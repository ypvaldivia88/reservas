import { adminHandler } from "@/lib/api/handlers";
import { ok, created } from "@/lib/api/responses";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { tenantQuery } from "@/lib/tenant";
import {
  FinancialTransaction,
  FinancialCategory,
  PaymentMethod,
} from "@/lib/types";
import { ObjectId } from "mongodb";
import { AppError } from "@/lib/api/errors";
import {
  getMonedaForPaymentMethod,
  isPaymentMethod,
} from "@/lib/paymentMethods";
import { resolveManualCobroBreakdown } from "@/lib/finances";

export const GET = adminHandler(async ({ salonId, request }) => {
  const tipo = request.nextUrl.searchParams.get("tipo");
  const desde = request.nextUrl.searchParams.get("desde");
  const hasta = request.nextUrl.searchParams.get("hasta");
  const metodoPago = request.nextUrl.searchParams.get("metodoPago");

  const filter: Record<string, unknown> = { ...tenantQuery(salonId) };
  if (tipo) filter.tipo = tipo;
  if (metodoPago && isPaymentMethod(metodoPago)) {
    filter.metodoPago = metodoPago;
  }
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
  const {
    tipo,
    fecha,
    descripcion,
    categoriaId,
    cobroEfectivo,
    cobroTransferencia,
    monto,
    metodoPago,
  } = body;

  if (!tipo || !["income", "expense"].includes(tipo)) {
    throw new AppError("tipo debe ser income o expense", 400);
  }
  if (!fecha || !descripcion) {
    throw new AppError("fecha y descripcion son requeridos", 400);
  }

  const hasSplitCobro =
    cobroEfectivo !== undefined || cobroTransferencia !== undefined;

  let breakdown = hasSplitCobro
    ? resolveManualCobroBreakdown({
        cobroEfectivo:
          cobroEfectivo !== undefined ? Number(cobroEfectivo) : undefined,
        cobroTransferencia:
          cobroTransferencia !== undefined
            ? Number(cobroTransferencia)
            : undefined,
      })
    : [];

  if (!hasSplitCobro) {
    if (!monto || Number(monto) <= 0) {
      throw new AppError("monto debe ser mayor a 0", 400);
    }
    if (!metodoPago || !isPaymentMethod(metodoPago)) {
      throw new AppError(
        "metodoPago debe ser transferencia o efectivo",
        400
      );
    }
    breakdown = [
      { metodo: metodoPago as PaymentMethod, monto: Number(monto) },
    ];
  }

  if (breakdown.length === 0) {
    throw new AppError(
      "Indica el monto en efectivo y/o transferencia",
      400
    );
  }

  const db = await getDb();
  let categoriaNombre: string | undefined;
  if (categoriaId) {
    const cat = (await db
      .collection(Collections.FINANCIAL_CATEGORIES)
      .findOne({ _id: new ObjectId(categoriaId) })) as FinancialCategory | null;
    categoriaNombre = cat?.nombre;
  }

  const baseTransaction = {
    salonId,
    tipo,
    categoriaId,
    categoriaNombre,
    fecha,
    descripcion: descripcion.trim(),
    fuente: "manual" as const,
    fechaCreacion: new Date(),
  };

  const createdTransactions: FinancialTransaction[] = [];

  for (const item of breakdown) {
    const metodo = item.metodo as PaymentMethod;
    const transaction: Omit<FinancialTransaction, "_id"> = {
      ...baseTransaction,
      monto: item.monto,
      moneda: getMonedaForPaymentMethod(metodo),
      metodoPago: metodo,
    };

    const result = await db
      .collection(Collections.FINANCIAL_TRANSACTIONS)
      .insertOne(transaction);

    createdTransactions.push({
      _id: result.insertedId.toString(),
      ...transaction,
    });
  }

  return created(
    createdTransactions.length === 1
      ? createdTransactions[0]
      : createdTransactions,
    createdTransactions.length > 1
      ? "Transacciones registradas"
      : "Transacción registrada"
  );
});
