import { Db } from "mongodb";
import {
  FinancialReport,
  FinancialTransaction,
  PaymentMethod,
  TransactionType,
} from "@/lib/types";
import { tenantQuery, DEFAULT_SALON_ID } from "@/lib/tenant";
import { Collections } from "@/lib/db/collections";
import {
  getMonedaForPaymentMethod,
  isPaymentMethod,
  PAYMENT_METHOD_OPTIONS,
} from "@/lib/paymentMethods";

const INCOME_COLORS = [
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#8b5cf6",
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  { nombre: "Materiales", tipo: "expense" as TransactionType, color: "#ef4444" },
  { nombre: "Alquiler", tipo: "expense" as TransactionType, color: "#f97316" },
  { nombre: "Servicios públicos", tipo: "expense" as TransactionType, color: "#eab308" },
  { nombre: "Marketing", tipo: "expense" as TransactionType, color: "#8b5cf6" },
  { nombre: "Otros gastos", tipo: "expense" as TransactionType, color: "#6b7280" },
];

/** @deprecated Usar DEFAULT_EXPENSE_CATEGORIES para gastos; ingresos vienen de servicios */
export const DEFAULT_FINANCIAL_CATEGORIES = [
  { nombre: "Servicios de uñas", tipo: "income" as TransactionType, color: "#22c55e" },
  { nombre: "Propinas", tipo: "income" as TransactionType, color: "#10b981" },
  { nombre: "Otros ingresos", tipo: "income" as TransactionType, color: "#14b8a6" },
  ...DEFAULT_EXPENSE_CATEGORIES,
];

const syncInFlight = new Map<string, Promise<void>>();

export async function ensureReservaIncomeIndexes(db: Db): Promise<void> {
  const col = db.collection(Collections.FINANCIAL_TRANSACTIONS);
  const indexes = await col.indexes();
  const legacyIndex = indexes.find((idx) => idx.name === "uniq_reserva_income");

  if (legacyIndex && !Object.prototype.hasOwnProperty.call(legacyIndex.key, "metodoPago")) {
    await col.dropIndex("uniq_reserva_income");
  }

  await col.createIndex(
    { salonId: 1, reservaId: 1, metodoPago: 1 },
    {
      name: "uniq_reserva_income_by_method",
      unique: true,
      partialFilterExpression: {
        fuente: "reserva",
        reservaId: { $exists: true },
      },
    }
  );
}

function getPrimaryServicioId(reserva: {
  servicioIds?: string[];
  servicioId?: string;
}): string | undefined {
  if (reserva.servicioIds && reserva.servicioIds.length > 0) {
    return reserva.servicioIds[0];
  }
  return reserva.servicioId;
}

async function dedupeReservaIncomeTransactions(
  db: Db,
  salonId: string
): Promise<number> {
  const duplicateGroups = await db
    .collection(Collections.FINANCIAL_TRANSACTIONS)
    .aggregate<{
      _id: { reservaId: string; metodoKey: string };
      ids: { toString(): string }[];
    }>([
      {
        $match: {
          ...tenantQuery(salonId),
          fuente: "reserva",
          reservaId: { $exists: true, $ne: null },
        },
      },
      {
        $addFields: {
          metodoKey: { $ifNull: ["$metodoPago", "__sin_desglose__"] },
        },
      },
      {
        $group: {
          _id: { reservaId: "$reservaId", metodoKey: "$metodoKey" },
          count: { $sum: 1 },
          ids: { $push: "$_id" },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  let removed = 0;

  for (const group of duplicateGroups) {
    const metodoFilter =
      group._id.metodoKey === "__sin_desglose__"
        ? { metodoPago: { $exists: false } }
        : { metodoPago: group._id.metodoKey };

    const txs = await db
      .collection(Collections.FINANCIAL_TRANSACTIONS)
      .find({
        ...tenantQuery(salonId),
        fuente: "reserva",
        reservaId: group._id.reservaId,
        ...metodoFilter,
      })
      .sort({ fechaCreacion: -1 })
      .toArray();

    const [, ...toDelete] = txs;
    if (toDelete.length === 0) continue;

    await db.collection(Collections.FINANCIAL_TRANSACTIONS).deleteMany({
      _id: { $in: toDelete.map((tx) => tx._id) },
    });
    removed += toDelete.length;
  }

  return removed;
}

export async function dedupeAllReservaIncomeTransactions(
  db: Db
): Promise<number> {
  const rawIds = await db
    .collection(Collections.FINANCIAL_TRANSACTIONS)
    .distinct("salonId", {
      fuente: "reserva",
      reservaId: { $exists: true, $ne: null },
    });

  const salonIds = new Set<string>([DEFAULT_SALON_ID]);
  for (const id of rawIds) {
    if (id != null) salonIds.add(String(id));
  }

  let removed = 0;
  for (const salonId of salonIds) {
    removed += await dedupeReservaIncomeTransactions(db, salonId);
  }

  return removed;
}

async function upsertReservaIncomeTransaction(
  db: Db,
  salonId: string,
  reservaId: string,
  monto: number,
  descripcion: string,
  fecha: string,
  servicioId?: string,
  metodoPago?: PaymentMethod
): Promise<void> {
  const { categoriaId, categoriaNombre } = await resolveIncomeCategory(
    db,
    salonId,
    servicioId
  );

  const metodoFilter =
    metodoPago != null
      ? { metodoPago }
      : { metodoPago: { $exists: false } };

  await db.collection(Collections.FINANCIAL_TRANSACTIONS).findOneAndUpdate(
    {
      ...tenantQuery(salonId),
      reservaId,
      fuente: "reserva",
      ...metodoFilter,
    },
    {
      $set: {
        monto,
        descripcion,
        fecha,
        tipo: "income",
        moneda: getMonedaForPaymentMethod(metodoPago),
        ...(metodoPago ? { metodoPago } : {}),
        ...(categoriaId ? { categoriaId } : {}),
        ...(categoriaNombre ? { categoriaNombre } : {}),
      },
      $setOnInsert: {
        salonId,
        fuente: "reserva",
        reservaId,
        fechaCreacion: new Date(),
      },
    },
    { upsert: true }
  );
}

interface CobroBreakdownItem {
  metodo: PaymentMethod | null;
  monto: number;
}

function resolveCobroBreakdown(reserva: {
  costo: number;
  cobroEfectivo?: number;
  cobroTransferencia?: number;
  metodoPago?: unknown;
}): CobroBreakdownItem[] {
  const hasSplitCobro =
    reserva.cobroEfectivo !== undefined ||
    reserva.cobroTransferencia !== undefined;

  const items: CobroBreakdownItem[] = [];
  const efectivo = Number(reserva.cobroEfectivo ?? 0);
  const transferencia = Number(reserva.cobroTransferencia ?? 0);

  if (!isNaN(efectivo) && efectivo > 0) {
    items.push({ metodo: "efectivo_cup", monto: efectivo });
  }
  if (!isNaN(transferencia) && transferencia > 0) {
    items.push({ metodo: "transferencia", monto: transferencia });
  }

  if (items.length > 0) return items;
  if (hasSplitCobro) return [];

  if (isPaymentMethod(reserva.metodoPago)) {
    return [{ metodo: reserva.metodoPago, monto: reserva.costo }];
  }

  return [{ metodo: null, monto: reserva.costo }];
}

async function cleanupReservaIncomeTransactions(
  db: Db,
  salonId: string,
  reservaId: string,
  keepMethods: (PaymentMethod | null)[]
): Promise<void> {
  const txs = await db
    .collection(Collections.FINANCIAL_TRANSACTIONS)
    .find({
      ...tenantQuery(salonId),
      fuente: "reserva",
      reservaId,
    })
    .toArray();

  const keepKeys = new Set(
    keepMethods.map((m) => (m == null ? "__sin_desglose__" : m))
  );

  const toDelete = txs.filter((tx) => {
    const key =
      tx.metodoPago != null && isPaymentMethod(tx.metodoPago)
        ? tx.metodoPago
        : "__sin_desglose__";
    return !keepKeys.has(key);
  });

  if (toDelete.length > 0) {
    await db.collection(Collections.FINANCIAL_TRANSACTIONS).deleteMany({
      _id: { $in: toDelete.map((tx) => tx._id) },
    });
  }
}

async function syncReservaIncomeTransactions(
  db: Db,
  salonId: string,
  reservaId: string,
  costo: number,
  descripcion: string,
  fecha: string,
  servicioId?: string,
  cobroEfectivo?: number,
  cobroTransferencia?: number,
  legacyMetodoPago?: PaymentMethod
): Promise<void> {
  const breakdown = resolveCobroBreakdown({
    costo,
    cobroEfectivo,
    cobroTransferencia,
    metodoPago: legacyMetodoPago,
  });

  for (const item of breakdown) {
    await upsertReservaIncomeTransaction(
      db,
      salonId,
      reservaId,
      item.monto,
      descripcion,
      fecha,
      servicioId,
      item.metodo ?? undefined
    );
  }

  await cleanupReservaIncomeTransactions(
    db,
    salonId,
    reservaId,
    breakdown.map((item) => item.metodo)
  );
}

export async function ensureExpenseCategories(
  db: Db,
  salonId: string
): Promise<void> {
  const expenseCount = await db
    .collection(Collections.FINANCIAL_CATEGORIES)
    .countDocuments({ ...tenantQuery(salonId), tipo: "expense" });

  if (expenseCount > 0) return;

  await db.collection(Collections.FINANCIAL_CATEGORIES).insertMany(
    DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
      ...c,
      salonId,
      activo: true,
      fechaCreacion: new Date(),
    }))
  );
}

export async function syncIncomeCategoriesFromServicios(
  db: Db,
  salonId: string
): Promise<void> {
  const servicios = await db
    .collection(Collections.SERVICIOS)
    .find({ ...tenantQuery(salonId), activo: true })
    .sort({ orden: 1, fechaCreacion: 1 })
    .toArray();

  const activeServicioIds = servicios.map((s) => s._id.toString());

  await db.collection(Collections.FINANCIAL_CATEGORIES).updateMany(
    {
      ...tenantQuery(salonId),
      tipo: "income",
      servicioId: { $exists: false },
    },
    { $set: { activo: false } }
  );

  if (activeServicioIds.length > 0) {
    await db.collection(Collections.FINANCIAL_CATEGORIES).updateMany(
      {
        ...tenantQuery(salonId),
        tipo: "income",
        servicioId: { $nin: activeServicioIds },
      },
      { $set: { activo: false } }
    );
  }

  for (let i = 0; i < servicios.length; i++) {
    const servicio = servicios[i];
    const servicioId = servicio._id.toString();

    const existing = await db
      .collection(Collections.FINANCIAL_CATEGORIES)
      .findOne({ ...tenantQuery(salonId), servicioId });

    const categoryData = {
      nombre: servicio.nombre as string,
      tipo: "income" as TransactionType,
      activo: true,
      color: INCOME_COLORS[i % INCOME_COLORS.length],
    };

    if (existing) {
      await db
        .collection(Collections.FINANCIAL_CATEGORIES)
        .updateOne({ _id: existing._id }, { $set: categoryData });
    } else {
      await db.collection(Collections.FINANCIAL_CATEGORIES).insertOne({
        salonId,
        servicioId,
        ...categoryData,
        fechaCreacion: new Date(),
      });
    }
  }
}

async function resolveIncomeCategory(
  db: Db,
  salonId: string,
  servicioId?: string
): Promise<{ categoriaId?: string; categoriaNombre?: string }> {
  if (servicioId) {
    const byServicio = await db
      .collection(Collections.FINANCIAL_CATEGORIES)
      .findOne({
        ...tenantQuery(salonId),
        tipo: "income",
        servicioId,
        activo: true,
      });
    if (byServicio) {
      return {
        categoriaId: byServicio._id?.toString(),
        categoriaNombre: byServicio.nombre as string,
      };
    }
  }

  const fallback = await db
    .collection(Collections.FINANCIAL_CATEGORIES)
    .findOne({
      ...tenantQuery(salonId),
      tipo: "income",
      activo: true,
      servicioId: { $exists: true },
    });

  if (fallback) {
    return {
      categoriaId: fallback._id?.toString(),
      categoriaNombre: fallback.nombre as string,
    };
  }

  return {};
}

export async function syncIncomesFromReservas(
  db: Db,
  salonId: string
): Promise<void> {
  await dedupeReservaIncomeTransactions(db, salonId);

  const reservas = await db
    .collection(Collections.RESERVAS)
    .find({
      ...tenantQuery(salonId),
      estado: { $in: ["confirmada", "completada"] },
      costo: { $exists: true, $ne: null },
    })
    .toArray();

  if (reservas.length === 0) return;

  for (const reserva of reservas) {
    const costo = Number(reserva.costo);
    if (isNaN(costo) || costo < 0) continue;

    const reservaId = reserva._id.toString();
    const servicioId = getPrimaryServicioId({
      servicioIds: reserva.servicioIds as string[] | undefined,
      servicioId: reserva.servicioId as string | undefined,
    });
    const descripcion = `Reserva ${reserva.nombre} - ${reserva.fechaCita}`;
    const fecha = reserva.fechaCita as string;

    const metodoPago = isPaymentMethod(reserva.metodoPago)
      ? reserva.metodoPago
      : undefined;
    const usesCobroSplit =
      reserva.cobroEfectivo !== undefined ||
      reserva.cobroTransferencia !== undefined;

    await syncReservaIncomeTransactions(
      db,
      salonId,
      reservaId,
      costo,
      descripcion,
      fecha,
      servicioId,
      reserva.cobroEfectivo as number | undefined,
      reserva.cobroTransferencia as number | undefined,
      usesCobroSplit ? undefined : metodoPago
    );
  }
}

export async function prepareFinancesForSalon(
  db: Db,
  salonId: string
): Promise<void> {
  const inFlight = syncInFlight.get(salonId);
  if (inFlight) return inFlight;

  const work = (async () => {
    await ensureReservaIncomeIndexes(db);
    await ensureExpenseCategories(db, salonId);
    await syncIncomeCategoriesFromServicios(db, salonId);
    await syncIncomesFromReservas(db, salonId);
  })();

  syncInFlight.set(salonId, work);
  try {
    await work;
  } finally {
    syncInFlight.delete(salonId);
  }
}

export async function createIncomeFromReserva(
  db: Db,
  salonId: string,
  reservaId: string,
  monto: number,
  descripcion: string,
  fecha?: string,
  servicioId?: string,
  cobroEfectivo?: number,
  cobroTransferencia?: number,
  legacyMetodoPago?: PaymentMethod
): Promise<void> {
  const fechaTransaccion = fecha ?? new Date().toISOString().split("T")[0];
  const inFlight = syncInFlight.get(salonId);
  if (inFlight) await inFlight;

  await ensureReservaIncomeIndexes(db);

  await syncReservaIncomeTransactions(
    db,
    salonId,
    reservaId,
    monto,
    descripcion,
    fechaTransaccion,
    servicioId,
    cobroEfectivo,
    cobroTransferencia,
    legacyMetodoPago
  );
}

export async function generateFinancialReport(
  db: Db,
  salonId: string,
  desde: string,
  hasta: string
): Promise<FinancialReport> {
  const filter = {
    ...tenantQuery(salonId),
    fecha: { $gte: desde, $lte: hasta },
  };

  const transactions = (await db
    .collection<FinancialTransaction>(Collections.FINANCIAL_TRANSACTIONS)
    .find(filter)
    .toArray()) as FinancialTransaction[];

  let ingresos = 0;
  let gastos = 0;
  const ingresosPorCategoriaMap = new Map<string, number>();
  const gastosPorCategoriaMap = new Map<string, number>();
  const ingresosPorMesMap = new Map<string, number>();
  const gastosPorMesMap = new Map<string, number>();
  const ingresosPorMetodoPagoMap = new Map<PaymentMethod, number>();
  let ingresosPorReservas = 0;
  let ingresosManuales = 0;

  for (const tx of transactions) {
    const cat = tx.categoriaNombre ?? "Sin categoría";
    const mes = tx.fecha.substring(0, 7);

    if (tx.tipo === "income") {
      ingresos += tx.monto;
      ingresosPorCategoriaMap.set(
        cat,
        (ingresosPorCategoriaMap.get(cat) ?? 0) + tx.monto
      );
      ingresosPorMesMap.set(
        mes,
        (ingresosPorMesMap.get(mes) ?? 0) + tx.monto
      );
      const metodo: PaymentMethod =
        tx.metodoPago ??
        (tx.moneda === "CUP" ? "efectivo_cup" : "transferencia");
      ingresosPorMetodoPagoMap.set(
        metodo,
        (ingresosPorMetodoPagoMap.get(metodo) ?? 0) + tx.monto
      );
      if (tx.fuente === "reserva") {
        ingresosPorReservas += tx.monto;
      } else {
        ingresosManuales += tx.monto;
      }
    } else {
      gastos += tx.monto;
      gastosPorCategoriaMap.set(
        cat,
        (gastosPorCategoriaMap.get(cat) ?? 0) + tx.monto
      );
      gastosPorMesMap.set(mes, (gastosPorMesMap.get(mes) ?? 0) + tx.monto);
    }
  }

  const toSortedArray = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);

  const toMonthArray = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([mes, total]) => ({ mes, total }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

  return {
    periodo: { desde, hasta },
    resumen: {
      ingresos: Math.round(ingresos * 100) / 100,
      gastos: Math.round(gastos * 100) / 100,
      balance: Math.round((ingresos - gastos) * 100) / 100,
    },
    ingresosPorCategoria: toSortedArray(ingresosPorCategoriaMap),
    gastosPorCategoria: toSortedArray(gastosPorCategoriaMap),
    ingresosPorMes: toMonthArray(ingresosPorMesMap),
    gastosPorMes: toMonthArray(gastosPorMesMap),
    ingresosPorReservas: Math.round(ingresosPorReservas * 100) / 100,
    ingresosManuales: Math.round(ingresosManuales * 100) / 100,
    ingresosPorMetodoPago: PAYMENT_METHOD_OPTIONS.map((option) => ({
      metodo: option.value,
      label: option.label,
      total:
        Math.round((ingresosPorMetodoPagoMap.get(option.value) ?? 0) * 100) /
        100,
    })).filter((item) => item.total > 0),
  };
}
