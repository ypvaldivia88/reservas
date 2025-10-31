import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { User, ApiResponse } from "@/lib/types";

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
