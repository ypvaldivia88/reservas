import { adminHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";
import { activationCertificateService } from "@/lib/services/activation-certificate.service";
import { platformAuditService } from "@/lib/services/platform-audit.service";

export const POST = adminHandler(async ({ salonId, session, request }) => {
  const { code } = await request.json();
  if (!code || typeof code !== "string") {
    throw new AppError("El código de activación es requerido", 400);
  }

  const result = await activationCertificateService.redeem(
    salonId,
    code,
    session!.userId
  );

  await platformAuditService.log({
    action: "certificate_redeemed",
    actorUserId: session!.userId,
    actorRole: session!.role,
    salonId,
    metadata: { periodoFin: result.periodoFin, ciclo: result.ciclo },
  });

  return ok(
    {
      periodoFin: result.periodoFin,
      ciclo: result.ciclo,
    },
    { message: "Suscripción activada correctamente" }
  );
});
