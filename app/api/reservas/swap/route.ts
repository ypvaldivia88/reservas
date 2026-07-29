import { adminHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";
import { reservaService } from "@/lib/services/reserva.service";

export const POST = adminHandler(async ({ salonId, request }) => {
  const data = await request.json();
  const reservaIdA = data.reservaIdA;
  const reservaIdB = data.reservaIdB;

  if (!reservaIdA || !reservaIdB) {
    throw new AppError("Se requieren reservaIdA y reservaIdB", 400);
  }

  if (typeof reservaIdA !== "string" || typeof reservaIdB !== "string") {
    throw new AppError("IDs de reserva inválidos", 400);
  }

  await reservaService.swap(salonId, reservaIdA, reservaIdB);
  return ok(undefined, { message: "Horarios intercambiados exitosamente" });
});
