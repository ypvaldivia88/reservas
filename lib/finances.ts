import { Db } from "mongodb";
import {
  FinancialReport,
  FinancialTransaction,
  TransactionType,
} from "@/lib/types";
import { tenantQuery } from "@/lib/tenant";

export const DEFAULT_FINANCIAL_CATEGORIES = [
  { nombre: "Servicios de uñas", tipo: "income" as TransactionType, color: "#22c55e" },
  { nombre: "Propinas", tipo: "income" as TransactionType, color: "#10b981" },
  { nombre: "Otros ingresos", tipo: "income" as TransactionType, color: "#14b8a6" },
  { nombre: "Materiales", tipo: "expense" as TransactionType, color: "#ef4444" },
  { nombre: "Alquiler", tipo: "expense" as TransactionType, color: "#f97316" },
  { nombre: "Servicios públicos", tipo: "expense" as TransactionType, color: "#eab308" },
  { nombre: "Marketing", tipo: "expense" as TransactionType, color: "#8b5cf6" },
  { nombre: "Otros gastos", tipo: "expense" as TransactionType, color: "#6b7280" },
];

export async function createIncomeFromReserva(
  db: Db,
  salonId: string,
  reservaId: string,
  monto: number,
  descripcion: string
): Promise<void> {
  const existing = await db.collection("financial_transactions").findOne({
    ...tenantQuery(salonId),
    reservaId,
    fuente: "reserva",
  });

  if (existing) {
    await db.collection("financial_transactions").updateOne(
      { _id: existing._id },
      {
        $set: {
          monto,
          descripcion,
          fecha: new Date().toISOString().split("T")[0],
        },
      }
    );
    return;
  }

  const categoria = await db.collection("financial_categories").findOne({
    ...tenantQuery(salonId),
    tipo: "income",
    nombre: "Servicios de uñas",
  });

  const transaction: Omit<FinancialTransaction, "_id"> = {
    salonId,
    tipo: "income",
    categoriaId: categoria?._id?.toString(),
    categoriaNombre: categoria?.nombre ?? "Servicios de uñas",
    monto,
    moneda: "USD",
    fecha: new Date().toISOString().split("T")[0],
    descripcion,
    fuente: "reserva",
    reservaId,
    fechaCreacion: new Date(),
  };

  await db.collection("financial_transactions").insertOne(transaction);
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
    .collection<FinancialTransaction>("financial_transactions")
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
