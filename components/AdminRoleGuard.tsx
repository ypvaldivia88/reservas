"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface SessionInfo {
  username: string;
  role: string;
  salonId?: string;
}

export default function AdminRoleGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setSession(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !session) return;

    const isPlatform = session.role === "platform_admin";
    const isPlatformRoute = pathname.startsWith("/admin/platform");
    const isSharedRoute =
      pathname.startsWith("/admin/perfil") ||
      pathname.startsWith("/admin/platform/perfil");

    if (isPlatform && !isPlatformRoute && !isSharedRoute) {
      router.replace("/admin/platform");
    } else if (!isPlatform && isPlatformRoute) {
      router.replace("/admin/dashboard");
    }
  }, [loading, session, pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return <>{children}</>;
}
