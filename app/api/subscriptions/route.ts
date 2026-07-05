import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  ApiResponse,
  SubscriptionPlan,
  TenantSubscription,
  PaymentRequest,
} from "@/lib/types";
import { requireAdmin } from "@/lib/session";
import { getTenantFromRequest, DEFAULT_SALON_ID } from "@/lib/tenant";
import { tenantQuery } from "@/lib/tenant";
import {
  calculatePlanPrice,
  generatePaymentReference,
  isSubscriptionActive,
} from "@/lib/subscription";

export async function GET(
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

    const { salonId } = await getTenantFromRequest(request);
    const effectiveSalonId = auth.session.salonId || salonId || DEFAULT_SALON_ID;

    const client = await clientPromise;
    const db = client.db("nailsalon");

    const subscription = (await db
      .collection<TenantSubscription>("tenant_subscriptions")
      .findOne(
        { ...tenantQuery(effectiveSalonId) },
        { sort: { fechaCreacion: -1 } }
      )) as TenantSubscription | null;

    let plan: SubscriptionPlan | null = null;
    if (subscription?.planId) {
      plan = (await db
        .collection("subscription_plans")
        .findOne({
          _id: new ObjectId(subscription.planId),
        })) as SubscriptionPlan | null;
    }

    const pendingPayment = (await db
      .collection<PaymentRequest>("payment_requests")
      .findOne({
        ...tenantQuery(effectiveSalonId),
        status: "pending",
      })) as PaymentRequest | null;

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        plan,
        isActive: isSubscriptionActive(subscription),
        pendingPayment,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/subscriptions:", error);
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

    const { planId, ciclo } = await request.json();
    if (!planId || !["monthly", "yearly"].includes(ciclo)) {
      return NextResponse.json(
        { success: false, error: "planId y ciclo son requeridos" },
        { status: 400 }
      );
    }

    const { salonId } = await getTenantFromRequest(request);
    const effectiveSalonId = auth.session.salonId || salonId || DEFAULT_SALON_ID;

    const client = await clientPromise;
    const db = client.db("nailsalon");

    const plan = (await db
      .collection("subscription_plans")
      .findOne({ _id: new ObjectId(planId), activo: true })) as SubscriptionPlan | null;

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    const pricing = calculatePlanPrice(plan, ciclo);
    const codigoReferencia = generatePaymentReference();

    const paymentRequest: Omit<PaymentRequest, "_id"> = {
      salonId: effectiveSalonId,
      planId,
      ciclo,
      montoOriginal: pricing.montoOriginal,
      descuentoPorcentaje: pricing.descuentoTotal,
      montoFinal: pricing.montoFinal,
      codigoReferencia,
      status: "pending",
      fechaCreacion: new Date(),
    };

    const result = await db
      .collection("payment_requests")
      .insertOne(paymentRequest);

    const salon = await db
      .collection("salons")
      .findOne({ salonId: effectiveSalonId });

    return NextResponse.json({
      success: true,
      data: {
        paymentRequest: {
          ...paymentRequest,
          _id: result.insertedId.toString(),
        },
        salonNombre: salon?.nombre ?? "Mi Salón",
        planNombre: plan.nombre,
      },
      message: "Solicitud de pago creada. Envía el comprobante por WhatsApp.",
    });
  } catch (error) {
    console.error("Error en POST /api/subscriptions:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
