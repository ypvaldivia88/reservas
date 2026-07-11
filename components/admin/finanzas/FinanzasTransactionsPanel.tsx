"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FinancialTransaction } from "@/lib/types";
import {
  formatTransactionAmount,
  getPaymentMethodMeta,
} from "@/lib/paymentMethods";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

type SortField = "fecha" | "monto" | "tipo";
type SortDir = "asc" | "desc";

interface FinanzasTransactionsPanelProps {
  transactions: FinancialTransaction[];
  onDelete: (id: string) => void;
}

export default function FinanzasTransactionsPanel({
  transactions,
  onDelete,
}: FinanzasTransactionsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("fecha");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = transactions;

    if (q) {
      rows = rows.filter((tx) => {
        const haystack = [
          tx.descripcion,
          tx.categoriaNombre,
          tx.fecha,
          tx.tipo === "income" ? "ingreso" : "gasto",
          getPaymentMethodMeta(tx.metodoPago).label,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortField === "fecha") {
        cmp = a.fecha.localeCompare(b.fecha);
      } else if (sortField === "monto") {
        cmp = a.monto - b.monto;
      } else {
        cmp = a.tipo.localeCompare(b.tipo);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [transactions, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "fecha" ? "desc" : "desc");
    }
    setPage(1);
  };

  return (
    <section className="dashboard-card overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/30 sm:px-5"
        aria-expanded={expanded}
      >
        <div>
          <p className="text-sm font-semibold">Transacciones</p>
          <p className="text-xs text-muted-foreground">
            {transactions.length} en el período
          </p>
        </div>
        <span className="flex items-center gap-2 text-sm font-medium text-primary">
          {expanded ? "Ocultar" : "Ver listado"}
          {expanded ? (
            <ChevronUp className="size-4" aria-hidden />
          ) : (
            <ChevronDown className="size-4" aria-hidden />
          )}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar descripción, categoría..."
                className="input-field w-full pl-9 text-sm"
                aria-label="Buscar transacciones"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["fecha", "Fecha"],
                  ["monto", "Monto"],
                  ["tipo", "Tipo"],
                ] as const
              ).map(([field, label]) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => toggleSort(field)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    sortField === field
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                  {sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                </button>
              ))}
            </div>
          </div>

          {pageRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay transacciones que coincidan
            </p>
          ) : (
            <>
              <div className="space-y-2 md:hidden">
                {pageRows.map((tx) => (
                  <article
                    key={tx._id}
                    className="rounded-xl border border-border/60 bg-muted/20 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{tx.descripcion}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.fecha} · {getPaymentMethodMeta(tx.metodoPago).label}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "shrink-0 text-sm font-semibold tabular-nums",
                          tx.tipo === "income" ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {tx.tipo === "income" ? "+" : "-"}
                        {formatTransactionAmount(tx.monto, tx.metodoPago, tx.moneda)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          tx.tipo === "income"
                            ? "bg-green-500/15 text-green-700 dark:text-green-400"
                            : "bg-red-500/15 text-red-700 dark:text-red-400"
                        )}
                      >
                        {tx.tipo === "income" ? "Ingreso" : "Gasto"}
                      </span>
                      {tx.fuente === "manual" && tx._id && (
                        <button
                          type="button"
                          onClick={() => onDelete(tx._id!)}
                          className="text-xs font-medium text-destructive hover:underline"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                      <th className="px-2 py-2">Fecha</th>
                      <th className="px-2 py-2">Tipo</th>
                      <th className="px-2 py-2">Descripción</th>
                      <th className="px-2 py-2">Método</th>
                      <th className="px-2 py-2 text-right">Monto</th>
                      <th className="px-2 py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {pageRows.map((tx) => (
                      <tr key={tx._id}>
                        <td className="px-2 py-2.5 whitespace-nowrap">{tx.fecha}</td>
                        <td className="px-2 py-2.5">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              tx.tipo === "income"
                                ? "bg-green-500/15 text-green-700 dark:text-green-400"
                                : "bg-red-500/15 text-red-700 dark:text-red-400"
                            )}
                          >
                            {tx.tipo === "income" ? "Ingreso" : "Gasto"}
                          </span>
                        </td>
                        <td className="max-w-[12rem] truncate px-2 py-2.5">
                          {tx.descripcion}
                        </td>
                        <td className="px-2 py-2.5 text-muted-foreground">
                          {getPaymentMethodMeta(tx.metodoPago).label}
                        </td>
                        <td
                          className={cn(
                            "px-2 py-2.5 text-right font-medium tabular-nums",
                            tx.tipo === "income" ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {tx.tipo === "income" ? "+" : "-"}
                          {formatTransactionAmount(tx.monto, tx.metodoPago, tx.moneda)}
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          {tx.fuente === "manual" && tx._id && (
                            <button
                              type="button"
                              onClick={() => onDelete(tx._id!)}
                              className="text-xs text-destructive hover:underline"
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

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Página {currentPage} de {totalPages} · {filtered.length} resultados
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outlined-secondary"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outlined-secondary"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
