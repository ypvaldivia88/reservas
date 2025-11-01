import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Categoria, ApiResponse } from '@/lib/types';

// GET - Obtener todas las categorías
export async function GET() {
  try {
    const db = await getDatabase();
    const categorias = await db
      .collection('categorias')
      .find({})
      .sort({ orden: 1, fechaCreacion: -1 })
      .toArray();

    const categoriasData: Categoria[] = categorias.map((cat: any) => ({
      _id: cat._id.toString(),
      nombre: cat.nombre,
      descripcion: cat.descripcion,
      imagenId: cat.imagenId,
      activo: cat.activo,
      orden: cat.orden,
      fechaCreacion: cat.fechaCreacion,
      fechaActualizacion: cat.fechaActualizacion,
    }));

    return NextResponse.json<ApiResponse<Categoria[]>>({
      success: true,
      data: categoriasData,
    });
  } catch (error) {
    console.error('Error en GET /api/categorias:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva categoría
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, descripcion, imagenId, activo, orden } = body;

    // Validación
    if (!nombre) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Campo requerido: nombre',
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();

    const nuevaCategoria = {
      nombre,
      descripcion: descripcion || '',
      imagenId: imagenId || null,
      activo: activo !== undefined ? activo : true,
      orden: orden || 0,
      fechaCreacion: now,
      fechaActualizacion: now,
    };

    const result = await db.collection('categorias').insertOne(nuevaCategoria);

    return NextResponse.json<ApiResponse<Categoria>>({
      success: true,
      data: {
        _id: result.insertedId.toString(),
        ...nuevaCategoria,
      },
      message: 'Categoría creada exitosamente',
    });
  } catch (error) {
    console.error('Error en POST /api/categorias:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar una categoría existente
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { _id, nombre, descripcion, imagenId, activo, orden } = body;

    if (!_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const updateData: Partial<Categoria> = {
      fechaActualizacion: new Date(),
    };

    if (nombre) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (imagenId !== undefined) updateData.imagenId = imagenId;
    if (activo !== undefined) updateData.activo = activo;
    if (orden !== undefined) updateData.orden = orden;

    const result = await db
      .collection('categorias')
      .updateOne({ _id: new ObjectId(_id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Categoría actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error en PATCH /api/categorias:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al actualizar categoría' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una categoría
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

    // Verificar si hay items de galería vinculados
    const galeriaCount = await db
      .collection('galeria')
      .countDocuments({ categoriaId: id });

    if (galeriaCount > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `No se puede eliminar. La categoría tiene ${galeriaCount} item(s) de galería vinculados`,
        },
        { status: 400 }
      );
    }

    const result = await db.collection('categorias').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Categoría eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error en DELETE /api/categorias:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al eliminar categoría' },
      { status: 500 }
    );
  }
}
