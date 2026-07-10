import { getBusinessTemplate } from "@/lib/business-templates";
import {
  getTemplatePlaceholderPack,
  getTemplateHeroUrl,
} from "@/lib/placeholder-config";
import { BusinessTemplate } from "@/lib/types";
import { hasUnsplashAccessKey, searchUnsplashPhoto } from "@/lib/unsplash";

export { getTemplateHeroUrl };

export interface PlaceholderAsset {
  titulo: string;
  descripcion: string;
  url: string;
}

export interface ResolvedPlaceholderPack {
  heroImageUrl: string;
  serviceImages: PlaceholderAsset[];
  source: "unsplash" | "curated";
}

async function resolveSlotUrl(
  slot: { query: string; curatedUrl: string },
  options: {
    page: number;
    width: number;
    height?: number;
    orientation: "landscape" | "squarish";
  }
): Promise<string> {
  if (hasUnsplashAccessKey()) {
    const searched = await searchUnsplashPhoto(slot.query, {
      page: options.page,
      width: options.width,
      height: options.height,
      orientation: options.orientation,
    });
    if (searched) return searched;
  }
  return slot.curatedUrl;
}

/**
 * Resolves placeholder images for a new tenant.
 * Uses Unsplash Search when UNSPLASH_ACCESS_KEY is set; otherwise curated CDN URLs.
 * Never returns /placeholders/ local paths (those may be stale random pics).
 */
export async function resolvePlaceholderPack(
  template: BusinessTemplate
): Promise<ResolvedPlaceholderPack> {
  const pack = getTemplatePlaceholderPack(template);
  const services = getBusinessTemplate(template).defaultServices;

  const heroImageUrl = await resolveSlotUrl(pack.hero, {
    page: 1,
    width: 1400,
    height: 800,
    orientation: "landscape",
  });

  const serviceImages = await Promise.all(
    pack.services.map(async (slot, index) => ({
      titulo: services[index]?.nombre ?? slot.id,
      descripcion: services[index]?.descripcion ?? slot.purpose,
      url: await resolveSlotUrl(slot, {
        page: index + 1,
        width: 900,
        height: 900,
        orientation: "squarish",
      }),
    }))
  );

  return {
    heroImageUrl,
    serviceImages,
    source: hasUnsplashAccessKey() ? "unsplash" : "curated",
  };
}

/** Sync fallback — curated Unsplash CDN only */
export function getTenantPlaceholders(template: BusinessTemplate): {
  heroImageUrl: string;
  serviceImages: PlaceholderAsset[];
} {
  const pack = getTemplatePlaceholderPack(template);
  const services = getBusinessTemplate(template).defaultServices;

  return {
    heroImageUrl: pack.hero.curatedUrl,
    serviceImages: pack.services.map((slot, index) => ({
      titulo: services[index]?.nombre ?? slot.id,
      descripcion: services[index]?.descripcion ?? slot.purpose,
      url: slot.curatedUrl,
    })),
  };
}
