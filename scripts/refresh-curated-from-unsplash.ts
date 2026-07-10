/**
 * Fetch fresh Unsplash CDN URLs per template slot (requires UNSPLASH_ACCESS_KEY).
 * Prints a JSON patch you can merge into lib/placeholder-config.ts curatedUrl fields.
 *
 * Usage: npx tsx scripts/refresh-curated-from-unsplash.ts [template]
 */
import "./load-env";
import { TEMPLATE_PLACEHOLDERS } from "../lib/placeholder-config";
import { BusinessTemplate } from "../lib/types";
import { hasUnsplashAccessKey, searchUnsplashPhoto } from "../lib/unsplash";

async function main() {
  if (!hasUnsplashAccessKey()) {
    console.error("Set UNSPLASH_ACCESS_KEY in .env.local (https://unsplash.com/developers)");
    process.exit(1);
  }

  const filter = process.argv[2] as BusinessTemplate | undefined;
  const templates = filter
    ? [filter]
    : (Object.keys(TEMPLATE_PLACEHOLDERS) as BusinessTemplate[]);

  const patch: Record<string, Record<string, string>> = {};

  for (const template of templates) {
    const pack = TEMPLATE_PLACEHOLDERS[template];
    patch[template] = {};

    const hero = await searchUnsplashPhoto(pack.hero.query, {
      page: 1,
      width: 1400,
      height: 800,
      orientation: "landscape",
    });
    if (hero) patch[template].hero = hero;

    for (const [index, slot] of pack.services.entries()) {
      const url = await searchUnsplashPhoto(slot.query, {
        page: index + 1,
        width: 900,
        height: 900,
        orientation: "squarish",
      });
      if (url) patch[template][slot.id] = url;
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(JSON.stringify(patch, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
