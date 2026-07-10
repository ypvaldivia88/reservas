import { BusinessTemplate } from "@/lib/types";

export interface PlaceholderAsset {
  titulo: string;
  descripcion: string;
  url: string;
}

export interface TenantPlaceholderPack {
  heroImageUrl: string;
  /** One image per default service, in order */
  serviceImages: PlaceholderAsset[];
}

function unsplash(photoId: string, width = 1200): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=80`;
}

export const TENANT_PLACEHOLDERS: Record<BusinessTemplate, TenantPlaceholderPack> = {
  manicure: {
    heroImageUrl: unsplash("1604654894610-df63bc536371", 1600),
    serviceImages: [
      {
        titulo: "Gel / Softgel",
        descripcion: "Manicure con acabado en gel natural.",
        url: unsplash("1610992015732-9f0d94a74caf", 900),
      },
      {
        titulo: "Base Rubber",
        descripcion: "Refuerzo con gel builder para uñas resistentes.",
        url: unsplash("1632345031435-8727f6897d53", 900),
      },
      {
        titulo: "Gel Dipping",
        descripcion: "Sistema dipping con acabado elegante.",
        url: unsplash("1522335781103-8c13d2a1d1e3", 900),
      },
      {
        titulo: "Pedicure",
        descripcion: "Cuidado completo para pies suaves y saludables.",
        url: unsplash("1519415513138-14fccfb655e4", 900),
      },
    ],
  },
  peluqueria: {
    heroImageUrl: unsplash("1560066984-138dadb4c035", 1600),
    serviceImages: [
      {
        titulo: "Corte de Cabello",
        descripcion: "Corte personalizado según tu estilo.",
        url: unsplash("1503957149076-491e326f20ab", 900),
      },
      {
        titulo: "Coloración",
        descripcion: "Tintes y técnicas de color profesional.",
        url: unsplash("1522337360788-8b13dee7a37e", 900),
      },
      {
        titulo: "Peinado",
        descripcion: "Peinados para eventos y ocasiones especiales.",
        url: unsplash("1492106087820-7f1aa59102fc", 900),
      },
      {
        titulo: "Tratamiento Capilar",
        descripcion: "Hidratación y tratamientos reparadores.",
        url: unsplash("1605499227524-faa1bdfa76e8", 900),
      },
    ],
  },
  barberia: {
    heroImageUrl: unsplash("1622287161400-a9d0dcef0171", 1600),
    serviceImages: [
      {
        titulo: "Corte Clásico",
        descripcion: "Corte tradicional con acabado impecable.",
        url: unsplash("1507002684117-0b1ddcfd7f68", 900),
      },
      {
        titulo: "Fade / Degradado",
        descripcion: "Degradados precisos y estilos modernos.",
        url: unsplash("1621605815971-fbc98d665ca7", 900),
      },
      {
        titulo: "Barba y Afeitado",
        descripcion: "Perfilado y afeitado con navaja.",
        url: unsplash("1599354577823-4fd71d5e8b31", 900),
      },
      {
        titulo: "Combo Corte + Barba",
        descripcion: "Servicio completo de grooming masculino.",
        url: unsplash("1585747860895-be7c67672a7b", 900),
      },
    ],
  },
  tatuajes: {
    heroImageUrl: unsplash("1590246814880-11c64ef328b2", 1600),
    serviceImages: [
      {
        titulo: "Tatuaje Pequeño",
        descripcion: "Diseños minimalistas y piezas pequeñas.",
        url: unsplash("1565058538345-85fd27538262", 900),
      },
      {
        titulo: "Tatuaje Mediano",
        descripcion: "Piezas de tamaño medio con buen detalle.",
        url: unsplash("1598371832886-c4f7f12e4b9b", 900),
      },
      {
        titulo: "Tatuaje Grande",
        descripcion: "Proyectos extensos y gran formato.",
        url: unsplash("1611502716789-7a7f3b421ccb", 900),
      },
      {
        titulo: "Consulta de Diseño",
        descripcion: "Sesión para planificar tu tatuaje.",
        url: unsplash("1559451681-9d0d9bb9c407", 900),
      },
    ],
  },
  generic: {
    heroImageUrl: unsplash("1556761175-b413da4baf72", 1600),
    serviceImages: [
      {
        titulo: "Servicio Básico",
        descripcion: "Atención estándar para tus clientes.",
        url: unsplash("1551836022-d0d0a944bd2c", 900),
      },
      {
        titulo: "Servicio Premium",
        descripcion: "Atención extendida y personalizada.",
        url: unsplash("1556761175-5973dc324aeb", 900),
      },
    ],
  },
};

export function getTenantPlaceholders(
  template: BusinessTemplate
): TenantPlaceholderPack {
  return TENANT_PLACEHOLDERS[template] ?? TENANT_PLACEHOLDERS.generic;
}

export function getTemplateHeroUrl(template: BusinessTemplate): string {
  return getTenantPlaceholders(template).heroImageUrl;
}
