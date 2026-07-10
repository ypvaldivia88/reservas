const HEX_SHORT = /^#([0-9a-fA-F]{3})$/;
const HEX_FULL = /^#([0-9a-fA-F]{6})$/;

export function normalizeHexColor(value: string, fallback = "#2563eb"): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  const short = withHash.match(HEX_SHORT);
  if (short) {
    const [r, g, b] = short[1];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  const full = withHash.match(HEX_FULL);
  if (full) {
    return `#${full[1].toLowerCase()}`;
  }

  return fallback;
}

export function isValidHexColor(value: string): boolean {
  const normalized = value.trim();
  const withHash = normalized.startsWith("#") ? normalized : `#${normalized}`;
  return HEX_SHORT.test(withHash) || HEX_FULL.test(withHash);
}

function hexToRgbTuple(hex: string): [number, number, number] | null {
  const normalized = normalizeHexColor(hex, "");
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(normalized);
  if (!match) return null;
  return [
    parseInt(match[1], 16),
    parseInt(match[2], 16),
    parseInt(match[3], 16),
  ];
}

/** WCAG relative luminance for sRGB hex colors (0 = black, 1 = white). */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgbTuple(hex);
  if (!rgb) return 0;

  const channels = rgb.map((value) => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function getContrastingForeground(hex: string): "#ffffff" | "#0f172a" {
  return getRelativeLuminance(hex) > 0.45 ? "#0f172a" : "#ffffff";
}

function lightenHex(hex: string, amount: number): string {
  const rgb = hexToRgbTuple(hex);
  if (!rgb) return hex;

  const [r, g, b] = rgb.map((channel) =>
    Math.min(255, channel + amount)
  ) as [number, number, number];

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Picks a primary token that stays readable on page backgrounds and buttons.
 * Dark brand colors (tattoo, barber) shift to secondary/accent in dark mode.
 */
export function getAccessibleBrandPrimary(
  primary: string,
  secondary: string,
  accent: string,
  isDark: boolean
): string {
  const minSurfaceLum = isDark ? 0.28 : 0.18;
  const candidates = isDark
    ? [primary, secondary, accent, lightenHex(primary, 90), lightenHex(secondary, 50)]
    : [primary, secondary, accent];

  for (const candidate of candidates) {
    if (getRelativeLuminance(candidate) >= minSurfaceLum) {
      return candidate;
    }
  }

  return isDark ? lightenHex(primary, 120) : primary;
}
