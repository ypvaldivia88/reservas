import { platformHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { platformService } from "@/lib/services/salon.service";

export const GET = platformHandler(async () => {
  const data = await platformService.getDashboardSummary();
  return ok(data);
});
