import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Servicio, ApiResponse } from '@/lib/types';

// GET - Obtener todos los servicios
export async function GET() {
  try {
    const db = await getDatabase();
    const servicios = await db
      .collection('servicios')
      .find({})
      .sort({ orden: 1, fechaCreacion: -1 })
      .toArray();

    const serviciosData: Servicio[] = servicios.map((srv: any) => ({
      _id: srv._id.toString(),
      nombre: srv.nombre,
      descripcion: srv.descripcion,
      precio: srv.precio,
      duracion: srv.duracion,
      imagenId: srv.imagenId,
      activo: srv.activo,
      orden: srv.orden,
      fechaCreacion: srv.fechaCreacion,
      fechaActualizacion: srv.fechaActualizacion,
    }));

    return NextResponse.json<ApiResponse<Servicio[]>>({
      success: true,
      data: serviciosData,
    });
  } catch (error) {
    console.error('Error en GET /api/servicios:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener servicios' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo servicio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, descripcion, precio, duracion, imagenId, activo, orden } = body;

    // Validación
    if (!nombre || !descripcion) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Faltan campos requeridos: nombre, descripcion',
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();

    const nuevoServicio = {
      nombre,
      descripcion,
      precio: precio || 0,
      duracion: duracion || 0,
      imagenId: imagenId || null,
      activo: activo !== undefined ? activo : true,
      orden: orden || 0,
      fechaCreacion: now,
      fechaActualizacion: now,
    };

    const result = await db.collection('servicios').insertOne(nuevoServicio);

    return NextResponse.json<ApiResponse<Servicio>>({
      success: true,
      data: {
        _id: result.insertedId.toString(),
        ...nuevoServicio,
      },
      message: 'Servicio creado exitosamente',
    });
  } catch (error) {
    console.error('Error en POST /api/servicios:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al crear servicio' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar un servicio existente
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { _id, nombre, descripcion, precio, duracion, imagenId, activo, orden } = body;

    if (!_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const updateData: Partial<Servicio> = {
      fechaActualizacion: new Date(),
    };

    if (nombre) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (precio !== undefined) updateData.precio = precio;
    if (duracion !== undefined) updateData.duracion = duracion;
    if (imagenId !== undefined) updateData.imagenId = imagenId;
    if (activo !== undefined) updateData.activo = activo;
    if (orden !== undefined) updateData.orden = orden;

    const result = await db
      .collection('servicios')
      .updateOne({ _id: new ObjectId(_id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Servicio actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error en PATCH /api/servicios:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al actualizar servicio' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un servicio
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const result = await db.collection('servicios').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Servicio eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error en DELETE /api/servicios:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al eliminar servicio' },
      { status: 500 }
    );
  }
}
