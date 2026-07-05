import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Reserva, ApiResponse, User } from "@/lib/types";
import { phoneUtils } from "@/lib/utils";
import { getTenantFromRequest, DEFAULT_SALON_ID } from "@/lib/tenant";
import { tenantQuery } from "@/lib/tenant";
import {
  validateReservaInput,
  findActiveSlotConflict,
  findClientDayConflict,
  clientDayConflictMessage,
  isMongoDuplicateKeyError,
} from "@/lib/reservaValidation";

// GET: Obtiene todas las reservas
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Reserva[]>>> {
  try {
    const { salonId } = await getTenantFromRequest(request);
    const client = await clientPromise;
    const db = client.db("nailsalon");

    const reservas = await db
      .collection<Reserva>("reservas")
      .find(tenantQuery(salonId))
      .sort({ fechaCreacion: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: reservas,
      message: "Reservas obtenidas exitosamente",
    });
  } catch (error) {
    console.error("Error en GET /api/reservas:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST: Crea una nueva reserva
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ insertedId: string }>>> {
  try {
    const data = await request.json();

    const validacion = validateReservaInput(data);
    if (!validacion.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos de entrada inválidos",
          message: validacion.errors.join(", "),
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");
    const { salonId } = await getTenantFromRequest(request);

    const slotConflict = await findActiveSlotConflict(
      db,
      data.fechaCita,
      data.horaCita,
      undefined,
      salonId
    );
    if (slotConflict) {
      return NextResponse.json(
        {
          success: false,
          error: "Horario no disponible",
          message:
            "Este horario ya está reservado. Por favor selecciona otro horario.",
        },
        { status: 400 }
      );
    }

    let telefonoNormalizado: string;
    try {
      telefonoNormalizado = phoneUtils.normalize(data.telefono);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Formato de teléfono inválido",
          message: "El número de teléfono ingresado no tiene un formato válido",
        },
        { status: 400 }
      );
    }

    const nombreNormalizado = data.nombre.trim();

    let cliente = await db.collection<User>("users").findOne({
      telefono: telefonoNormalizado,
      role: "cliente",
      ...tenantQuery(salonId),
    });

    if (cliente) {
      if (cliente.nombre !== nombreNormalizado) {
        return NextResponse.json(
          {
            success: false,
            error: "Teléfono ya registrado con otro nombre",
            message: `Este teléfono está registrado con el nombre: ${cliente.nombre}. Por favor verifica tus datos.`,
          },
          { status: 400 }
        );
      }
    } else {
      const nuevoCliente: Omit<User, "_id"> = {
        nombre: nombreNormalizado,
        telefono: telefonoNormalizado,
        role: "cliente",
        salonId,
        fechaCreacion: new Date(),
      };

      const resultCliente = await db
        .collection<User>("users")
        .insertOne(nuevoCliente);
      cliente = { ...nuevoCliente, _id: resultCliente.insertedId.toString() };
    }

    const clienteId = cliente?._id?.toString();

    const dayConflict = await findClientDayConflict(db, data.fechaCita, {
      clienteId,
      telefono: telefonoNormalizado,
      salonId,
    });
    if (dayConflict) {
      return NextResponse.json(
        {
          success: false,
          error: "Cita duplicada en el mismo día",
          message: clientDayConflictMessage(dayConflict.horaCita),
        },
        { status: 400 }
      );
    }

    const nuevaReserva: Omit<Reserva, "_id"> = {
      salonId: salonId || DEFAULT_SALON_ID,
      clienteId,
      nombre: nombreNormalizado,
      telefono: telefonoNormalizado,
      forma: data.forma,
      largo: Number(data.largo),
      decoracion: data.decoracion?.trim() || "",
      fechaCreacion: new Date(),
      fechaCita: data.fechaCita,
      horaCita: data.horaCita,
      estado: "pendiente",
    };

    const result = await db
      .collection<Reserva>("reservas")
      .insertOne(nuevaReserva);

    return NextResponse.json({
      success: true,
      data: { insertedId: result.insertedId.toString() },
      message: "Reserva creada exitosamente",
    });
  } catch (error) {
    console.error("Error creando reserva:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: "Formato JSON inválido" },
        { status: 400 }
      );
    }

    if (isMongoDuplicateKeyError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: "Cita duplicada",
          message: clientDayConflictMessage(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
