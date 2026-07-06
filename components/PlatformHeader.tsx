"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import HamburgerButton from "./HamburgerButton";
import MobileNavDrawer, { MobileNavLink } from "./MobileNavDrawer";

const navLinks = [
  { href: "#funciones", label: "Funciones" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "/admin", label: "Iniciar sesión" },
];

const mobileLinks: MobileNavLink[] = navLinks.map((link) => ({
  ...link,
}));

export default function PlatformHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link
              href="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                R
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                ReservaSalón
              </h1>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 dark:text-gray-300 hover:text-violet-700 dark:hover:text-violet-400 transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/registro"
                className="bg-gradient-to-r from-violet-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Registrar mi salón
              </Link>
              <ThemeToggle />
            </nav>

            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <HamburgerButton
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </div>
        </div>
      </header>

      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={mobileLinks}
        title="ReservaSalón"
        cta={{ href: "/registro", label: "Registrar mi salón" }}
      />
    </>
  );
}
