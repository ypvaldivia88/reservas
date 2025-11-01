import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Reserva, ApiResponse, FORMAS_UNAS } from "@/lib/types";
import { ObjectId } from "mongodb";

// GET: Obtener una reserva específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Reserva>>> {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de reserva inválido'
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");
    
    const reserva = await db
      .collection("reservas")
      .findOne({ _id: new ObjectId(id) }) as Reserva | null;

    if (!reserva) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reserva no encontrada'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reserva,
      message: 'Reserva obtenida exitosamente'
    });

  } catch (error) {
    console.error('Error obteniendo reserva:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
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
        {
          success: false,
          error: 'ID de reserva inválido'
        },
        { status: 400 }
      );
    }

    const data = await request.json();
    const updateData: Partial<Reserva> = {};

    // Validar y preparar campos para actualizar
    if (data.estado) {
      if (!['pendiente', 'confirmada', 'cancelada', 'completada'].includes(data.estado)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Estado inválido'
          },
          { status: 400 }
        );
      }
      updateData.estado = data.estado;
    }

    if (data.fechaCita) {
      const fecha = new Date(data.fechaCita);
      if (isNaN(fecha.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Fecha de cita inválida'
          },
          { status: 400 }
        );
      }
      updateData.fechaCita = data.fechaCita; // Store as string in YYYY-MM-DD format
    }

    if (data.horaCita) {
      updateData.horaCita = data.horaCita;
    }

    if (data.nombre) {
      updateData.nombre = data.nombre.trim();
    }

    if (data.telefono) {
      updateData.telefono = data.telefono.trim();
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

    const client = await clientPromise;
    const db = client.db("nailsalon");
    
    const result = await db
      .collection("reservas")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reserva no encontrada'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reserva actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando reserva:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Formato JSON inválido'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
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
        {
          success: false,
          error: 'ID de reserva inválido'
        },
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
        {
          success: false,
          error: 'Reserva no encontrada'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reserva eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando reserva:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
