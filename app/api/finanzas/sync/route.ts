import { adminHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { getDb } from "@/lib/mongodb";
import { prepareFinancesForSalon } from "@/lib/finances";

export const POST = adminHandler(async ({ salonId }) => {
  const db = await getDb();
  await prepareFinancesForSalon(db, salonId);
  return ok(undefined, { message: "Finanzas sincronizadas" });
});
