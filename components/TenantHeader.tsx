"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import HamburgerButton from "./HamburgerButton";
import MobileNavDrawer, { MobileNavLink } from "./MobileNavDrawer";
import { SalonPublicProfile } from "@/lib/types";

interface TenantHeaderProps {
  profile: SalonPublicProfile;
  isHomePage?: boolean;
}

const NavIcons = {
  servicios: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  galeria: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  contacto: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  inicio: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
};

function getIconForLabel(label: string) {
  const key = label.toLowerCase();
  if (key.includes("servicio")) return NavIcons.servicios;
  if (key.includes("galer")) return NavIcons.galeria;
  if (key.includes("contacto")) return NavIcons.contacto;
  if (key.includes("inicio")) return NavIcons.inicio;
  return undefined;
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

  const mobileLinks: MobileNavLink[] = navLinks.map((link) => ({
    ...link,
    icon: getIconForLabel(link.label),
  }));

  const logoUrl = profile.branding.logoSmallUrl || profile.branding.logoUrl;
  const primary = profile.branding.primaryColor || "#2563eb";
  const secondary = profile.branding.secondaryColor || primary;

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
              style={{ background: `linear-gradient(to right, ${primary}, ${secondary})` }}
            >
              Reservar Cita
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

      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={mobileLinks}
        title={profile.nombre}
        accentColor={primary}
        cta={{
          href: reservaPath,
          label: "Reservar Cita",
          style: { background: `linear-gradient(to right, ${primary}, ${secondary})` },
          className:
            "flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full text-white font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98]",
        }}
      />
    </header>
  );
}
