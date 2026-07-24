import { SalonBranding } from "@/lib/types";
import { normalizeHexColor } from "@/lib/color-utils";

export type HeroImageFocus = "top" | "center" | "bottom";

export const DEFAULT_HERO_OVERLAY_OPACITY = 75;

const FOCUS_TO_OBJECT_POSITION: Record<HeroImageFocus, string> = {
  top: "center top",
  center: "center center",
  bottom: "center bottom",
};

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = normalizeHexColor(hex, "");
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(normalized);
  if (!match) return null;
  return [
    parseInt(match[1], 16),
    parseInt(match[2], 16),
    parseInt(match[3], 16),
  ];
}

function rgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(15, 23, 42, ${alpha})`;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export function clampHeroOverlayOpacity(value?: number): number {
  if (value === undefined || Number.isNaN(value)) {
    return DEFAULT_HERO_OVERLAY_OPACITY;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeHeroImageFocus(
  value?: string | null
): HeroImageFocus {
  if (value === "top" || value === "bottom" || value === "center") {
    return value;
  }
  return "top";
}

export function getHeroObjectPosition(focus?: string | null): string {
  return FOCUS_TO_OBJECT_POSITION[normalizeHeroImageFocus(focus)];
}

/**
 * Scrim inferior: la foto se ve arriba; el color de marca sube desde abajo
 * para legibilidad del texto sin tapar toda la imagen.
 */
export function buildHeroOverlayGradient(
  primaryColor: string,
  secondaryColor: string,
  opacityPercent?: number
): string {
  const opacity = clampHeroOverlayOpacity(opacityPercent) / 100;
  const primary = normalizeHexColor(primaryColor, "#2563eb");
  const secondary = normalizeHexColor(secondaryColor, "#7c3aed");

  if (opacity <= 0) {
    return "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 55%)";
  }

  const bottom = opacity * 0.95;
  const mid = opacity * 0.62;
  const upper = opacity * 0.18;

  return [
    "linear-gradient(to top,",
    `${rgba(primary, bottom)} 0%,`,
    `${rgba(secondary, mid)} 38%,`,
    `${rgba(secondary, upper)} 62%,`,
    "transparent 78%)",
  ].join(" ");
}

export function resolveHeroBranding(branding: SalonBranding) {
  return {
    primary: normalizeHexColor(branding.primaryColor || "", "#2563eb"),
    secondary: normalizeHexColor(branding.secondaryColor || "", "#7c3aed"),
    overlayOpacity: clampHeroOverlayOpacity(branding.heroOverlayOpacity),
    imageFocus: normalizeHeroImageFocus(branding.heroImageFocus),
    objectPosition: getHeroObjectPosition(branding.heroImageFocus),
    overlayGradient: buildHeroOverlayGradient(
      branding.primaryColor || "#2563eb",
      branding.secondaryColor || "#7c3aed",
      branding.heroOverlayOpacity
    ),
  };
}
