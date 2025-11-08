"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import {
  SaveIcon,
  CloseIcon,
  HomeIcon,
  KeyIcon,
  LogoutIcon,
  MenuIcon,
} from "@/components/ui/Icons";

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setTimeout(() => setShowChangePassword(false), 2000);
      } else {
        setPasswordMessage(data.error || "Error al cambiar contraseña");
      }
    } catch (error) {
      console.error("Error:", error);
      setPasswordMessage("Error de conexión");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-gray-100 dark:from-gray-950 dark:via-blue-950 dark:to-gray-950">
      {/* Header común */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-5 lg:px-8">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  Administración
                </h1>
                <p className="text-blue-600 dark:text-blue-300 text-xs sm:text-sm truncate">
                  Gestión del Salón de Belleza
                </p>
              </div>
            </div>

            {/* Desktop View - Botones */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <ThemeToggle />

              <Button
                onClick={() => router.push("/")}
                variant="ghost"
                size="sm"
                icon={<HomeIcon />}
                aria-label="Ir a la vista del cliente"
                title="Ir a la vista del cliente"
                className="rounded-full p-2"
              />

              <Button
                onClick={() => setShowChangePassword(!showChangePassword)}
                variant="primary"
                size="sm"
                icon={<KeyIcon />}
              >
                Cambiar Contraseña
              </Button>
              <Button
                onClick={handleLogout}
                variant="outlined-secondary"
                size="sm"
                icon={<LogoutIcon />}
              >
                Cerrar Sesión
              </Button>
            </div>

            {/* Mobile View - Hamburger Menu */}
            <div className="flex md:hidden items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                onClick={() => router.push("/")}
                variant="ghost"
                size="sm"
                icon={<HomeIcon />}
                aria-label="Ir a la vista del cliente"
                className="rounded-full p-2"
              />
              <ThemeToggle />
              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                variant="ghost"
                size="sm"
                icon={isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                aria-label="Toggle menu"
              />
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 space-y-2 pb-2">
              <Button
                onClick={() => {
                  setShowChangePassword(!showChangePassword);
                  setIsMobileMenuOpen(false);
                }}
                variant="primary"
                size="sm"
                icon={<KeyIcon />}
                fullWidth
              >
                Cambiar Contraseña
              </Button>
              <Button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                variant="outlined-secondary"
                size="sm"
                icon={<LogoutIcon />}
                fullWidth
              >
                Cerrar Sesión
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Navegación común */}
      <AdminNav />

      {/* Modal de cambio de contraseña */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-200 dark:border-white/20 animate-fadeInUp">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <svg
                className="w-7 h-7 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>Cambiar Contraseña</span>
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                  placeholder="Ingresa tu contraseña actual"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                />
              </div>
              {passwordMessage && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    passwordMessage.includes("exitosamente") ?
                      "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                    : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                  }`}
                >
                  {passwordMessage.includes("exitosamente") ?
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  : <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                  <p className="text-sm font-medium">{passwordMessage}</p>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setPasswordMessage("");
                  }}
                  variant="outlined-secondary"
                  icon={<CloseIcon />}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" icon={<SaveIcon />}>
                  Actualizar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contenido de cada página */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:px-8">
        {children}
      </div>
    </div>
  );
}
