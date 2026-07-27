import { platformHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";
import { platformService } from "@/lib/services/salon.service";
import { activationCertificateService } from "@/lib/services/activation-certificate.service";

export const GET = platformHandler(async ({ params }) => {
  const salonId = params.id;
  if (!salonId) throw new AppError("ID de salón requerido", 400);
  const detail = await platformService.getSalonDetail(salonId);
  return ok(detail);
});

export const PATCH = platformHandler(async ({ session, params, request }) => {
  const salonId = params.id;
  if (!salonId) throw new AppError("ID de salón requerido", 400);

  const body = await request.json();

  if (body.status) {
    if (!["active", "suspended", "inactive"].includes(body.status)) {
      throw new AppError("Estado inválido", 400);
    }
    const salon = await platformService.updateSalonStatus(
      salonId,
      body.status,
      session!.userId
    );
    return ok(salon, { message: "Estado del salón actualizado" });
  }

  if (body.extendTrialDays) {
    const result = await platformService.extendTrial(
      salonId,
      Number(body.extendTrialDays),
      session!.userId
    );
    return ok(result, { message: "Periodo de prueba extendido" });
  }

  throw new AppError("No se proporcionó una acción válida", 400);
});

export const DELETE = platformHandler(async ({ session, params, request }) => {
  const salonId = params.id;
  if (!salonId) throw new AppError("ID de salón requerido", 400);

  const { confirmSlug } = await request.json();
  if (!confirmSlug) {
    throw new AppError("confirmSlug es requerido", 400);
  }

  const result = await platformService.deleteSalonCascade(
    salonId,
    confirmSlug,
    session!.userId
  );

  return ok(result, { message: "Salón eliminado permanentemente" });
});
