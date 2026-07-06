"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import { SalonPublicProfile } from "@/lib/types";

interface TenantHeaderProps {
  profile: SalonPublicProfile;
  isHomePage?: boolean;
}

export default function TenantHeader({
  profile,
  isHomePage = true,
}: TenantHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const basePath = `/${profile.slug}`;
  const reservaPath = `/reserva?slug=${profile.slug}`;

  const navLinks = isHomePage
    ? [
        { href: `${basePath}#servicios`, label: "Servicios" },
        { href: `${basePath}#galeria`, label: "Galería" },
        { href: `${basePath}#contacto`, label: "Contacto" },
      ]
    : [
        { href: basePath, label: "Inicio" },
        { href: `${basePath}#servicios`, label: "Servicios" },
        { href: `${basePath}#contacto`, label: "Contacto" },
      ];

  const logoUrl = profile.branding.logoSmallUrl || profile.branding.logoUrl;
  const primary = profile.branding.primaryColor || "#2563eb";

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Link
            href={basePath}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            {logoUrl ? (
              <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={logoUrl}
                  alt={`${profile.nombre} Logo`}
                  height={48}
                  width={48}
                  className="object-contain"
                />
              </div>
            ) : (
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ background: primary }}
              >
                {profile.nombre.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {profile.nombre}
            </h1>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 dark:text-gray-300 hover:text-[var(--tenant-primary)] transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={reservaPath}
              className="text-white px-4 py-2 rounded-full text-sm font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              style={{ background: `linear-gradient(to right, ${primary}, ${profile.branding.secondaryColor || primary})` }}
            >
              Reservar Cita
            </Link>
            <ThemeToggle />
          </nav>

          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="py-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 dark:text-gray-300 font-medium py-2"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={reservaPath}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-white text-center py-3 rounded-full font-semibold"
              style={{ background: primary }}
            >
              Reservar Cita
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
