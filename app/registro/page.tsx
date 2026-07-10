"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BusinessTemplate } from "@/lib/types";
import { markWelcomePending } from "@/lib/salon-onboarding";
import { getReservaTemplateConfig } from "@/lib/reserva-template-config";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function publicHostFromOrigin(origin: string): string {
  if (!origin) return "";
  try {
    return new URL(origin).host;
  } catch {
    return origin.replace(/^https?:\/\//, "").split("/")[0];
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 min-h-10 px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors"
    >
      {copied ? "¡Copiado!" : "Copiar"}
    </button>
  );
}

interface RegistrationSuccess {
  nombre: string;
  slug: string;
  trialEndsAt: string;
}

export default function RegistroPage() {
  const [origin, setOrigin] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    slug: "",
    whatsappNumber: "",
    businessTemplate: "generic" as BusinessTemplate,
    adminNombre: "",
    adminUsername: "",
    adminPassword: "",
    adminPasswordConfirm: "",
  });
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<RegistrationSuccess | null>(null);
  const [templates, setTemplates] = useState<
    { id: BusinessTemplate; nombre: string; descripcion: string; icon: string; branding: { primaryColor?: string; secondaryColor?: string } }[]
  >([]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    fetch("/api/business-templates")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTemplates(data.data);
      });
  }, []);

  const checkSlug = useCallback(async (slug: string) => {
    if (slug.length < 3) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const res = await fetch(`/api/salons/check-slug?slug=${encodeURIComponent(slug)}`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus(data.data?.available ? "ok" : "taken");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.slug) checkSlug(form.slug);
    }, 400);
    return () => clearTimeout(timer);
  }, [form.slug, checkSlug]);

  const handleNombreChange = (nombre: string) => {
    const autoSlug = slugify(nombre);
    setForm((f) => ({
      ...f,
      nombre,
      slug: f.slug === slugify(f.nombre) || !f.slug ? autoSlug : f.slug,
    }));
  };

  const publicHost = publicHostFromOrigin(origin);
  const shortPublicUrl =
    form.slug && publicHost ? `${publicHost}/${form.slug}` : "";
  const registrationConfig = getReservaTemplateConfig(form.businessTemplate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.adminPassword !== form.adminPasswordConfirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (slugStatus === "taken") {
      setError("El slug ya está en uso");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/salons/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          slug: form.slug,
          whatsappNumber: form.whatsappNumber,
          businessTemplate: form.businessTemplate,
          adminNombre: form.adminNombre,
          adminUsername: form.adminUsername,
          adminPassword: form.adminPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        markWelcomePending();
        setSuccess({
          nombre: data.data.nombre,
          slug: data.data.slug,
          trialEndsAt: data.data.trialEndsAt,
        });
      } else {
        setError(data.error || "Error al registrar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const salonUrl = `${origin}/${success.slug}`;
    const reservaUrl = `${origin}/reserva?slug=${success.slug}`;

    return (
      <div id="main-content" className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ¡{success.nombre} está listo!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tu salón fue creado con 14 días de prueba (hasta el {success.trialEndsAt}).
              Comparte estos enlaces con tus clientes:
            </p>

            <div className="space-y-4 text-left mb-8">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Página de tu salón
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 font-mono text-sm break-all">
                    {salonUrl}
                  </div>
                  <CopyButton text={salonUrl} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Enlace directo de reservas
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 font-mono text-sm break-all">
                    {reservaUrl}
                  </div>
                  <CopyButton text={reservaUrl} />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={`/${success.slug}`} className="flex-1">
                <Button variant="outlined-primary" fullWidth size="lg">
                  Ver mi página
                </Button>
              </Link>
              <Link href="/admin/dashboard?bienvenida=1" className="flex-1">
                <Button variant="primary" fullWidth size="lg">
                  Configurar mi sitio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="main-content" className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-sm text-primary hover:underline mb-4 inline-block">
            ← Volver al inicio
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Registra tu salón
          </h1>
          <p className="text-muted-foreground mt-2">
            14 días de prueba gratis · Sin tarjeta de crédito
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-5 shadow-sm"
        >
          <div>
            <label htmlFor="nombre" className="text-sm font-medium block mb-1">
              {registrationConfig.registration.nombreLabel}
            </label>
            <input
              id="nombre"
              required
              value={form.nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              className="w-full min-h-11 px-4 py-3 rounded-lg border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={registrationConfig.registration.nombrePlaceholder}
            />
          </div>

          <div>
            <label htmlFor="slug" className="mb-1 block text-sm font-medium">
              URL de tu salón
            </label>
            <div className="overflow-hidden rounded-lg border border-input bg-background">
              {origin && (
                <div
                  className="truncate border-b border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground"
                  title={`${origin}/`}
                >
                  {origin}/
                </div>
              )}
              <input
                id="slug"
                required
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
                }
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                className="w-full min-h-11 border-0 bg-transparent px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                placeholder={registrationConfig.registration.slugPlaceholder}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            {shortPublicUrl && slugStatus === "ok" && (
              <p className="mt-2 break-all text-xs text-muted-foreground">
                Tu página:{" "}
                <span className="font-medium text-primary">{shortPublicUrl}</span>
              </p>
            )}
            {slugStatus === "checking" && (
              <p className="text-xs text-gray-500 mt-1">Verificando...</p>
            )}
            {slugStatus === "ok" && (
              <p className="text-xs text-green-600 mt-1">✓ Disponible</p>
            )}
            {slugStatus === "taken" && (
              <p className="text-xs text-red-600 mt-1">✗ Ya en uso</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Tipo de negocio
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, businessTemplate: t.id }))}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.businessTemplate === t.id
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <p className="text-sm font-medium mt-1">{t.nombre}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              WhatsApp (opcional)
            </label>
            <input
              value={form.whatsappNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, whatsappNumber: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              placeholder="+53 5 123 4567"
            />
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          <div>
            <label className="text-sm font-medium block mb-1">Tu nombre</label>
            <input
              required
              value={form.adminNombre}
              onChange={(e) =>
                setForm((f) => ({ ...f, adminNombre: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Usuario admin</label>
            <input
              required
              value={form.adminUsername}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  adminUsername: e.target.value.toLowerCase(),
                }))
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              placeholder="miusuario"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Contraseña</label>
              <input
                required
                type="password"
                minLength={8}
                value={form.adminPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, adminPassword: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Confirmar</label>
              <input
                required
                type="password"
                value={form.adminPasswordConfirm}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    adminPasswordConfirm: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth loading={loading} size="lg">
            Crear mi salón
          </Button>

          <p className="text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/admin" className="text-violet-600 hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
