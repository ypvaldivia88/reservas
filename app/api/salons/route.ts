import { platformHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { salonService } from "@/lib/services/salon.service";

export const dynamic = "force-dynamic";

export const GET = platformHandler(async () => {
  const salons = await salonService.listWithSubscriptions();
  return ok(salons);
});
