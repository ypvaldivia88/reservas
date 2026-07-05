"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import {
  FinancialTransaction,
  FinancialCategory,
  FinancialReport,
  TransactionType,
} from "@/lib/types";

export default function FinanzasPage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterTipo, setFilterTipo] = useState<"" | TransactionType>("");
  const [desde, setDesde] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [hasta, setHasta] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  const [form, setForm] = useState({
    tipo: "income" as TransactionType,
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    categoriaId: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tipoParam = filterTipo ? `&tipo=${filterTipo}` : "";
      const [txRes, catRes, repRes] = await Promise.all([
        fetch(
          `/api/finanzas/transactions?desde=${desde}&hasta=${hasta}${tipoParam}`
        ),
        fetch("/api/finanzas/categories"),
        fetch(`/api/finanzas/reports?desde=${desde}&hasta=${hasta}`),
      ]);
      const [txData, catData, repData] = await Promise.all([
        txRes.json(),
        catRes.json(),
        repRes.json(),
      ]);
      if (txData.success) setTransactions(txData.data);
      if (catData.success) setCategories(catData.data);
      if (repData.success) setReport(repData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, filterTipo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/finanzas/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        monto: parseFloat(form.monto),
      }),
    });
    const data = await res.json();
    if (data.success) {
      setShowForm(false);
      setForm({
        tipo: "income",
        monto: "",
        fecha: new Date().toISOString().split("T")[0],
        descripcion: "",
        categoriaId: "",
      });
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta transacción?")) return;
    await fetch(`/api/finanzas/transactions/${id}`, { method: "DELETE" });
    loadData();
  };

  const incomeCategories = categories.filter((c) => c.tipo === "income");
  const expenseCategories = categories.filter((c) => c.tipo === "expense");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Finanzas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Gestiona ingresos, gastos y reportes de tu salón
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          + Nueva transacción
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Tipo</label>
          <select
            value={filterTipo}
            onChange={(e) =>
              setFilterTipo(e.target.value as "" | TransactionType)
            }
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          >
            <option value="">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
        </div>
      </div>

      {/* Resumen */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              Ingresos
            </p>
            <p className="text-2xl font-bold text-green-800 dark:text-green-300">
              ${report.resumen.ingresos.toFixed(2)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              Reservas: ${report.ingresosPorReservas.toFixed(2)} · Manual: $
              {report.ingresosManuales.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">
              Gastos
            </p>
            <p className="text-2xl font-bold text-red-800 dark:text-red-300">
              ${report.resumen.gastos.toFixed(2)}
            </p>
          </div>
          <div
            className={`rounded-xl p-5 border ${
              report.resumen.balance >= 0
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
            }`}
          >
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Balance
            </p>
            <p
              className={`text-2xl font-bold ${
                report.resumen.balance >= 0
                  ? "text-blue-800 dark:text-blue-300"
                  : "text-orange-800 dark:text-orange-300"
              }`}
            >
              ${report.resumen.balance.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Reportes por categoría */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Ingresos por categoría
            </h3>
            {report.ingresosPorCategoria.length === 0 ? (
              <p className="text-sm text-gray-500">Sin datos en el período</p>
            ) : (
              <ul className="space-y-2">
                {report.ingresosPorCategoria.map((item) => (
                  <li
                    key={item.categoria}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {item.categoria}
                    </span>
                    <span className="font-medium text-green-600">
                      ${item.total.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Gastos por categoría
            </h3>
            {report.gastosPorCategoria.length === 0 ? (
              <p className="text-sm text-gray-500">Sin datos en el período</p>
            ) : (
              <ul className="space-y-2">
                {report.gastosPorCategoria.map((item) => (
                  <li
                    key={item.categoria}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {item.categoria}
                    </span>
                    <span className="font-medium text-red-600">
                      ${item.total.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Lista de transacciones */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Transacciones
          </h3>
        </div>
        {loading ? (
          <p className="p-5 text-gray-500">Cargando...</p>
        ) : transactions.length === 0 ? (
          <p className="p-5 text-gray-500">No hay transacciones en el período</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Descripción</th>
                  <th className="px-4 py-3 text-left">Categoría</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td className="px-4 py-3">{tx.fecha}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          tx.tipo === "income"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {tx.tipo === "income" ? "Ingreso" : "Gasto"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{tx.descripcion}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {tx.categoriaNombre || "—"}
                      {tx.fuente === "reserva" && (
                        <span className="ml-1 text-xs text-blue-500">
                          (reserva)
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        tx.tipo === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {tx.tipo === "income" ? "+" : "-"}${tx.monto.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tx.fuente === "manual" && (
                        <button
                          onClick={() => handleDelete(tx._id!)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nueva transacción */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Nueva transacción
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tipo: e.target.value as TransactionType,
                      categoriaId: "",
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="income">Ingreso</option>
                  <option value="expense">Gasto</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Categoría</label>
                <select
                  value={form.categoriaId}
                  onChange={(e) =>
                    setForm({ ...form, categoriaId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="">Sin categoría</option>
                  {(form.tipo === "income"
                    ? incomeCategories
                    : expenseCategories
                  ).map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  required
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outlined-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
