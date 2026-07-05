import { adminHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { Salon } from "@/lib/types";
import { DEFAULT_SALON_ID } from "@/lib/tenant";

export const GET = adminHandler(async ({ salonId }) => {
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

  return ok({ ...salon, _id: salon._id?.toString() });
});
