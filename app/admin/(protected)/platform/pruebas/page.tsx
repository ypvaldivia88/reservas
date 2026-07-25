"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Clock3, FlaskConical, AlertTriangle } from "lucide-react";
import PlatformNav from "@/components/PlatformNav";
import SurfaceCard from "@/components/design/SurfaceCard";
import {
  CompactMetricRow,
  MetricDashboardCard,
  SegmentedControl,
  StatusPill,
} from "@/components/design/dashboard";
import type { TrialPhase } from "@/lib/subscription";

interface TrialItem {
  salonId: string;
  slug: string;
  nombre: string;
  whatsappNumber?: string;
  fechaCreacion?: string;
  adminUsername?: string;
  planNombre?: string;
  subscription: {
    status: string;
    periodoInicio?: string;
    periodoFin?: string;
  };
  trialRemaining: {
    expired: boolean;
    label: string;
    phase: TrialPhase;
    daysRemaining: number;
    hoursRemaining: number;
  };
  pendingPayments: number;
}

interface TrialsSummary {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  withPendingPayment: number;
}

type TrialFilter = "all" | "active" | "expiring_soon" | "expired";

const FILTER_OPTIONS = [
  { value: "all" as const, label: "Todos" },
  { value: "active" as const, label: "En prueba" },
  { value: "expiring_soon" as const, label: "Por vencer" },
  { value: "expired" as const, label: "Expiradas" },
];

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function trialStatusLabel(item: TrialItem): string {
  if (item.trialRemaining.expired) return "Expirada";
  if (item.trialRemaining.phase === "expiring_soon") return "Por vencer";
  return "En prueba";
}

function trialStatusVariant(
  item: TrialItem
): "success" | "warning" | "muted" {
  if (item.trialRemaining.expired) return "warning";
  if (item.trialRemaining.phase === "expiring_soon") return "warning";
  return "success";
}

function matchesFilter(item: TrialItem, filter: TrialFilter): boolean {
  if (filter === "all") return true;
  if (filter === "expired") return item.trialRemaining.expired;
  if (filter === "expiring_soon") {
    return (
      !item.trialRemaining.expired &&
      item.trialRemaining.phase === "expiring_soon"
    );
  }
  return !item.trialRemaining.expired;
}

export default function PlatformTrialsPage() {
  const [trials, setTrials] = useState<TrialItem[]>([]);
  const [summary, setSummary] = useState<TrialsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TrialFilter>("all");

  const loadTrials = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/platform/trials", { cache: "no-store" });
    const data = await res.json();
    if (data.success) {
      setTrials(data.data.trials);
      setSummary(data.data.summary);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTrials();
  }, [loadTrials]);

  const filtered = trials.filter((t) => matchesFilter(t, filter));

  return (
    <>
      <PlatformNav />
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fase de prueba</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Salones en periodo de prueba de 14 días y tiempo restante hasta el
            vencimiento
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricDashboardCard
            icon={FlaskConical}
            title="En prueba"
            value={String(summary?.total ?? 0)}
            valueLabel="Total con status trial"
            progress={
              summary && summary.total > 0
                ? Math.round((summary.active / summary.total) * 100)
                : 0
            }
            details={[
              { label: "Activas", value: String(summary?.active ?? 0) },
              { label: "Por vencer", value: String(summary?.expiringSoon ?? 0) },
              { label: "Expiradas", value: String(summary?.expired ?? 0) },
              {
                label: "Con pago pend.",
                value: String(summary?.withPendingPayment ?? 0),
              },
            ]}
          />
          <MetricDashboardCard
            icon={Clock3}
            title="Por vencer"
            badge={{ label: "≤ 3 días", variant: "warning" }}
            value={String(summary?.expiringSoon ?? 0)}
            valueLabel="Requieren seguimiento"
            progress={
              summary && summary.total > 0
                ? Math.round((summary.expiringSoon / summary.total) * 100)
                : 0
            }
            details={[
              { label: "Total trials", value: String(summary?.total ?? 0) },
              { label: "Activas", value: String(summary?.active ?? 0) },
              { label: "Expiradas", value: String(summary?.expired ?? 0) },
              { label: "Filtro", value: filter },
            ]}
          />
          <MetricDashboardCard
            icon={AlertTriangle}
            title="Expiradas"
            badge={{ label: "Sin pago", variant: "warning" }}
            value={String(summary?.expired ?? 0)}
            valueLabel="Prueba vencida, sin bloqueo automático"
            progress={
              summary && summary.total > 0
                ? Math.round((summary.expired / summary.total) * 100)
                : 0
            }
            details={[
              {
                label: "Nota",
                value: "El acceso no se bloquea aún",
              },
              {
                label: "Pagos pend.",
                value: String(summary?.withPendingPayment ?? 0),
              },
              { label: "Vista", value: String(filtered.length) },
              { label: "Cargando", value: loading ? "Sí" : "No" },
            ]}
          />
        </div>

        <SegmentedControl
          value={filter}
          options={FILTER_OPTIONS}
          onChange={setFilter}
        />

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : filtered.length === 0 ? (
          <SurfaceCard padding="lg" className="text-center">
            <p className="text-muted-foreground">
              {filter === "all"
                ? "No hay salones en fase de prueba"
                : "No hay salones en esta categoría"}
            </p>
          </SurfaceCard>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Salón</th>
                  <th className="px-4 py-3 text-left font-medium">Admin</th>
                  <th className="px-4 py-3 text-left font-medium">Inicio</th>
                  <th className="px-4 py-3 text-left font-medium">Vence</th>
                  <th className="px-4 py-3 text-left font-medium">Tiempo restante</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Pagos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item.salonId} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.nombre}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        /{item.slug}
                      </p>
                      <Link
                        href={`/${item.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Ver sitio
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.adminUsername ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(item.subscription.periodoInicio)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(item.subscription.periodoFin)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold tabular-nums ${
                          item.trialRemaining.expired
                            ? "text-destructive"
                            : item.trialRemaining.phase === "expiring_soon"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-foreground"
                        }`}
                      >
                        {item.trialRemaining.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill variant={trialStatusVariant(item)}>
                        {trialStatusLabel(item)}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.pendingPayments > 0 ? (
                        <Link
                          href="/admin/platform"
                          className="font-medium text-amber-600 hover:underline"
                        >
                          {item.pendingPayments} pend.
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <CompactMetricRow
            icon={Clock3}
            title="Sobre el bloqueo"
            subtitle="Hoy la prueba vencida no bloquea el admin ni el sitio público; solo se refleja aquí y en /admin/suscripcion del salón."
            value={new Date().toLocaleTimeString("es", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            badge={{ label: "Informativo", variant: "muted" }}
          />
        )}
      </div>
    </>
  );
}
