"use client";

import { normalizeHexColor } from "@/lib/color-utils";
import { SalonBranding } from "@/lib/types";

interface TenantBrandingProviderProps {
  branding: SalonBranding;
  children: React.ReactNode;
}

function hexToRgb(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export default function TenantBrandingProvider({
  branding,
  children,
}: TenantBrandingProviderProps) {
  const primary = normalizeHexColor(branding.primaryColor || "", "#2563eb");
  const secondary = normalizeHexColor(branding.secondaryColor || "", "#7c3aed");
  const accent = normalizeHexColor(branding.accentColor || "", "#93c5fd");

  const style = {
    "--color-primary-dark": primary,
    "--color-primary": primary,
    "--color-primary-light": lighten(primary, 30),
    "--color-primary-lighter": lighten(primary, 60),
    "--color-secondary-dark": secondary,
    "--color-secondary": secondary,
    "--color-secondary-light": lighten(secondary, 30),
    "--color-accent": accent,
    "--color-accent-light": lighten(accent, 40),
    "--color-accent-lighter": lighten(accent, 80),
    "--gradient-primary": `linear-gradient(135deg, ${primary} 0%, ${lighten(primary, 40)} 100%)`,
    "--gradient-secondary": `linear-gradient(135deg, ${secondary} 0%, ${lighten(secondary, 40)} 100%)`,
    "--gradient-accent": `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
    "--tenant-primary": primary,
    "--tenant-secondary": secondary,
    "--tenant-primary-rgb": hexToRgb(primary) || "37, 99, 235",
    "--primary": primary,
    "--ring": primary,
  } as React.CSSProperties;

  return (
    <div style={style} className="tenant-branded">
      {children}
    </div>
  );
}
