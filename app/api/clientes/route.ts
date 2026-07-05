import { adminHandler } from "@/lib/api/handlers";
import { ok, created } from "@/lib/api/responses";
import { clienteService } from "@/lib/services/reserva.service";

export const GET = adminHandler(async ({ salonId }) => {
  const data = await clienteService.list(salonId);
  return ok(data, { message: "Clientes obtenidos exitosamente" });
});

export const POST = adminHandler(async ({ salonId, request }) => {
  const data = await request.json();
  const result = await clienteService.create(salonId, data);
  return created(result, "Cliente creado exitosamente");
});
