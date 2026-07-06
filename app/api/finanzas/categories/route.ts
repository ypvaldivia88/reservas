import { adminHandler } from "@/lib/api/handlers";
import { ok, created } from "@/lib/api/responses";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { tenantQuery } from "@/lib/tenant";
import { FinancialCategory } from "@/lib/types";
import { AppError } from "@/lib/api/errors";

export const GET = adminHandler(async ({ salonId }) => {
  const db = await getDb();
  const categories = await db
    .collection<FinancialCategory>(Collections.FINANCIAL_CATEGORIES)
    .find({ ...tenantQuery(salonId), activo: true })
    .sort({ tipo: 1, nombre: 1 })
    .toArray();

  return ok(categories.map((c) => ({ ...c, _id: c._id?.toString() })));
});

export const POST = adminHandler(async ({ salonId, request }) => {
  const { nombre, tipo, color } = await request.json();
  if (!nombre || !["income", "expense"].includes(tipo)) {
    throw new AppError("nombre y tipo son requeridos", 400);
  }

  const db = await getDb();
  const category: Omit<FinancialCategory, "_id"> = {
    salonId,
    nombre: nombre.trim(),
    tipo,
    color: color || "#6b7280",
    activo: true,
    fechaCreacion: new Date(),
  };

  const result = await db
    .collection(Collections.FINANCIAL_CATEGORIES)
    .insertOne(category);

  return created({ _id: result.insertedId.toString(), ...category });
});
