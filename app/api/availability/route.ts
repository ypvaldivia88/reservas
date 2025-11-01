import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { AvailabilityOverride, Schedule, Reserva, ApiResponse, TimeSlot, DayOfWeek } from "@/lib/types";
import { Db } from "mongodb";
import { dateUtils, scheduleUtils } from "@/lib/utils";

// Función helper para obtener el día de la semana de una fecha
function getDayOfWeek(dateString: string): DayOfWeek {
  const date = dateUtils.parseDate(dateString);
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

// Función para calcular disponibilidad de una fecha específica
async function getDateAvailability(
  db: Db,
  dateString: string,
  schedule: Schedule
): Promise<{ date: string; slots: TimeSlot[]; isWorkingDay: boolean }> {
  // Primero, verificar si hay un override para esta fecha
  const override = await db.collection("availability_overrides").findOne({ date: dateString }) as AvailabilityOverride | null;
  
  if (override) {
    return {
      date: dateString,
      slots: override.slots,
      isWorkingDay: override.isWorkingDay
    };
  }

  // Si no hay override, usar el horario por defecto basado en el día de la semana
  const dayOfWeek = getDayOfWeek(dateString);
  const daySchedule = schedule.schedule.find(s => s.dayOfWeek === dayOfWeek);

  if (!daySchedule || !daySchedule.isWorkingDay) {
    return {
      date: dateString,
      slots: [],
      isWorkingDay: false
    };
  }

  // Obtener reservas existentes para esta fecha
  const reservas = (await db.collection("reservas").find({
    fechaCita: dateString,
    estado: { $in: ['pendiente', 'confirmada'] }
  }).toArray()) as unknown as Reserva[];

  // Marcar slots como no disponibles si ya tienen reserva
  const slotsWithAvailability = daySchedule.slots.map(slot => {
    const isBooked = reservas.some((r: Reserva) => r.horaCita === slot.time);
    return {
      time: slot.time,
      available: slot.available && !isBooked
    };
  });

  return {
    date: dateString,
    slots: slotsWithAvailability,
    isWorkingDay: true
  };
}

// GET: Obtiene disponibilidad para un rango de fechas
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const daysParam = searchParams.get('days') || '30'; // Por defecto 30 días

    const client = await clientPromise;
    const db = client.db("nailsalon");

    // Obtener el horario por defecto
    let schedule = await db.collection<Schedule>("schedules").findOne({ name: 'default' });
    
    if (!schedule) {
      // Crear horario por defecto si no existe
      const defaultSchedule = scheduleUtils.createDefaultSchedule();
      const result = await db.collection("schedules").insertOne(defaultSchedule);
      schedule = { ...defaultSchedule, _id: result.insertedId.toString() } as any;
    }

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo crear el horario por defecto'
        },
        { status: 500 }
      );
    }

    // Calcular rango de fechas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = startDateParam ? new Date(startDateParam) : today;
    const days = parseInt(daysParam);
    const endDate = endDateParam ? new Date(endDateParam) : new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

    const availability = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayAvailability = await getDateAvailability(db, dateString, schedule);
      availability.push(dayAvailability);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      data: {
        availability,
        schedule
      }
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
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AvailabilityOverride>>> {
  try {
    const data = await request.json();

    if (!data.date) {
      return NextResponse.json(
        {
          success: false,
          error: 'La fecha es requerida'
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");

    const override: Omit<AvailabilityOverride, '_id'> = {
      date: data.date,
      slots: data.slots || [],
      isWorkingDay: data.isWorkingDay !== undefined ? data.isWorkingDay : true,
      reason: data.reason || '',
      createdAt: new Date()
    };

    const result = await db.collection<AvailabilityOverride>("availability_overrides").findOneAndUpdate(
      { date: data.date },
      { $set: override },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      data: result as AvailabilityOverride,
      message: 'Override de disponibilidad creado exitosamente'
    });

  } catch (error) {
    console.error('Error en POST /api/availability:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un override de disponibilidad
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: 'La fecha es requerida'
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");

    await db.collection<AvailabilityOverride>("availability_overrides").deleteOne({ date });

    return NextResponse.json({
      success: true,
      message: 'Override eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE /api/availability:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
