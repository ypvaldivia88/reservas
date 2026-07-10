"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import AdminSidebarMenu from "@/components/AdminSidebarMenu";
import AdminRoleGuard from "@/components/AdminRoleGuard";
import ThemeToggle from "@/components/ThemeToggle";
import HamburgerButton from "@/components/HamburgerButton";
import { Button } from "@/components/ui/Button";
import { HomeIcon } from "@/components/ui/Icons";

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
  const homeHref = isPlatformRoute ? "/admin/platform" : "/admin/dashboard";

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
    <div className="admin-shell min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-3.5 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm sm:size-10">
                <svg className="size-4 sm:size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold tracking-tight sm:text-xl">
                  Administración
                </h1>
                <p className="truncate text-xs text-muted-foreground">
                  {isPlatformRoute ? "Panel de plataforma" : "Gestión del salón"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                onClick={() => router.push(homeHref)}
                variant="ghost"
                size="sm"
                icon={<HomeIcon />}
                aria-label={isPlatformRoute ? "Ir al panel de plataforma" : "Ir al inicio del salón"}
                title={isPlatformRoute ? "Panel de plataforma" : "Inicio"}
                className="size-9 rounded-lg p-0"
              />
              <ThemeToggle />
              <HamburgerButton
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                ariaLabel="Menú de administración"
              />
            </div>
          </div>
        </div>
      </header>

      <AdminSidebarMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMenu}
        profileHref={profileHref}
        onLogout={handleLogout}
        isPlatformRoute={isPlatformRoute}
      />

      {!isPlatformRoute && <AdminNav />}

      <div className="mx-auto max-w-7xl px-3 py-6 pb-36 sm:px-4 sm:py-8 sm:pb-10 md:pb-8 lg:px-8">
        <AdminRoleGuard>{children}</AdminRoleGuard>
      </div>
    </div>
  );
}
