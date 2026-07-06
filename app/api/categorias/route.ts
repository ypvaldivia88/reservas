import { adminHandler, publicHandler } from "@/lib/api/handlers";
import { ok, created } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";
import { categoriaService } from "@/lib/services/catalog.service";

export const revalidate = 60;

export const GET = publicHandler(async ({ salonId }) => {
  const data = await categoriaService.list(salonId);
  return ok(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
});

export const POST = adminHandler(async ({ salonId, request }) => {
  const body = await request.json();
  const data = await categoriaService.create(salonId, body);
  return created(data, "Categoría creada exitosamente");
});

export const PATCH = adminHandler(async ({ salonId, request }) => {
  const body = await request.json();
  await categoriaService.update(salonId, body);
  return ok(undefined, { message: "Categoría actualizada exitosamente" });
});

export const DELETE = adminHandler(async ({ salonId, request }) => {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) throw new AppError("ID es requerido", 400);
  await categoriaService.delete(salonId, id);
  return ok(undefined, { message: "Categoría eliminada exitosamente" });
});
