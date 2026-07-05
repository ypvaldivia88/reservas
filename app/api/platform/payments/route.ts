import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { ApiResponse, PaymentRequest } from "@/lib/types";
import { requirePlatformAdmin } from "@/lib/session";
import { getSubscriptionPeriodEnd } from "@/lib/subscription";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaymentRequest[]>>> {
  try {
    const auth = await requirePlatformAdmin(request);
    if ("error" in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const status = (request.nextUrl.searchParams.get("status") ||
      "pending") as PaymentRequest["status"];
    const client = await clientPromise;
    const db = client.db("nailsalon");

    const payments = await db
      .collection<PaymentRequest>("payment_requests")
      .find({ status })
      .sort({ fechaCreacion: -1 })
      .toArray();

    const enriched = await Promise.all(
      payments.map(async (p) => {
        const salon = await db
          .collection("salons")
          .findOne({ salonId: p.salonId });
        const plan = await db
          .collection("subscription_plans")
          .findOne({ _id: new ObjectId(p.planId) });
        return {
          ...p,
          _id: p._id?.toString(),
          salonNombre: salon?.nombre,
          planNombre: plan?.nombre,
        };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Error en GET /api/platform/payments:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const auth = await requirePlatformAdmin(request);
    if ("error" in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { paymentId, action, notas } = await request.json();
    if (!paymentId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "paymentId y action (approve/reject) requeridos" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");

    const payment = (await db
      .collection("payment_requests")
      .findOne({ _id: new ObjectId(paymentId) })) as PaymentRequest | null;

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    if (payment.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Este pago ya fue procesado" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    await db.collection("payment_requests").updateOne(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          status: newStatus,
          notas,
          fechaResolucion: new Date(),
        },
      }
    );

    if (action === "approve") {
      const now = new Date();
      const periodoFin = getSubscriptionPeriodEnd(payment.ciclo, now);

      const existingSub = await db
        .collection("tenant_subscriptions")
        .findOne({ salonId: payment.salonId });

      if (existingSub) {
        await db.collection("tenant_subscriptions").updateOne(
          { _id: existingSub._id },
          {
            $set: {
              planId: payment.planId,
              ciclo: payment.ciclo,
              status: "active",
              descuentoAplicado: payment.descuentoPorcentaje,
              periodoInicio: now,
              periodoFin,
              fechaActualizacion: now,
            },
          }
        );
      } else {
        await db.collection("tenant_subscriptions").insertOne({
          salonId: payment.salonId,
          planId: payment.planId,
          ciclo: payment.ciclo,
          status: "active",
          descuentoAplicado: payment.descuentoPorcentaje,
          periodoInicio: now,
          periodoFin,
          fechaCreacion: now,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "Pago aprobado y suscripción activada"
          : "Pago rechazado",
    });
  } catch (error) {
    console.error("Error en PATCH /api/platform/payments:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
