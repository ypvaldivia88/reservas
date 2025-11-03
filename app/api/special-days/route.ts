import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { AvailabilityOverride, ApiResponse } from "@/lib/types";

// GET: Obtiene todos los días especiales configurados
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<AvailabilityOverride[]>>> {
  try {
    const client = await clientPromise;
    const db = client.db("nailsalon");
    
    const specialDays = await db.collection<AvailabilityOverride>("availability_overrides")
      .find({})
      .sort({ date: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: specialDays as AvailabilityOverride[]
    });

  } catch (error) {
    console.error('Error en GET /api/special-days:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

// POST: Crear o actualizar un día especial
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AvailabilityOverride>>> {
  try {
    const data = await request.json();

    if (!data.date) {
      return NextResponse.json(
        {
          success: false,
          error: 'La fecha es requerida'
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");

    const override: Omit<AvailabilityOverride, '_id'> = {
      date: data.date,
      slots: data.slots || [],
      isWorkingDay: data.isWorkingDay !== undefined ? data.isWorkingDay : true,
      reason: data.reason || '',
      createdAt: new Date()
    };

    const result = await db.collection<AvailabilityOverride>("availability_overrides").findOneAndUpdate(
      { date: data.date },
      { $set: override },
      { upsert: true, returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al crear el día especial'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result as AvailabilityOverride,
      message: 'Día especial creado exitosamente'
    });

  } catch (error) {
    console.error('Error en POST /api/special-days:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un día especial
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: 'La fecha es requerida'
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");

    await db.collection<AvailabilityOverride>("availability_overrides").deleteOne({ date });

    return NextResponse.json({
      success: true,
      message: 'Día especial eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE /api/special-days:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
