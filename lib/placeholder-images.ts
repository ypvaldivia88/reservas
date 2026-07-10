import { getBusinessTemplate } from "@/lib/business-templates";
import { BusinessTemplate } from "@/lib/types";

export interface PlaceholderAsset {
  titulo: string;
  descripcion: string;
  url: string;
}

export interface ResolvedPlaceholderPack {
  heroImageUrl: string;
  serviceImages: PlaceholderAsset[];
  source: "unsplash" | "local";
}

interface TemplatePlaceholderConfig {
  heroQuery: string;
  heroLocal: string;
  services: { file: string; query: string }[];
}

const PLACEHOLDER_CONFIG: Record<BusinessTemplate, TemplatePlaceholderConfig> = {
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

function localServicePath(template: BusinessTemplate, file: string): string {
  return `/placeholders/${template}/${file}.jpg`;
}

/** Static hero for CMS defaults / SSR before tenant seed runs */
export function getTemplateHeroUrl(template: BusinessTemplate): string {
  const config = PLACEHOLDER_CONFIG[template] ?? PLACEHOLDER_CONFIG.generic;
  return config.heroLocal;
}

interface UnsplashRandomPhoto {
  urls?: { regular?: string; small?: string };
}

async function fetchUnsplashByQuery(
  query: string,
  orientation: "landscape" | "squarish"
): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!accessKey) return null;

  const params = new URLSearchParams({
    query,
    orientation,
    content_filter: "high",
    client_id: accessKey,
  });

  try {
    const res = await fetch(`https://api.unsplash.com/photos/random?${params}`, {
      headers: { "Accept-Version": "v1" },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as UnsplashRandomPhoto;
    return data.urls?.regular ?? data.urls?.small ?? null;
  } catch {
    return null;
  }
}

async function resolveImageUrl(
  query: string,
  localPath: string,
  orientation: "landscape" | "squarish"
): Promise<{ url: string; fromUnsplash: boolean }> {
  const remote = await fetchUnsplashByQuery(query, orientation);
  if (remote) return { url: remote, fromUnsplash: true };
  return { url: localPath, fromUnsplash: false };
}

/**
 * Resolves placeholder images for a new tenant.
 * Tries Unsplash search (random by query) when UNSPLASH_ACCESS_KEY is set;
 * otherwise uses bundled images under /public/placeholders/.
 */
export async function resolvePlaceholderPack(
  template: BusinessTemplate
): Promise<ResolvedPlaceholderPack> {
  const config = PLACEHOLDER_CONFIG[template] ?? PLACEHOLDER_CONFIG.generic;
  const services = getBusinessTemplate(template).defaultServices;

  const hero = await resolveImageUrl(config.heroQuery, config.heroLocal, "landscape");

  const serviceImages: PlaceholderAsset[] = [];
  let usedUnsplash = hero.fromUnsplash;

  for (let i = 0; i < services.length; i++) {
    const slot = config.services[i];
    const localPath = slot
      ? localServicePath(template, slot.file)
      : config.heroLocal;
    const query = slot?.query ?? services[i].nombre;

    const resolved = await resolveImageUrl(query, localPath, "squarish");
    if (resolved.fromUnsplash) usedUnsplash = true;

    serviceImages.push({
      titulo: services[i].nombre,
      descripcion: services[i].descripcion,
      url: resolved.url,
    });
  }

  return {
    heroImageUrl: hero.url,
    serviceImages,
    source: usedUnsplash ? "unsplash" : "local",
  };
}

/** @deprecated Use resolvePlaceholderPack — sync local fallback only */
export function getTenantPlaceholders(template: BusinessTemplate): {
  heroImageUrl: string;
  serviceImages: PlaceholderAsset[];
} {
  const config = PLACEHOLDER_CONFIG[template] ?? PLACEHOLDER_CONFIG.generic;
  const services = getBusinessTemplate(template).defaultServices;

  return {
    heroImageUrl: config.heroLocal,
    serviceImages: services.map((service, index) => ({
      titulo: service.nombre,
      descripcion: service.descripcion,
      url: localServicePath(
        template,
        config.services[index]?.file ?? "hero"
      ),
    })),
  };
}
