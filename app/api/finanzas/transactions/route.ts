import { adminHandler } from "@/lib/api/handlers";
import { ok, created } from "@/lib/api/responses";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { tenantQuery } from "@/lib/tenant";
import {
  FinancialTransaction,
  FinancialCategory,
} from "@/lib/types";
import { ObjectId } from "mongodb";
import { AppError } from "@/lib/api/errors";

export const GET = adminHandler(async ({ salonId, request }) => {
  const tipo = request.nextUrl.searchParams.get("tipo");
  const desde = request.nextUrl.searchParams.get("desde");
  const hasta = request.nextUrl.searchParams.get("hasta");

  const filter: Record<string, unknown> = { ...tenantQuery(salonId) };
  if (tipo) filter.tipo = tipo;
  if (desde || hasta) {
    filter.fecha = {};
    if (desde) (filter.fecha as Record<string, string>).$gte = desde;
    if (hasta) (filter.fecha as Record<string, string>).$lte = hasta;
  }

  const db = await getDb();
  const transactions = await db
    .collection<FinancialTransaction>(Collections.FINANCIAL_TRANSACTIONS)
    .find(filter)
    .sort({ fecha: -1, fechaCreacion: -1 })
    .toArray();

  return ok(transactions.map((t) => ({ ...t, _id: t._id?.toString() })));
});

export const POST = adminHandler(async ({ salonId, request }) => {
  const body = await request.json();
  const { tipo, monto, fecha, descripcion, categoriaId } = body;

  if (!tipo || !["income", "expense"].includes(tipo)) {
    throw new AppError("tipo debe ser income o expense", 400);
  }
  if (!monto || monto <= 0) {
    throw new AppError("monto debe ser mayor a 0", 400);
  }
  if (!fecha || !descripcion) {
    throw new AppError("fecha y descripcion son requeridos", 400);
  }

  const db = await getDb();
  let categoriaNombre: string | undefined;
  if (categoriaId) {
    const cat = (await db
      .collection(Collections.FINANCIAL_CATEGORIES)
      .findOne({ _id: new ObjectId(categoriaId) })) as FinancialCategory | null;
    categoriaNombre = cat?.nombre;
  }

  const transaction: Omit<FinancialTransaction, "_id"> = {
    salonId,
    tipo,
    categoriaId,
    categoriaNombre,
    monto: Number(monto),
    moneda: "USD",
    fecha,
    descripcion: descripcion.trim(),
    fuente: "manual",
    fechaCreacion: new Date(),
  };

  const result = await db
    .collection(Collections.FINANCIAL_TRANSACTIONS)
    .insertOne(transaction);

  return created(
    { _id: result.insertedId.toString(), ...transaction },
    "Transacción registrada"
  );
});
