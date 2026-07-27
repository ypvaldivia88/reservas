import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { hashPassword } from "@/lib/auth";
import { AppError } from "@/lib/api/errors";
import {
  SalonRegistrationRequest,
  SalonRegistrationResult,
  PaymentRequest,
  TenantSubscription,
  BusinessTemplate,
} from "@/lib/types";
import {
  salonRepository,
  generateSalonId,
  slugify,
} from "@/lib/repositories/salon.repository";
import { userRepository } from "@/lib/repositories/user.repository";
import { DEFAULT_FINANCIAL_CATEGORIES } from "@/lib/finances";
import { scheduleUtils } from "@/lib/utils";
import {
  getSubscriptionPeriodEnd,
  getTrialRemaining,
  getSubscriptionAccessInfo,
  TRIAL_DAYS,
} from "@/lib/subscription";
import { activationCertificateService } from "@/lib/services/activation-certificate.service";
import { platformAuditService } from "@/lib/services/platform-audit.service";
import {
  getBusinessTemplate,
  isValidBusinessTemplate,
} from "@/lib/business-templates";
import { seedTenantMedia } from "@/lib/services/tenant-seed.service";
import { resolvePlaceholderPack } from "@/lib/placeholder-images";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class SalonService {
  normalizeSlug(slug: string): string {
    return slugify(slug);
  }

  async isSlugAvailable(slug: string): Promise<boolean> {
    const normalized = this.normalizeSlug(slug);
    if (!normalized || normalized.length < 3) return false;
    return !(await salonRepository.slugExists(normalized));
  }

  async register(
    data: SalonRegistrationRequest
  ): Promise<SalonRegistrationResult> {
    const nombre = data.nombre?.trim();
    const slug = this.normalizeSlug(data.slug || data.nombre);
    const adminUsername = data.adminUsername?.trim().toLowerCase();
    const adminPassword = data.adminPassword;
    const adminNombre = data.adminNombre?.trim();

    if (!nombre || nombre.length < 2) {
      throw new AppError("El nombre del salón es requerido", 400);
    }
    if (!slug || slug.length < 3 || !SLUG_REGEX.test(slug)) {
      throw new AppError(
        "El slug debe tener al menos 3 caracteres (solo letras, números y guiones)",
        400
      );
    }
    if (!adminNombre || adminNombre.length < 2) {
      throw new AppError("El nombre del administrador es requerido", 400);
    }
    if (!adminUsername || adminUsername.length < 3) {
      throw new AppError("El usuario debe tener al menos 3 caracteres", 400);
    }
    if (!adminPassword || adminPassword.length < 8) {
      throw new AppError("La contraseña debe tener al menos 8 caracteres", 400);
    }

    if (await salonRepository.slugExists(slug)) {
      throw AppError.conflict("Este slug ya está en uso. Elige otro.");
    }

    const existingUser = await userRepository.findAdminByUsername(adminUsername);
    if (existingUser) {
      throw AppError.conflict("Este nombre de usuario ya está registrado");
    }

    const salonId = generateSalonId();
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

    const businessTemplate: BusinessTemplate =
      data.businessTemplate && isValidBusinessTemplate(data.businessTemplate)
        ? data.businessTemplate
        : "generic";
    const templateConfig = getBusinessTemplate(businessTemplate);
    const placeholderPack = await resolvePlaceholderPack(businessTemplate);

    const db = await getDb();

    await salonRepository.create({
      salonId,
      slug,
      nombre,
      whatsappNumber: data.whatsappNumber?.trim(),
      timezone: "America/Havana",
      currency: "CUP",
      status: "active",
      businessTemplate,
      branding: {
        ...templateConfig.branding,
        heroImageUrl: placeholderPack.heroImageUrl,
        logoUrl: undefined,
        logoSmallUrl: undefined,
      },
      content: {
        ...templateConfig.content,
        heroTitle: nombre,
        heroHighlight: templateConfig.content.heroHighlight,
      },
      contact: templateConfig.contact,
      social: {
        ...templateConfig.social,
        whatsapp: data.whatsappNumber?.trim(),
      },
      fechaCreacion: now,
    });

    await db.collection(Collections.USERS).insertOne({
      username: adminUsername,
      password: await hashPassword(adminPassword),
      role: "salon_admin",
      salonId,
      nombre: adminNombre,
      fechaCreacion: now,
    });

    await db.collection(Collections.SCHEDULES).insertOne({
      ...scheduleUtils.createDefaultSchedule(),
      salonId,
      createdAt: now,
      updatedAt: now,
    });

    await db.collection(Collections.FINANCIAL_CATEGORIES).insertMany(
      DEFAULT_FINANCIAL_CATEGORIES.map((c) => ({
        ...c,
        salonId,
        activo: true,
        fechaCreacion: now,
      }))
    );

    await seedTenantMedia(db, salonId, businessTemplate, placeholderPack, now);

    const basicPlan = await db
      .collection(Collections.SUBSCRIPTION_PLANS)
      .findOne({ activo: true }, { sort: { orden: 1 } });

    if (basicPlan) {
      await db.collection(Collections.TENANT_SUBSCRIPTIONS).insertOne({
        salonId,
        planId: basicPlan._id!.toString(),
        ciclo: "monthly",
        status: "trial",
        descuentoAplicado: 0,
        periodoInicio: now,
        periodoFin: trialEnd,
        fechaCreacion: now,
      });
    }

    return {
      salonId,
      slug,
      nombre,
      adminUsername,
      trialEndsAt: trialEnd.toISOString().split("T")[0],
    };
  }

  async listWithSubscriptions() {
    const salons = await salonRepository.listAll();
    const db = await getDb();

    return Promise.all(
      salons.map(async (salon) => {
        const subscription = (await db
          .collection<TenantSubscription>(Collections.TENANT_SUBSCRIPTIONS)
          .findOne(
            { salonId: salon.salonId },
            { sort: { fechaCreacion: -1 } }
          )) as TenantSubscription | null;

        let planNombre: string | undefined;
        if (subscription?.planId) {
          const plan = await db
            .collection(Collections.SUBSCRIPTION_PLANS)
            .findOne({ _id: new ObjectId(subscription.planId) });
          planNombre = plan?.nombre;
        }

        const pendingPayments = await db
          .collection(Collections.PAYMENT_REQUESTS)
          .countDocuments({ salonId: salon.salonId, status: "pending" });

        const access = getSubscriptionAccessInfo(
          subscription,
          salon.status
        );

        const pendingCertificate = await db
          .collection(Collections.ACTIVATION_CERTIFICATES)
          .countDocuments({
            salonId: salon.salonId,
            status: "pending",
            expiresAt: { $gt: new Date() },
          });

        return {
          ...salon,
          _id: salon._id?.toString(),
          subscription,
          planNombre,
          pendingPayments,
          accessState: access.accessState,
          graceDaysRemaining: access.graceDaysRemaining,
          isOperational: access.isOperational,
          hasPendingCertificate: pendingCertificate > 0,
        };
      })
    );
  }
}

export class PlatformService {
  async listPayments(status: PaymentRequest["status"] = "pending") {
    const db = await getDb();
    const payments = await db
      .collection<PaymentRequest>(Collections.PAYMENT_REQUESTS)
      .find({ status })
      .sort({ fechaCreacion: -1 })
      .toArray();

    return Promise.all(
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
  }

  async listTrials() {
    const db = await getDb();
    const salons = await salonRepository.listAll();

    const trials = await Promise.all(
      salons.map(async (salon) => {
        const subscription = (await db
          .collection<TenantSubscription>(Collections.TENANT_SUBSCRIPTIONS)
          .findOne(
            { salonId: salon.salonId },
            { sort: { fechaCreacion: -1 } }
          )) as TenantSubscription | null;

        if (!subscription || subscription.status !== "trial") {
          return null;
        }

        let planNombre: string | undefined;
        if (subscription.planId) {
          const plan = await db
            .collection(Collections.SUBSCRIPTION_PLANS)
            .findOne({ _id: new ObjectId(subscription.planId) });
          planNombre = plan?.nombre;
        }

        const adminUser = await db.collection(Collections.USERS).findOne({
          salonId: salon.salonId,
          role: "salon_admin",
        });

        const pendingPayments = await db
          .collection(Collections.PAYMENT_REQUESTS)
          .countDocuments({ salonId: salon.salonId, status: "pending" });

        const trialRemaining = getTrialRemaining(subscription.periodoFin);

        return {
          salonId: salon.salonId,
          slug: salon.slug,
          nombre: salon.nombre,
          whatsappNumber: salon.whatsappNumber,
          fechaCreacion: salon.fechaCreacion,
          adminUsername: adminUser?.username as string | undefined,
          planNombre,
          subscription: {
            status: subscription.status,
            periodoInicio: subscription.periodoInicio,
            periodoFin: subscription.periodoFin,
          },
          trialRemaining,
          pendingPayments,
        };
      })
    );

    return trials
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        const aEnd = a.subscription.periodoFin
          ? new Date(a.subscription.periodoFin).getTime()
          : Number.MAX_SAFE_INTEGER;
        const bEnd = b.subscription.periodoFin
          ? new Date(b.subscription.periodoFin).getTime()
          : Number.MAX_SAFE_INTEGER;
        return aEnd - bEnd;
      });
  }

  async resolvePayment(
    paymentId: string,
    action: "approve" | "reject",
    notas?: string,
    actorUserId?: string
  ) {
    if (!ObjectId.isValid(paymentId)) {
      throw new AppError("ID de pago inválido", 400);
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
      if (!actorUserId) {
        throw new AppError("actorUserId requerido para aprobar", 400);
      }

      const paymentWithId = {
        ...payment,
        _id: paymentId,
      };

      const { certificate, code } =
        await activationCertificateService.createForPayment(
          paymentWithId,
          actorUserId
        );

      const salon = await db
        .collection(Collections.SALONS)
        .findOne({ salonId: payment.salonId });
      const plan = await db
        .collection(Collections.SUBSCRIPTION_PLANS)
        .findOne({ _id: new ObjectId(payment.planId) });
      const adminUser = await db.collection(Collections.USERS).findOne({
        salonId: payment.salonId,
        role: "salon_admin",
      });

      await platformAuditService.log({
        action: "payment_approved_certificate_issued",
        actorUserId,
        actorRole: "platform_admin",
        salonId: payment.salonId,
        targetId: String(certificate._id),
        metadata: {
          paymentId,
          codePrefix: certificate.codePrefix,
        },
      });

      return {
        message: "Pago aprobado. Certificado de activación generado.",
        certificate: {
          id: certificate._id,
          code,
          codePrefix: certificate.codePrefix,
          salonId: payment.salonId,
          salonNombre: salon?.nombre,
          planNombre: plan?.nombre,
          ciclo: payment.ciclo,
          adminPhone: adminUser?.telefono ?? salon?.whatsappNumber,
          expiresAt: certificate.expiresAt,
        },
      };
    }

    if (actorUserId) {
      await platformAuditService.log({
        action: "payment_rejected",
        actorUserId,
        actorRole: "platform_admin",
        salonId: payment.salonId,
        targetId: paymentId,
      });
    }

    return { message: "Pago rechazado" };
  }

  async getDashboardSummary() {
    const salons = await salonService.listWithSubscriptions();
    const db = await getDb();

    const summary = {
      total: salons.length,
      active: 0,
      gracePeriod: 0,
      expired: 0,
      suspended: 0,
      trial: 0,
      pendingPayments: 0,
      pendingCertificates: 0,
    };

    for (const salon of salons) {
      if (salon.accessState === "active") summary.active++;
      if (salon.accessState === "grace_period") summary.gracePeriod++;
      if (salon.accessState === "expired") summary.expired++;
      if (salon.accessState === "suspended") summary.suspended++;
      if (salon.subscription?.status === "trial" && salon.accessState === "active") {
        summary.trial++;
      }
      summary.pendingPayments += salon.pendingPayments;
      if (salon.hasPendingCertificate) summary.pendingCertificates++;
    }

    const recentAudit = await platformAuditService.listRecent(10);

    return { summary, salons, recentAudit };
  }

  async getSalonDetail(salonId: string) {
    const db = await getDb();
    const salon = await salonRepository.findBySalonId(salonId);
    if (!salon) throw AppError.notFound("Salón no encontrado");

    const subscription = (await db
      .collection<TenantSubscription>(Collections.TENANT_SUBSCRIPTIONS)
      .findOne({ salonId }, { sort: { fechaCreacion: -1 } })) as TenantSubscription | null;

    const access = getSubscriptionAccessInfo(subscription, salon.status);
    const certificates = await activationCertificateService.listForSalon(salonId);
    const payments = await db
      .collection<PaymentRequest>(Collections.PAYMENT_REQUESTS)
      .find({ salonId })
      .sort({ fechaCreacion: -1 })
      .limit(20)
      .toArray();

    const admins = await db
      .collection(Collections.USERS)
      .find({ salonId, role: { $in: ["salon_admin", "admin"] } })
      .project({ password: 0 })
      .toArray();

    const auditLog = await platformAuditService.listForSalon(salonId);

    return {
      salon,
      subscription,
      access,
      certificates,
      payments: payments.map((p) => ({ ...p, _id: p._id?.toString() })),
      admins: admins.map((a) => ({ ...a, _id: a._id?.toString() })),
      auditLog,
    };
  }

  async updateSalonStatus(
    salonId: string,
    status: "active" | "suspended" | "inactive",
    actorUserId: string
  ) {
    const salon = await salonRepository.updateBySalonId(salonId, {
      status,
      fechaActualizacion: new Date(),
    });
    if (!salon) throw AppError.notFound("Salón no encontrado");

    await platformAuditService.log({
      action: "salon_status_updated",
      actorUserId,
      actorRole: "platform_admin",
      salonId,
      metadata: { status },
    });

    return salon;
  }

  async extendTrial(salonId: string, days: number, actorUserId: string) {
    if (days < 1 || days > 90) {
      throw new AppError("Los días deben estar entre 1 y 90", 400);
    }

    const db = await getDb();
    const subscription = await db
      .collection<TenantSubscription>(Collections.TENANT_SUBSCRIPTIONS)
      .findOne({ salonId }, { sort: { fechaCreacion: -1 } });

    if (!subscription) throw AppError.notFound("Suscripción no encontrada");

    const base = subscription.periodoFin
      ? new Date(subscription.periodoFin)
      : new Date();
    const newEnd = new Date(base);
    newEnd.setDate(newEnd.getDate() + days);

    await db.collection(Collections.TENANT_SUBSCRIPTIONS).updateOne(
      { _id: new ObjectId(String(subscription._id)) },
      {
        $set: {
          status: "trial",
          periodoFin: newEnd,
          fechaActualizacion: new Date(),
        },
      }
    );

    await platformAuditService.log({
      action: "trial_extended",
      actorUserId,
      actorRole: "platform_admin",
      salonId,
      metadata: { days, newEnd },
    });

    return { periodoFin: newEnd };
  }

  async deleteSalonCascade(
    salonId: string,
    confirmSlug: string,
    actorUserId: string
  ) {
    const { DEFAULT_SALON_ID } = await import("@/lib/tenant");
    if (salonId === DEFAULT_SALON_ID) {
      throw new AppError("No se puede eliminar el salón por defecto", 400);
    }

    const salon = await salonRepository.findBySalonId(salonId);
    if (!salon) throw AppError.notFound("Salón no encontrado");
    if (salon.slug !== confirmSlug) {
      throw new AppError("El slug de confirmación no coincide", 400);
    }

    const db = await getDb();
    const tenantCollections = [
      Collections.RESERVAS,
      Collections.SCHEDULES,
      Collections.AVAILABILITY_OVERRIDES,
      Collections.SERVICIOS,
      Collections.CATEGORIAS,
      Collections.IMAGENES,
      Collections.GALERIA,
      Collections.TENANT_SUBSCRIPTIONS,
      Collections.PAYMENT_REQUESTS,
      Collections.ACTIVATION_CERTIFICATES,
      Collections.FINANCIAL_TRANSACTIONS,
      Collections.FINANCIAL_CATEGORIES,
      Collections.REDEEM_ATTEMPTS,
    ] as const;

    const users = await db
      .collection(Collections.USERS)
      .find({ salonId })
      .toArray();
    const userIds = users.map((u) => u._id);

    if (userIds.length > 0) {
      await db.collection(Collections.SESSIONS).deleteMany({
        userId: { $in: userIds },
      });
      await db.collection(Collections.USERS).deleteMany({ salonId });
    }

    for (const col of tenantCollections) {
      await db.collection(col).deleteMany({ salonId });
    }

    await db.collection(Collections.SALONS).deleteOne({ salonId });
    await db
      .collection(Collections.PLATFORM_AUDIT_LOG)
      .deleteMany({ salonId });

    await platformAuditService.log({
      action: "salon_deleted",
      actorUserId,
      actorRole: "platform_admin",
      salonId,
      metadata: { slug: salon.slug, nombre: salon.nombre },
    });

    return { deleted: true };
  }
}

export const salonService = new SalonService();
export const platformService = new PlatformService();
