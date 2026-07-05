import { adminHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { clienteDetailService } from "@/lib/services/cliente.service";

export const GET = adminHandler(async ({ salonId, params }) => {
  const data = await clienteDetailService.getById(salonId, params.id);
  return ok(data, { message: "Cliente obtenido exitosamente" });
});

export const PATCH = adminHandler(async ({ salonId, params, request }) => {
  const data = await request.json();
  await clienteDetailService.update(salonId, params.id, data);
  return ok(undefined, { message: "Cliente actualizado exitosamente" });
});

export const DELETE = adminHandler(async ({ salonId, params }) => {
  await clienteDetailService.delete(salonId, params.id);
  return ok(undefined, { message: "Cliente eliminado exitosamente" });
});
