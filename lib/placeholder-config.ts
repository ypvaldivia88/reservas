import { BusinessTemplate } from "@/lib/types";

export interface TemplatePlaceholderConfig {
  heroQuery: string;
  heroLocal: string;
  services: { file: string; query: string }[];
}

export const PLACEHOLDER_CONFIG: Record<BusinessTemplate, TemplatePlaceholderConfig> = {
  manicure: {
    heroQuery: "nail salon manicure",
    heroLocal: "/placeholders/manicure/hero.jpg",
    services: [
      { file: "gel", query: "gel nail manicure" },
      { file: "rubber", query: "nail technician manicure hands" },
      { file: "dipping", query: "nail polish dipping powder" },
      { file: "pedicure", query: "pedicure spa feet" },
    ],
  },
  peluqueria: {
    heroQuery: "hair salon stylist",
    heroLocal: "/placeholders/peluqueria/hero.jpg",
    services: [
      { file: "corte", query: "haircut salon" },
      { file: "color", query: "hair color dye salon" },
      { file: "peinado", query: "hairstyle blowout salon" },
      { file: "tratamiento", query: "hair treatment salon" },
    ],
  },
  barberia: {
    heroQuery: "barbershop haircut",
    heroLocal: "/placeholders/barberia/hero.jpg",
    services: [
      { file: "clasico", query: "classic men's haircut barber" },
      { file: "fade", query: "fade haircut barber" },
      { file: "barba", query: "beard trim barber" },
      { file: "combo", query: "barber haircut beard" },
    ],
  },
  tatuajes: {
    heroQuery: "tattoo studio artist",
    heroLocal: "/placeholders/tatuajes/hero.jpg",
    services: [
      { file: "pequeno", query: "small minimalist tattoo" },
      { file: "mediano", query: "tattoo arm studio" },
      { file: "grande", query: "large tattoo back piece" },
      { file: "consulta", query: "tattoo design sketch studio" },
    ],
  },
  generic: {
    heroQuery: "small business service appointment",
    heroLocal: "/placeholders/generic/hero.jpg",
    services: [
      { file: "basico", query: "customer service business" },
      { file: "premium", query: "professional consultation office" },
    ],
  },
};

export function localServicePath(template: BusinessTemplate, file: string): string {
  return `/placeholders/${template}/${file}.jpg`;
}

/** Static hero for CMS defaults / SSR before tenant seed runs */
export function getTemplateHeroUrl(template: BusinessTemplate): string {
  const config = PLACEHOLDER_CONFIG[template] ?? PLACEHOLDER_CONFIG.generic;
  return config.heroLocal;
}
