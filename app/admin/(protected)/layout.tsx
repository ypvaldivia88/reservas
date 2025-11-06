"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import ThemeToggle from "@/components/ThemeToggle";

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
        setPasswordMessage("✅ Contraseña actualizada exitosamente");
        setCurrentPassword("");
        setNewPassword("");
        setTimeout(() => setShowChangePassword(false), 2000);
      } else {
        setPasswordMessage(
          "❌ " + (data.error || "Error al cambiar contraseña")
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setPasswordMessage("❌ Error de conexión");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-gray-100 dark:from-gray-950 dark:via-blue-950 dark:to-gray-950">
      {/* Header común */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                <span className="text-2xl">💎</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Panel Administrador
                </h1>
                <p className="text-blue-600 dark:text-blue-300 text-sm">
                  Gestión del Salón de Belleza
                </p>
              </div>
            </div>

            {/* Desktop View - Botones */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              
              <button
                onClick={() => router.push("/")}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Ir a la vista del cliente"
                title="Ir a la vista del cliente"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap"
              >
                🔑 Cambiar Contraseña
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-sm text-gray-700 dark:text-white rounded-lg transition-all duration-300 text-sm font-medium border border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/40 whitespace-nowrap"
              >
                🚪 Cerrar Sesión
              </button>
            </div>

            {/* Mobile View - Hamburger Menu */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => router.push("/")}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Ir a la vista del cliente"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors touch-manipulation"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ?
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  : <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  }
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 space-y-2 pb-2">
              <button
                onClick={() => {
                  setShowChangePassword(!showChangePassword);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 text-sm font-medium shadow-lg flex items-center justify-center gap-2 touch-manipulation"
              >
                🔑 Cambiar Contraseña
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-white rounded-lg transition-all duration-300 text-sm font-medium border border-gray-300 dark:border-white/20 flex items-center justify-center gap-2 touch-manipulation"
              >
                🚪 Cerrar Sesión
              </button>
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
              <span className="text-3xl">🔒</span>
              Cambiar Contraseña
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
                  className={`p-3 rounded-lg ${
                    passwordMessage.includes("✅") ?
                      "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                    : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                  }`}
                >
                  <p className="text-sm font-medium">{passwordMessage}</p>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setPasswordMessage("");
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-xl transition-all font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contenido de cada página */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
