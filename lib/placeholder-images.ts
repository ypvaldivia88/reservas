import { getBusinessTemplate } from "@/lib/business-templates";
import {
  PLACEHOLDER_CONFIG,
  getTemplateHeroUrl,
  localServicePath,
} from "@/lib/placeholder-config";
import { BusinessTemplate } from "@/lib/types";

export { getTemplateHeroUrl } from "@/lib/placeholder-config";

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

/**
 * Resolves placeholder images for a new tenant.
 * Always uses bundled images under /public/placeholders/ for reliable public access.
 */
export async function resolvePlaceholderPack(
  template: BusinessTemplate
): Promise<ResolvedPlaceholderPack> {
  const local = getTenantPlaceholders(template);
  return {
    ...local,
    source: "local",
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
