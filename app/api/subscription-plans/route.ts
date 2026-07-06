import { publicHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { SubscriptionPlan } from "@/lib/types";
import { normalizeSubscriptionPlan } from "@/lib/subscription";

export const GET = publicHandler(async () => {
  const db = await getDb();
  const plans = await db
    .collection<SubscriptionPlan>(Collections.SUBSCRIPTION_PLANS)
    .find({ activo: true })
    .sort({ orden: 1 })
    .toArray();

  return ok(
    plans.map((p) => ({
      ...normalizeSubscriptionPlan({ ...p, _id: p._id?.toString() }),
      _id: p._id?.toString(),
    }))
  );
});
