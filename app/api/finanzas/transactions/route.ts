import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  ApiResponse,
  FinancialTransaction,
  FinancialCategory,
} from "@/lib/types";
import { requireAdmin } from "@/lib/session";
import { getTenantFromRequest, DEFAULT_SALON_ID } from "@/lib/tenant";
import { tenantQuery } from "@/lib/tenant";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<FinancialTransaction[]>>> {
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

    const tipo = request.nextUrl.searchParams.get("tipo");
    const desde = request.nextUrl.searchParams.get("desde");
    const hasta = request.nextUrl.searchParams.get("hasta");

    const filter: Record<string, unknown> = { ...tenantQuery(effectiveSalonId) };
    if (tipo) filter.tipo = tipo;
    if (desde || hasta) {
      filter.fecha = {};
      if (desde) (filter.fecha as Record<string, string>).$gte = desde;
      if (hasta) (filter.fecha as Record<string, string>).$lte = hasta;
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");

    const transactions = await db
      .collection<FinancialTransaction>("financial_transactions")
      .find(filter)
      .sort({ fecha: -1, fechaCreacion: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: transactions.map((t) => ({ ...t, _id: t._id?.toString() })),
    });
  } catch (error) {
    console.error("Error en GET /api/finanzas/transactions:", error);
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

    const body = await request.json();
    const { tipo, monto, fecha, descripcion, categoriaId } = body;

    if (!tipo || !["income", "expense"].includes(tipo)) {
      return NextResponse.json(
        { success: false, error: "tipo debe ser income o expense" },
        { status: 400 }
      );
    }
    if (!monto || monto <= 0) {
      return NextResponse.json(
        { success: false, error: "monto debe ser mayor a 0" },
        { status: 400 }
      );
    }
    if (!fecha || !descripcion) {
      return NextResponse.json(
        { success: false, error: "fecha y descripcion son requeridos" },
        { status: 400 }
      );
    }

    const { salonId } = await getTenantFromRequest(request);
    const effectiveSalonId = auth.session.salonId || salonId || DEFAULT_SALON_ID;

    const client = await clientPromise;
    const db = client.db("nailsalon");

    let categoriaNombre: string | undefined;
    if (categoriaId) {
      const cat = await db
        .collection("financial_categories")
        .findOne({ _id: new ObjectId(categoriaId) }) as FinancialCategory | null;
      categoriaNombre = cat?.nombre;
    }

    const transaction: Omit<FinancialTransaction, "_id"> = {
      salonId: effectiveSalonId,
      tipo,
      categoriaId,
      categoriaNombre,
      monto: Number(monto),
      moneda: "USD",
      fecha,
      descripcion: descripcion.trim(),
      fuente: "manual",
      fechaCreacion: new Date(),
    };

    const result = await db
      .collection("financial_transactions")
      .insertOne(transaction);

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId.toString(), ...transaction },
      message: "Transacción registrada",
    });
  } catch (error) {
    console.error("Error en POST /api/finanzas/transactions:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
