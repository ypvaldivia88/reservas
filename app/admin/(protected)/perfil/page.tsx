"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import PlatformNav from "@/components/PlatformNav";
import { Button } from "@/components/ui/Button";
import { SaveIcon } from "@/components/ui/Icons";
import { UserProfile } from "@/lib/types";

export default function PerfilPage() {
  const pathname = usePathname();
  const isPlatform = pathname.startsWith("/admin/platform");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setProfile(data.data);
          setNombre(data.data.nombre);
          setUsername(data.data.username || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, username }),
      });
      const data = await res.json();

      if (data.success) {
        setProfile(data.data);
        setMessage("Perfil actualizado exitosamente");
      } else {
        setMessage(data.error || "Error al actualizar perfil");
      }
    } catch {
      setMessage("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordMessage("");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (data.success) {
        setPasswordMessage("Contraseña actualizada exitosamente");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPasswordMessage(data.error || "Error al cambiar contraseña");
      }
    } catch {
      setPasswordMessage("Error de conexión");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Cargando...</p>;
  }

  return (
    <>
      {isPlatform && <PlatformNav />}

      <div className="space-y-8 max-w-2xl">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mi Perfil
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Gestiona tus datos de cuenta y contraseña
          </p>
        </div>

        <form
          onSubmit={handleSaveProfile}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Datos personales
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              required
              minLength={3}
              pattern="[a-zA-Z0-9_.-]{3,30}"
            />
            <p className="text-xs text-gray-500 mt-1">
              3-30 caracteres: letras, números, punto, guión o guión bajo
            </p>
          </div>

          {profile?.role && (
            <div className="text-sm text-gray-500">
              Rol:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {profile.role === "platform_admin"
                  ? "Administrador de plataforma"
                  : profile.role === "salon_admin" || profile.role === "admin"
                    ? "Administrador de salón"
                    : profile.role}
              </span>
            </div>
          )}

          {message && (
            <p
              className={`text-sm font-medium ${
                message.includes("exitosamente")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            icon={<SaveIcon />}
            loading={saving}
          >
            Guardar cambios
          </Button>
        </form>

        <form
          onSubmit={handleChangePassword}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cambiar contraseña
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña actual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              required
              minLength={8}
            />
          </div>

          {passwordMessage && (
            <p
              className={`text-sm font-medium ${
                passwordMessage.includes("exitosamente")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {passwordMessage}
            </p>
          )}

          <Button
            type="submit"
            variant="outlined-primary"
            loading={changingPassword}
          >
            Actualizar contraseña
          </Button>
        </form>
      </div>
    </>
  );
}
