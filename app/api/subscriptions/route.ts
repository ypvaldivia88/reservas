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
  getSubscriptionAccessInfo,
  normalizeSubscriptionPlan,
} from "@/lib/subscription";
import { AppError } from "@/lib/api/errors";
import { getTenantAccessForSalon } from "@/lib/services/tenant-access.service";
import { activationCertificateService } from "@/lib/services/activation-certificate.service";

async function getPendingPaymentForSalon(salonId: string) {
  const db = await getDb();
  return (await db
    .collection<PaymentRequest>(Collections.PAYMENT_REQUESTS)
    .findOne({
      ...tenantQuery(salonId),
      status: "pending",
    })) as PaymentRequest | null;
}

async function buildPaymentResponse(
  payment: PaymentRequest & { _id?: unknown },
  options?: { alreadyPending?: boolean }
) {
  const db = await getDb();
  const paymentId =
    payment._id != null ? String(payment._id) : "";

  const [salon, plan] = await Promise.all([
    db.collection(Collections.SALONS).findOne({ salonId: payment.salonId }),
    db
      .collection(Collections.SUBSCRIPTION_PLANS)
      .findOne({ _id: new ObjectId(payment.planId) }),
  ]);

  return {
    paymentRequest: {
      ...payment,
      _id: paymentId ?? "",
    },
    salonNombre: salon?.nombre ?? "Mi Salón",
    planNombre: plan?.nombre ?? "Plan",
    alreadyPending: options?.alreadyPending ?? false,
  };
}

export const GET = adminHandler(async ({ salonId }) => {
  const db = await getDb();

  const { salon, subscription, access } = await getTenantAccessForSalon(salonId);

  let plan: SubscriptionPlan | null = null;
  if (subscription?.planId) {
    plan = (await db
      .collection(Collections.SUBSCRIPTION_PLANS)
      .findOne({ _id: new ObjectId(subscription.planId) })) as SubscriptionPlan | null;
  }

  const pendingPayment = await getPendingPaymentForSalon(salonId);

  const pendingCertificate =
    await activationCertificateService.getPendingForSalon(salonId);

  return ok({
    subscription,
    plan,
    isActive: access.isActive,
    isOperational: access.isOperational,
    accessState: access.accessState,
    graceDaysRemaining: access.graceDaysRemaining,
    salonStatus: salon?.status ?? "active",
    pendingPayment: pendingPayment
      ? {
          _id: pendingPayment._id != null ? String(pendingPayment._id) : "",
          codigoReferencia: pendingPayment.codigoReferencia,
          montoOriginal: pendingPayment.montoOriginal,
          descuentoPorcentaje: pendingPayment.descuentoPorcentaje,
          montoFinal: pendingPayment.montoFinal,
          ciclo: pendingPayment.ciclo,
          status: pendingPayment.status,
        }
      : null,
    pendingCertificate: pendingCertificate
      ? {
          _id: pendingCertificate._id,
          codePrefix: pendingCertificate.codePrefix,
          expiresAt: pendingCertificate.expiresAt,
        }
      : null,
  });
});

export const POST = adminHandler(async ({ salonId, request }) => {
  const { planId, ciclo } = await request.json();
  if (!planId || !["monthly", "semiannual", "yearly"].includes(ciclo)) {
    throw new AppError("planId y ciclo son requeridos", 400);
  }

  const db = await getDb();
  const existingPending = await getPendingPaymentForSalon(salonId);
  if (existingPending) {
    const payload = await buildPaymentResponse(existingPending, {
      alreadyPending: true,
    });
    return ok(payload, {
      message:
        "Ya tienes un pago pendiente de verificación. Puedes reenviar el comprobante por WhatsApp.",
    });
  }

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

  const payload = await buildPaymentResponse({
    ...paymentRequest,
    _id: result.insertedId.toString(),
  });

  return created(
    payload,
    "Solicitud de pago creada. Envía el comprobante por WhatsApp."
  );
});
