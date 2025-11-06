import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { ImageData, ApiResponse } from '@/lib/types';
import { uploadBase64ToBlob, deleteImageFromBlob } from '@/lib/blobStorage';

// GET - Obtener todas las imágenes o una específica
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      // Obtener una imagen específica
      const imagen = await db.collection('imagenes').findOne({ _id: new ObjectId(id) });
      
      if (!imagen) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Imagen no encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json<ApiResponse<ImageData>>({
        success: true,
        data: {
          _id: imagen._id.toString(),
          nombre: imagen.nombre,
          titulo: imagen.titulo,
          descripcion: imagen.descripcion,
          base64Data: imagen.base64Data, // Legacy support
          blobUrl: imagen.blobUrl, // New Vercel Blob URL
          mimeType: imagen.mimeType,
          size: imagen.size,
          enGaleriaDashboard: imagen.enGaleriaDashboard || false,
          enGaleriaInspiracion: imagen.enGaleriaInspiracion || false,
          categoriaIds: imagen.categoriaIds || [],
          servicioIds: imagen.servicioIds || [],
          fechaCreacion: imagen.fechaCreacion,
          fechaActualizacion: imagen.fechaActualizacion,
        },
      });
    }

    // Obtener todas las imágenes
    const imagenes = await db
      .collection('imagenes')
      .find({})
      .sort({ fechaCreacion: -1 })
      .toArray();

    const imagenesData: ImageData[] = imagenes.map((img: any) => ({
      _id: img._id.toString(),
      nombre: img.nombre,
      titulo: img.titulo,
      descripcion: img.descripcion,
      base64Data: img.base64Data, // Legacy support
      blobUrl: img.blobUrl, // New Vercel Blob URL
      mimeType: img.mimeType,
      size: img.size,
      enGaleriaDashboard: img.enGaleriaDashboard || false,
      enGaleriaInspiracion: img.enGaleriaInspiracion || false,
      categoriaIds: img.categoriaIds || [],
      servicioIds: img.servicioIds || [],
      fechaCreacion: img.fechaCreacion,
      fechaActualizacion: img.fechaActualizacion,
    }));

    return NextResponse.json<ApiResponse<ImageData[]>>({
      success: true,
      data: imagenesData,
    });
  } catch (error) {
    console.error('Error en GET /api/imagenes:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener imágenes' },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva imagen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      nombre, 
      titulo, 
      descripcion, 
      base64Data, 
      mimeType, 
      size,
      enGaleriaDashboard,
      enGaleriaInspiracion,
      categoriaIds,
      servicioIds
    } = body;

    // Validación
    if (!nombre || !base64Data || !mimeType) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Faltan campos requeridos: nombre, base64Data, mimeType',
        },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await uploadBase64ToBlob(base64Data, nombre, mimeType);

    const db = await getDatabase();
    const now = new Date();

    const nuevaImagen = {
      nombre,
      titulo: titulo || '',
      descripcion: descripcion || '',
      blobUrl: blob.url, // Store Blob URL
      // Keep base64Data for legacy support during transition (optional, can remove later)
      // base64Data,
      mimeType,
      size: size || 0,
      enGaleriaDashboard: enGaleriaDashboard || false,
      enGaleriaInspiracion: enGaleriaInspiracion || false,
      categoriaIds: categoriaIds || [],
      servicioIds: servicioIds || [],
      fechaCreacion: now,
      fechaActualizacion: now,
    };

    const result = await db.collection('imagenes').insertOne(nuevaImagen);

    return NextResponse.json<ApiResponse<ImageData>>({
      success: true,
      data: {
        _id: result.insertedId.toString(),
        ...nuevaImagen,
      },
      message: 'Imagen creada exitosamente',
    });
  } catch (error) {
    console.error('Error en POST /api/imagenes:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al crear imagen' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar una imagen existente
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      _id, 
      nombre, 
      titulo, 
      descripcion, 
      base64Data, 
      mimeType, 
      size,
      enGaleriaDashboard,
      enGaleriaInspiracion,
      categoriaIds,
      servicioIds
    } = body;

    if (!_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const updateData: Partial<ImageData> & { fechaActualizacion: Date } = {
      fechaActualizacion: new Date(),
    };

    // If new image data is provided, upload to blob and delete old blob
    if (base64Data && mimeType) {
      // Get existing image to delete old blob
      const existingImage = await db
        .collection('imagenes')
        .findOne({ _id: new ObjectId(_id) });

      if (existingImage && existingImage.blobUrl) {
        try {
          await deleteImageFromBlob(existingImage.blobUrl);
        } catch (error) {
          console.error('Error deleting old blob:', error);
          // Continue with update even if delete fails
        }
      }

      // Upload new image to blob
      const blob = await uploadBase64ToBlob(base64Data, nombre || existingImage?.nombre || 'image', mimeType);
      updateData.blobUrl = blob.url;
      updateData.mimeType = mimeType;
      // Remove base64Data from updates - no longer storing in DB
      // updateData.base64Data = base64Data;
    }

    if (nombre !== undefined) updateData.nombre = nombre;
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (size !== undefined) updateData.size = size;
    if (enGaleriaDashboard !== undefined) updateData.enGaleriaDashboard = enGaleriaDashboard;
    if (enGaleriaInspiracion !== undefined) updateData.enGaleriaInspiracion = enGaleriaInspiracion;
    if (categoriaIds !== undefined) updateData.categoriaIds = categoriaIds;
    if (servicioIds !== undefined) updateData.servicioIds = servicioIds;

    const result = await db
      .collection('imagenes')
      .updateOne({ _id: new ObjectId(_id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Imagen no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Imagen actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error en PATCH /api/imagenes:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al actualizar imagen' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una imagen
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

    // Verificar si la imagen está siendo usada
    const [servicios, categorias, galeria] = await Promise.all([
      db.collection('servicios').countDocuments({ imagenId: id }),
      db.collection('categorias').countDocuments({ imagenId: id }),
      db.collection('galeria').countDocuments({ imagenId: id }),
    ]);

    const enUso = servicios + categorias + galeria;
    if (enUso > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `No se puede eliminar. La imagen está siendo usada en ${enUso} elemento(s)`,
        },
        { status: 400 }
      );
    }

    // Get image to delete blob before deleting from database
    const imagen = await db.collection('imagenes').findOne({ _id: new ObjectId(id) });

    if (!imagen) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Imagen no encontrada' },
        { status: 404 }
      );
    }

    // Delete from Vercel Blob if blobUrl exists
    if (imagen.blobUrl) {
      try {
        await deleteImageFromBlob(imagen.blobUrl);
      } catch (error) {
        console.error('Error deleting blob:', error);
        // Continue with database deletion even if blob deletion fails
      }
    }

    const result = await db.collection('imagenes').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Imagen no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Imagen eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error en DELETE /api/imagenes:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al eliminar imagen' },
      { status: 500 }
    );
  }
}
