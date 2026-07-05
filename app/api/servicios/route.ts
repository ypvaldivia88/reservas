import { adminHandler, publicHandler } from "@/lib/api/handlers";
import { ok, created } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";
import { servicioService } from "@/lib/services/catalog.service";

export const GET = publicHandler(async ({ salonId }) => {
  const data = await servicioService.list(salonId);
  return ok(data);
});

export const POST = adminHandler(async ({ salonId, request }) => {
  const body = await request.json();
  const data = await servicioService.create(salonId, body);
  return created(data, "Servicio creado exitosamente");
});

export const PATCH = adminHandler(async ({ salonId, request }) => {
  const body = await request.json();
  await servicioService.update(salonId, body);
  return ok(undefined, { message: "Servicio actualizado exitosamente" });
});

export const DELETE = adminHandler(async ({ salonId, request }) => {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) throw new AppError("ID es requerido", 400);
  await servicioService.delete(salonId, id);
  return ok(undefined, { message: "Servicio eliminado exitosamente" });
});
