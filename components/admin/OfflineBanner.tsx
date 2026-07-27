"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfflineBannerProps {
  fromCache: boolean;
  syncedAt: string | null;
  online: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  className?: string;
}

function formatSyncTime(iso: string | null): string {
  if (!iso) return "sin datos guardados";
  try {
    return new Date(iso).toLocaleString("es", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "desconocido";
  }
}

export default function OfflineBanner({
  fromCache,
  syncedAt,
  online,
  onRefresh,
  refreshing,
  className,
}: OfflineBannerProps) {
  if (online && !fromCache) return null;

  const offline = !online;

  return (
    <div
      role="status"
      className={cn(
        "mb-4 flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        offline
          ? "border-amber-300/80 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          : "border-border bg-muted/50 text-muted-foreground",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">
            {offline ? "Sin conexión" : "Datos en caché"}
          </p>
          <p className="text-xs opacity-90">
            {offline
              ? `Mostrando turnos guardados · última sync ${formatSyncTime(syncedAt)}`
              : `Última sincronización: ${formatSyncTime(syncedAt)}`}
          </p>
        </div>
      </div>
      {online && onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-60"
        >
          <RefreshCw
            className={cn("size-3.5", refreshing && "animate-spin")}
          />
          Sincronizar
        </button>
      )}
    </div>
  );
}
