import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { User, ApiResponse, LoginCredentials } from "@/lib/types";
import { verifyPassword, generateSessionToken } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ token: string; user: { username: string; role: string } }>>> {
  try {
    const data: LoginCredentials = await request.json();

    // Validar datos de entrada
    if (!data.username || !data.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario y contraseña son requeridos'
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");
    
    // Buscar usuario admin
    const user = await db.collection<User>("users").findOne({ 
      username: data.username,
      role: 'admin'
    });

    if (!user || !user.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciales inválidas'
        },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isValid = await verifyPassword(data.password, user.password);
    
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciales inválidas'
        },
        { status: 401 }
      );
    }

    // Generar token de sesión
    const token = generateSessionToken();

    // Guardar sesión en la base de datos
    await db.collection("sessions").insertOne({
      token,
      userId: user._id,
      username: user.username,
      role: user.role,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    });

    const response = NextResponse.json({
      success: true,
      data: { 
        token,
        user: {
          username: user.username!,
          role: user.role
        }
      },
      message: 'Inicio de sesión exitoso'
    });

    // Establecer cookie con el token
    response.cookies.set('session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 horas
    });

    return response;

  } catch (error) {
    console.error('Error en login:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
