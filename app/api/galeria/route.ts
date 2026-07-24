import { ObjectId } from "mongodb";
import { GaleriaItem } from "@/lib/types";
import { getDatabase } from "@/lib/mongodb";
import { withTenantScope } from "@/lib/tenant";
import { adminHandler, publicOrSalonAdminHandler } from "@/lib/api/handlers";
import { ok, created } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";
import { assertImagenBelongsToTenant } from "@/lib/image-ownership";

function mapGaleriaItem(item: Record<string, unknown>): GaleriaItem {
  return {
    _id: (item._id as ObjectId).toString(),
    titulo: item.titulo as string,
    descripcion: item.descripcion as string,
    imagenId: item.imagenId as string,
    categoriaId: item.categoriaId as string,
    servicioId: item.servicioId as string,
    destacado: item.destacado as boolean,
    orden: item.orden as number,
    fechaCreacion: item.fechaCreacion as Date,
    fechaActualizacion: item.fechaActualizacion as Date,
  };
}

export const GET = publicOrSalonAdminHandler(async ({ salonId }) => {
  const db = await getDatabase();
  const galeria = await db
    .collection("galeria")
    .find(withTenantScope({}, salonId))
    .sort({ orden: 1, fechaCreacion: -1 })
    .toArray();

  return ok(galeria.map(mapGaleriaItem));
});

export const POST = adminHandler(async ({ salonId, request }) => {
  const body = await request.json();
  const { titulo, descripcion, imagenId, categoriaId, servicioId, destacado, orden } =
    body;

  if (!titulo || !imagenId) {
    throw new AppError("Faltan campos requeridos: titulo, imagenId", 400);
  }

  await assertImagenBelongsToTenant(salonId, imagenId);

  const db = await getDatabase();
  const now = new Date();

  const nuevoItem = {
    salonId,
    titulo,
    descripcion: descripcion || "",
    imagenId,
    categoriaId: categoriaId || null,
    servicioId: servicioId || null,
    destacado: destacado !== undefined ? destacado : false,
    orden: orden || 0,
    fechaCreacion: now,
    fechaActualizacion: now,
  };

  const result = await db.collection("galeria").insertOne(nuevoItem);

  return created(
    {
      _id: result.insertedId.toString(),
      ...nuevoItem,
    } as GaleriaItem,
    "Item de galería creado exitosamente"
  );
});

export const PATCH = adminHandler(async ({ salonId, request }) => {
  const body = await request.json();
  const {
    _id,
    titulo,
    descripcion,
    imagenId,
    categoriaId,
    servicioId,
    destacado,
    orden,
  } = body;

  if (!_id) {
    throw new AppError("ID es requerido", 400);
  }

  const db = await getDatabase();
  const updateData: Partial<GaleriaItem> = {
    fechaActualizacion: new Date(),
  };

  if (titulo) updateData.titulo = titulo;
  if (descripcion !== undefined) updateData.descripcion = descripcion;
  if (imagenId !== undefined) {
    await assertImagenBelongsToTenant(salonId, imagenId);
    updateData.imagenId = imagenId;
  }
  if (categoriaId !== undefined) updateData.categoriaId = categoriaId;
  if (servicioId !== undefined) updateData.servicioId = servicioId;
  if (destacado !== undefined) updateData.destacado = destacado;
  if (orden !== undefined) updateData.orden = orden;

  const result = await db
    .collection("galeria")
    .updateOne(
      withTenantScope({ _id: new ObjectId(_id) }, salonId),
      { $set: updateData }
    );

  if (result.matchedCount === 0) {
    throw AppError.notFound("Item de galería no encontrado");
  }

  return ok(undefined, { message: "Item de galería actualizado exitosamente" });
});

export const DELETE = adminHandler(async ({ salonId, request }) => {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    throw new AppError("ID es requerido", 400);
  }

  const db = await getDatabase();
  const result = await db
    .collection("galeria")
    .deleteOne(withTenantScope({ _id: new ObjectId(id) }, salonId));

  if (result.deletedCount === 0) {
    throw AppError.notFound("Item de galería no encontrado");
  }

  return ok(undefined, { message: "Item de galería eliminado exitosamente" });
});
