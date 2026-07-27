import { platformHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";
import { activationCertificateService } from "@/lib/services/activation-certificate.service";
import { platformAuditService } from "@/lib/services/platform-audit.service";

export const PATCH = platformHandler(async ({ session, params, request }) => {
  const certificateId = params.id;
  if (!certificateId) throw new AppError("ID de certificado requerido", 400);

  const { action } = await request.json();
  if (action !== "revoke") {
    throw new AppError("action debe ser revoke", 400);
  }

  await activationCertificateService.revoke(certificateId);

  await platformAuditService.log({
    action: "certificate_revoked",
    actorUserId: session!.userId,
    actorRole: session!.role,
    targetId: certificateId,
  });

  return ok(undefined, { message: "Certificado revocado" });
});
