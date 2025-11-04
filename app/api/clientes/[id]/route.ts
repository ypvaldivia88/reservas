import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { User, ApiResponse } from "@/lib/types";
import { ObjectId, WithId } from "mongodb";

// GET: Obtener un cliente específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<User>>> {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de cliente inválido'
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");
    
    const cliente = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id), role: 'cliente' }) as WithId<User> | null;

    if (!cliente) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cliente no encontrado'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { ...cliente, _id: cliente._id.toString() },
      message: 'Cliente obtenido exitosamente'
    });

  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar un cliente
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
          error: 'ID de cliente inválido'
        },
        { status: 400 }
      );
    }

    const data = await request.json();
    const updateData: Partial<User> = {};

    // Validar y preparar campos para actualizar
    if (data.nombre) {
      if (typeof data.nombre !== 'string' || data.nombre.trim().length < 2) {
        return NextResponse.json(
          {
            success: false,
            error: 'El nombre debe tener al menos 2 caracteres'
          },
          { status: 400 }
        );
      }
      updateData.nombre = data.nombre.trim();
    }

    if (data.telefono) {
      if (typeof data.telefono !== 'string' || !/^\+?[\d\s\-()]{8,15}$/.test(data.telefono)) {
        return NextResponse.json(
          {
            success: false,
            error: 'El teléfono debe tener un formato válido'
          },
          { status: 400 }
        );
      }
      
      // Verificar que el teléfono no esté siendo usado por otro cliente
      const client = await clientPromise;
      const db = client.db("nailsalon");
      
      const existingCliente = await db.collection("users").findOne({
        telefono: data.telefono.trim(),
        role: 'cliente',
        _id: { $ne: new ObjectId(id) }
      });

      if (existingCliente) {
        return NextResponse.json(
          {
            success: false,
            error: 'El teléfono ya está registrado por otro cliente'
          },
          { status: 400 }
        );
      }

      updateData.telefono = data.telefono.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se proporcionaron campos para actualizar'
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");
    
    const result = await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(id), role: 'cliente' },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cliente no encontrado'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cliente actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando cliente:', error);
    
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

// DELETE: Eliminar un cliente
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
          error: 'ID de cliente inválido'
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");
    
    // Verificar si el cliente tiene reservas activas
    const reservasActivas = await db
      .collection("reservas")
      .countDocuments({ 
        clienteId: id,
        estado: { $in: ['pendiente', 'confirmada'] }
      });

    if (reservasActivas > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se puede eliminar un cliente con reservas activas',
          message: `El cliente tiene ${reservasActivas} reserva(s) activa(s). Por favor cancela o completa las reservas primero.`
        },
        { status: 400 }
      );
    }
    
    const result = await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(id), role: 'cliente' });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cliente no encontrado'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando cliente:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
