/**
 * Reseed placeholder services and images for an existing tenant.
 * Usage: npx tsx scripts/reseed-tenant-content.ts <slug>
 */
import { getDb } from "../lib/mongodb";
import { salonRepository } from "../lib/repositories/salon.repository";
import { reseedTenantMedia } from "../lib/services/tenant-seed.service";
import { getTenantPlaceholders } from "../lib/tenant-placeholders";
import { BusinessTemplate } from "../lib/types";

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npx tsx scripts/reseed-tenant-content.ts <slug>");
    process.exit(1);
  }

  const salon = await salonRepository.findBySlug(slug);
  if (!salon) {
    console.error(`Salon not found for slug: ${slug}`);
    process.exit(1);
  }

  const template = (salon.businessTemplate || "generic") as BusinessTemplate;
  const db = await getDb();
  const placeholders = getTenantPlaceholders(template);

  const result = await reseedTenantMedia(db, salon.salonId, template);

  await salonRepository.updateBySalonId(salon.salonId, {
    branding: {
      ...salon.branding,
      heroImageUrl: placeholders.heroImageUrl,
      logoUrl: undefined,
      logoSmallUrl: undefined,
    },
    fechaActualizacion: new Date(),
  });

  console.log(
    `Reseeded ${slug} (${salon.salonId}): ${result.serviceCount} services, ${result.imageCount} images`
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
