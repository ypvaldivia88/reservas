"use client";

import {
  getAccessibleBrandPrimary,
  getContrastingForeground,
  normalizeHexColor,
} from "@/lib/color-utils";
import { useTheme } from "@/contexts/ThemeContext";
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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const brandPrimary = normalizeHexColor(branding.primaryColor || "", "#2563eb");
  const brandSecondary = normalizeHexColor(branding.secondaryColor || "", "#7c3aed");
  const accent = normalizeHexColor(branding.accentColor || "", "#93c5fd");

  const actionPrimary = getAccessibleBrandPrimary(
    brandPrimary,
    brandSecondary,
    accent,
    isDark
  );
  const actionForeground = getContrastingForeground(actionPrimary);

  const style = {
    "--color-primary-dark": brandPrimary,
    "--color-primary": actionPrimary,
    "--color-primary-light": lighten(actionPrimary, 30),
    "--color-primary-lighter": lighten(actionPrimary, 60),
    "--color-secondary-dark": brandSecondary,
    "--color-secondary": brandSecondary,
    "--color-secondary-light": lighten(brandSecondary, 30),
    "--color-accent": accent,
    "--color-accent-light": lighten(accent, 40),
    "--color-accent-lighter": lighten(accent, 80),
    "--gradient-primary": `linear-gradient(135deg, ${brandPrimary} 0%, ${lighten(brandPrimary, 40)} 100%)`,
    "--gradient-secondary": `linear-gradient(135deg, ${brandSecondary} 0%, ${lighten(brandSecondary, 40)} 100%)`,
    "--gradient-accent": `linear-gradient(135deg, ${brandPrimary} 0%, ${accent} 100%)`,
    "--tenant-brand": brandPrimary,
    "--tenant-brand-secondary": brandSecondary,
    "--tenant-primary": actionPrimary,
    "--tenant-secondary": brandSecondary,
    "--tenant-primary-rgb": hexToRgb(actionPrimary) || "37, 99, 235",
    "--primary": actionPrimary,
    "--primary-foreground": actionForeground,
    "--ring": actionPrimary,
  } as React.CSSProperties;

  return (
    <div style={style} className="tenant-branded">
      {children}
    </div>
  );
}
