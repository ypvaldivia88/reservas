"use client";

import { useState } from "react";
import { Copy, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getBillingCycleLabel } from "@/lib/subscription";
import {
  openActivationCertificateWhatsApp,
  ActivationCertificateDetails,
} from "@/lib/whatsapp";
import type { BillingCycle } from "@/lib/types";

export interface IssuedCertificate {
  code: string;
  salonNombre?: string;
  planNombre?: string;
  ciclo: BillingCycle;
  adminPhone?: string;
  expiresAt?: string;
}

interface CertificateIssuedDialogProps {
  certificate: IssuedCertificate | null;
  onClose: () => void;
}

export default function CertificateIssuedDialog({
  certificate,
  onClose,
}: CertificateIssuedDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!certificate) return null;

  const redeemUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/admin/suscripcion`
      : "/admin/suscripcion";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(certificate.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const details: ActivationCertificateDetails = {
      salonNombre: certificate.salonNombre ?? "Salón",
      planNombre: certificate.planNombre ?? "Plan",
      ciclo: certificate.ciclo,
      code: certificate.code,
      redeemUrl,
      expiresAt: certificate.expiresAt
        ? new Date(certificate.expiresAt).toLocaleDateString("es")
        : undefined,
      recipientPhone: certificate.adminPhone,
    };
    if (!openActivationCertificateWhatsApp(details)) {
      window.alert(
        "No hay teléfono del administrador del salón. Copia el código y envíalo manualmente."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-labelledby="cert-dialog-title"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="cert-dialog-title" className="text-lg font-bold">
              Certificado generado
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Envía este código al administrador del salón para que active su
              suscripción.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 rounded-xl bg-muted/60 p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Código de activación
          </p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-wider text-primary">
            {certificate.code}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {certificate.salonNombre} · {certificate.planNombre} ·{" "}
            {getBillingCycleLabel(certificate.ciclo)}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outlined-secondary"
            fullWidth
            onClick={handleCopy}
            icon={<Copy className="size-4" />}
          >
            {copied ? "Copiado" : "Copiar código"}
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleWhatsApp}
            disabled={!certificate.adminPhone?.trim()}
            icon={<MessageCircle className="size-4" />}
          >
            Enviar por WhatsApp
          </Button>
        </div>

        <Button variant="ghost" fullWidth className="mt-3" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
