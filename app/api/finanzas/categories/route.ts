import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ApiResponse, FinancialCategory } from "@/lib/types";
import { requireAdmin } from "@/lib/session";
import { getTenantFromRequest, DEFAULT_SALON_ID } from "@/lib/tenant";
import { tenantQuery } from "@/lib/tenant";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<FinancialCategory[]>>> {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { salonId } = await getTenantFromRequest(request);
    const effectiveSalonId = auth.session.salonId || salonId || DEFAULT_SALON_ID;

    const client = await clientPromise;
    const db = client.db("nailsalon");

    const categories = await db
      .collection<FinancialCategory>("financial_categories")
      .find({ ...tenantQuery(effectiveSalonId), activo: true })
      .sort({ tipo: 1, nombre: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: categories.map((c) => ({ ...c, _id: c._id?.toString() })),
    });
  } catch (error) {
    console.error("Error en GET /api/finanzas/categories:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { nombre, tipo, color } = await request.json();
    if (!nombre || !["income", "expense"].includes(tipo)) {
      return NextResponse.json(
        { success: false, error: "nombre y tipo son requeridos" },
        { status: 400 }
      );
    }

    const { salonId } = await getTenantFromRequest(request);
    const effectiveSalonId = auth.session.salonId || salonId || DEFAULT_SALON_ID;

    const client = await clientPromise;
    const db = client.db("nailsalon");

    const category: Omit<FinancialCategory, "_id"> = {
      salonId: effectiveSalonId,
      nombre: nombre.trim(),
      tipo,
      color: color || "#6b7280",
      activo: true,
      fechaCreacion: new Date(),
    };

    const result = await db
      .collection("financial_categories")
      .insertOne(category);

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId.toString(), ...category },
    });
  } catch (error) {
    console.error("Error en POST /api/finanzas/categories:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
