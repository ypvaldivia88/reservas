import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Reserva, ApiResponse, FORMAS_UNAS } from "@/lib/types";
import { ObjectId } from "mongodb";
import { phoneUtils } from "@/lib/utils";
import {
  findActiveSlotConflict,
  findClientDayConflict,
  clientDayConflictMessage,
  isMongoDuplicateKeyError,
} from "@/lib/reservaValidation";

// GET: Obtener una reserva específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Reserva>>> {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID de reserva inválido" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");

    const reserva = (await db
      .collection("reservas")
      .findOne({ _id: new ObjectId(id) })) as Reserva | null;

    if (!reserva) {
      return NextResponse.json(
        { success: false, error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reserva,
      message: "Reserva obtenida exitosamente",
    });
  } catch (error) {
    console.error("Error obteniendo reserva:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar una reserva (estado, fecha, hora)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID de reserva inválido" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const updateData: Partial<Reserva> = {};

    if (data.estado) {
      if (
        !["pendiente", "confirmada", "cancelada", "completada"].includes(
          data.estado
        )
      ) {
        return NextResponse.json(
          { success: false, error: "Estado inválido" },
          { status: 400 }
        );
      }
      updateData.estado = data.estado;
    }

    if (data.fechaCita) {
      const fecha = new Date(data.fechaCita);
      if (isNaN(fecha.getTime())) {
        return NextResponse.json(
          { success: false, error: "Fecha de cita inválida" },
          { status: 400 }
        );
      }
      updateData.fechaCita = data.fechaCita;
    }

    if (data.horaCita) {
      updateData.horaCita = data.horaCita;
    }

    if (data.nombre) {
      updateData.nombre = data.nombre.trim();
    }

    if (data.telefono) {
      try {
        updateData.telefono = phoneUtils.normalize(data.telefono);
      } catch {
        return NextResponse.json(
          { success: false, error: "Formato de teléfono inválido" },
          { status: 400 }
        );
      }
    }

    if (data.forma && FORMAS_UNAS.includes(data.forma)) {
      updateData.forma = data.forma;
    }

    if (data.largo !== undefined) {
      const largo = Number(data.largo);
      if (largo >= 1 && largo <= 8) {
        updateData.largo = largo;
      }
    }

    if (data.decoracion !== undefined) {
      updateData.decoracion = data.decoracion.trim();
    }

    if (data.costo !== undefined) {
      const costo = Number(data.costo);
      if (!isNaN(costo) && costo >= 0) {
        updateData.costo = costo;
      }
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");

    const existingReserva = (await db
      .collection("reservas")
      .findOne({ _id: new ObjectId(id) })) as Reserva | null;

    if (!existingReserva) {
      return NextResponse.json(
        { success: false, error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    const newFechaCita = updateData.fechaCita ?? existingReserva.fechaCita;
    const newHoraCita = updateData.horaCita ?? existingReserva.horaCita;
    const newTelefono = updateData.telefono ?? existingReserva.telefono;
    const newEstado = updateData.estado ?? existingReserva.estado;
    const isActiveState =
      newEstado === "pendiente" || newEstado === "confirmada";

    if (
      isActiveState &&
      (updateData.fechaCita || updateData.horaCita)
    ) {
      const slotConflict = await findActiveSlotConflict(
        db,
        newFechaCita,
        newHoraCita,
        id
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
    }

    if (
      isActiveState &&
      (updateData.fechaCita || updateData.telefono)
    ) {
      const dayConflict = await findClientDayConflict(db, newFechaCita, {
        clienteId: existingReserva.clienteId,
        telefono: newTelefono,
        excludeId: id,
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
    }

    const result = await db
      .collection("reservas")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reserva actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error actualizando reserva:", error);

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

// DELETE: Eliminar una reserva
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID de reserva inválido" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");

    const result = await db
      .collection("reservas")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reserva eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error eliminando reserva:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
