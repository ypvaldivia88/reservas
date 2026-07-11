"use client";

import { useRouter } from "next/navigation";
import {
  CompactMetricRow,
  MetricDashboardCard,
} from "@/components/design/dashboard";
import { Reserva, FinancialReport } from "@/lib/types";
import {
  formatTransactionAmount,
  PAYMENT_METHOD_OPTIONS,
} from "@/lib/paymentMethods";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Clock3,
  Scale,
  Users,
  Wallet,
} from "lucide-react";

export function ReservationMetricsSection({
  reservas,
  clientesCount,
}: {
  reservas: Reserva[];
  clientesCount?: number;
}) {
  const router = useRouter();
  const pendingCount = reservas.filter((r) => r.estado === "pendiente").length;

  return (
    <section className="mb-6 space-y-3">
      <MetricDashboardCard
        icon={Calendar}
        title="Reservas del salón"
        badge={{ label: "Calendario", variant: "muted" }}
        value={String(reservas.length)}
        valueLabel="Total registradas"
        progress={
          reservas.length > 0
            ? Math.round(
                (reservas.filter((r) => r.estado === "completada").length /
                  reservas.length) *
                  100
              )
            : 0
        }
        details={[
          {
            label: "Pendientes",
            value: String(
              reservas.filter((r) => r.estado === "pendiente").length
            ),
          },
          {
            label: "Confirmadas",
            value: String(
              reservas.filter((r) => r.estado === "confirmada").length
            ),
          },
          {
            label: "Completadas",
            value: String(
              reservas.filter((r) => r.estado === "completada").length
            ),
          },
          ...(clientesCount !== undefined
            ? [{ label: "Clientes", value: String(clientesCount) }]
            : []),
        ]}
        footer="Ver agenda de reservas"
        onClick={() => router.push("/admin/calendario?view=month")}
      />
      <CompactMetricRow
        icon={Clock3}
        title="Citas pendientes"
        subtitle="Requieren confirmación"
        value={String(pendingCount)}
        badge={{
          label: pendingCount > 0 ? "Revisar" : "Al día",
          variant: pendingCount > 0 ? "warning" : "success",
        }}
        onClick={() =>
          router.push("/admin/calendario?view=agenda&estado=pendiente")
        }
      />
    </section>
  );
}

export function ClientMetricsSection({ clientesCount }: { clientesCount: number }) {
  const router = useRouter();

  return (
    <section className="mb-6">
      <CompactMetricRow
        icon={Users}
        title="Base de clientes"
        subtitle="Contactos registrados en tu salón"
        value={String(clientesCount)}
        badge={{ label: "Activos", variant: "success" }}
        onClick={() => router.push("/admin/clientes")}
      />
    </section>
  );
}

export function FinanceMetricsSection({ report }: { report: FinancialReport }) {
  const router = useRouter();

  const ingresosPorMetodoPago = PAYMENT_METHOD_OPTIONS.map((option) => {
    const found = report.ingresosPorMetodoPago.find(
      (item) => item.metodo === option.value
    );
    return {
      metodo: option.value,
      label: option.label,
      total: found?.total ?? 0,
    };
  }).filter((item) => item.total > 0);

  return (
    <section className="mb-6 space-y-3">
      <MetricDashboardCard
        icon={ArrowUpRight}
        title="Ingresos totales"
        badge={{ label: "Período filtrado", variant: "success" }}
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
            label: "Manual",
            value: formatTransactionAmount(report.ingresosManuales),
          },
          {
            label: "Gastos",
            value: formatTransactionAmount(report.resumen.gastos),
          },
          {
            label: "Balance",
            value: formatTransactionAmount(report.resumen.balance),
          },
        ]}
        footer="Detalle en transacciones"
        onClick={() => router.push("/admin/finanzas")}
      />

      {ingresosPorMetodoPago.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ingresosPorMetodoPago.map((item) => (
            <CompactMetricRow
              key={item.metodo}
              icon={Wallet}
              title={item.label}
              subtitle="Ingresos por forma de cobro"
              value={formatTransactionAmount(item.total)}
              badge={{ label: "Ingreso", variant: "success" }}
              onClick={() => router.push("/admin/finanzas")}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CompactMetricRow
          icon={ArrowDownLeft}
          title="Gastos"
          subtitle="Salidas del período"
          value={formatTransactionAmount(report.resumen.gastos)}
          badge={{ label: "Egreso", variant: "warning" }}
          onClick={() => router.push("/admin/finanzas")}
        />
        <CompactMetricRow
          icon={Scale}
          title="Balance (CUP)"
          subtitle={
            report.resumen.balance >= 0
              ? "Resultado positivo"
              : "Déficit en el período"
          }
          value={formatTransactionAmount(report.resumen.balance)}
          badge={{
            label: report.resumen.balance >= 0 ? "Saludable" : "Revisar",
            variant: report.resumen.balance >= 0 ? "success" : "warning",
          }}
          onClick={() => router.push("/admin/finanzas")}
        />
      </div>
    </section>
  );
}
