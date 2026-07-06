import { randomBytes } from "crypto";
import {
  BillingCycle,
  SubscriptionPlan,
  TenantSubscription,
} from "@/lib/types";

export const SUBSCRIPTION_CURRENCY = "USD" as const;

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
  return `${monto.toFixed(2)} ${SUBSCRIPTION_CURRENCY}`;
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
  const months = BILLING_CYCLE_MONTHS[ciclo];
  const montoOriginal = plan.precioMensual * months;

  const descuentoCiclo =
    ciclo === "yearly"
      ? plan.descuentoAnualPorcentaje
      : ciclo === "semiannual"
        ? plan.descuentoSemestralPorcentaje
        : 0;

  const descuentoTotal = Math.min(descuentoCiclo + descuentoExtra, 100);
  const montoFinal =
    Math.round(montoOriginal * (1 - descuentoTotal / 100) * 100) / 100;
  const precioMensualEquivalente =
    Math.round((montoFinal / months) * 100) / 100;

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
  subscription: TenantSubscription | null
): boolean {
  if (!subscription) return false;
  if (subscription.status === "active" || subscription.status === "trial") {
    if (subscription.periodoFin) {
      return new Date(subscription.periodoFin) > new Date();
    }
    return true;
  }
  return false;
}

export const DEFAULT_PLANS: Omit<SubscriptionPlan, "_id">[] = [
  {
    nombre: "Salón",
    descripcion: "Acceso completo a todas las funciones de la plataforma",
    precioMensual: 15,
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
