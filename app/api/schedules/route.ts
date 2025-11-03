import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Schedule, ApiResponse } from "@/lib/types";
import { scheduleUtils } from "@/lib/utils";

// GET: Obtiene el horario por defecto o uno específico
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Schedule>>> {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || 'default';

    const client = await clientPromise;
    const db = client.db("nailsalon");
    
    let schedule = await db.collection<Schedule>("schedules").findOne({ name });

    // Si no existe el horario por defecto, crearlo
    if (!schedule && name === 'default') {
      const defaultSchedule = scheduleUtils.createDefaultSchedule();
      const result = await db.collection("schedules").insertOne(defaultSchedule);
      schedule = { ...defaultSchedule, _id: result.insertedId.toString() } as any;
      console.log('✨ Horario por defecto creado');
    }

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          error: 'Horario no encontrado'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error('Error en GET /api/schedules:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

// POST: Crea o actualiza el horario por defecto
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Schedule>>> {
  try {
    const data = await request.json();

    // Validar datos
    if (!data.schedule || !Array.isArray(data.schedule)) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos de horario inválidos",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");

    const scheduleData = {
      name: data.name || "default",
      description: data.description || "",
      schedule: data.schedule,
      updatedAt: new Date(),
    };

    // Actualizar o insertar
    const result = await db.collection<Schedule>("schedules").findOneAndUpdate(
      { name: scheduleData.name },
      {
        $set: scheduleData,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "Error al actualizar el horario",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result as Schedule,
      message: "Horario actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error en POST /api/schedules:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}