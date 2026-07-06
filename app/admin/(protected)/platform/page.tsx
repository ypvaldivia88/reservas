"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import PlatformNav from "@/components/PlatformNav";
import { getBillingCycleLabel, formatSubscriptionAmount } from "@/lib/subscription";

interface PaymentItem {
  _id: string;
  salonNombre?: string;
  planNombre?: string;
  ciclo: string;
  montoFinal: number;
  descuentoPorcentaje: number;
  codigoReferencia: string;
  status: string;
  fechaCreacion: string;
}

export default function PlatformPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");

  const loadPayments = async () => {
    setLoading(true);
    const res = await fetch(`/api/platform/payments?status=${filter}`);
    const data = await res.json();
    if (data.success) setPayments(data.data);
    setLoading(false);
  };

  useEffect(() => {
    loadPayments();
  }, [filter]);

  const handleAction = async (paymentId: string, action: "approve" | "reject") => {
    const res = await fetch("/api/platform/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, action }),
    });
    const data = await res.json();
    if (data.success) loadPayments();
  };

  return (
    <>
      <PlatformNav />
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de pagos
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Aprueba o rechaza pagos de suscripción recibidos por WhatsApp
          </p>
        </div>

        <div className="flex gap-2">
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === s
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {s === "pending" ? "Pendientes" : s === "approved" ? "Aprobados" : "Rechazados"}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : payments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500">No hay pagos {filter === "pending" ? "pendientes" : ""}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((p) => (
              <div
                key={p._id}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {p.salonNombre ?? "Salón"} — {p.planNombre ?? "Plan"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {getBillingCycleLabel(p.ciclo as "monthly" | "semiannual" | "yearly")} ·{" "}
                      <span className="font-mono">{p.codigoReferencia}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(p.fechaCreacion).toLocaleString("es")}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-violet-600">
                    {formatSubscriptionAmount(p.montoFinal)}
                  </p>
                </div>
                {filter === "pending" && (
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAction(p._id, "approve")}
                    >
                      Aprobar
                    </Button>
                    <Button
                      variant="outlined-secondary"
                      size="sm"
                      onClick={() => handleAction(p._id, "reject")}
                    >
                      Rechazar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
