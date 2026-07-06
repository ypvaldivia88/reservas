import { adminHandler } from "@/lib/api/handlers";
import { ok, created } from "@/lib/api/responses";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { tenantQuery } from "@/lib/tenant";
import { ObjectId } from "mongodb";
import {
  SubscriptionPlan,
  TenantSubscription,
  PaymentRequest,
} from "@/lib/types";
import {
  calculatePlanPrice,
  generatePaymentReference,
  isSubscriptionActive,
  normalizeSubscriptionPlan,
} from "@/lib/subscription";
import { AppError } from "@/lib/api/errors";

export const GET = adminHandler(async ({ salonId }) => {
  const db = await getDb();

  const subscription = (await db
    .collection<TenantSubscription>(Collections.TENANT_SUBSCRIPTIONS)
    .findOne(
      { ...tenantQuery(salonId) },
      { sort: { fechaCreacion: -1 } }
    )) as TenantSubscription | null;

  let plan: SubscriptionPlan | null = null;
  if (subscription?.planId) {
    plan = (await db
      .collection(Collections.SUBSCRIPTION_PLANS)
      .findOne({ _id: new ObjectId(subscription.planId) })) as SubscriptionPlan | null;
  }

  const pendingPayment = (await db
    .collection<PaymentRequest>(Collections.PAYMENT_REQUESTS)
    .findOne({
      ...tenantQuery(salonId),
      status: "pending",
    })) as PaymentRequest | null;

  return ok({
    subscription,
    plan,
    isActive: isSubscriptionActive(subscription),
    pendingPayment,
  });
});

export const POST = adminHandler(async ({ salonId, request }) => {
  const { planId, ciclo } = await request.json();
  if (!planId || !["monthly", "semiannual", "yearly"].includes(ciclo)) {
    throw new AppError("planId y ciclo son requeridos", 400);
  }

  const db = await getDb();
  const plan = (await db
    .collection(Collections.SUBSCRIPTION_PLANS)
    .findOne({ _id: new ObjectId(planId), activo: true })) as SubscriptionPlan | null;

  if (!plan) throw AppError.notFound("Plan no encontrado");

  const normalizedPlan = normalizeSubscriptionPlan(plan);
  const pricing = calculatePlanPrice(normalizedPlan, ciclo);
  const codigoReferencia = generatePaymentReference();

  const paymentRequest: Omit<PaymentRequest, "_id"> = {
    salonId,
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
    .collection(Collections.PAYMENT_REQUESTS)
    .insertOne(paymentRequest);

  const salon = await db
    .collection(Collections.SALONS)
    .findOne({ salonId });

  return created(
    {
      paymentRequest: {
        ...paymentRequest,
        _id: result.insertedId.toString(),
      },
      salonNombre: salon?.nombre ?? "Mi Salón",
      planNombre: plan.nombre,
    },
    "Solicitud de pago creada. Envía el comprobante por WhatsApp."
  );
});
