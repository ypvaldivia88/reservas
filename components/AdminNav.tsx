"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const adminMediaNavItem = {
  href: "/admin/contenido",
  matchPaths: ["/admin/contenido"],
  label: "Media",
  icon: (
    <svg
      className="w-5 h-5 sm:w-6 sm:h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
};

const bottomNavItems = [
  {
    href: "/admin/calendario?view=month",
    matchPaths: ["/admin/calendario", "/admin/dashboard"],
    label: "Calendario",
    icon: (
      <svg
        className="w-5 h-5 sm:w-6 sm:h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    href: "/admin/schedule",
    matchPaths: ["/admin/schedule"],
    label: "Horarios",
    icon: (
      <svg
        className="w-5 h-5 sm:w-6 sm:h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    href: "/admin/servicios",
    matchPaths: ["/admin/servicios"],
    label: "Servicios",
    icon: (
      <svg
        className="w-5 h-5 sm:w-6 sm:h-6"
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
    ),
  },
  {
    href: "/admin/finanzas",
    matchPaths: ["/admin/finanzas"],
    label: "Finanzas",
    icon: (
      <svg
        className="w-5 h-5 sm:w-6 sm:h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:static bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t md:border-t-0 md:border-b border-gray-200 dark:border-white/10 md:mb-6 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="grid grid-cols-4 gap-0.5 sm:gap-1 py-2 sm:py-3 md:py-4 md:max-w-2xl md:mx-auto">
          {bottomNavItems.map((item) => {
            const isActive = item.matchPaths.some((p) => pathname.startsWith(p));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-2 sm:py-2.5 rounded-xl transition-all duration-200 font-semibold min-h-[56px] ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <span
                  className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
                >
                  {item.icon}
                </span>
                <span className="text-[10px] sm:text-xs leading-tight text-center truncate w-full">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-blue-500 dark:bg-blue-400 md:hidden" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
