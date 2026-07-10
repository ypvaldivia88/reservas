"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileNavDrawer from "./MobileNavDrawer";
import { Button } from "@/components/ui/Button";
import { LogoutIcon } from "@/components/ui/Icons";
import { adminMediaNavItem } from "./AdminNav";

interface AdminSidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  profileHref: string;
  onLogout: () => void;
  isPlatformRoute?: boolean;
}

interface SidebarItem {
  href: string;
  label: string;
  matchPaths: string[];
  icon: React.ReactNode;
}

function SidebarLink({
  item,
  isActive,
  onClose,
}: {
  item: SidebarItem;
  isActive: boolean;
  onClose: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] ${
        isActive
          ? "bg-primary/10 text-primary"
          : "text-foreground hover:bg-muted hover:text-primary"
      }`}
    >
      <span
        className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
          isActive
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        }`}
      >
        {item.icon}
      </span>
      <span className="text-base">{item.label}</span>
    </Link>
  );
}

function getSalonSidebarItems(profileHref: string): SidebarItem[] {
  return [
    adminMediaNavItem,
    {
      href: "/admin/sitio",
      label: "Sitio",
      matchPaths: ["/admin/sitio"],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      ),
    },
    {
      href: "/admin/suscripcion",
      label: "Plan",
      matchPaths: ["/admin/suscripcion"],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
    {
      href: profileHref,
      label: "Mi Perfil",
      matchPaths: [profileHref],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ];
}

export default function AdminSidebarMenu({
  isOpen,
  onClose,
  profileHref,
  onLogout,
  isPlatformRoute = false,
}: AdminSidebarMenuProps) {
  const pathname = usePathname();
  const items = isPlatformRoute
    ? [
        {
          href: profileHref,
          label: "Mi Perfil",
          matchPaths: [profileHref],
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          ),
        },
      ]
    : getSalonSidebarItems(profileHref);

  return (
    <MobileNavDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Menú"
      visibility="all"
    >
      <div className="space-y-1.5">
        {items.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            isActive={item.matchPaths.some((p) => pathname.startsWith(p))}
            onClose={onClose}
          />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border/60">
        <Button
          onClick={() => {
            onLogout();
            onClose();
          }}
          variant="outlined-secondary"
          size="sm"
          icon={<LogoutIcon />}
          fullWidth
        >
          Cerrar Sesión
        </Button>
      </div>
    </MobileNavDrawer>
  );
}
