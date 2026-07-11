"use client";

import {
  CompactMetricRow,
  MetricDashboardCard,
} from "@/components/design/dashboard";
import { formatTransactionAmount, PAYMENT_METHOD_OPTIONS } from "@/lib/paymentMethods";
import { FinancialReport, PaymentMethod, TransactionType } from "@/lib/types";
import { ArrowDownLeft, ArrowUpRight, Tag } from "lucide-react";
import FinanzasPeriodFilter, { DatePreset } from "./FinanzasPeriodFilter";

function getMethodTotal(
  report: FinancialReport,
  metodo: PaymentMethod,
  kind: "income" | "expense"
) {
  const list =
    kind === "income" ? report.ingresosPorMetodoPago : report.gastosPorMetodoPago;
  return list?.find((item) => item.metodo === metodo)?.total ?? 0;
}

interface FinanzasOverviewProps {
  report: FinancialReport;
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

export default function FinanzasOverview({
  report,
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
}: FinanzasOverviewProps) {
  const efectivoIngresos = getMethodTotal(report, "efectivo_cup", "income");
  const transferenciaIngresos = getMethodTotal(report, "transferencia", "income");

  const categoryRows = [
    ...report.ingresosPorCategoria.map((item) => ({
      key: `in-${item.categoria}`,
      title: item.categoria,
      value: item.total,
      kind: "income" as const,
    })),
    ...report.gastosPorCategoria.map((item) => ({
      key: `out-${item.categoria}`,
      title: item.categoria,
      value: item.total,
      kind: "expense" as const,
    })),
  ].filter((item) => item.value > 0);

  const gastosPorMetodo = PAYMENT_METHOD_OPTIONS.map((option) => ({
    label: option.label,
    metodo: option.value,
    total: getMethodTotal(report, option.value, "expense"),
  })).filter((item) => item.total > 0);

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_4.25rem] items-stretch gap-2 sm:grid-cols-[minmax(0,1fr)_5rem] sm:gap-3">
        <MetricDashboardCard
          icon={ArrowUpRight}
          title="Ingresos totales"
          badge={{ label: "Período", variant: "success" }}
          value={formatTransactionAmount(report.resumen.ingresos)}
          valueLabel="CUP en el rango"
          progress={
            report.resumen.ingresos > 0
              ? Math.min(
                  100,
                  Math.round(
                    (report.ingresosPorReservas / report.resumen.ingresos) * 100
                  )
                )
              : 0
          }
          details={[
            {
              label: "Reservas",
              value: formatTransactionAmount(report.ingresosPorReservas),
            },
            {
              label: "Efectivo",
              value: formatTransactionAmount(efectivoIngresos),
            },
            {
              label: "Transferencia",
              value: formatTransactionAmount(transferenciaIngresos),
            },
            {
              label: "Gastos",
              value: formatTransactionAmount(report.resumen.gastos),
            },
          ]}
          footer={`Balance del período: ${formatTransactionAmount(report.resumen.balance)}`}
          className="min-w-0"
        />

        <FinanzasPeriodFilter
          activeDatePreset={activeDatePreset}
          desde={desde}
          hasta={hasta}
          filterTipo={filterTipo}
          filterMetodoPago={filterMetodoPago}
          onPreset={onPreset}
          onDesdeChange={onDesdeChange}
          onHastaChange={onHastaChange}
          onFilterTipoChange={onFilterTipoChange}
          onFilterMetodoChange={onFilterMetodoChange}
          onCustomRange={onCustomRange}
        />
      </div>

      {(categoryRows.length > 0 || gastosPorMetodo.length > 0) && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {categoryRows.map((item) => (
            <CompactMetricRow
              key={item.key}
              icon={item.kind === "income" ? ArrowUpRight : ArrowDownLeft}
              title={item.title}
              subtitle={item.kind === "income" ? "Ingreso por categoría" : "Gasto por categoría"}
              value={formatTransactionAmount(item.value)}
              badge={{
                label: item.kind === "income" ? "Ingreso" : "Egreso",
                variant: item.kind === "income" ? "success" : "warning",
              }}
            />
          ))}
          {gastosPorMetodo.map((item) => (
            <CompactMetricRow
              key={`gasto-${item.metodo}`}
              icon={Tag}
              title={item.label}
              subtitle="Gasto por método de pago"
              value={formatTransactionAmount(item.total)}
              badge={{ label: "Egreso", variant: "warning" }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
