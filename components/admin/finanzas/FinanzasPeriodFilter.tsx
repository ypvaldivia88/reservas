"use client";

import { useState } from "react";
import { CalendarRange, SlidersHorizontal } from "lucide-react";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import { PaymentMethod, TransactionType } from "@/lib/types";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/paymentMethods";
import { cn } from "@/lib/utils";

export type DatePreset =
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year";

const QUICK_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "this_week", label: "Semana" },
  { id: "this_month", label: "Mes" },
  { id: "this_year", label: "Año" },
];

const EXTRA_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "last_month", label: "Mes anterior" },
  { id: "last_year", label: "Año anterior" },
];

interface FinanzasPeriodFilterProps {
  activeDatePreset: DatePreset | null;
  desde: string;
  hasta: string;
  filterTipo: "" | TransactionType;
  filterMetodoPago: "" | PaymentMethod;
  onPreset: (preset: DatePreset) => void;
  onDesdeChange: (value: string) => void;
  onHastaChange: (value: string) => void;
  onFilterTipoChange: (value: "" | TransactionType) => void;
  onFilterMetodoChange: (value: "" | PaymentMethod) => void;
  onCustomRange: () => void;
}

export default function FinanzasPeriodFilter({
  activeDatePreset,
  desde,
  hasta,
  filterTipo,
  filterMetodoPago,
  onPreset,
  onDesdeChange,
  onHastaChange,
  onFilterTipoChange,
  onFilterMetodoChange,
  onCustomRange,
}: FinanzasPeriodFilterProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hasExtraFilters = filterTipo !== "" || filterMetodoPago !== "";
  const hasCustomRange = activeDatePreset === null;

  return (
    <>
      <div className="flex h-full min-w-[4.25rem] flex-col gap-1 sm:min-w-[5rem] sm:gap-1.5">
        {QUICK_PRESETS.map((preset) => {
          const isActive = activeDatePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPreset(preset.id)}
              className={cn(
                "rounded-xl px-1.5 py-2 text-[10px] font-semibold leading-tight transition-colors sm:px-2 sm:py-2.5 sm:text-xs",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border/70 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {preset.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "mt-auto flex flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-2 text-[10px] font-semibold transition-colors sm:gap-1 sm:py-2.5 sm:text-xs",
            hasCustomRange || hasExtraFilters
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/70 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          aria-label="Filtros avanzados y rango de fechas"
        >
          <CalendarRange className="size-3.5 sm:size-4" aria-hidden />
          <span>Más</span>
        </button>
      </div>

      <MobileNavDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Período y filtros"
        visibility="all"
      >
        <div className="space-y-5 px-1">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Período rápido
            </p>
            <div className="flex flex-wrap gap-2">
              {[...QUICK_PRESETS, ...EXTRA_PRESETS].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onPreset(preset.id);
                    setDrawerOpen(false);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    activeDatePreset === preset.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => {
                  onDesdeChange(e.target.value);
                  onCustomRange();
                }}
                className="input-field w-full text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => {
                  onHastaChange(e.target.value);
                  onCustomRange();
                }}
                className="input-field w-full text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <SlidersHorizontal className="size-3.5" aria-hidden />
              Tipo
            </label>
            <select
              value={filterTipo}
              onChange={(e) =>
                onFilterTipoChange(e.target.value as "" | TransactionType)
              }
              className="input-field w-full text-sm"
            >
              <option value="">Todos</option>
              <option value="income">Ingresos</option>
              <option value="expense">Gastos</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Método de pago
            </label>
            <select
              value={filterMetodoPago}
              onChange={(e) =>
                onFilterMetodoChange(e.target.value as "" | PaymentMethod)
              }
              className="input-field w-full text-sm"
            >
              <option value="">Todos</option>
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Aplicar
          </button>
        </div>
      </MobileNavDrawer>
    </>
  );
}
