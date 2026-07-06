import { publicHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { salonService } from "@/lib/services/salon.service";

export const GET = publicHandler(async ({ request }) => {
  const slug = request.nextUrl.searchParams.get("slug") || "";
  const available = await salonService.isSlugAvailable(slug);
  const normalized = salonService.normalizeSlug(slug);

  return ok({
    slug: normalized,
    available,
    suggestion: available ? normalized : `${normalized}-${Date.now().toString(36).slice(-4)}`,
  });
});
