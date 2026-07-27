import { platformHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { platformService } from "@/lib/services/salon.service";
import { PaymentRequest } from "@/lib/types";
import { AppError } from "@/lib/api/errors";

export const GET = platformHandler(async ({ request }) => {
  const status = (request.nextUrl.searchParams.get("status") ||
    "pending") as PaymentRequest["status"];
  const payments = await platformService.listPayments(status);
  return ok(payments);
});

export const PATCH = platformHandler(async ({ session, request }) => {
  const { paymentId, action, notas } = await request.json();
  if (!paymentId || !["approve", "reject"].includes(action)) {
    throw new AppError("paymentId y action (approve/reject) requeridos", 400);
  }

  const result = await platformService.resolvePayment(
    paymentId,
    action,
    notas,
    session!.userId
  );

  return ok(result, { message: result.message });
});
