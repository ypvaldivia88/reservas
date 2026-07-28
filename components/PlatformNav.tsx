"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const platformNavItems = [
  {
    href: "/admin/platform",
    matchPaths: ["/admin/platform"],
    exact: true,
    label: "Resumen",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: "/admin/platform/tenants",
    matchPaths: ["/admin/platform/tenants"],
    label: "Salones",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: "/admin/platform/pagos",
    matchPaths: ["/admin/platform/pagos"],
    label: "Pagos",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

export default function PlatformNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-dock safe-area-bottom" aria-label="Navegación de plataforma">
      <div className="grid grid-cols-3 gap-0.5 px-1 py-1.5 sm:gap-1 sm:px-2 sm:py-2 md:max-w-xl md:mx-auto">
        {platformNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : item.matchPaths.some((p) => pathname.startsWith(p));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold transition-colors sm:gap-1 sm:text-xs",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className={cn("transition-transform", isActive && "scale-110")}>
                {item.icon}
              </span>
              <span className="max-w-full truncate text-center leading-tight">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary md:hidden" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
