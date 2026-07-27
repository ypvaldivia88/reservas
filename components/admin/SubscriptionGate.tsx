"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isOnboardingSetupPath } from "@/lib/salon-onboarding";

const ALLOWED_PATHS = ["/admin/suscripcion", "/admin/perfil"];

export default function SubscriptionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin/platform")) {
      setChecked(true);
      return;
    }

    const isAllowed =
      ALLOWED_PATHS.some((p) => pathname.startsWith(p)) ||
      isOnboardingSetupPath(pathname);

    fetch("/api/subscriptions", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) {
          setChecked(true);
          return;
        }
        const { accessState, isOperational } = res.data;
        const shouldBlock =
          !isOperational &&
          (accessState === "expired" || accessState === "suspended");

        if (shouldBlock && !isAllowed) {
          setBlocked(true);
          router.replace("/admin/suscripcion");
        } else {
          setBlocked(false);
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [pathname, router]);

  if (!checked || blocked) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">Verificando suscripción…</p>
      </div>
    );
  }

  return <>{children}</>;
}
