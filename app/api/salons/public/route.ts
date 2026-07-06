import { publicHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";
import { salonCmsService } from "@/lib/services/salon-cms.service";

export const GET = publicHandler(async ({ request }) => {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    throw new AppError("El parámetro slug es requerido", 400);
  }

  const profile = await salonCmsService.getPublicBySlug(slug);
  return ok(profile);
});
