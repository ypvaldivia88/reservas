import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { User, ApiResponse } from "@/lib/types";
import { hashPassword } from "@/lib/auth";
import { DEFAULT_SALON_ID } from "@/lib/tenant";

export async function POST(): Promise<NextResponse<ApiResponse>> {
  try {
    const client = await clientPromise;
    const db = client.db("nailsalon");
    
    // Verificar si ya existe un admin
    const existingAdmin = await db.collection<User>("users").findOne({ 
      role: { $in: ['admin', 'salon_admin'] }
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin ya existe'
      });
    }

    // Crear admin por defecto
    const hashedPassword = await hashPassword('admin');
    
    const adminUser: Omit<User, '_id'> = {
      username: 'admin',
      password: hashedPassword,
      role: 'salon_admin',
      salonId: DEFAULT_SALON_ID,
      nombre: 'Administrador',
      fechaCreacion: new Date()
    };

    await db.collection<User>("users").insertOne(adminUser);

    return NextResponse.json({
      success: true,
      message: 'Admin creado exitosamente con usuario: admin y contraseña: admin'
    });

  } catch (error) {
    console.error('Error inicializando admin:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
