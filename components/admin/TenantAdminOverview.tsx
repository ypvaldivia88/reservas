"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/design/PageHeader";
import {
  CompactMetricRow,
  MetricDashboardCard,
} from "@/components/design/dashboard";
import { Reserva, User, FinancialReport } from "@/lib/types";
import { getCurrentMonthFinanceRange } from "@/lib/admin-date-presets";
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

export default function TenantAdminOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [clientes, setClientes] = useState<User[]>([]);
  const [financeReport, setFinanceReport] = useState<FinancialReport | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [reservasRes, clientesRes, report] = await Promise.all([
          fetch("/api/reservas"),
          fetch("/api/clientes"),
          fetchFinanceReport(),
        ]);

        if (cancelled) return;

        if (reservasRes.ok) {
          const data = await reservasRes.json();
          if (data.success) setReservas(data.data);
        }

        if (clientesRes.ok) {
          const data = await clientesRes.json();
          if (data.success) setClientes(data.data);
        }

        setFinanceReport(report);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingCount = reservas.filter((r) => r.estado === "pendiente").length;

  const ingresosPorMetodoPago = PAYMENT_METHOD_OPTIONS.map((option) => {
    const found = financeReport?.ingresosPorMetodoPago.find(
      (item) => item.metodo === option.value
    );
    return {
      metodo: option.value,
      label: option.label,
      total: found?.total ?? 0,
    };
  }).filter((item) => item.total > 0);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="font-medium text-muted-foreground">Cargando resumen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inicio"
        description="Resumen del salón: reservas, clientes y finanzas del mes"
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Reservas
        </h2>
        <MetricDashboardCard
          icon={Calendar}
          title="Reservas del salón"
          badge={{ label: "Vista general", variant: "muted" }}
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
            {
              label: "Clientes",
              value: String(clientes.length),
            },
          ]}
          footer="Ir al calendario de reservas"
          onClick={() => router.push("/admin/calendario?view=month")}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CompactMetricRow
            icon={Users}
            title="Base de clientes"
            subtitle="Contactos registrados"
            value={String(clientes.length)}
            badge={{ label: "Activos", variant: "success" }}
            onClick={() => router.push("/admin/clientes")}
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
        </div>
      </section>

      {financeReport && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Finanzas · mes actual
          </h2>
          <MetricDashboardCard
            icon={ArrowUpRight}
            title="Ingresos totales"
            badge={{ label: "Mes actual", variant: "success" }}
            value={formatTransactionAmount(financeReport.resumen.ingresos)}
            valueLabel="CUP en el mes"
            progress={
              financeReport.resumen.ingresos > 0
                ? Math.min(
                    100,
                    Math.round(
                      (financeReport.ingresosPorReservas /
                        financeReport.resumen.ingresos) *
                        100
                    )
                  )
                : 0
            }
            details={[
              {
                label: "Reservas",
                value: formatTransactionAmount(financeReport.ingresosPorReservas),
              },
              {
                label: "Manual",
                value: formatTransactionAmount(financeReport.ingresosManuales),
              },
              {
                label: "Gastos",
                value: formatTransactionAmount(financeReport.resumen.gastos),
              },
              {
                label: "Balance",
                value: formatTransactionAmount(financeReport.resumen.balance),
              },
            ]}
            footer="Ir a finanzas"
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
              subtitle="Salidas del mes"
              value={formatTransactionAmount(financeReport.resumen.gastos)}
              badge={{ label: "Egreso", variant: "warning" }}
              onClick={() => router.push("/admin/finanzas")}
            />
            <CompactMetricRow
              icon={Scale}
              title="Balance (CUP)"
              subtitle={
                financeReport.resumen.balance >= 0
                  ? "Resultado positivo"
                  : "Déficit"
              }
              value={formatTransactionAmount(financeReport.resumen.balance)}
              badge={{
                label:
                  financeReport.resumen.balance >= 0 ? "Saludable" : "Revisar",
                variant:
                  financeReport.resumen.balance >= 0 ? "success" : "warning",
              }}
              onClick={() => router.push("/admin/finanzas")}
            />
          </div>
        </section>
      )}
    </div>
  );
}

async function fetchFinanceReport() {
  const { desde, hasta } = getCurrentMonthFinanceRange();
  const res = await fetch(`/api/finanzas/dashboard?desde=${desde}&hasta=${hasta}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.success) return null;
  return data.data.report as FinancialReport;
}
