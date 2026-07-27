import { randomBytes } from "crypto";
import {
  BillingCycle,
  SubscriptionPlan,
  TenantSubscription,
} from "@/lib/types";

export const SUBSCRIPTION_CURRENCY = "USD" as const;
export const TRIAL_DAYS = 14;
export const GRACE_PERIOD_DAYS = 4;
export const CERTIFICATE_VALIDITY_DAYS = 30;

export type SubscriptionAccessState =
  | "active"
  | "grace_period"
  | "expired"
  | "suspended"
  | "no_subscription";

export interface SubscriptionAccessInfo {
  accessState: SubscriptionAccessState;
  isActive: boolean;
  isOperational: boolean;
  graceDaysRemaining: number;
  graceMsRemaining: number;
}

export type TrialPhase = "active" | "expiring_soon" | "expired";

export interface TrialRemaining {
  expired: boolean;
  msRemaining: number;
  daysRemaining: number;
  hoursRemaining: number;
  /** Texto legible, ej. "5 días" o "Expirada" */
  label: string;
  phase: TrialPhase;
}

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const EXPIRING_SOON_DAYS = 3;

export function isTrialSubscription(
  subscription: TenantSubscription | null | undefined
): boolean {
  return subscription?.status === "trial";
}

export function getTrialRemaining(
  periodoFin: Date | string | undefined,
  now: Date = new Date()
): TrialRemaining {
  if (!periodoFin) {
    return {
      expired: false,
      msRemaining: 0,
      daysRemaining: 0,
      hoursRemaining: 0,
      label: "Sin fecha de fin",
      phase: "active",
    };
  }

  const end = new Date(periodoFin);
  const msRemaining = end.getTime() - now.getTime();

  if (msRemaining <= 0) {
    return {
      expired: true,
      msRemaining: 0,
      daysRemaining: 0,
      hoursRemaining: 0,
      label: "Expirada",
      phase: "expired",
    };
  }

  const daysRemaining = Math.floor(msRemaining / MS_PER_DAY);
  const hoursRemaining = Math.floor(
    (msRemaining % MS_PER_DAY) / MS_PER_HOUR
  );

  let label: string;
  if (daysRemaining >= 1) {
    label =
      daysRemaining === 1 ? "1 día" : `${daysRemaining} días`;
  } else if (hoursRemaining >= 1) {
    label =
      hoursRemaining === 1 ? "1 hora" : `${hoursRemaining} horas`;
  } else {
    label = "Menos de 1 hora";
  }

  const phase: TrialPhase =
    daysRemaining <= EXPIRING_SOON_DAYS ? "expiring_soon" : "active";

  return {
    expired: false,
    msRemaining,
    daysRemaining,
    hoursRemaining,
    label,
    phase,
  };
}

const BILLING_CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  semiannual: 6,
  yearly: 12,
};

export function getBillingCycleLabel(ciclo: BillingCycle): string {
  switch (ciclo) {
    case "monthly":
      return "Mensual";
    case "semiannual":
      return "6 meses";
    case "yearly":
      return "Anual";
  }
}

export function getBillingCyclePeriodSuffix(ciclo: BillingCycle): string {
  switch (ciclo) {
    case "monthly":
      return "mes";
    case "semiannual":
      return "6 meses";
    case "yearly":
      return "año";
  }
}

export function formatSubscriptionAmount(monto: number): string {
  const safe = Number.isFinite(monto) ? monto : 0;
  return `${safe.toFixed(2)} ${SUBSCRIPTION_CURRENCY}`;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeSubscriptionPlan(
  plan: SubscriptionPlan
): SubscriptionPlan {
  const defaults = DEFAULT_PLANS[0];
  const raw = plan as SubscriptionPlan & {
    descuentoSemestral?: unknown;
    descuentoAnual?: unknown;
  };

  return {
    ...plan,
    precioMensual: toNumber(plan.precioMensual, defaults.precioMensual),
    descuentoSemestralPorcentaje: toNumber(
      plan.descuentoSemestralPorcentaje ?? raw.descuentoSemestral,
      defaults.descuentoSemestralPorcentaje
    ),
    descuentoAnualPorcentaje: toNumber(
      plan.descuentoAnualPorcentaje ?? raw.descuentoAnual,
      defaults.descuentoAnualPorcentaje
    ),
  };
}

export function calculatePlanPrice(
  plan: SubscriptionPlan,
  ciclo: BillingCycle,
  descuentoExtra: number = 0
): {
  montoOriginal: number;
  descuentoTotal: number;
  montoFinal: number;
  precioMensualEquivalente: number;
} {
  const normalizedPlan = normalizeSubscriptionPlan(plan);
  const months = BILLING_CYCLE_MONTHS[ciclo];
  const montoOriginal = normalizedPlan.precioMensual * months;

  const descuentoCiclo =
    ciclo === "yearly"
      ? normalizedPlan.descuentoAnualPorcentaje
      : ciclo === "semiannual"
        ? normalizedPlan.descuentoSemestralPorcentaje
        : 0;

  const descuentoTotal = Math.min(
    toNumber(descuentoCiclo) + toNumber(descuentoExtra),
    100
  );
  const montoFinal =
    Math.round(montoOriginal * (1 - descuentoTotal / 100) * 100) / 100;
  const precioMensualEquivalente =
    months > 0 ? Math.round((montoFinal / months) * 100) / 100 : 0;

  return {
    montoOriginal,
    descuentoTotal,
    montoFinal,
    precioMensualEquivalente,
  };
}

export function generatePaymentReference(): string {
  return `PAY-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function getSubscriptionPeriodEnd(
  ciclo: BillingCycle,
  from: Date = new Date()
): Date {
  const end = new Date(from);
  if (ciclo === "yearly") {
    end.setFullYear(end.getFullYear() + 1);
  } else if (ciclo === "semiannual") {
    end.setMonth(end.getMonth() + 6);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

export function isSubscriptionActive(
  subscription: TenantSubscription | null,
  now: Date = new Date()
): boolean {
  const info = getSubscriptionAccessInfo(subscription, "active", now);
  return info.accessState === "active";
}

export function isTenantOperational(
  accessState: SubscriptionAccessState
): boolean {
  return accessState === "active" || accessState === "grace_period";
}

export function getSubscriptionAccessState(
  subscription: TenantSubscription | null,
  salonStatus: "active" | "inactive" | "suspended" = "active",
  now: Date = new Date()
): SubscriptionAccessState {
  if (salonStatus !== "active") {
    return "suspended";
  }
  if (!subscription) {
    return "no_subscription";
  }

  const eligibleStatus =
    subscription.status === "active" ||
    subscription.status === "trial" ||
    subscription.status === "past_due";

  if (!eligibleStatus) {
    return "expired";
  }

  if (!subscription.periodoFin) {
    return "active";
  }

  const periodEnd = new Date(subscription.periodoFin);
  if (periodEnd > now) {
    return "active";
  }

  const graceEnd = new Date(periodEnd);
  graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);

  if (now <= graceEnd) {
    return "grace_period";
  }

  return "expired";
}

export function getGracePeriodRemaining(
  periodoFin: Date | string | undefined,
  now: Date = new Date()
): { daysRemaining: number; msRemaining: number } {
  if (!periodoFin) {
    return { daysRemaining: 0, msRemaining: 0 };
  }

  const periodEnd = new Date(periodoFin);
  const graceEnd = new Date(periodEnd);
  graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);
  const msRemaining = graceEnd.getTime() - now.getTime();

  if (msRemaining <= 0) {
    return { daysRemaining: 0, msRemaining: 0 };
  }

  return {
    daysRemaining: Math.ceil(msRemaining / MS_PER_DAY),
    msRemaining,
  };
}

export function getSubscriptionAccessInfo(
  subscription: TenantSubscription | null,
  salonStatus: "active" | "inactive" | "suspended" = "active",
  now: Date = new Date()
): SubscriptionAccessInfo {
  const accessState = getSubscriptionAccessState(
    subscription,
    salonStatus,
    now
  );
  const grace = getGracePeriodRemaining(subscription?.periodoFin, now);

  return {
    accessState,
    isActive: accessState === "active",
    isOperational: isTenantOperational(accessState),
    graceDaysRemaining: grace.daysRemaining,
    graceMsRemaining: grace.msRemaining,
  };
}

export function getAccessStateLabel(state: SubscriptionAccessState): string {
  switch (state) {
    case "active":
      return "Activo";
    case "grace_period":
      return "En periodo de gracia";
    case "expired":
      return "Expirado";
    case "suspended":
      return "Suspendido";
    case "no_subscription":
      return "Sin suscripción";
  }
}

export const DEFAULT_PLANS: Omit<SubscriptionPlan, "_id">[] = [
  {
    nombre: "Salón",
    descripcion: "Acceso completo a todas las funciones de la plataforma",
    precioMensual: 10,
    descuentoSemestralPorcentaje: 10,
    descuentoAnualPorcentaje: 15,
    caracteristicas: [
      "Reservas ilimitadas",
      "Gestión de horarios y servicios",
      "Notificaciones por WhatsApp",
      "Galería de trabajos",
      "Módulo de finanzas",
      "Sitio web personalizado",
      "Soporte por WhatsApp",
    ],
    activo: true,
    orden: 1,
  },
];
