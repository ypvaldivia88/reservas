/**
 * Reseed placeholder services and images for an existing tenant.
 * Usage: npx tsx scripts/reseed-tenant-content.ts <slug> [slug2 ...]
 */
import "./load-env";
import { getDb } from "../lib/mongodb";
import { salonRepository } from "../lib/repositories/salon.repository";
import { reseedTenantMedia } from "../lib/services/tenant-seed.service";
import { BusinessTemplate } from "../lib/types";

async function reseedSlug(slug: string) {
  const salon = await salonRepository.findBySlug(slug);
  if (!salon) {
    console.error(`Salon not found for slug: ${slug}`);
    return false;
  }

  const template = (salon.businessTemplate || "generic") as BusinessTemplate;
  const db = await getDb();

  const result = await reseedTenantMedia(db, salon.salonId, template);

  await salonRepository.updateBySalonId(salon.salonId, {
    branding: {
      ...salon.branding,
      heroImageUrl: result.heroImageUrl,
      logoUrl: undefined,
      logoSmallUrl: undefined,
    },
    fechaActualizacion: new Date(),
  });

  console.log(
    `Reseeded ${slug} (${salon.salonId}): ${result.serviceCount} services, ${result.imageCount} images [${result.source}]`
  );
  return true;
}

async function main() {
  const slugs = process.argv.slice(2);
  if (slugs.length === 0) {
    console.error("Usage: npx tsx scripts/reseed-tenant-content.ts <slug> [slug2 ...]");
    process.exit(1);
  }

  let ok = 0;
  for (const slug of slugs) {
    if (await reseedSlug(slug)) ok += 1;
  }

  if (ok !== slugs.length) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
