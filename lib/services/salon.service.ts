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
import { getSubscriptionPeriodEnd } from "@/lib/subscription";
import {
  getBusinessTemplate,
  isValidBusinessTemplate,
} from "@/lib/business-templates";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TRIAL_DAYS = 14;

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

    const db = await getDb();

    await salonRepository.create({
      salonId,
      slug,
      nombre,
      whatsappNumber: data.whatsappNumber?.trim(),
      timezone: "America/Havana",
      currency: "USD",
      status: "active",
      businessTemplate,
      branding: templateConfig.branding,
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

    await db.collection(Collections.SERVICIOS).insertMany(
      templateConfig.defaultServices.map((s, i) => ({
        ...s,
        salonId,
        precio: 0,
        activo: true,
        orden: i + 1,
        fechaCreacion: now,
        fechaActualizacion: now,
      }))
    );

    const basicPlan = await db
      .collection(Collections.SUBSCRIPTION_PLANS)
      .findOne({ nombre: "Básico", activo: true });

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

        return {
          ...salon,
          _id: salon._id?.toString(),
          subscription,
          planNombre,
          pendingPayments,
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

  async resolvePayment(
    paymentId: string,
    action: "approve" | "reject",
    notas?: string
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

    return action === "approve"
      ? "Pago aprobado y suscripción activada"
      : "Pago rechazado";
  }
}

export const salonService = new SalonService();
export const platformService = new PlatformService();
