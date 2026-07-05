import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { ApiResponse } from "@/lib/types";
import { requireAdmin } from "@/lib/session";
import { DEFAULT_SALON_ID } from "@/lib/tenant";
import { tenantQuery } from "@/lib/tenant";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const effectiveSalonId = auth.session.salonId || DEFAULT_SALON_ID;
    const client = await clientPromise;
    const db = client.db("nailsalon");

    const tx = await db.collection("financial_transactions").findOne({
      _id: new ObjectId(id),
      ...tenantQuery(effectiveSalonId),
    });

    if (!tx) {
      return NextResponse.json(
        { success: false, error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    // Solo permitir eliminar transacciones manuales (proteger ingresos de reservas)
    if (tx.fuente === "reserva") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Los ingresos de reservas no se pueden eliminar. Edita el costo de la reserva.",
        },
        { status: 400 }
      );
    }

    await db
      .collection("financial_transactions")
      .deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: "Transacción eliminada",
    });
  } catch (error) {
    console.error("Error en DELETE /api/finanzas/transactions:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
