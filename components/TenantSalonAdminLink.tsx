"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";

interface TenantSalonAdminLinkProps {
  slug: string;
}

export default function TenantSalonAdminLink({ slug }: TenantSalonAdminLinkProps) {
  const [adminHref, setAdminHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveAdminLink() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        const session = meData.success ? meData.data : null;
        if (!session) return;

        const role = session.role as string;
        if (role !== "salon_admin" && role !== "admin") return;

        const salonRes = await fetch("/api/salons/current");
        const salonData = await salonRes.json();
        if (!salonData.success || salonData.data?.slug !== slug) return;

        if (!cancelled) {
          setAdminHref("/admin/calendario?view=month");
        }
      } catch {
        // Ignore — public page stays clean for visitors
      }
    }

    void resolveAdminLink();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!adminHref) return null;

  return (
    <Link
      href={adminHref}
      className="fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:right-6 sm:top-5 sm:px-4 sm:text-sm"
    >
      <LayoutDashboard className="size-4" aria-hidden />
      Administración
    </Link>
  );
}
