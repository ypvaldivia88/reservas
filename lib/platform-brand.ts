/** Identidad visual de la plataforma ReservaSalón (no confundir con branding de tenants). */

export const PLATFORM_NAME = "ReservaSalón";
export const PLATFORM_TAGLINE = "Reservas online para salones";

export const PLATFORM_BRAND = {
  name: PLATFORM_NAME,
  tagline: PLATFORM_TAGLINE,
  primary: "#1a9e8f",
  primaryLight: "#22b8a5",
  accent: "#fbbf24",
} as const;

export const PLATFORM_LOGO = {
  mark: "/brand/logo-mark.svg",
  full: "/brand/logo.svg",
  small: "/brand/logo-small.svg",
} as const;
