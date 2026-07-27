"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";

interface GraceBannerData {
  accessState: string;
  graceDaysRemaining: number;
  periodoFin?: string;
  salonId?: string;
}

function getDismissKey(salonId: string, periodoFin: string) {
  return `grace-banner-dismissed:${salonId}:${periodoFin}`;
}

export default function GracePeriodBanner() {
  const [data, setData] = useState<GraceBannerData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/subscriptions", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;
        const sub = res.data;
        if (sub.accessState !== "grace_period") return;

        const salonId =
          sub.subscription?.salonId ??
          (typeof window !== "undefined"
            ? localStorage.getItem("salon-id-cache")
            : null);

        fetch("/api/salons/current")
          .then((r) => r.json())
          .then((salonRes) => {
            const sid = salonRes.success
              ? salonRes.data?.salonId
              : salonId;
            if (sid && typeof window !== "undefined") {
              localStorage.setItem("salon-id-cache", sid);
            }
            const periodoFin = sub.subscription?.periodoFin;
            if (sid && periodoFin) {
              const key = getDismissKey(sid, String(periodoFin));
              setDismissed(localStorage.getItem(key) === "1");
            }
            setData({
              accessState: sub.accessState,
              graceDaysRemaining: sub.graceDaysRemaining,
              periodoFin: sub.subscription?.periodoFin,
              salonId: sid,
            });
          });
      })
      .catch(() => {});
  }, []);

  if (!data || data.accessState !== "grace_period" || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    if (data.salonId && data.periodoFin) {
      localStorage.setItem(
        getDismissKey(data.salonId, data.periodoFin),
        "1"
      );
    }
    setDismissed(true);
  };

  const expiredDate = data.periodoFin
    ? new Date(data.periodoFin).toLocaleDateString("es", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
      style={{ borderLeftWidth: 4, borderLeftColor: "#F59E0B" }}
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Suscripción vencida</p>
        <p className="mt-0.5 text-sm">
          {expiredDate
            ? `Tu plan venció el ${expiredDate}. `
            : "Tu plan ha vencido. "}
          Te quedan{" "}
          <strong>
            {data.graceDaysRemaining}{" "}
            {data.graceDaysRemaining === 1 ? "día" : "días"}
          </strong>{" "}
          de gracia para renovar antes de perder el acceso.
        </p>
        <Link
          href="/admin/suscripcion"
          className="mt-2 inline-block text-sm font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900 dark:text-amber-200"
        >
          Renovar ahora
        </Link>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded-lg p-1.5 text-amber-700 transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/50"
        aria-label="Cerrar aviso"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
