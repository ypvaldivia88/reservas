import { FormaUna } from "@/lib/types";

export const FORMA_LABELS: Record<
  FormaUna,
  { label: string; hint: string }
> = {
  square: { label: "Cuadrada", hint: "Clásica y resistente" },
  almond: { label: "Almendra", hint: "Ovalada, alarga el dedo" },
  coffin: { label: "Ballena", hint: "Recta con punta suave" },
  stiletto: { label: "Punta fina", hint: "Puntiaguda y elegante" },
};

export const LARGO_LABELS: Record<number, string> = {
  1: "Muy corto",
  2: "Corto",
  3: "Natural",
  4: "Medio corto",
  5: "Medio",
  6: "Medio largo",
  7: "Largo",
  8: "Muy largo",
};

export function getLargoSummary(value: string): string {
  const n = parseInt(value, 10);
  if (n <= 3) return "Corto — cómodo para el día a día";
  if (n <= 5) return "Medio — buen equilibrio";
  return "Largo — look más llamativo";
}
