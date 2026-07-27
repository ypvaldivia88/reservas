import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { platformHandler } from "@/lib/api/handlers";
import { ok, created } from "@/lib/api/responses";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { AppError } from "@/lib/api/errors";
import { SubscriptionPlan } from "@/lib/types";
import { DEFAULT_PLANS } from "@/lib/subscription";

export const GET = platformHandler(async () => {
  const db = await getDb();
  const plans = await db
    .collection<SubscriptionPlan>(Collections.SUBSCRIPTION_PLANS)
    .find({})
    .sort({ orden: 1 })
    .toArray();

  return ok(
    plans.map((p) => ({ ...p, _id: p._id?.toString() }))
  );
});

export const POST = platformHandler(async ({ request }) => {
  const body = await request.json();
  if (!body.nombre?.trim()) {
    throw new AppError("Nombre requerido", 400);
  }

  const db = await getDb();
  const plan: Omit<SubscriptionPlan, "_id"> = {
    nombre: body.nombre.trim(),
    descripcion: body.descripcion?.trim() ?? "",
    precioMensual: Number(body.precioMensual) || DEFAULT_PLANS[0].precioMensual,
    descuentoSemestralPorcentaje:
      Number(body.descuentoSemestralPorcentaje) ?? 10,
    descuentoAnualPorcentaje: Number(body.descuentoAnualPorcentaje) ?? 15,
    caracteristicas: Array.isArray(body.caracteristicas)
      ? body.caracteristicas
      : DEFAULT_PLANS[0].caracteristicas,
    activo: body.activo !== false,
    orden: Number(body.orden) || 99,
    fechaCreacion: new Date(),
  };

  const result = await db
    .collection(Collections.SUBSCRIPTION_PLANS)
    .insertOne(plan);

  return created({ ...plan, _id: result.insertedId.toString() });
});

export const PATCH = platformHandler(async ({ request }) => {
  const body = await request.json();
  if (!body._id || !ObjectId.isValid(body._id)) {
    throw new AppError("_id requerido", 400);
  }

  const updates: Partial<SubscriptionPlan> = {};
  if (body.nombre !== undefined) updates.nombre = body.nombre.trim();
  if (body.descripcion !== undefined) updates.descripcion = body.descripcion;
  if (body.precioMensual !== undefined) {
    updates.precioMensual = Number(body.precioMensual);
  }
  if (body.descuentoSemestralPorcentaje !== undefined) {
    updates.descuentoSemestralPorcentaje = Number(
      body.descuentoSemestralPorcentaje
    );
  }
  if (body.descuentoAnualPorcentaje !== undefined) {
    updates.descuentoAnualPorcentaje = Number(body.descuentoAnualPorcentaje);
  }
  if (body.activo !== undefined) updates.activo = Boolean(body.activo);
  if (body.caracteristicas !== undefined) {
    updates.caracteristicas = body.caracteristicas;
  }

  const db = await getDb();
  await db
    .collection(Collections.SUBSCRIPTION_PLANS)
    .updateOne({ _id: new ObjectId(body._id) }, { $set: updates });

  return ok(undefined, { message: "Plan actualizado" });
});
