import { BusinessTemplate } from "@/lib/types";
import { PLACEHOLDER_CONFIG, localServicePath } from "@/lib/placeholder-config";

/** Curated Unsplash CDN URLs (no API key) for bundled placeholder files. */
export const PLACEHOLDER_DOWNLOAD_URLS: Record<
  BusinessTemplate,
  { hero: string; services: Record<string, string> }
> = {
  manicure: {
    hero: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1400&q=85&auto=format&fit=crop",
    services: {
      gel: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=900&q=85&auto=format&fit=crop",
      rubber: "https://images.unsplash.com/photo-1519014815656-a63f1269d4e8?w=900&q=85&auto=format&fit=crop",
      dipping: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=85&auto=format&fit=crop",
      pedicure: "https://images.unsplash.com/photo-1519415517518-0b308632220f?w=900&q=85&auto=format&fit=crop",
    },
  },
  peluqueria: {
    hero: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1400&q=85&auto=format&fit=crop",
    services: {
      corte: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=900&q=85&auto=format&fit=crop",
      color: "https://images.unsplash.com/photo-1522337360788-8b13dee7a7e0?w=900&q=85&auto=format&fit=crop",
      peinado: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=900&q=85&auto=format&fit=crop",
      tratamiento: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=900&q=85&auto=format&fit=crop",
    },
  },
  barberia: {
    hero: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1400&q=85&auto=format&fit=crop",
    services: {
      clasico: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=900&q=85&auto=format&fit=crop",
      fade: "https://images.unsplash.com/photo-1605497788043-5f32c05005a3?w=900&q=85&auto=format&fit=crop",
      barba: "https://images.unsplash.com/photo-1621605813561-0955f4a9c781?w=900&q=85&auto=format&fit=crop",
      combo: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=900&q=85&auto=format&fit=crop",
    },
  },
  tatuajes: {
    hero: "https://images.unsplash.com/photo-1590246814883-57c511a30dcb?w=1400&q=85&auto=format&fit=crop",
    services: {
      pequeno: "https://images.unsplash.com/photo-1611501275019-8b3f915508e3?w=900&q=85&auto=format&fit=crop",
      mediano: "https://images.unsplash.com/photo-1565058530932-860b69e3d267?w=900&q=85&auto=format&fit=crop",
      grande: "https://images.unsplash.com/photo-1598372297313-7331c00d0e52?w=900&q=85&auto=format&fit=crop",
      consulta: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc9?w=900&q=85&auto=format&fit=crop",
    },
  },
  generic: {
    hero: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1400&q=85&auto=format&fit=crop",
    services: {
      basico: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900&q=85&auto=format&fit=crop",
      premium: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=900&q=85&auto=format&fit=crop",
    },
  },
};

export function listPlaceholderDownloadTargets(): {
  template: BusinessTemplate;
  file: string;
  url: string;
  outputPath: string;
}[] {
  const targets: {
    template: BusinessTemplate;
    file: string;
    url: string;
    outputPath: string;
  }[] = [];

  for (const template of Object.keys(PLACEHOLDER_CONFIG) as BusinessTemplate[]) {
    const config = PLACEHOLDER_CONFIG[template];
    const assets = PLACEHOLDER_DOWNLOAD_URLS[template];

    targets.push({
      template,
      file: "hero",
      url: assets.hero,
      outputPath: `public${config.heroLocal}`,
    });

    for (const slot of config.services) {
      targets.push({
        template,
        file: slot.file,
        url: assets.services[slot.file],
        outputPath: `public${localServicePath(template, slot.file)}`,
      });
    }
  }

  return targets;
}
