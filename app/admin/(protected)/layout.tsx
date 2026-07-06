"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import AdminRoleGuard from "@/components/AdminRoleGuard";
import ThemeToggle from "@/components/ThemeToggle";
import HamburgerButton from "@/components/HamburgerButton";
import { Button } from "@/components/ui/Button";
import {
  HomeIcon,
  LogoutIcon,
} from "@/components/ui/Icons";
import Link from "next/link";

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isPlatformRoute = pathname.startsWith("/admin/platform");
  const profileHref = isPlatformRoute ? "/admin/platform/perfil" : "/admin/perfil";

  const salonSecondaryItems = [
    { href: "/admin/sitio", label: "Sitio" },
    { href: "/admin/suscripcion", label: "Plan" },
    { href: profileHref, label: "Mi Perfil" },
  ];

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
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
                  {isPlatformRoute ? "Panel de Plataforma" : "Gestión del Salón de Belleza"}
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

              {isPlatformRoute ? (
                <>
                  <Link href={profileHref}>
                    <Button variant="primary" size="sm">
                      Mi Perfil
                    </Button>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="outlined-secondary"
                    size="sm"
                    icon={<LogoutIcon />}
                  >
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <HamburgerButton
                  isOpen={isMobileMenuOpen}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  ariaLabel="Menú de administración"
                />
              )}
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
              <HamburgerButton
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                ariaLabel="Menú de administración"
              />
            </div>
          </div>

          {/* Menú secundario expandible (Sitio, Plan, Perfil, Sesión) */}
          {isMobileMenuOpen && (
            <div
              className={`mt-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg p-3 space-y-2 animate-fadeInUp ${
                isPlatformRoute ? "md:hidden" : ""
              }`}
            >
              {!isPlatformRoute &&
                salonSecondaryItems.map((item) => (
                  <Link key={item.href} href={item.href} className="block" onClick={closeMenu}>
                    <Button
                      variant={
                        pathname.startsWith(item.href) ? "primary" : "outlined-secondary"
                      }
                      size="sm"
                      fullWidth
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}

              {isPlatformRoute && (
                <Link href={profileHref} className="block" onClick={closeMenu}>
                  <Button variant="primary" size="sm" fullWidth>
                    Mi Perfil
                  </Button>
                </Link>
              )}

              <Button
                onClick={() => {
                  handleLogout();
                  closeMenu();
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

      {/* Navegación (solo salones, no plataforma) */}
      {!isPlatformRoute && <AdminNav />}

      {/* Contenido de cada página */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-24 md:pb-8 lg:px-8">
        <AdminRoleGuard>{children}</AdminRoleGuard>
      </div>
    </div>
  );
}
