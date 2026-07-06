import { Db, AnyBulkWriteOperation, Document } from "mongodb";
import {
  FinancialReport,
  FinancialTransaction,
  TransactionType,
} from "@/lib/types";
import { tenantQuery } from "@/lib/tenant";
import { Collections } from "@/lib/db/collections";

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
  const reservas = await db
    .collection(Collections.RESERVAS)
    .find({
      ...tenantQuery(salonId),
      estado: { $in: ["confirmada", "completada"] },
      costo: { $exists: true, $ne: null },
    })
    .toArray();

  if (reservas.length === 0) return;

  const reservaIds = reservas.map((r) => r._id.toString());
  const existingTxs = await db
    .collection(Collections.FINANCIAL_TRANSACTIONS)
    .find({
      ...tenantQuery(salonId),
      fuente: "reserva",
      reservaId: { $in: reservaIds },
    })
    .toArray();

  const existingByReservaId = new Map(
    existingTxs.map((tx) => [String(tx.reservaId), tx])
  );

  const incomeCategories = await db
    .collection(Collections.FINANCIAL_CATEGORIES)
    .find({
      ...tenantQuery(salonId),
      tipo: "income",
      activo: true,
      servicioId: { $exists: true },
    })
    .toArray();

  const categoryByServicioId = new Map(
    incomeCategories.map((cat) => [
      String(cat.servicioId),
      {
        categoriaId: cat._id?.toString(),
        categoriaNombre: cat.nombre as string,
      },
    ])
  );

  const fallbackCategory =
    incomeCategories.length > 0 ?
      {
        categoriaId: incomeCategories[0]._id?.toString(),
        categoriaNombre: incomeCategories[0].nombre as string,
      }
    : {};

  const bulkOps: AnyBulkWriteOperation<Document>[] = [];

  for (const reserva of reservas) {
    const costo = Number(reserva.costo);
    if (isNaN(costo) || costo < 0) continue;

    const reservaId = reserva._id.toString();
    const servicioId = reserva.servicioId as string | undefined;
    const category =
      (servicioId && categoryByServicioId.get(servicioId)) || fallbackCategory;
    const descripcion = `Reserva ${reserva.nombre} - ${reserva.fechaCita}`;
    const fecha = reserva.fechaCita as string;
    const existing = existingByReservaId.get(reservaId);

    if (existing) {
      bulkOps.push({
        updateOne: {
          filter: { _id: existing._id },
          update: {
            $set: {
              monto: costo,
              descripcion,
              fecha,
              ...(category.categoriaId ? { categoriaId: category.categoriaId } : {}),
              ...(category.categoriaNombre ?
                { categoriaNombre: category.categoriaNombre }
              : {}),
            },
          },
        },
      });
    } else {
      bulkOps.push({
        insertOne: {
          document: {
            salonId,
            tipo: "income",
            categoriaId: category.categoriaId,
            categoriaNombre: category.categoriaNombre,
            monto: costo,
            moneda: "USD",
            fecha,
            descripcion,
            fuente: "reserva",
            reservaId,
            fechaCreacion: new Date(),
          },
        },
      });
    }
  }

  if (bulkOps.length > 0) {
    await db
      .collection(Collections.FINANCIAL_TRANSACTIONS)
      .bulkWrite(bulkOps, { ordered: false });
  }
}

export async function prepareFinancesForSalon(
  db: Db,
  salonId: string
): Promise<void> {
  const inFlight = syncInFlight.get(salonId);
  if (inFlight) return inFlight;

  const work = (async () => {
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
  servicioId?: string
): Promise<void> {
  const fechaTransaccion = fecha ?? new Date().toISOString().split("T")[0];
  const { categoriaId, categoriaNombre } = await resolveIncomeCategory(
    db,
    salonId,
    servicioId
  );

  const existing = await db.collection(Collections.FINANCIAL_TRANSACTIONS).findOne({
    ...tenantQuery(salonId),
    reservaId,
    fuente: "reserva",
  });

  if (existing) {
    await db.collection(Collections.FINANCIAL_TRANSACTIONS).updateOne(
      { _id: existing._id },
      {
        $set: {
          monto,
          descripcion,
          fecha: fechaTransaccion,
          ...(categoriaId ? { categoriaId } : {}),
          ...(categoriaNombre ? { categoriaNombre } : {}),
        },
      }
    );
    return;
  }

  const transaction: Omit<FinancialTransaction, "_id"> = {
    salonId,
    tipo: "income",
    categoriaId,
    categoriaNombre,
    monto,
    moneda: "USD",
    fecha: fechaTransaccion,
    descripcion,
    fuente: "reserva",
    reservaId,
    fechaCreacion: new Date(),
  };

  await db.collection(Collections.FINANCIAL_TRANSACTIONS).insertOne(transaction);
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
  };
}
