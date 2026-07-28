"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SurfaceCard from "@/components/design/SurfaceCard";
import { SegmentedControl } from "@/components/design/dashboard";
import { StatusPill } from "@/components/design/dashboard";
import { Button } from "@/components/ui/Button";
import SalonAdminsManager, {
  type SalonAdminRecord,
} from "@/components/platform/SalonAdminsManager";
import { getAccessStateLabel } from "@/lib/subscription";
import type { SubscriptionAccessState } from "@/lib/subscription";

type Tab = "general" | "subscription" | "certificates" | "users" | "danger";

export default function PlatformTenantDetailPage() {
  const params = useParams();
  const salonId = params.id as string;
  const [tab, setTab] = useState<Tab>("general");
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmSlug, setConfirmSlug] = useState("");
  const [extendDays, setExtendDays] = useState("7");
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/platform/salons/${salonId}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success) setDetail(data.data);
    setLoading(false);
  }, [salonId]);

  useEffect(() => {
    load();
  }, [load]);

  const salon = detail?.salon as Record<string, unknown> | undefined;
  const access = detail?.access as {
    accessState: SubscriptionAccessState;
    graceDaysRemaining: number;
  } | undefined;

  const patchSalon = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/platform/salons/${salonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setMessage(data.message ?? data.error);
    if (data.success) load();
  };

  const deleteSalon = async () => {
    if (!confirm("¿Eliminar permanentemente este salón?")) return;
    const res = await fetch(`/api/platform/salons/${salonId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmSlug }),
    });
    const data = await res.json();
    if (data.success) {
      window.location.href = "/admin/platform/tenants";
    } else {
      setMessage(data.error);
    }
  };

  const revokeCert = async (certId: string) => {
    const res = await fetch(`/api/platform/certificates/${certId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke" }),
    });
    const data = await res.json();
    setMessage(data.message ?? data.error);
    if (data.success) load();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "subscription", label: "Suscripción" },
    { id: "certificates", label: "Certificados" },
    { id: "users", label: "Admins" },
    { id: "danger", label: "Peligro" },
  ];

  if (loading) {
    return <p className="text-muted-foreground">Cargando...</p>;
  }

  if (!detail || !salon) {
    return <p className="text-muted-foreground">Salón no encontrado</p>;
  }

  const certificates = (detail.certificates as Array<Record<string, unknown>>) ?? [];
  const admins = (detail.admins as SalonAdminRecord[]) ?? [];
  const subscription = detail.subscription as Record<string, unknown> | null;
  const auditLog = (detail.auditLog as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="space-y-6">
        <div>
          <Link
            href="/admin/platform/tenants"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Salones
          </Link>
          <h2 className="mt-2 text-2xl font-bold">{String(salon.nombre)}</h2>
          <p className="font-mono text-sm text-muted-foreground">
            {String(salon.slug)} · {String(salon.salonId)}
          </p>
          {access && (
            <div className="mt-2">
              <StatusPill
                variant={
                  access.accessState === "active" ? "success" : "warning"
                }
              >
                {getAccessStateLabel(access.accessState)}
              </StatusPill>
            </div>
          )}
        </div>

        {message && (
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        )}

        <SegmentedControl
          value={tab}
          options={tabs.map((t) => ({ value: t.id, label: t.label }))}
          onChange={setTab}
        />

        {tab === "general" && (
          <SurfaceCard padding="default" className="space-y-4">
            <p>
              <span className="text-muted-foreground">Estado salón:</span>{" "}
              {String(salon.status)}
            </p>
            <p>
              <span className="text-muted-foreground">WhatsApp:</span>{" "}
              {String(salon.whatsappNumber ?? "—")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => patchSalon({ status: "active" })}
              >
                Reactivar
              </Button>
              <Button
                size="sm"
                variant="outlined-secondary"
                onClick={() => patchSalon({ status: "suspended" })}
              >
                Suspender
              </Button>
              <a
                href={`/${salon.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-sm"
              >
                Ver sitio público
              </a>
            </div>
            {auditLog.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2">Actividad reciente</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {auditLog.slice(0, 5).map((log) => (
                    <li key={String(log._id)}>
                      {String(log.action)} ·{" "}
                      {new Date(String(log.createdAt)).toLocaleString("es")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SurfaceCard>
        )}

        {tab === "subscription" && (
          <SurfaceCard padding="default" className="space-y-4">
            {subscription ? (
              <>
                <p>Estado: {String(subscription.status)}</p>
                <p>
                  Vence:{" "}
                  {subscription.periodoFin
                    ? new Date(String(subscription.periodoFin)).toLocaleDateString(
                        "es"
                      )
                    : "—"}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Sin suscripción</p>
            )}
            <div className="flex gap-2 items-end">
              <div>
                <label className="text-xs text-muted-foreground">
                  Extender trial (días)
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="block w-24 rounded-lg border border-border px-2 py-1 text-sm"
                />
              </div>
              <Button
                size="sm"
                onClick={() =>
                  patchSalon({ extendTrialDays: Number(extendDays) })
                }
              >
                Extender
              </Button>
            </div>
          </SurfaceCard>
        )}

        {tab === "certificates" && (
          <SurfaceCard padding="default">
            {certificates.length === 0 ? (
              <p className="text-muted-foreground">Sin certificados</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {certificates.map((c) => (
                  <li
                    key={String(c._id)}
                    className="flex items-center justify-between border-b border-border pb-2"
                  >
                    <span>
                      {String(c.codePrefix)}… · {String(c.status)} ·{" "}
                      {new Date(String(c.createdAt)).toLocaleDateString("es")}
                    </span>
                    {c.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outlined-secondary"
                        onClick={() => revokeCert(String(c._id))}
                      >
                        Revocar
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SurfaceCard>
        )}

        {tab === "users" && (
          <SurfaceCard padding="default">
            <SalonAdminsManager
              salonId={salonId}
              admins={admins}
              onChanged={load}
              onMessage={setMessage}
            />
          </SurfaceCard>
        )}

        {tab === "danger" && (
          <SurfaceCard padding="default" className="border-destructive/50">
            <h3 className="font-semibold text-destructive">
              Eliminar salón permanentemente
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Se borrarán reservas, usuarios, servicios y toda la data del
              tenant. Escribe el slug <strong>{String(salon.slug)}</strong>{" "}
              para confirmar.
            </p>
            <input
              value={confirmSlug}
              onChange={(e) => setConfirmSlug(e.target.value)}
              placeholder={String(salon.slug)}
              className="mt-3 w-full max-w-sm rounded-lg border border-border px-3 py-2 text-sm font-mono"
            />
            <Button
              className="mt-3"
              variant="outlined-secondary"
              onClick={deleteSalon}
              disabled={confirmSlug !== salon.slug}
            >
              Eliminar salón
            </Button>
          </SurfaceCard>
        )}
    </div>
  );
}
