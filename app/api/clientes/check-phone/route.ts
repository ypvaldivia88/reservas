import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { User, Reserva, ApiResponse } from "@/lib/types";

interface ClientCheckResponse {
  exists: boolean;
  cliente?: User;
  reservasActivas?: Reserva[];
}

// GET: Check if client exists by phone and return active reservations
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ClientCheckResponse>>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const telefono = searchParams.get('telefono');

    if (!telefono) {
      return NextResponse.json(
        {
          success: false,
          error: 'Teléfono es requerido',
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");
    
    // Normalize phone for consistent search
    const telefonoNormalizado = telefono.trim();

    // Find client by phone
    const cliente = await db.collection<User>("users").findOne({
      telefono: telefonoNormalizado,
      role: 'cliente'
    });

    if (!cliente) {
      return NextResponse.json({
        success: true,
        data: {
          exists: false
        },
        message: 'Cliente no encontrado'
      });
    }

    // Get active reservations (pendiente or confirmada)
    const reservasActivas = await db
      .collection<Reserva>("reservas")
      .find({
        clienteId: cliente._id?.toString(),
        estado: { $in: ['pendiente', 'confirmada'] }
      })
      .sort({ fechaCita: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        exists: true,
        cliente,
        reservasActivas
      },
      message: 'Cliente encontrado'
    });

  } catch (error) {
    console.error('Error checking client by phone:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
