import { FinancialReport } from "@/lib/types";

export type AdminDatePreset =
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year";

export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getAdminDatePresetRange(preset: AdminDatePreset): {
  desde: string;
  hasta: string;
} {
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

export function getCurrentMonthFinanceRange() {
  return getAdminDatePresetRange("this_month");
}

export type FinanceOverviewReport = FinancialReport;
