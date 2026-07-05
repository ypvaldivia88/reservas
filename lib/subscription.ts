import { randomBytes } from "crypto";
import {
  BillingCycle,
  SubscriptionPlan,
  TenantSubscription,
} from "@/lib/types";

export function calculatePlanPrice(
  plan: SubscriptionPlan,
  ciclo: BillingCycle,
  descuentoExtra: number = 0
): {
  montoOriginal: number;
  descuentoTotal: number;
  montoFinal: number;
} {
  const base =
    ciclo === "yearly" ? plan.precioAnual : plan.precioMensual;

  const descuentoPlan = plan.descuentoPorcentaje;
  const descuentoAnual =
    ciclo === "yearly" ? plan.descuentoAnualPorcentaje : 0;
  const descuentoTotal = Math.min(
    descuentoPlan + descuentoAnual + descuentoExtra,
    100
  );

  const montoFinal = Math.round(base * (1 - descuentoTotal / 100) * 100) / 100;

  return {
    montoOriginal: base,
    descuentoTotal,
    montoFinal,
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
    nombre: "Básico",
    descripcion: "Ideal para salones pequeños que empiezan",
    precioMensual: 15,
    precioAnual: 150,
    descuentoPorcentaje: 0,
    descuentoAnualPorcentaje: 17,
    caracteristicas: [
      "Hasta 100 reservas/mes",
      "Gestión de horarios",
      "Notificaciones WhatsApp",
      "Galería de trabajos",
    ],
    activo: true,
    orden: 1,
  },
  {
    nombre: "Profesional",
    descripcion: "Para salones en crecimiento con finanzas",
    precioMensual: 29,
    precioAnual: 290,
    descuentoPorcentaje: 10,
    descuentoAnualPorcentaje: 20,
    caracteristicas: [
      "Reservas ilimitadas",
      "Módulo de finanzas",
      "Reportes financieros",
      "Múltiples servicios",
      "Soporte prioritario",
    ],
    activo: true,
    orden: 2,
  },
  {
    nombre: "Premium",
    descripcion: "Máximo rendimiento para tu negocio",
    precioMensual: 49,
    precioAnual: 490,
    descuentoPorcentaje: 15,
    descuentoAnualPorcentaje: 25,
    caracteristicas: [
      "Todo en Profesional",
      "Ofertas personalizadas",
      "Reportes avanzados",
      "Almacenamiento ampliado",
      "Onboarding dedicado",
    ],
    activo: true,
    orden: 3,
  },
];
