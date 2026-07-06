import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { AvailabilityOverride, Schedule, Reserva, ApiResponse, DayOfWeek } from "@/lib/types";
import { dateUtils, scheduleUtils, phoneUtils } from "@/lib/utils";
import { ACTIVE_RESERVATION_STATES } from "@/lib/reservaValidation";
import { tenantQuery } from "@/lib/tenant";
import { resolvePublicTenant } from "@/lib/services/tenant-context.service";
import { adminHandler } from "@/lib/api/handlers";
import { ok, created } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";
import { handleError } from "@/lib/api/responses";

// Función helper para obtener el día de la semana de una fecha
function getDayOfWeek(dateString: string): DayOfWeek {
  const date = dateUtils.parseDate(dateString);
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

// GET: Obtiene disponibilidad para un rango de fechas
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const daysParam = searchParams.get("days") || "30"; // Por defecto 30 días
    const telefonoParam = searchParams.get("telefono");

    const { salonId } = await resolvePublicTenant(request);
    const tenantFilter = tenantQuery(salonId);

    const client = await clientPromise;
    const db = client.db("nailsalon");

    // Obtener el horario por defecto
    let schedule = await db
      .collection<Schedule>("schedules")
      .findOne({ name: "default", ...tenantFilter });

    if (!schedule) {
      // Crear horario por defecto si no existe
      const defaultSchedule = {
        ...scheduleUtils.createDefaultSchedule(),
        salonId,
      };
      const result = await db
        .collection("schedules")
        .insertOne(defaultSchedule);
      schedule = {
        ...defaultSchedule,
        _id: result.insertedId.toString(),
      } as any;
    }

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          error: "No se pudo crear el horario por defecto",
        },
        { status: 500 }
      );
    }

    // Calcular rango de fechas
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = startDateParam ? new Date(startDateParam) : today;
    const days = parseInt(daysParam);
    const endDate =
      endDateParam ?
        new Date(endDateParam)
      : new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

    // OPTIMIZACIÓN: Obtener todos los overrides y reservas del rango en UNA SOLA consulta cada uno
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Consulta 1: Todos los overrides del rango
    const overrides = (await db
      .collection("availability_overrides")
      .find({
        date: { $gte: startDateStr, $lte: endDateStr },
        ...tenantFilter,
      })
      .toArray()) as unknown as AvailabilityOverride[];

    // Crear un mapa para acceso rápido
    const overridesMap = new Map<string, AvailabilityOverride>();
    overrides.forEach((override) => {
      overridesMap.set(override.date, override);
    });

    // Consulta 2: Todas las reservas del rango
    const reservas = (await db
      .collection("reservas")
      .find({
        fechaCita: { $gte: startDateStr, $lte: endDateStr },
        estado: { $in: ACTIVE_RESERVATION_STATES },
        ...tenantFilter,
      })
      .toArray()) as unknown as Reserva[];

    // Crear un mapa de reservas por fecha y hora para acceso rápido
    const reservasMap = new Map<string, Set<string>>();
    reservas.forEach((reserva: Reserva) => {
      if (!reservasMap.has(reserva.fechaCita)) {
        reservasMap.set(reserva.fechaCita, new Set());
      }
      reservasMap.get(reserva.fechaCita)!.add(reserva.horaCita);
    });

    // Fechas donde el cliente ya tiene una cita activa (máx. 1 por día)
    const clientBookedDates = new Set<string>();
    if (telefonoParam) {
      try {
        const telefonoNormalizado = phoneUtils.normalize(telefonoParam);
        reservas
          .filter((r) => r.telefono === telefonoNormalizado)
          .forEach((r) => clientBookedDates.add(r.fechaCita));
      } catch {
        // Teléfono inválido: ignorar filtro de cliente
      }
    }

    // Generar disponibilidad procesando en memoria (sin consultas adicionales)
    const availability = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split("T")[0];

      // Verificar si hay override
      const override = overridesMap.get(dateString);

      const clientHasBooking = clientBookedDates.has(dateString);

      if (override) {
        // Filtrar slots ya reservados
        const bookedTimes = reservasMap.get(dateString) || new Set();
        const slotsWithAvailability = override.slots.map((slot) => ({
          time: slot.time,
          available:
            slot.available &&
            !bookedTimes.has(slot.time) &&
            !clientHasBooking,
        }));

        availability.push({
          date: dateString,
          slots: slotsWithAvailability,
          isWorkingDay: override.isWorkingDay,
          clientHasBooking,
        });
      } else {
        // Usar horario por defecto basado en el día de la semana
        const dayOfWeek = getDayOfWeek(dateString);
        const daySchedule = schedule.schedule.find(
          (s) => s.dayOfWeek === dayOfWeek
        );

        if (!daySchedule || !daySchedule.isWorkingDay) {
          availability.push({
            date: dateString,
            slots: [],
            isWorkingDay: false,
            clientHasBooking,
          });
        } else {
          // Obtener reservas de esta fecha (desde el mapa)
          const bookedTimes = reservasMap.get(dateString) || new Set();

          // Marcar slots como no disponibles si ya tienen reserva
          const slotsWithAvailability = daySchedule.slots.map((slot) => ({
            time: slot.time,
            available:
              slot.available &&
              !bookedTimes.has(slot.time) &&
              !clientHasBooking,
          }));

          availability.push({
            date: dateString,
            slots: slotsWithAvailability,
            isWorkingDay: true,
            clientHasBooking,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      data: {
        availability,
        schedule,
      },
    });
  } catch (error) {
    console.error('Error en GET /api/availability:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

// POST: Crear un override de disponibilidad para una fecha específica
export const POST = adminHandler(async ({ salonId, request }) => {
  const data = await request.json();

  if (!data.date) throw new AppError("La fecha es requerida", 400);

  const client = await clientPromise;
  const db = client.db("nailsalon");

  const override: Omit<AvailabilityOverride, "_id"> = {
    salonId,
    date: data.date,
    slots: data.slots || [],
    isWorkingDay: data.isWorkingDay !== undefined ? data.isWorkingDay : true,
    reason: data.reason || "",
    createdAt: new Date(),
  };

  const result = await db
    .collection<AvailabilityOverride>("availability_overrides")
    .findOneAndUpdate(
      { date: data.date, ...tenantQuery(salonId) },
      { $set: override },
      { upsert: true, returnDocument: "after" }
    );

  if (!result) throw AppError.internal("Error al crear el override de disponibilidad");

  return created(
    result as AvailabilityOverride,
    "Override de disponibilidad creado exitosamente"
  );
});

// DELETE: Eliminar un override de disponibilidad
export const DELETE = adminHandler(async ({ salonId, request }) => {
  const date = request.nextUrl.searchParams.get("date");
  if (!date) throw new AppError("La fecha es requerida", 400);

  const client = await clientPromise;
  const db = client.db("nailsalon");

  await db.collection<AvailabilityOverride>("availability_overrides").deleteOne({
    date,
    ...tenantQuery(salonId),
  });

  return ok(undefined, { message: "Override eliminado exitosamente" });
});
