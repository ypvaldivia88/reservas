import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ApiResponse, FinancialReport } from "@/lib/types";
import { requireAdmin } from "@/lib/session";
import { getTenantFromRequest, DEFAULT_SALON_ID } from "@/lib/tenant";
import { generateFinancialReport } from "@/lib/finances";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<FinancialReport>>> {
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

    const desde =
      request.nextUrl.searchParams.get("desde") ||
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];
    const hasta =
      request.nextUrl.searchParams.get("hasta") ||
      new Date().toISOString().split("T")[0];

    const client = await clientPromise;
    const db = client.db("nailsalon");

    const report = await generateFinancialReport(
      db,
      effectiveSalonId,
      desde,
      hasta
    );

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("Error en GET /api/finanzas/reports:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
