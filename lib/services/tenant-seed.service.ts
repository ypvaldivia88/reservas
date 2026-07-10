import { Db } from "mongodb";
import { BusinessTemplate } from "@/lib/types";
import { Collections } from "@/lib/db/collections";
import { getBusinessTemplate } from "@/lib/business-templates";
import {
  resolvePlaceholderPack,
  type ResolvedPlaceholderPack,
} from "@/lib/placeholder-images";
import { tenantQuery } from "@/lib/tenant";

export async function seedTenantMedia(
  db: Db,
  salonId: string,
  template: BusinessTemplate,
  pack?: ResolvedPlaceholderPack,
  now = new Date()
): Promise<{
  heroImageUrl: string;
  serviceCount: number;
  imageCount: number;
  source: "unsplash" | "curated";
}> {
  const placeholders = pack ?? (await resolvePlaceholderPack(template));
  const services = getBusinessTemplate(template).defaultServices;

  const imageDocs = placeholders.serviceImages.map((asset, index) => ({
    salonId,
    nombre: `placeholder-${template}-${index + 1}`,
    titulo: asset.titulo || services[index]?.nombre || `Imagen ${index + 1}`,
    descripcion: asset.descripcion || services[index]?.descripcion || "",
    blobUrl: asset.url,
    mimeType: "image/jpeg",
    size: 0,
    enGaleriaDashboard: true,
    enGaleriaInspiracion: false,
    categoriaIds: [] as string[],
    servicioIds: [] as string[],
    isPlaceholder: true,
    fechaCreacion: now,
    fechaActualizacion: now,
  }));

  const imageResult = await db.collection(Collections.IMAGENES).insertMany(imageDocs);
  const imageIds = Object.values(imageResult.insertedIds).map((id) => id.toString());

  await db.collection(Collections.SERVICIOS).insertMany(
    services.map((service, index) => ({
      ...service,
      salonId,
      precio: 0,
      imagenId: imageIds[index] ?? null,
      activo: true,
      orden: index + 1,
      fechaCreacion: now,
      fechaActualizacion: now,
    }))
  );

  return {
    heroImageUrl: placeholders.heroImageUrl,
    serviceCount: services.length,
    imageCount: imageIds.length,
    source: placeholders.source,
  };
}

/** Replace tenant media with fresh template placeholders (existing salons only). */
export async function reseedTenantMedia(
  db: Db,
  salonId: string,
  template: BusinessTemplate
): Promise<{
  heroImageUrl: string;
  serviceCount: number;
  imageCount: number;
  source: "unsplash" | "curated";
}> {
  const scope = tenantQuery(salonId);
  const now = new Date();

  await db.collection(Collections.SERVICIOS).deleteMany(scope);
  await db.collection(Collections.IMAGENES).deleteMany(scope);

  const pack = await resolvePlaceholderPack(template);
  return seedTenantMedia(db, salonId, template, pack, now);
}
