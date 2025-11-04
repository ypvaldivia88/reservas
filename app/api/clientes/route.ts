import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { User, ApiResponse } from "@/lib/types";
import { NextRequest } from "next/server";

// GET: Obtiene todos los clientes
export async function GET(): Promise<NextResponse<ApiResponse<User[]>>> {
  try {
    const client = await clientPromise;
    const db = client.db("nailsalon");
    
    const clientes = await db
      .collection<User>("users")
      .find({ role: 'cliente' })
      .sort({ fechaCreacion: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: clientes,
      message: 'Clientes obtenidos exitosamente'
    });

  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo cliente manualmente
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ insertedId: string }>>> {
  try {
    const data = await request.json();

    // Validar datos de entrada
    if (!data.nombre || typeof data.nombre !== 'string' || data.nombre.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'El nombre es requerido y debe tener al menos 2 caracteres'
        },
        { status: 400 }
      );
    }

    if (!data.telefono || typeof data.telefono !== 'string' || !/^\+?[\d\s\-()]{8,15}$/.test(data.telefono)) {
      return NextResponse.json(
        {
          success: false,
          error: 'El teléfono es requerido y debe tener un formato válido'
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");
    
    // Verificar que el teléfono no esté registrado
    const existingCliente = await db.collection<User>("users").findOne({
      telefono: data.telefono.trim(),
      role: 'cliente'
    });

    if (existingCliente) {
      return NextResponse.json(
        {
          success: false,
          error: 'El teléfono ya está registrado',
          message: `Este teléfono ya está registrado con el nombre: ${existingCliente.nombre}`
        },
        { status: 400 }
      );
    }

    const nuevoCliente: Omit<User, '_id'> = {
      nombre: data.nombre.trim(),
      telefono: data.telefono.trim(),
      role: 'cliente',
      fechaCreacion: new Date()
    };

    const result = await db.collection<User>("users").insertOne(nuevoCliente);

    return NextResponse.json({
      success: true,
      data: { insertedId: result.insertedId.toString() },
      message: 'Cliente creado exitosamente'
    });

  } catch (error) {
    console.error('Error creando cliente:', error);
    
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
