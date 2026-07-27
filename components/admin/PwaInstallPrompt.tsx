"use client";

import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { usePwaInstallOptional } from "@/contexts/PwaInstallContext";

export default function PwaInstallPrompt() {
  const pwa = usePwaInstallOptional();

  if (!pwa?.showBanner) return null;

  const { dismissBanner, installApp, installing } = pwa;

  return (
    <div
      role="region"
      aria-label="Instalar aplicación"
      className={cn(
        "fixed bottom-36 left-3 right-3 z-[65] mx-auto max-w-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-300 md:bottom-6 md:left-auto md:right-6"
      )}
    >
      <div className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-xl">
        <div className="bg-gradient-to-r from-primary/15 via-transparent to-transparent px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Download className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold tracking-tight">
                Instalar ReservaSalón
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Accede al calendario desde tu pantalla de inicio y úsalo sin
                conexión cuando ya lo hayas abierto antes.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissBanner}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Cerrar aviso de instalación"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border/80 px-4 py-2.5">
          <button
            type="button"
            onClick={dismissBanner}
            className="px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Ahora no
          </button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={installing}
            onClick={installApp}
            icon={<Download className="size-3.5" />}
          >
            Instalar app
          </Button>
        </div>
      </div>
    </div>
  );
}
