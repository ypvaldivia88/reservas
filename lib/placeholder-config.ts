import { BusinessTemplate } from "@/lib/types";

/**
 * Where each placeholder image is used in the product:
 *
 * | Role    | Stored in              | Shown on                                      |
 * |---------|------------------------|-----------------------------------------------|
 * | hero    | salon.branding.heroImageUrl | Tenant home hero background              |
 * | service | imagenes.blobUrl + servicios.imagenId | Service cards, admin servicios, gallery carousel |
 *
 * Gallery (DynamicGalleryCarousel) and inspiration picker reuse the same
 * service placeholder rows (enGaleriaDashboard: true).
 */
export type PlaceholderImageRole = "hero" | "service";

export interface PlaceholderSlot {
  /** Stable key, e.g. "fade" — matches filename when bundling locally */
  id: string;
  role: PlaceholderImageRole;
  /** Human-readable purpose for maintainers */
  purpose: string;
  /** Unsplash Search API query (when UNSPLASH_ACCESS_KEY is set) */
  query: string;
  /** Curated Unsplash CDN URL — always used as fallback (no local /placeholders/) */
  curatedUrl: string;
}

export interface TemplatePlaceholderPack {
  hero: PlaceholderSlot;
  services: PlaceholderSlot[];
}

const u = (photoId: string, w: number, h?: number) => {
  const base = `https://images.unsplash.com/${photoId}`;
  const params = new URLSearchParams({
    w: String(w),
    q: "85",
    auto: "format",
    fit: "crop",
  });
  if (h) params.set("h", String(h));
  return `${base}?${params}`;
};

export const TEMPLATE_PLACEHOLDERS: Record<BusinessTemplate, TemplatePlaceholderPack> =
  {
    manicure: {
      hero: {
        id: "hero",
        role: "hero",
        purpose: "Salon interior / manicure atmosphere",
        query: "nail salon manicure studio interior",
        curatedUrl: u("photo-1604654894610-df63bc536371", 1400, 800),
      },
      services: [
        {
          id: "gel",
          role: "service",
          purpose: "Gel / softgel manicure",
          query: "gel nail polish manicure hands close up",
          curatedUrl: u("photo-1632345031435-8727f6897d53", 900, 900),
        },
        {
          id: "rubber",
          role: "service",
          purpose: "Builder gel / rubber base",
          query: "nail extension builder gel manicure",
          curatedUrl: u("photo-1522335789203-aabd1fc54bc9", 900, 900),
        },
        {
          id: "dipping",
          role: "service",
          purpose: "Dip powder nails",
          query: "dip powder nails manicure colorful",
          curatedUrl: u("photo-1522335789203-aabd1fc54bc9", 900, 900),
        },
        {
          id: "pedicure",
          role: "service",
          purpose: "Pedicure / foot care",
          query: "pedicure spa foot care salon",
          curatedUrl: u("photo-1513364776144-60967b0f800f", 900, 900),
        },
      ],
    },
    peluqueria: {
      hero: {
        id: "hero",
        role: "hero",
        purpose: "Hair salon styling area",
        query: "hair salon interior stylist mirrors",
        curatedUrl: u("photo-1560066984-138dadb4c035", 1400, 800),
      },
      services: [
        {
          id: "corte",
          role: "service",
          purpose: "Haircut",
          query: "women haircut salon stylist scissors",
          curatedUrl: u("photo-1562322140-8baeececf3df", 900, 900),
        },
        {
          id: "color",
          role: "service",
          purpose: "Hair color / balayage",
          query: "hair coloring balayage salon dye",
          curatedUrl: u("photo-1492724441997-5dc865305da7", 900, 900),
        },
        {
          id: "peinado",
          role: "service",
          purpose: "Blowout / styling",
          query: "hair styling blow dry salon elegant",
          curatedUrl: u("photo-1492106087820-71f1a00d2b11", 900, 900),
        },
        {
          id: "tratamiento",
          role: "service",
          purpose: "Hair treatment / mask",
          query: "hair treatment mask salon spa",
          curatedUrl: u("photo-1516975080664-ed2fc6a32937", 900, 900),
        },
      ],
    },
    barberia: {
      hero: {
        id: "hero",
        role: "hero",
        purpose: "Barbershop interior",
        query: "barbershop interior vintage chairs",
        curatedUrl: u("photo-1503951914875-452162b0f3f1", 1400, 800),
      },
      services: [
        {
          id: "clasico",
          role: "service",
          purpose: "Classic men's haircut",
          query: "classic men's haircut barber scissors",
          curatedUrl: u("photo-1622286342621-4bd786c2447c", 900, 900),
        },
        {
          id: "fade",
          role: "service",
          purpose: "Skin fade / taper",
          query: "skin fade haircut barber clippers side",
          curatedUrl: u("photo-1534438327276-14e5300c3a48", 900, 900),
        },
        {
          id: "barba",
          role: "service",
          purpose: "Beard trim / straight razor",
          query: "beard trim straight razor barber hot towel",
          curatedUrl: u("photo-1580618672591-eb180b1a973f", 900, 900),
        },
        {
          id: "combo",
          role: "service",
          purpose: "Haircut + beard combo",
          query: "barber haircut beard grooming man",
          curatedUrl: u("photo-1599351431202-1e0f0137899a", 900, 900),
        },
      ],
    },
    tatuajes: {
      hero: {
        id: "hero",
        role: "hero",
        purpose: "Tattoo studio / artist at work",
        query: "tattoo artist studio working tattoo machine",
        curatedUrl: u("photo-1612349317150-e413f6a5b16d", 1400, 800),
      },
      services: [
        {
          id: "pequeno",
          role: "service",
          purpose: "Small / minimalist tattoo",
          query: "small minimalist fine line tattoo wrist",
          curatedUrl: u("photo-1487412947147-5cebf100ffc2", 900, 900),
        },
        {
          id: "mediano",
          role: "service",
          purpose: "Medium forearm tattoo",
          query: "forearm tattoo artistic black ink",
          curatedUrl: u("photo-1583337130417-3346a1be7dee", 900, 900),
        },
        {
          id: "grande",
          role: "service",
          purpose: "Large back / sleeve tattoo",
          query: "large back tattoo session studio",
          curatedUrl: u("photo-1612349317150-e413f6a5b16d", 900, 900),
        },
        {
          id: "consulta",
          role: "service",
          purpose: "Design consultation / sketch",
          query: "tattoo design sketch consultation artist drawing",
          curatedUrl: u("photo-1555215695-3004980ad54e", 900, 900),
        },
      ],
    },
    generic: {
      hero: {
        id: "hero",
        role: "hero",
        purpose: "Small business / appointment welcome",
        query: "small business professional reception welcome",
        curatedUrl: u("photo-1556761175-b413da4baf72", 1400, 800),
      },
      services: [
        {
          id: "basico",
          role: "service",
          purpose: "Standard service",
          query: "customer service appointment professional",
          curatedUrl: u("photo-1553877522-43269d4ea984", 900, 900),
        },
        {
          id: "premium",
          role: "service",
          purpose: "Premium / consultation",
          query: "business consultation meeting professional",
          curatedUrl: u("photo-1522202176988-66273c2fd55f", 900, 900),
        },
      ],
    },
  };

/** @deprecated Use TEMPLATE_PLACEHOLDERS — kept for download script paths */
export const PLACEHOLDER_CONFIG = Object.fromEntries(
  Object.entries(TEMPLATE_PLACEHOLDERS).map(([template, pack]) => [
    template,
    {
      heroQuery: pack.hero.query,
      heroLocal: `/placeholders/${template}/hero.jpg`,
      services: pack.services.map((s) => ({ file: s.id, query: s.query })),
    },
  ])
) as Record<
  BusinessTemplate,
  {
    heroQuery: string;
    heroLocal: string;
    services: { file: string; query: string }[];
  }
>;

export function getTemplatePlaceholderPack(
  template: BusinessTemplate
): TemplatePlaceholderPack {
  return TEMPLATE_PLACEHOLDERS[template] ?? TEMPLATE_PLACEHOLDERS.generic;
}

export function localServicePath(template: BusinessTemplate, file: string): string {
  return `/placeholders/${template}/${file}.jpg`;
}

/** Hero URL for defaults, SSR, and new tenants — always Unsplash CDN, never local files */
export function getTemplateHeroUrl(template: BusinessTemplate): string {
  return getTemplatePlaceholderPack(template).hero.curatedUrl;
}

export function getCuratedServiceUrl(
  template: BusinessTemplate,
  serviceId: string
): string {
  const pack = getTemplatePlaceholderPack(template);
  const slot =
    pack.services.find((s) => s.id === serviceId) ?? pack.services[0];
  return slot?.curatedUrl ?? pack.hero.curatedUrl;
}

/** Legacy shape for download script */
export const PLACEHOLDER_DOWNLOAD_URLS: Record<
  BusinessTemplate,
  { hero: string; services: Record<string, string> }
> = Object.fromEntries(
  Object.entries(TEMPLATE_PLACEHOLDERS).map(([template, pack]) => [
    template,
    {
      hero: pack.hero.curatedUrl,
      services: Object.fromEntries(
        pack.services.map((s) => [s.id, s.curatedUrl])
      ),
    },
  ])
) as Record<BusinessTemplate, { hero: string; services: Record<string, string> }>;

export function listPlaceholderDownloadTargets(): {
  template: BusinessTemplate;
  file: string;
  url: string;
  outputPath: string;
  purpose: string;
}[] {
  const targets: {
    template: BusinessTemplate;
    file: string;
    url: string;
    outputPath: string;
    purpose: string;
  }[] = [];

  for (const template of Object.keys(TEMPLATE_PLACEHOLDERS) as BusinessTemplate[]) {
    const pack = TEMPLATE_PLACEHOLDERS[template];
    targets.push({
      template,
      file: "hero",
      url: pack.hero.curatedUrl,
      outputPath: `public/placeholders/${template}/hero.jpg`,
      purpose: pack.hero.purpose,
    });
    for (const slot of pack.services) {
      targets.push({
        template,
        file: slot.id,
        url: slot.curatedUrl,
        outputPath: `public/placeholders/${template}/${slot.id}.jpg`,
        purpose: slot.purpose,
      });
    }
  }

  return targets;
}
