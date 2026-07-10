"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import AdminSidebarMenu from "@/components/AdminSidebarMenu";
import AdminRoleGuard from "@/components/AdminRoleGuard";
import ThemeToggle from "@/components/ThemeToggle";
import DarkToneSelect from "@/components/DarkToneSelect";
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold tracking-tight sm:text-2xl">
                  Administración
                </h1>
                <p className="truncate text-xs text-muted-foreground sm:text-sm">
                  {isPlatformRoute ? "Panel de plataforma" : "Gestión del salón"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <DarkToneSelect />
              <div className="hidden md:flex">
                <ThemeToggle />
              </div>
              <Button
                onClick={() => router.push("/")}
                variant="ghost"
                size="sm"
                icon={<HomeIcon />}
                aria-label="Ir a la vista del cliente"
                title="Ir a la vista del cliente"
                className="rounded-lg p-2"
              />
              <div className="md:hidden">
                <ThemeToggle />
              </div>
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

      <div className="mx-auto max-w-7xl px-3 py-6 pb-28 sm:px-4 sm:py-8 md:pb-8 lg:px-8">
        <AdminRoleGuard>{children}</AdminRoleGuard>
      </div>
    </div>
  );
}
