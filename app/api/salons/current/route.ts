import { adminHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { Salon, SalonCmsUpdateRequest } from "@/lib/types";
import { DEFAULT_SALON_ID } from "@/lib/tenant";
import { salonCmsService } from "@/lib/services/salon-cms.service";

export const GET = adminHandler(async ({ salonId }) => {
  const profile = await salonCmsService.getPublicBySalonId(salonId);
  const db = await getDb();
  let salon = (await db
    .collection<Salon>(Collections.SALONS)
    .findOne({ salonId })) as Salon | null;

  if (!salon) {
    salon = {
      salonId: DEFAULT_SALON_ID,
      slug: "oh-diosa",
      nombre: "Oh`Diosa",
      status: "active",
    };
  }

  return ok({ ...salon, _id: salon._id?.toString(), cms: profile });
});

export const PATCH = adminHandler(async ({ salonId, request }) => {
  const body = (await request.json()) as SalonCmsUpdateRequest & {
    applyTemplate?: boolean;
    resetContent?: boolean;
  };

  if (body.applyTemplate && body.businessTemplate) {
    const profile = await salonCmsService.applyTemplate(
      salonId,
      body.businessTemplate,
      body.resetContent ?? false
    );
    return ok(profile);
  }

  const profile = await salonCmsService.updateCms(salonId, body);
  return ok(profile);
});
