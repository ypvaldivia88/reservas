import { platformHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { platformService } from "@/lib/services/salon.service";

export const dynamic = "force-dynamic";

export const GET = platformHandler(async () => {
  const trials = await platformService.listTrials();
  const summary = {
    total: trials.length,
    active: trials.filter((t) => t.trialRemaining.phase === "active").length,
    expiringSoon: trials.filter((t) => t.trialRemaining.phase === "expiring_soon")
      .length,
    expired: trials.filter((t) => t.trialRemaining.expired).length,
    withPendingPayment: trials.filter((t) => t.pendingPayments > 0).length,
  };

  return ok({ trials, summary });
});
