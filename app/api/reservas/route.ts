import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Reserva, ApiResponse, FORMAS_UNAS } from "@/lib/types";

// Función de validación
function validarReserva(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.nombre || typeof data.nombre !== 'string' || data.nombre.trim().length < 2) {
    errors.push('El nombre es requerido y debe tener al menos 2 caracteres');
  }

  if (!data.telefono || typeof data.telefono !== 'string' || !/^\+?[\d\s\-()]{8,15}$/.test(data.telefono)) {
    errors.push('El teléfono debe tener un formato válido');
  }

  if (!data.forma || !FORMAS_UNAS.includes(data.forma)) {
    errors.push('La forma debe ser una opción válida');
  }

  const largo = Number(data.largo);
  if (!largo || largo < 1 || largo > 8) {
    errors.push('El largo debe ser un número entre 1 y 8');
  }

  return { isValid: errors.length === 0, errors };
}

// GET: Obtiene todas las reservas
export async function GET(): Promise<NextResponse<ApiResponse<Reserva[]>>> {
  try {
    console.log('🔍 Iniciando GET /api/reservas');
    console.log('📁 MONGODB_URI configurado:', !!process.env.MONGODB_URI);
    
    const client = await clientPromise;
    console.log('✅ Cliente MongoDB conectado');
    
    const db = client.db("nailsalon");
    console.log('📊 Base de datos seleccionada: nailsalon');
    
    const reservas = await db
      .collection<Reserva>("reservas")
      .find({})
      .sort({ fechaCreacion: -1 })
      .toArray();
    
    console.log(`📋 ${reservas.length} reservas encontradas`);

    return NextResponse.json({
      success: true,
      data: reservas,
      message: 'Reservas obtenidas exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en GET /api/reservas:', error);
    console.error('📍 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: Crea una nueva reserva
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ insertedId: string }>>> {
  try {
    const data = await request.json();

    // Validar datos de entrada
    const validacion = validarReserva(data);
    if (!validacion.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de entrada inválidos',
          message: validacion.errors.join(', ')
        },
        { status: 400 }
      );
    }

    // Preparar datos para inserción
    const nuevaReserva: Omit<Reserva, '_id'> = {
      nombre: data.nombre.trim(),
      telefono: data.telefono.trim(),
      forma: data.forma,
      largo: Number(data.largo),
      decoracion: data.decoracion?.trim() || '',
      fechaCreacion: new Date(),
      estado: 'pendiente'
    };

    const client = await clientPromise;
    const db = client.db("nailsalon");
    
    const result = await db.collection<Reserva>("reservas").insertOne(nuevaReserva);

    return NextResponse.json({
      success: true,
      data: { insertedId: result.insertedId.toString() },
      message: 'Reserva creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando reserva:', error);
    
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
