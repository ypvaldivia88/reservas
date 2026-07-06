"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  SubscriptionPlan,
  TenantSubscription,
  BillingCycle,
} from "@/lib/types";
import {
  openSubscriptionPaymentWhatsApp,
  SubscriptionPaymentDetails,
} from "@/lib/whatsapp";
import {
  calculatePlanPrice,
  formatSubscriptionAmount,
  getBillingCycleLabel,
  getBillingCyclePeriodSuffix,
} from "@/lib/subscription";

interface SubscriptionData {
  subscription: TenantSubscription | null;
  plan: SubscriptionPlan | null;
  isActive: boolean;
  pendingPayment: {
    _id: string;
    codigoReferencia: string;
    montoFinal: number;
    status: string;
  } | null;
}

const BILLING_CYCLES: BillingCycle[] = ["monthly", "semiannual", "yearly"];

export default function SuscripcionPage() {
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [salonNombre, setSalonNombre] = useState("Mi Salón");
  const [loading, setLoading] = useState(true);
  const [ciclo, setCiclo] = useState<BillingCycle>("monthly");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [plansRes, subRes, salonRes] = await Promise.all([
          fetch("/api/subscription-plans"),
          fetch("/api/subscriptions"),
          fetch("/api/salons/current"),
        ]);
        const [plansData, subDataRes, salonData] = await Promise.all([
          plansRes.json(),
          subRes.json(),
          salonRes.json(),
        ]);
        if (plansData.success && plansData.data.length > 0) {
          setPlan(plansData.data[0]);
        }
        if (subDataRes.success) setSubData(subDataRes.data);
        if (salonData.success) setSalonNombre(salonData.data.nombre);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSubscribe = async () => {
    if (!plan?._id) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan._id, ciclo }),
      });
      const data = await res.json();
      if (data.success) {
        const { paymentRequest, planNombre } = data.data;
        const details: SubscriptionPaymentDetails = {
          salonNombre,
          planNombre,
          ciclo,
          montoOriginal: paymentRequest.montoOriginal,
          descuentoPorcentaje: paymentRequest.descuentoPorcentaje,
          montoFinal: paymentRequest.montoFinal,
          codigoReferencia: paymentRequest.codigoReferencia,
        };
        openSubscriptionPaymentWhatsApp(details);
        const subRes = await fetch("/api/subscriptions");
        const subDataRes = await subRes.json();
        if (subDataRes.success) setSubData(subDataRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const preview = plan ? calculatePlanPrice(plan, ciclo) : null;

  if (loading) {
    return <p className="text-gray-500">Cargando...</p>;
  }

  if (!plan) {
    return <p className="text-gray-500">No hay plan disponible.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Suscripción
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Un solo plan con todo incluido · Pago manual por WhatsApp
        </p>
      </div>

      {subData?.subscription && (
        <div
          className={`rounded-xl p-5 border ${
            subData.isActive
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Plan actual: {subData.plan?.nombre ?? plan.nombre}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Estado:{" "}
                <span className="font-medium">
                  {subData.isActive
                    ? "✅ Activo"
                    : "⚠️ " + subData.subscription.status}
                </span>
                {subData.subscription.periodoFin && (
                  <>
                    {" "}
                    · Vence:{" "}
                    {new Date(
                      subData.subscription.periodoFin
                    ).toLocaleDateString("es")}
                  </>
                )}
              </p>
            </div>
            {subData.pendingPayment && (
              <span className="text-sm bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full">
                Pago pendiente: {subData.pendingPayment.codigoReferencia}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {BILLING_CYCLES.map((c) => {
          const pricing = calculatePlanPrice(plan, c);
          return (
            <button
              key={c}
              onClick={() => setCiclo(c)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                ciclo === c
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {getBillingCycleLabel(c)}
              {pricing.descuentoTotal > 0 && (
                <span className="ml-1 opacity-80">
                  (-{pricing.descuentoTotal}%)
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-blue-500 shadow-lg max-w-xl">
        <h3 className="font-bold text-xl text-gray-900 dark:text-white">
          {plan.nombre}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {plan.descripcion}
        </p>

        {preview && (
          <div className="mt-4">
            {preview.descuentoTotal > 0 && (
              <p className="text-sm text-gray-400 line-through">
                {formatSubscriptionAmount(preview.montoOriginal)}
              </p>
            )}
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatSubscriptionAmount(preview.montoFinal)}
              <span className="text-sm font-normal text-gray-500">
                /{getBillingCyclePeriodSuffix(ciclo)}
              </span>
            </p>
            {ciclo !== "monthly" && (
              <p className="text-sm text-gray-500 mt-1">
                Equivale a{" "}
                {formatSubscriptionAmount(preview.precioMensualEquivalente)}/mes
              </p>
            )}
            {preview.descuentoTotal > 0 && (
              <span className="inline-block mt-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                {preview.descuentoTotal}% de descuento
              </span>
            )}
          </div>
        )}

        <ul className="mt-5 space-y-2">
          {plan.caracteristicas.map((f) => (
            <li
              key={f}
              className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
            >
              <span className="text-green-500 mt-0.5">✓</span> {f}
            </li>
          ))}
        </ul>
      </div>

      {preview && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 max-w-xl">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Resumen de pago
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Plan</span>
              <span>{plan.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Ciclo</span>
              <span>{getBillingCycleLabel(ciclo)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Precio original
              </span>
              <span>{formatSubscriptionAmount(preview.montoOriginal)}</span>
            </div>
            {preview.descuentoTotal > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento ({preview.descuentoTotal}%)</span>
                <span>
                  -
                  {formatSubscriptionAmount(
                    preview.montoOriginal - preview.montoFinal
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Total</span>
              <span className="text-blue-600">
                {formatSubscriptionAmount(preview.montoFinal)}
              </span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-xs text-gray-600 dark:text-gray-400">
            Al hacer clic en &quot;Pagar por WhatsApp&quot;, se abrirá WhatsApp
            con un mensaje prellenado. Envía el comprobante de pago y tu
            suscripción será activada manualmente.
          </div>
          <Button
            variant="primary"
            fullWidth
            className="mt-4"
            onClick={handleSubscribe}
            loading={processing}
          >
            💬 Pagar por WhatsApp
          </Button>
        </div>
      )}
    </div>
  );
}
