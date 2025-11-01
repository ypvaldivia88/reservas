import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { GaleriaItem, ApiResponse } from '@/lib/types';

// GET - Obtener todos los items de galería
export async function GET() {
  try {
    const db = await getDatabase();
    const galeria = await db
      .collection('galeria')
      .find({})
      .sort({ orden: 1, fechaCreacion: -1 })
      .toArray();

    const galeriaData: GaleriaItem[] = galeria.map((item: any) => ({
      _id: item._id.toString(),
      titulo: item.titulo,
      descripcion: item.descripcion,
      imagenId: item.imagenId,
      categoriaId: item.categoriaId,
      servicioId: item.servicioId,
      destacado: item.destacado,
      orden: item.orden,
      fechaCreacion: item.fechaCreacion,
      fechaActualizacion: item.fechaActualizacion,
    }));

    return NextResponse.json<ApiResponse<GaleriaItem[]>>({
      success: true,
      data: galeriaData,
    });
  } catch (error) {
    console.error('Error en GET /api/galeria:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener galería' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo item de galería
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, descripcion, imagenId, categoriaId, servicioId, destacado, orden } =
      body;

    // Validación
    if (!titulo || !imagenId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Faltan campos requeridos: titulo, imagenId',
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();

    const nuevoItem = {
      titulo,
      descripcion: descripcion || '',
      imagenId,
      categoriaId: categoriaId || null,
      servicioId: servicioId || null,
      destacado: destacado !== undefined ? destacado : false,
      orden: orden || 0,
      fechaCreacion: now,
      fechaActualizacion: now,
    };

    const result = await db.collection('galeria').insertOne(nuevoItem);

    return NextResponse.json<ApiResponse<GaleriaItem>>({
      success: true,
      data: {
        _id: result.insertedId.toString(),
        ...nuevoItem,
      },
      message: 'Item de galería creado exitosamente',
    });
  } catch (error) {
    console.error('Error en POST /api/galeria:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al crear item de galería' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar un item de galería existente
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      _id,
      titulo,
      descripcion,
      imagenId,
      categoriaId,
      servicioId,
      destacado,
      orden,
    } = body;

    if (!_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const updateData: Partial<GaleriaItem> = {
      fechaActualizacion: new Date(),
    };

    if (titulo) updateData.titulo = titulo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (imagenId !== undefined) updateData.imagenId = imagenId;
    if (categoriaId !== undefined) updateData.categoriaId = categoriaId;
    if (servicioId !== undefined) updateData.servicioId = servicioId;
    if (destacado !== undefined) updateData.destacado = destacado;
    if (orden !== undefined) updateData.orden = orden;

    const result = await db
      .collection('galeria')
      .updateOne({ _id: new ObjectId(_id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Item de galería no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Item de galería actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error en PATCH /api/galeria:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al actualizar item de galería' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un item de galería
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
    const result = await db.collection('galeria').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Item de galería no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Item de galería eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error en DELETE /api/galeria:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al eliminar item de galería' },
      { status: 500 }
    );
  }
}
