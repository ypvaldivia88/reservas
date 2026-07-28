"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import SurfaceCard from "@/components/design/SurfaceCard";
import { SegmentedControl, StatusPill } from "@/components/design/dashboard";
import { getAccessStateLabel, getBillingCycleLabel } from "@/lib/subscription";
import { buildSalonWhatsAppLink } from "@/lib/whatsapp";
import type { BillingCycle } from "@/lib/types";
import type { SubscriptionAccessState } from "@/lib/subscription";

interface SalonItem {
  salonId: string;
  slug: string;
  nombre: string;
  status: string;
  contactPhone?: string;
  adminNombre?: string;
  adminUsername?: string;
  accessState: SubscriptionAccessState;
  graceDaysRemaining: number;
  pendingPayments: number;
  hasPendingCertificate: boolean;
  subscription?: { status: string; periodoFin?: string; ciclo?: BillingCycle };
}

function buildTenantWhatsAppLink(salon: SalonItem): string | null {
  if (!salon.contactPhone) return null;
  return buildSalonWhatsAppLink(
    salon.contactPhone,
    `Hola ${salon.nombre}, te escribo desde el equipo de ReservaSalón.`
  );
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
  { value: "trial" as const, label: "Prueba" },
  { value: "grace_period" as const, label: "Gracia" },
  { value: "expired" as const, label: "Expirados" },
  { value: "suspended" as const, label: "Suspend." },
];

function statusVariant(
  state: SubscriptionAccessState
): "success" | "warning" | "muted" {
  if (state === "active") return "success";
  if (state === "grace_period" || state === "expired") return "warning";
  return "muted";
}

function billingCycleLabel(salon: SalonItem): string {
  const ciclo = salon.subscription?.ciclo;
  if (!ciclo) return "—";
  return getBillingCycleLabel(ciclo);
}

function statusLabel(salon: SalonItem) {
  return salon.accessState === "grace_period"
    ? `En gracia (${salon.graceDaysRemaining}d)`
    : getAccessStateLabel(salon.accessState);
}

function TenantMobileCard({ salon }: { salon: SalonItem }) {
  const whatsappLink = buildTenantWhatsAppLink(salon);

  return (
    <SurfaceCard padding="default" className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/admin/platform/tenants/${salon.salonId}`}
            className="block truncate font-semibold hover:underline"
          >
            {salon.nombre}
          </Link>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {salon.slug}
            {salon.adminUsername ? ` · @${salon.adminUsername}` : ""}
          </p>
        </div>
        <StatusPill variant={statusVariant(salon.accessState)}>
          {statusLabel(salon)}
        </StatusPill>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="min-w-0 col-span-2">
          <p className="text-muted-foreground">Administrador</p>
          <p className="truncate font-medium">
            {salon.adminNombre ?? "—"}
            {salon.adminUsername ? (
              <span className="font-mono text-muted-foreground">
                {" "}
                · @{salon.adminUsername}
              </span>
            ) : null}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground">Ciclo</p>
          <p className="truncate font-medium">{billingCycleLabel(salon)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground">Vence</p>
          <p className="truncate font-medium">
            {salon.subscription?.periodoFin
              ? new Date(salon.subscription.periodoFin).toLocaleDateString("es")
              : "—"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {whatsappLink ? (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-600/25 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-500/15 dark:text-emerald-300"
            aria-label={`Contactar a ${salon.nombre} por WhatsApp`}
          >
            <MessageCircle className="size-3.5 shrink-0" />
            WhatsApp
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">Sin contacto</span>
        )}
        {(salon.pendingPayments > 0 || salon.hasPendingCertificate) && (
          <div className="flex flex-wrap gap-2 text-xs">
            {salon.pendingPayments > 0 && (
              <span className="text-amber-600">
                {salon.pendingPayments} pago(s)
              </span>
            )}
            {salon.hasPendingCertificate && (
              <span className="text-violet-600">Cert. pendiente</span>
            )}
          </div>
        )}
      </div>
    </SurfaceCard>
  );
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
          s.slug.toLowerCase().includes(q) ||
          (s.adminNombre?.toLowerCase().includes(q) ?? false) ||
          (s.adminUsername?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [salons, filter, query]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Salones</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {salons.length} salón(es) registrados · estado en tiempo real
        </p>
      </div>

      <input
        type="search"
        placeholder="Buscar por nombre, slug o usuario admin…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
      />

      <SegmentedControl
        value={filter}
        options={FILTER_OPTIONS}
        onChange={setFilter}
      />

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : filtered.length === 0 ? (
        <SurfaceCard padding="lg" className="text-center">
          <p className="text-muted-foreground">Sin resultados</p>
        </SurfaceCard>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((s) => (
              <TenantMobileCard key={s.salonId} salon={s} />
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">Salón</th>
                  <th className="px-4 py-3 text-left">Administrador</th>
                  <th className="px-4 py-3 text-left">Contacto</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Ciclo</th>
                  <th className="px-4 py-3 text-left">Vence</th>
                  <th className="px-4 py-3 text-right">Alertas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => {
                  const whatsappLink = buildTenantWhatsAppLink(s);
                  return (
                    <tr key={s.salonId} className="hover:bg-muted/30">
                      <td className="max-w-[180px] px-4 py-3">
                        <Link
                          href={`/admin/platform/tenants/${s.salonId}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {s.nombre}
                        </Link>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {s.slug}
                        </p>
                      </td>
                      <td className="max-w-[140px] px-4 py-3">
                        <p className="truncate font-medium">
                          {s.adminNombre ?? "—"}
                        </p>
                        {s.adminUsername && (
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            @{s.adminUsername}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {whatsappLink ? (
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/25 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-500/15 dark:text-emerald-300"
                            aria-label={`Contactar a ${s.nombre} por WhatsApp`}
                          >
                            <MessageCircle className="size-3.5 shrink-0" />
                            WhatsApp
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {s.contactPhone && (
                          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                            {s.contactPhone}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill variant={statusVariant(s.accessState)}>
                          {statusLabel(s)}
                        </StatusPill>
                      </td>
                      <td className="max-w-[100px] truncate px-4 py-3">
                        {billingCycleLabel(s)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
