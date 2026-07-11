"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/Button";
import FinanzasSkeleton from "@/components/FinanzasSkeleton";
import {
  FinancialTransaction,
  FinancialCategory,
  FinancialReport,
  TransactionType,
  PaymentMethod,
} from "@/lib/types";
import FinanzasOverview from "@/components/admin/finanzas/FinanzasOverview";
import FinanzasTransactionsPanel from "@/components/admin/finanzas/FinanzasTransactionsPanel";
import { DatePreset } from "@/components/admin/finanzas/FinanzasPeriodFilter";

const SYNC_STORAGE_KEY = "finanzas_last_sync_at";

function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDatePresetRange(preset: DatePreset): { desde: string; hasta: string } {
  const now = new Date();
  const today = formatLocalDate(now);

  switch (preset) {
    case "today":
      return { desde: today, hasta: today };
    case "this_week": {
      const mondayOffset = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - mondayOffset);
      return { desde: formatLocalDate(monday), hasta: today };
    }
    case "this_month":
      return {
        desde: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
        hasta: today,
      };
    case "last_month": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { desde: formatLocalDate(first), hasta: formatLocalDate(last) };
    }
    case "this_year":
      return { desde: `${now.getFullYear()}-01-01`, hasta: today };
    case "last_year":
      return {
        desde: `${now.getFullYear() - 1}-01-01`,
        hasta: `${now.getFullYear() - 1}-12-31`,
      };
  }
}

export default function FinanzasPage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const syncInFlightRef = useRef(false);
  const [showForm, setShowForm] = useState(false);
  const [filterTipo, setFilterTipo] = useState<"" | TransactionType>("");
  const [filterMetodoPago, setFilterMetodoPago] = useState<"" | PaymentMethod>(
    ""
  );
  const [desde, setDesde] = useState(() => getDatePresetRange("this_month").desde);
  const [hasta, setHasta] = useState(() => getDatePresetRange("this_month").hasta);
  const [activeDatePreset, setActiveDatePreset] = useState<DatePreset | null>(
    "this_month"
  );

  const applyDatePreset = (preset: DatePreset) => {
    const range = getDatePresetRange(preset);
    setDesde(range.desde);
    setHasta(range.hasta);
    setActiveDatePreset(preset);
  };

  const [form, setForm] = useState({
    tipo: "income" as TransactionType,
    cobroEfectivo: "",
    cobroTransferencia: "",
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    categoriaId: "",
  });

  const getFormCobroTotal = () => {
    const efectivo = form.cobroEfectivo ? parseFloat(form.cobroEfectivo) : 0;
    const transferencia = form.cobroTransferencia
      ? parseFloat(form.cobroTransferencia)
      : 0;
    if (isNaN(efectivo) || isNaN(transferencia)) return 0;
    return efectivo + transferencia;
  };

  const fetchDashboard = useCallback(
    async (options?: { showLoading?: boolean }) => {
      const showLoading = options?.showLoading ?? false;
      if (showLoading) setLoading(true);
      setError("");

      const tipoParam = filterTipo ? `&tipo=${filterTipo}` : "";
      const metodoParam =
        filterMetodoPago ? `&metodoPago=${filterMetodoPago}` : "";

      try {
        const res = await fetch(
          `/api/finanzas/dashboard?desde=${desde}&hasta=${hasta}${tipoParam}${metodoParam}`
        );

        if (!res.ok) {
          throw new Error("Error en la respuesta del servidor");
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error("No se pudieron obtener los datos de finanzas");
        }

        setTransactions(data.data.transactions);
        setCategories(data.data.categories);
        setReport(data.data.report);
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar las finanzas. Intenta de nuevo.");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [desde, hasta, filterTipo, filterMetodoPago]
  );

  const runSync = useCallback(
    async () => {
      if (syncInFlightRef.current) return;

      syncInFlightRef.current = true;
      setSyncing(true);
      try {
        await fetch("/api/finanzas/sync", { method: "POST" });
        sessionStorage.setItem(SYNC_STORAGE_KEY, String(Date.now()));
        await fetchDashboard();
      } catch (e) {
        console.error(e);
      } finally {
        syncInFlightRef.current = false;
        setSyncing(false);
      }
    },
    [fetchDashboard]
  );

  useEffect(() => {
    void fetchDashboard({ showLoading: true });
  }, [fetchDashboard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const cobroEfectivo = form.cobroEfectivo
      ? parseFloat(form.cobroEfectivo)
      : 0;
    const cobroTransferencia = form.cobroTransferencia
      ? parseFloat(form.cobroTransferencia)
      : 0;

    if (
      (isNaN(cobroEfectivo) || cobroEfectivo < 0) ||
      (isNaN(cobroTransferencia) || cobroTransferencia < 0) ||
      cobroEfectivo + cobroTransferencia <= 0
    ) {
      setFormError("Indica el monto en efectivo y/o transferencia");
      return;
    }

    const res = await fetch("/api/finanzas/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: form.tipo,
        fecha: form.fecha,
        descripcion: form.descripcion,
        categoriaId: form.categoriaId || undefined,
        cobroEfectivo,
        cobroTransferencia,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setShowForm(false);
      setFormError("");
      setForm({
        tipo: "income",
        cobroEfectivo: "",
        cobroTransferencia: "",
        fecha: new Date().toISOString().split("T")[0],
        descripcion: "",
        categoriaId: "",
      });
      await fetchDashboard();
    } else {
      setFormError(data.error || "No se pudo registrar la transacción");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta transacción?")) return;
    await fetch(`/api/finanzas/transactions/${id}`, { method: "DELETE" });
    await fetchDashboard();
  };

  const incomeCategories = categories.filter((c) => c.tipo === "income");
  const expenseCategories = categories.filter((c) => c.tipo === "expense");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Finanzas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresos, gastos y balance del salón
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => { setFormError(""); setShowForm(true); }}>
            + Nueva transacción
          </Button>
          <Button
            variant="outlined-secondary"
            onClick={() => void runSync()}
            loading={syncing}
          >
            Sincronizar reservas
          </Button>
        </div>
      </div>

      {syncing && !loading && (
        <p className="text-sm text-primary">Sincronizando ingresos de reservas...</p>
      )}

      {error && (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <FinanzasSkeleton />
      ) : (
        <>
          {report && (
            <FinanzasOverview
              report={report}
              activeDatePreset={activeDatePreset}
              desde={desde}
              hasta={hasta}
              filterTipo={filterTipo}
              filterMetodoPago={filterMetodoPago}
              onPreset={applyDatePreset}
              onDesdeChange={setDesde}
              onHastaChange={setHasta}
              onFilterTipoChange={setFilterTipo}
              onFilterMetodoChange={setFilterMetodoPago}
              onCustomRange={() => setActiveDatePreset(null)}
            />
          )}

          <FinanzasTransactionsPanel
            transactions={transactions}
            onDelete={handleDelete}
          />
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Nueva transacción</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div
                  className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                  role="alert"
                >
                  {formError}
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tipo: e.target.value as TransactionType,
                      categoriaId: "",
                    })
                  }
                  className="input-field w-full"
                >
                  <option value="income">Ingreso</option>
                  <option value="expense">Gasto</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Categoría</label>
                <select
                  value={form.categoriaId}
                  onChange={(e) =>
                    setForm({ ...form, categoriaId: e.target.value })
                  }
                  className="input-field w-full"
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
                <label className="mb-1 block text-sm font-medium">
                  {form.tipo === "expense"
                    ? "Pago en efectivo (CUP)"
                    : "Cobro en efectivo (CUP)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cobroEfectivo}
                  onChange={(e) =>
                    setForm({ ...form, cobroEfectivo: e.target.value })
                  }
                  className="input-field w-full"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {form.tipo === "expense"
                    ? "Pago por transferencia (CUP)"
                    : "Cobro por transferencia (CUP)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cobroTransferencia}
                  onChange={(e) =>
                    setForm({ ...form, cobroTransferencia: e.target.value })
                  }
                  className="input-field w-full"
                  placeholder="0.00"
                />
              </div>
              {getFormCobroTotal() > 0 && (
                <p className="text-sm text-muted-foreground">
                  Total:{" "}
                  <span className="font-medium text-foreground">
                    {getFormCobroTotal().toFixed(2)} CUP
                  </span>
                </p>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">Fecha</label>
                <input
                  type="date"
                  required
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Descripción</label>
                <input
                  type="text"
                  required
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  className="input-field w-full"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outlined-secondary"
                  onClick={() => {
                    setFormError("");
                    setShowForm(false);
                  }}
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
