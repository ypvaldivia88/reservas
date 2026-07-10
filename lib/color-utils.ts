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
