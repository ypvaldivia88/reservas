"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import PlatformNav from "@/components/PlatformNav";
import SurfaceCard from "@/components/design/SurfaceCard";
import {
  CompactMetricRow,
  MetricDashboardCard,
  SegmentedControl,
} from "@/components/design/dashboard";
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

type PaymentFilter = "pending" | "approved" | "rejected";

const FILTER_OPTIONS = [
  { value: "pending" as const, label: "Pendientes" },
  { value: "approved" as const, label: "Aprobados" },
  { value: "rejected" as const, label: "Rechazados" },
];

export default function PlatformPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PaymentFilter>("pending");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/platform/payments?status=${filter}`);
    const data = await res.json();
    if (data.success) setPayments(data.data);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleAction = async (paymentId: string, action: "approve" | "reject") => {
    const res = await fetch("/api/platform/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, action }),
    });
    const data = await res.json();
    if (data.success) loadPayments();
  };

  const totalAmount = payments.reduce((sum, p) => sum + p.montoFinal, 0);

  return (
    <>
      <PlatformNav />
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de pagos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Aprueba o rechaza pagos de suscripción recibidos por WhatsApp
          </p>
        </div>

        <MetricDashboardCard
          icon={CreditCard}
          title="Pagos de suscripción"
          badge={{
            label:
              filter === "pending"
                ? "Por revisar"
                : filter === "approved"
                  ? "Aprobados"
                  : "Rechazados",
            variant:
              filter === "pending"
                ? "warning"
                : filter === "approved"
                  ? "success"
                  : "muted",
          }}
          value={String(payments.length)}
          valueLabel="En la vista actual"
          progress={
            payments.length > 0 && filter === "approved" ? 100 : payments.length > 0 ? 50 : 0
          }
          details={[
            { label: "Monto total", value: formatSubscriptionAmount(totalAmount) },
            { label: "Vista", value: FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? "" },
            { label: "Estado", value: filter },
            { label: "Cargando", value: loading ? "Sí" : "No" },
          ]}
        />

        <SegmentedControl value={filter} options={FILTER_OPTIONS} onChange={setFilter} />

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : payments.length === 0 ? (
          <SurfaceCard padding="lg" className="text-center">
            <p className="text-muted-foreground">
              No hay pagos {filter === "pending" ? "pendientes" : ""}
            </p>
          </SurfaceCard>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <SurfaceCard key={p._id} padding="default">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {p.salonNombre ?? "Salón"} — {p.planNombre ?? "Plan"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getBillingCycleLabel(p.ciclo as "monthly" | "semiannual" | "yearly")} ·{" "}
                      <span className="font-mono">{p.codigoReferencia}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(p.fechaCreacion).toLocaleString("es")}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-primary tabular-nums">
                    {formatSubscriptionAmount(p.montoFinal)}
                  </p>
                </div>
                {filter === "pending" && (
                  <div className="mt-4 flex gap-3">
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
              </SurfaceCard>
            ))}
          </div>
        )}

        {!loading && payments.length > 0 && (
          <CompactMetricRow
            icon={Clock3}
            title="Última actualización"
            subtitle="Lista sincronizada con la API"
            value={new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
            badge={{ label: "En vivo", variant: "success" }}
          />
        )}
      </div>
    </>
  );
}
