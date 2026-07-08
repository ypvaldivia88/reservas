import { publicHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { reservaService } from "@/lib/services/reserva.service";
import { AppError } from "@/lib/api/errors";

export const POST = publicHandler(async ({ salonId, params, request }) => {
  const body = await request.json();
  const telefono = body.telefono as string | undefined;
  const motivo = body.motivo as string | undefined;

  if (!telefono?.trim()) {
    throw new AppError("Teléfono es requerido para cancelar", 400);
  }

  const result = await reservaService.cancelByClient(
    salonId,
    params.id,
    telefono.trim(),
    motivo?.trim()
  );

  return ok(result, { message: "Reserva cancelada exitosamente" });
});
