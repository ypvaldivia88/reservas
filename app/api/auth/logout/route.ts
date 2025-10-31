import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ApiResponse } from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const token = request.cookies.get('session-token')?.value;
    
    if (token) {
      const client = await clientPromise;
      const db = client.db("nailsalon");
      
      // Eliminar sesión de la base de datos
      await db.collection("sessions").deleteOne({ token });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });

    // Eliminar cookie
    response.cookies.delete('session-token');

    return response;

  } catch (error) {
    console.error('Error en logout:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
