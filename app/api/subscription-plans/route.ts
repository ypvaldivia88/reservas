import { publicHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { SubscriptionPlan } from "@/lib/types";
import { DEFAULT_PLANS, normalizeSubscriptionPlan } from "@/lib/subscription";

/** Devuelve el plan único de la plataforma (precio mensual + descuentos 6m/anual). */
export const GET = publicHandler(async () => {
  const db = await getDb();
  const canonicalName = DEFAULT_PLANS[0].nombre;

  const plan = await db
    .collection<SubscriptionPlan>(Collections.SUBSCRIPTION_PLANS)
    .findOne({ activo: true, nombre: canonicalName }, { sort: { orden: 1 } });

  if (!plan) {
    return ok([
      normalizeSubscriptionPlan({
        ...DEFAULT_PLANS[0],
        _id: "default",
      }),
    ]);
  }

  return ok([
    normalizeSubscriptionPlan({ ...plan, _id: plan._id?.toString() }),
  ]);
});
