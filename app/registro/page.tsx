"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export default function RegistroPage() {
  const [form, setForm] = useState({
    nombre: "",
    slug: "",
    whatsappNumber: "",
    adminNombre: "",
    adminUsername: "",
    adminPassword: "",
    adminPasswordConfirm: "",
  });
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkSlug = useCallback(async (slug: string) => {
    if (slug.length < 3) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const res = await fetch(`/api/salons/check-slug?slug=${encodeURIComponent(slug)}`);
    const data = await res.json();
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
          adminNombre: form.adminNombre,
          adminUsername: form.adminUsername,
          adminPassword: form.adminPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        window.location.href = "/admin/dashboard";
      } else {
        setError(data.error || "Error al registrar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Registra tu salón
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            14 días de prueba gratis · Sin tarjeta de crédito
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-5 border border-gray-200 dark:border-gray-700"
        >
          <div>
            <label className="text-sm font-medium block mb-1">Nombre del salón</label>
            <input
              required
              value={form.nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              placeholder="Ej: Bella Nails Studio"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              URL de tu salón
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 shrink-0">/reserva?slug=</span>
              <input
                required
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
                }
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>
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
            <Link href="/admin" className="text-blue-600 hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
