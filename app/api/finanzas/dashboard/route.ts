import { adminHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { tenantQuery } from "@/lib/tenant";
import {
  buildFinancialTransactionFilter,
  ensureFinancialQueryIndexes,
  generateFinancialReport,
} from "@/lib/finances";
import {
  FinancialCategory,
  FinancialTransaction,
  TransactionType,
} from "@/lib/types";
import { isPaymentMethod } from "@/lib/paymentMethods";

const TRANSACTION_FIELDS = {
  _id: 1,
  tipo: 1,
  monto: 1,
  moneda: 1,
  metodoPago: 1,
  fecha: 1,
  descripcion: 1,
  categoriaId: 1,
  categoriaNombre: 1,
  fuente: 1,
  fechaCreacion: 1,
} as const;

const CATEGORY_FIELDS = {
  _id: 1,
  nombre: 1,
  tipo: 1,
  color: 1,
  activo: 1,
  servicioId: 1,
} as const;

export const GET = adminHandler(async ({ salonId, request }) => {
  const tipo = request.nextUrl.searchParams.get("tipo");
  const desde =
    request.nextUrl.searchParams.get("desde") ||
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0];
  const hasta =
    request.nextUrl.searchParams.get("hasta") ||
    new Date().toISOString().split("T")[0];
  const metodoPago = request.nextUrl.searchParams.get("metodoPago");

  const reportFilters = {
    ...(tipo === "income" || tipo === "expense"
      ? { tipo: tipo as TransactionType }
      : {}),
    ...(metodoPago && isPaymentMethod(metodoPago) ? { metodoPago } : {}),
  };

  const filter = buildFinancialTransactionFilter(
    salonId,
    desde,
    hasta,
    reportFilters
  );

  const db = await getDb();
  await ensureFinancialQueryIndexes(db);

  const [transactions, categories, report] = await Promise.all([
    db
      .collection<FinancialTransaction>(Collections.FINANCIAL_TRANSACTIONS)
      .find(filter)
      .project(TRANSACTION_FIELDS)
      .sort({ fecha: -1, fechaCreacion: -1 })
      .toArray(),
    db
      .collection<FinancialCategory>(Collections.FINANCIAL_CATEGORIES)
      .find({ ...tenantQuery(salonId), activo: true })
      .project(CATEGORY_FIELDS)
      .sort({ tipo: 1, nombre: 1 })
      .toArray(),
    generateFinancialReport(db, salonId, desde, hasta, reportFilters),
  ]);

  return ok({
    transactions: transactions.map((t) => ({ ...t, _id: t._id?.toString() })),
    categories: categories.map((c) => ({ ...c, _id: c._id?.toString() })),
    report,
  });
});
