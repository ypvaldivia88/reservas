import { adminHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { tenantQuery } from "@/lib/tenant";
import { generateFinancialReport, ensureExpenseCategories } from "@/lib/finances";
import {
  FinancialCategory,
  FinancialTransaction,
  TransactionType,
} from "@/lib/types";
import { isPaymentMethod } from "@/lib/paymentMethods";

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

  const filter: Record<string, unknown> = { ...tenantQuery(salonId) };
  if (tipo && (tipo === "income" || tipo === "expense")) {
    filter.tipo = tipo as TransactionType;
  }
  if (metodoPago && isPaymentMethod(metodoPago)) {
    filter.metodoPago = metodoPago;
  }
  filter.fecha = { $gte: desde, $lte: hasta };

  const db = await getDb();
  await ensureExpenseCategories(db, salonId);

  const [transactions, categories, report] = await Promise.all([
    db
      .collection<FinancialTransaction>(Collections.FINANCIAL_TRANSACTIONS)
      .find(filter)
      .sort({ fecha: -1, fechaCreacion: -1 })
      .toArray(),
    db
      .collection<FinancialCategory>(Collections.FINANCIAL_CATEGORIES)
      .find({ ...tenantQuery(salonId), activo: true })
      .sort({ tipo: 1, nombre: 1 })
      .toArray(),
    generateFinancialReport(db, salonId, desde, hasta),
  ]);

  return ok({
    transactions: transactions.map((t) => ({ ...t, _id: t._id?.toString() })),
    categories: categories.map((c) => ({ ...c, _id: c._id?.toString() })),
    report,
  });
});
