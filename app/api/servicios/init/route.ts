import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ApiResponse } from '@/lib/types';

// POST - Inicializar servicios por defecto
export async function POST() {
  try {
    const db = await getDatabase();
    
    // Check if services already exist
    const existingCount = await db.collection('servicios').countDocuments();
    
    if (existingCount > 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `Ya existen ${existingCount} servicio(s) en la base de datos. No se puede inicializar.`,
      }, { status: 400 });
    }

    const now = new Date();
    
    const serviciosPorDefecto = [
      {
        nombre: "Gel / Softgel",
        descripcion: "Gel ligero y flexible, ideal para acabado natural y cómodo.",
        precio: 0,
        duracion: 0,
        imagenId: null, // Será asignado manualmente desde el admin
        activo: true,
        orden: 1,
        fechaCreacion: now,
        fechaActualizacion: now,
      },
      {
        nombre: "Base Rubber / Gel Builder",
        descripcion: "Gel reforzado para uñas débiles, perfecto para mayor resistencia y durabilidad.",
        precio: 0,
        duracion: 0,
        imagenId: null,
        activo: true,
        orden: 2,
        fechaCreacion: now,
        fechaActualizacion: now,
      },
      {
        nombre: "Gel Dipping",
        descripcion: "Sistema sin monómero con polvo aclírico, uñas fuertes y acabado elegante.",
        precio: 0,
        duracion: 0,
        imagenId: null,
        activo: true,
        orden: 3,
        fechaCreacion: now,
        fechaActualizacion: now,
      },
      {
        nombre: "Pedicure",
        descripcion: "Un servicio completo para pies suaves, saludables y bien cuidados.",
        precio: 0,
        duracion: 0,
        imagenId: null,
        activo: true,
        orden: 4,
        fechaCreacion: now,
        fechaActualizacion: now,
      },
    ];

    const result = await db.collection('servicios').insertMany(serviciosPorDefecto);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `✅ ${result.insertedCount} servicios creados exitosamente. Ahora puedes asignarles imágenes desde el panel de administración.`,
      data: {
        insertedCount: result.insertedCount,
        insertedIds: Object.values(result.insertedIds),
      },
    });
  } catch (error) {
    console.error('Error en POST /api/servicios/init:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al inicializar servicios' },
      { status: 500 }
    );
  }
}

// GET - Verificar estado de inicialización
export async function GET() {
  try {
    const db = await getDatabase();
    const count = await db.collection('servicios').countDocuments();
    
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        serviciosExistentes: count,
        inicializado: count > 0,
      },
    });
  } catch (error) {
    console.error('Error en GET /api/servicios/init:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al verificar servicios' },
      { status: 500 }
    );
  }
}
