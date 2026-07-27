"use client";

import { useCallback, useEffect, useState } from "react";
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
  getAccessStateLabel,
  type SubscriptionAccessState,
} from "@/lib/subscription";
import { KeyRound } from "lucide-react";

interface SubscriptionData {
  subscription: TenantSubscription | null;
  plan: SubscriptionPlan | null;
  isActive: boolean;
  isOperational: boolean;
  accessState: SubscriptionAccessState;
  graceDaysRemaining: number;
  pendingPayment: {
    _id: string;
    codigoReferencia: string;
    montoOriginal: number;
    descuentoPorcentaje: number;
    montoFinal: number;
    ciclo: BillingCycle;
    status: string;
  } | null;
  pendingCertificate: {
    _id?: string;
    codePrefix: string;
    expiresAt: string;
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
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openPaymentWhatsApp = (
    paymentRequest: {
      montoOriginal: number;
      descuentoPorcentaje: number;
      montoFinal: number;
      codigoReferencia: string;
    },
    paymentCiclo: BillingCycle,
    planNombre: string
  ) => {
    const details: SubscriptionPaymentDetails = {
      salonNombre,
      planNombre,
      ciclo: paymentCiclo,
      montoOriginal: paymentRequest.montoOriginal,
      descuentoPorcentaje: paymentRequest.descuentoPorcentaje,
      montoFinal: paymentRequest.montoFinal,
      codigoReferencia: paymentRequest.codigoReferencia,
    };
    openSubscriptionPaymentWhatsApp(details);
  };

  const handleSubscribe = async () => {
    if (!plan?._id) return;
    setProcessing(true);
    setPaymentNotice(null);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan._id, ciclo }),
      });
      const data = await res.json();
      if (data.success) {
        const { paymentRequest, planNombre, alreadyPending } = data.data;
        openPaymentWhatsApp(paymentRequest, ciclo, planNombre);
        if (alreadyPending) {
          setPaymentNotice(
            data.message ??
              "Tu pago ya está en revisión. Puedes reenviar el comprobante por WhatsApp."
          );
        } else {
          setPaymentNotice(
            "Solicitud registrada. Envía el comprobante por WhatsApp para acelerar la verificación."
          );
        }
        await loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleResendPendingPayment = () => {
    const pending = subData?.pendingPayment;
    if (!pending || !plan) return;
    openPaymentWhatsApp(
      pending,
      pending.ciclo,
      subData?.plan?.nombre ?? plan.nombre
    );
    setPaymentNotice(
      "Reenviando comprobante con tu código de referencia existente. No se creó un pago nuevo."
    );
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    setRedeemError(null);
    setRedeemMessage(null);
    try {
      const res = await fetch("/api/subscriptions/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setRedeemMessage(data.message ?? "Suscripción activada correctamente");
        setRedeemCode("");
        await loadData();
      } else {
        setRedeemError(data.error ?? "No se pudo canjear el código");
      }
    } catch {
      setRedeemError("Error de conexión");
    } finally {
      setRedeeming(false);
    }
  };

  const preview = plan ? calculatePlanPrice(plan, ciclo) : null;

  if (loading) {
    return <p className="text-gray-500">Cargando...</p>;
  }

  if (!plan) {
    return <p className="text-gray-500">No hay plan disponible.</p>;
  }

  const statusBannerClass =
    subData?.accessState === "active"
      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      : subData?.accessState === "grace_period"
        ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
        : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";

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

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 max-w-xl">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="size-5 text-primary" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Activar con código
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Si recibiste un código de activación tras tu pago, ingrésalo aquí.
        </p>
        {subData?.pendingCertificate && (
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            Tienes un certificado pendiente ({subData.pendingCertificate.codePrefix}
            …). Vence el{" "}
            {new Date(subData.pendingCertificate.expiresAt).toLocaleDateString(
              "es"
            )}
            .
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
            placeholder="RSRV-XXXX-XXXX"
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 font-mono text-sm"
          />
          <Button
            variant="primary"
            onClick={handleRedeem}
            loading={redeeming}
            disabled={!redeemCode.trim()}
          >
            Canjear código
          </Button>
        </div>
        {redeemMessage && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400" role="status">
            {redeemMessage}
          </p>
        )}
        {redeemError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {redeemError}
          </p>
        )}
      </div>

      {subData?.subscription && (
        <div className={`rounded-xl p-5 border ${statusBannerClass}`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Plan actual: {subData.plan?.nombre ?? plan.nombre}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Estado:{" "}
                <span className="font-medium">
                  {getAccessStateLabel(subData.accessState)}
                </span>
                {subData.accessState === "grace_period" && (
                  <>
                    {" "}
                    · {subData.graceDaysRemaining} día(s) de gracia restantes
                  </>
                )}
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
                Pago en revisión: {subData.pendingPayment.codigoReferencia}
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
            <div className="flex justify-between font-bold text-base pt-2">
              <span>Total</span>
              <span className="text-blue-600">
                {formatSubscriptionAmount(preview.montoFinal)}
              </span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-xs text-gray-600 dark:text-gray-400">
            {subData?.pendingPayment ? (
              <>
                Tu pago con código{" "}
                <span className="font-mono font-medium">
                  {subData.pendingPayment.codigoReferencia}
                </span>{" "}
                está siendo verificado por el equipo de ReservaSalón. Puedes
                reenviar el comprobante por WhatsApp sin crear una solicitud
                nueva.
              </>
            ) : (
              <>
                Al hacer clic en &quot;Pagar por WhatsApp&quot;, se abrirá
                WhatsApp con un mensaje prellenado. Tras verificar tu pago,
                recibirás un código de activación para canjear aquí.
              </>
            )}
          </div>
          {paymentNotice && (
            <p className="mt-3 text-sm text-amber-700 dark:text-amber-300" role="status">
              {paymentNotice}
            </p>
          )}
          <Button
            variant="primary"
            fullWidth
            className="mt-4"
            onClick={
              subData?.pendingPayment
                ? handleResendPendingPayment
                : handleSubscribe
            }
            loading={processing}
          >
            {subData?.pendingPayment
              ? "Reenviar comprobante por WhatsApp"
              : "Pagar por WhatsApp"}
          </Button>
        </div>
      )}
    </div>
  );
}
