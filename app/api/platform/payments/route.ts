import { platformHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { PaymentRequest } from "@/lib/types";
import { getSubscriptionPeriodEnd } from "@/lib/subscription";
import { AppError } from "@/lib/api/errors";

export const GET = platformHandler(async ({ request }) => {
  const status = (request.nextUrl.searchParams.get("status") ||
    "pending") as PaymentRequest["status"];

  const db = await getDb();
  const payments = await db
    .collection<PaymentRequest>(Collections.PAYMENT_REQUESTS)
    .find({ status })
    .sort({ fechaCreacion: -1 })
    .toArray();

  const enriched = await Promise.all(
    payments.map(async (p) => {
      const salon = await db
        .collection(Collections.SALONS)
        .findOne({ salonId: p.salonId });
      const plan = await db
        .collection(Collections.SUBSCRIPTION_PLANS)
        .findOne({ _id: new ObjectId(p.planId) });
      return {
        ...p,
        _id: p._id?.toString(),
        salonNombre: salon?.nombre,
        planNombre: plan?.nombre,
      };
    })
  );

  return ok(enriched);
});

export const PATCH = platformHandler(async ({ request }) => {
  const { paymentId, action, notas } = await request.json();
  if (!paymentId || !["approve", "reject"].includes(action)) {
    throw new AppError("paymentId y action (approve/reject) requeridos", 400);
  }

  const db = await getDb();
  const payment = (await db
    .collection(Collections.PAYMENT_REQUESTS)
    .findOne({ _id: new ObjectId(paymentId) })) as PaymentRequest | null;

  if (!payment) throw AppError.notFound("Pago no encontrado");
  if (payment.status !== "pending") {
    throw new AppError("Este pago ya fue procesado", 400);
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  await db.collection(Collections.PAYMENT_REQUESTS).updateOne(
    { _id: new ObjectId(paymentId) },
    { $set: { status: newStatus, notas, fechaResolucion: new Date() } }
  );

  if (action === "approve") {
    const now = new Date();
    const periodoFin = getSubscriptionPeriodEnd(payment.ciclo, now);

    const existingSub = await db
      .collection(Collections.TENANT_SUBSCRIPTIONS)
      .findOne({ salonId: payment.salonId });

    const subData = {
      planId: payment.planId,
      ciclo: payment.ciclo,
      status: "active" as const,
      descuentoAplicado: payment.descuentoPorcentaje,
      periodoInicio: now,
      periodoFin,
      fechaActualizacion: now,
    };

    if (existingSub) {
      await db
        .collection(Collections.TENANT_SUBSCRIPTIONS)
        .updateOne({ _id: existingSub._id }, { $set: subData });
    } else {
      await db.collection(Collections.TENANT_SUBSCRIPTIONS).insertOne({
        salonId: payment.salonId,
        ...subData,
        fechaCreacion: now,
      });
    }
  }

  return ok(undefined, {
    message:
      action === "approve"
        ? "Pago aprobado y suscripción activada"
        : "Pago rechazado",
  });
});
