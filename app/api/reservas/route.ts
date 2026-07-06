import { adminHandler, publicHandler } from "@/lib/api/handlers";
import { ok, created } from "@/lib/api/responses";
import { reservaService } from "@/lib/services/reserva.service";

export const GET = adminHandler(async ({ salonId }) => {
  const data = await reservaService.list(salonId);
  return ok(data, { message: "Reservas obtenidas exitosamente" });
});

export const POST = publicHandler(async ({ salonId, request }) => {
  const data = await request.json();
  const result = await reservaService.create(salonId, data);
  return created(result, "Reserva creada exitosamente");
});
