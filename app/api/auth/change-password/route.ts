import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { User, ApiResponse, ChangePasswordRequest } from "@/lib/types";
import { verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Obtener token de sesión
    const token = request.cookies.get('session-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autenticado'
        },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");
    
    // Verificar sesión
    const session = await db.collection("sessions").findOne({ token });
    
    if (!session || new Date(session.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sesión expirada'
        },
        { status: 401 }
      );
    }

    const data: ChangePasswordRequest = await request.json();

    // Validar datos de entrada
    if (!data.currentPassword || !data.newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contraseña actual y nueva son requeridas'
        },
        { status: 400 }
      );
    }

    if (data.newPassword.length < 4) {
      return NextResponse.json(
        {
          success: false,
          error: 'La nueva contraseña debe tener al menos 4 caracteres'
        },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await db.collection<User>("users").findOne({ 
      _id: session.userId
    });

    if (!user || !user.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no encontrado'
        },
        { status: 404 }
      );
    }

    // Verificar contraseña actual
    const isValid = await verifyPassword(data.currentPassword, user.password);
    
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contraseña actual incorrecta'
        },
        { status: 401 }
      );
    }

    // Hash de la nueva contraseña
    const hashedPassword = await hashPassword(data.newPassword);

    // Actualizar contraseña
    await db.collection<User>("users").updateOne(
      { _id: session.userId },
      { $set: { password: hashedPassword } }
    );

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error en change-password:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
