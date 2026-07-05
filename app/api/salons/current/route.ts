import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ApiResponse, Salon } from "@/lib/types";
import { requireAdmin } from "@/lib/session";
import { getTenantFromRequest, DEFAULT_SALON_ID } from "@/lib/tenant";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Salon>>> {
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

    let salon = (await db
      .collection<Salon>("salons")
      .findOne({ salonId: effectiveSalonId })) as Salon | null;

    // Si no existe registro de salón, devolver datos por defecto sin crear nada
    if (!salon) {
      salon = {
        salonId: DEFAULT_SALON_ID,
        slug: "oh-diosa",
        nombre: "Oh`Diosa",
        status: "active",
      };
    }

    return NextResponse.json({
      success: true,
      data: { ...salon, _id: salon._id?.toString() },
    });
  } catch (error) {
    console.error("Error en GET /api/salons/current:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
