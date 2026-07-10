import { LucideIcon } from "lucide-react";
import DashboardCard from "./DashboardCard";
import StatusPill from "./StatusPill";
import { cn } from "@/lib/utils";

export default function CompactMetricRow({
  icon: Icon,
  title,
  subtitle,
  value,
  badge,
  onClick,
  className,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  value: string;
  badge?: { label: string; variant?: "default" | "success" | "warning" | "muted" };
  onClick?: () => void;
  className?: string;
}) {
  return (
    <DashboardCard
      as={onClick ? "button" : "article"}
      onClick={onClick}
      className={cn("flex items-center gap-3 py-3.5 sm:py-4", className)}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{title}</p>
          {badge && <StatusPill variant={badge.variant}>{badge.label}</StatusPill>}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground tabular-nums">{subtitle}</p>
        )}
      </div>

      <p className="shrink-0 text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
    </DashboardCard>
  );
}
