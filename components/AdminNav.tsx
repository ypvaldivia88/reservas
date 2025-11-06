"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/dashboard", label: "Portada", icon: "📊" },
    { href: "/admin/schedule", label: "Horarios", icon: "📅" },
  ];

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 mb-6 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-2 sm:space-x-4 py-4 overflow-x-auto hide-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-xl transition-all duration-300 whitespace-nowrap font-semibold ${
                  isActive ?
                    "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg scale-105"
                  : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-blue-200 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10"
                }`}
              >
                <span className="text-lg sm:text-xl">{item.icon}</span>
                <span className="text-sm sm:text-base">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
