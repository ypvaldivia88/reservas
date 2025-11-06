"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/dashboard", label: "Portada", icon: "📊" },
    { href: "/admin/schedule", label: "Horarios", icon: "📅" },
    { href: "/admin/contenido", label: "Contenido", icon: "🎨" },
  ];

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 mb-6 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center py-4">
          {/* Container con fondo pill */}
          <div className="inline-flex bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-1.5 shadow-inner">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center space-x-2 px-6 py-2.5 rounded-xl transition-all duration-300 whitespace-nowrap font-semibold text-sm sm:text-base ${
                    isActive ?
                      "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <span
                    className={`text-xl transition-transform duration-300 ${isActive ? "scale-110" : ""}`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl border-2 border-blue-500/20 dark:border-blue-400/30 pointer-events-none"></span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
