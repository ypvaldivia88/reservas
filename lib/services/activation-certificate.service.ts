import { randomBytes } from "crypto";
import { ObjectId } from "mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { AppError } from "@/lib/api/errors";
import {
  ActivationCertificate,
  BillingCycle,
  PaymentRequest,
  TenantSubscription,
} from "@/lib/types";
import {
  CERTIFICATE_VALIDITY_DAYS,
  getSubscriptionPeriodEnd,
} from "@/lib/subscription";

const CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_REDEEM_ATTEMPTS_PER_HOUR = 5;

function generateCertificateCode(): string {
  const bytes = randomBytes(8);
  let raw = "";
  for (let i = 0; i < 8; i++) {
    raw += CODE_CHARSET[bytes[i] % CODE_CHARSET.length];
  }
  return `RSRV-${raw.slice(0, 4)}-${raw.slice(4)}`;
}

function normalizeCodeInput(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export class ActivationCertificateService {
  async createForPayment(
    payment: PaymentRequest,
    createdByUserId: string
  ): Promise<{ certificate: ActivationCertificate; code: string }> {
    const db = await getDb();
    const paymentId = String(payment._id);

    const existing = await db
      .collection<ActivationCertificate>(Collections.ACTIVATION_CERTIFICATES)
      .findOne({ paymentRequestId: paymentId, status: "pending" });

    if (existing) {
      throw AppError.conflict(
        "Ya existe un certificado pendiente para este pago"
      );
    }

    const code = generateCertificateCode();
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + CERTIFICATE_VALIDITY_DAYS);

    const certificate: Omit<ActivationCertificate, "_id"> = {
      salonId: payment.salonId,
      paymentRequestId: paymentId,
      planId: payment.planId,
      ciclo: payment.ciclo,
      codeHash: await hashPassword(code),
      codePrefix: code.slice(0, 9),
      status: "pending",
      expiresAt,
      createdAt: now,
      createdByUserId,
    };

    const result = await db
      .collection(Collections.ACTIVATION_CERTIFICATES)
      .insertOne(certificate);

    return {
      certificate: { ...certificate, _id: result.insertedId.toString() },
      code,
    };
  }

  async getPendingForSalon(salonId: string): Promise<ActivationCertificate | null> {
    const db = await getDb();
    const now = new Date();

    const cert = (await db
      .collection<ActivationCertificate>(Collections.ACTIVATION_CERTIFICATES)
      .findOne({
        salonId,
        status: "pending",
        expiresAt: { $gt: now },
      })) as ActivationCertificate | null;

    return cert;
  }

  async listForSalon(salonId: string): Promise<ActivationCertificate[]> {
    const db = await getDb();
    const certs = await db
      .collection<ActivationCertificate>(Collections.ACTIVATION_CERTIFICATES)
      .find({ salonId })
      .sort({ createdAt: -1 })
      .toArray();

    return certs.map((c) => ({
      ...c,
      _id: c._id?.toString(),
    }));
  }

  private async recordRedeemAttempt(
    salonId: string,
    success: boolean
  ): Promise<void> {
    const db = await getDb();
    await db.collection(Collections.REDEEM_ATTEMPTS).insertOne({
      salonId,
      success,
      createdAt: new Date(),
    });
  }

  private async assertRateLimit(salonId: string): Promise<void> {
    const db = await getDb();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const failedAttempts = await db
      .collection(Collections.REDEEM_ATTEMPTS)
      .countDocuments({
        salonId,
        success: false,
        createdAt: { $gte: oneHourAgo },
      });

    if (failedAttempts >= MAX_REDEEM_ATTEMPTS_PER_HOUR) {
      throw new AppError(
        "Demasiados intentos fallidos. Espera una hora e intenta de nuevo.",
        429
      );
    }
  }

  async redeem(
    salonId: string,
    codeInput: string,
    redeemedByUserId: string
  ): Promise<{ periodoFin: Date; ciclo: BillingCycle }> {
    const code = normalizeCodeInput(codeInput);
    if (!/^RSRV-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code)) {
      throw new AppError("Formato de código inválido", 400);
    }

    await this.assertRateLimit(salonId);

    const db = await getDb();
    const now = new Date();

    const pendingCerts = await db
      .collection<ActivationCertificate>(Collections.ACTIVATION_CERTIFICATES)
      .find({ salonId, status: "pending", expiresAt: { $gt: now } })
      .toArray();

    let matched: ActivationCertificate | null = null;
    for (const cert of pendingCerts) {
      if (await verifyPassword(code, cert.codeHash)) {
        matched = cert;
        break;
      }
    }

    if (!matched) {
      await this.recordRedeemAttempt(salonId, false);
      throw new AppError("Código inválido o expirado", 400);
    }

    const periodoFin = getSubscriptionPeriodEnd(matched.ciclo, now);

    const updateResult = await db
      .collection(Collections.ACTIVATION_CERTIFICATES)
      .updateOne(
        {
          _id: new ObjectId(String(matched._id)),
          status: "pending",
        },
        {
          $set: {
            status: "redeemed",
            redeemedAt: now,
            redeemedByUserId,
            activatedPeriodoFin: periodoFin,
          },
        }
      );

    if (updateResult.modifiedCount === 0) {
      throw AppError.conflict("Este código ya fue utilizado");
    }

    const payment = (await db
      .collection(Collections.PAYMENT_REQUESTS)
      .findOne({
        _id: new ObjectId(matched.paymentRequestId),
      })) as PaymentRequest | null;

    const descuentoAplicado = payment?.descuentoPorcentaje ?? 0;

    const existingSub = await db
      .collection<TenantSubscription>(Collections.TENANT_SUBSCRIPTIONS)
      .findOne({ salonId });

    const subData = {
      planId: matched.planId,
      ciclo: matched.ciclo,
      status: "active" as const,
      descuentoAplicado,
      periodoInicio: now,
      periodoFin,
      fechaActualizacion: now,
    };

    if (existingSub) {
      await db
        .collection(Collections.TENANT_SUBSCRIPTIONS)
        .updateOne(
          { _id: new ObjectId(String(existingSub._id)) },
          { $set: subData }
        );
    } else {
      await db.collection(Collections.TENANT_SUBSCRIPTIONS).insertOne({
        salonId,
        ...subData,
        fechaCreacion: now,
      });
    }

    await this.recordRedeemAttempt(salonId, true);

    return { periodoFin, ciclo: matched.ciclo };
  }

  async revoke(certificateId: string): Promise<void> {
    if (!ObjectId.isValid(certificateId)) {
      throw new AppError("ID de certificado inválido", 400);
    }

    const db = await getDb();
    const result = await db
      .collection(Collections.ACTIVATION_CERTIFICATES)
      .updateOne(
        { _id: new ObjectId(certificateId), status: "pending" },
        { $set: { status: "revoked" } }
      );

    if (result.modifiedCount === 0) {
      throw new AppError("Certificado no encontrado o ya procesado", 404);
    }
  }
}

export const activationCertificateService = new ActivationCertificateService();
