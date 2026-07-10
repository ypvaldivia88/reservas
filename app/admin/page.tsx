"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import SurfaceCard from "@/components/design/SurfaceCard";
import { ArrowLeft, LockKeyhole } from "lucide-react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        const role = data.data?.user?.role;
        router.push(
          role === "platform_admin" ? "/admin/platform" : "/admin/dashboard"
        );
      } else {
        setError(data.error || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver al portal
        </Link>
        <SurfaceCard padding="lg" className="shadow-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LockKeyhole className="size-6" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Acceso administrador
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Tu usuario"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Tu contraseña"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} variant="primary" loading={loading} fullWidth size="lg">
              Iniciar sesión
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Nuevo salón?{" "}
            <Link href="/registro" className="font-medium text-primary hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </SurfaceCard>
      </div>
    </div>
  );
}
