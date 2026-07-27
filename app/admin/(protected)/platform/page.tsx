"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  CreditCard,
} from "lucide-react";
import PlatformNav from "@/components/PlatformNav";
import SurfaceCard from "@/components/design/SurfaceCard";
import { MetricDashboardCard } from "@/components/design/dashboard";
import { getAccessStateLabel } from "@/lib/subscription";
import type { SubscriptionAccessState } from "@/lib/subscription";

interface DashboardSummary {
  total: number;
  active: number;
  gracePeriod: number;
  expired: number;
  suspended: number;
  trial: number;
  pendingPayments: number;
  pendingCertificates: number;
}

interface SalonRow {
  salonId: string;
  slug: string;
  nombre: string;
  accessState: SubscriptionAccessState;
  graceDaysRemaining: number;
  pendingPayments: number;
  hasPendingCertificate: boolean;
  planNombre?: string;
  subscription?: { periodoFin?: string };
}

export default function PlatformDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<SalonRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/platform/dashboard", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSummary(data.data.summary);
          const salons: SalonRow[] = data.data.salons ?? [];
          setAlerts(
            salons.filter(
              (s) =>
                s.accessState === "grace_period" ||
                s.accessState === "expired" ||
                s.pendingPayments > 0 ||
                s.hasPendingCertificate
            )
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PlatformNav />
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resumen de plataforma</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vista general de tenants, suscripciones y alertas
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricDashboardCard
                icon={Building2}
                title="Total salones"
                value={String(summary.total)}
                valueLabel="Registrados"
                progress={100}
                details={[
                  { label: "Activos", value: String(summary.active) },
                  { label: "En prueba", value: String(summary.trial) },
                ]}
              />
              <MetricDashboardCard
                icon={AlertTriangle}
                title="En gracia"
                badge={{ label: "Atención", variant: "warning" }}
                value={String(summary.gracePeriod)}
                valueLabel="Vencidos con gracia"
                progress={summary.gracePeriod > 0 ? 60 : 0}
                details={[
                  { label: "Expirados", value: String(summary.expired) },
                  { label: "Suspendidos", value: String(summary.suspended) },
                ]}
              />
              <MetricDashboardCard
                icon={CreditCard}
                title="Pagos pendientes"
                badge={{ label: "Cola", variant: "warning" }}
                value={String(summary.pendingPayments)}
                valueLabel="Por revisar"
                progress={summary.pendingPayments > 0 ? 40 : 0}
                details={[
                  {
                    label: "Ir a pagos",
                    value: "Ver cola",
                  },
                ]}
              />
              <MetricDashboardCard
                icon={KeyRound}
                title="Certificados"
                badge={{ label: "Pendientes", variant: "muted" }}
                value={String(summary.pendingCertificates)}
                valueLabel="Sin canjear"
                progress={summary.pendingCertificates > 0 ? 30 : 0}
                details={[
                  { label: "Activos", value: String(summary.active) },
                ]}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/platform/tenants"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Ver todos los tenants
              </Link>
              <Link
                href="/admin/platform/pagos"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
              >
                Gestionar pagos
              </Link>
            </div>

            {alerts.length > 0 && (
              <SurfaceCard padding="default">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-600" />
                  Requieren atención
                </h3>
                <div className="space-y-2">
                  {alerts.slice(0, 10).map((s) => (
                    <Link
                      key={s.salonId}
                      href={`/admin/platform/tenants/${s.salonId}`}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50"
                    >
                      <span className="font-medium">{s.nombre}</span>
                      <span className="text-muted-foreground">
                        {getAccessStateLabel(s.accessState)}
                        {s.pendingPayments > 0 && " · Pago pendiente"}
                        {s.hasPendingCertificate && " · Cert. pendiente"}
                      </span>
                    </Link>
                  ))}
                </div>
              </SurfaceCard>
            )}

            {summary.expired === 0 && summary.gracePeriod === 0 && (
              <SurfaceCard padding="lg" className="text-center">
                <CheckCircle2 className="mx-auto size-8 text-green-600 mb-2" />
                <p className="text-muted-foreground">
                  No hay tenants en gracia ni expirados
                </p>
              </SurfaceCard>
            )}
          </>
        ) : null}
      </div>
    </>
  );
}
