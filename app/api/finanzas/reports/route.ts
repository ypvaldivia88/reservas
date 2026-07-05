import { adminHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { getDb } from "@/lib/mongodb";
import { generateFinancialReport } from "@/lib/finances";
import { FinancialReport } from "@/lib/types";

export const GET = adminHandler(async ({ salonId, request }) => {
  const desde =
    request.nextUrl.searchParams.get("desde") ||
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0];
  const hasta =
    request.nextUrl.searchParams.get("hasta") ||
    new Date().toISOString().split("T")[0];

  const db = await getDb();
  const report: FinancialReport = await generateFinancialReport(
    db,
    salonId,
    desde,
    hasta
  );

  return ok(report);
});
