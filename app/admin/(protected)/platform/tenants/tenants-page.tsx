"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PlatformNav from "@/components/PlatformNav";
import SurfaceCard from "@/components/design/SurfaceCard";
import { SegmentedControl, StatusPill } from "@/components/design/dashboard";
import { getAccessStateLabel } from "@/lib/subscription";
import type { SubscriptionAccessState } from "@/lib/subscription";

interface SalonItem {
  salonId: string;
  slug: string;
  nombre: string;
  status: string;
  planNombre?: string;
  accessState: SubscriptionAccessState;
  graceDaysRemaining: number;
  pendingPayments: number;
  hasPendingCertificate: boolean;
  subscription?: { status: string; periodoFin?: string };
}

type TenantFilter =
  | "all"
  | "active"
  | "trial"
  | "grace_period"
  | "expired"
  | "suspended";

const FILTER_OPTIONS = [
  { value: "all" as const, label: "Todos" },
  { value: "active" as const, label: "Activos" },
  { value: "trial" as const, label: "En prueba" },
  { value: "grace_period" as const, label: "En gracia" },
  { value: "expired" as const, label: "Expirados" },
  { value: "suspended" as const, label: "Suspendidos" },
];

function statusVariant(
  state: SubscriptionAccessState
): "success" | "warning" | "muted" {
  if (state === "active") return "success";
  if (state === "grace_period" || state === "expired") return "warning";
  return "muted";
}

export default function PlatformTenantsPage() {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("status") as TenantFilter) || "all";
  const [salons, setSalons] = useState<SalonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TenantFilter>(initialFilter);
  const [query, setQuery] = useState("");

  const loadSalons = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/salons", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setSalons(data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSalons();
  }, [loadSalons]);

  const filtered = useMemo(() => {
    return salons.filter((s) => {
      if (filter !== "all") {
        if (filter === "trial") {
          if (
            !(s.subscription?.status === "trial" && s.accessState === "active")
          ) {
            return false;
          }
        } else if (s.accessState !== filter) {
          return false;
        }
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          s.nombre.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [salons, filter, query]);

  return (
    <>
      <PlatformNav />
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenants</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {salons.length} salón(es) · estado computado en tiempo real
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            placeholder="Buscar por nombre o slug…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <SegmentedControl
          value={filter}
          options={FILTER_OPTIONS}
          onChange={setFilter}
        />

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">Salón</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Vence</th>
                  <th className="px-4 py-3 text-right">Alertas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr key={s.salonId} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/platform/tenants/${s.salonId}`}
                        className="font-medium hover:underline"
                      >
                        {s.nombre}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">
                        {s.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill variant={statusVariant(s.accessState)}>
                        {s.accessState === "grace_period"
                          ? `En gracia (${s.graceDaysRemaining}d)`
                          : getAccessStateLabel(s.accessState)}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3">{s.planNombre ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.subscription?.periodoFin
                        ? new Date(s.subscription.periodoFin).toLocaleDateString(
                            "es"
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      {s.pendingPayments > 0 && (
                        <span className="text-amber-600">
                          {s.pendingPayments} pago(s)
                        </span>
                      )}
                      {s.hasPendingCertificate && (
                        <span className="ml-2 text-violet-600">Cert.</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <SurfaceCard padding="lg" className="text-center border-0">
                <p className="text-muted-foreground">Sin resultados</p>
              </SurfaceCard>
            )}
          </div>
        )}
      </div>
    </>
  );
}
