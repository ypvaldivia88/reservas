import { LucideIcon } from "lucide-react";
import DashboardCard from "./DashboardCard";
import ProgressRing from "./ProgressRing";
import StatusPill from "./StatusPill";
import { cn } from "@/lib/utils";

export interface MetricDetail {
  label: string;
  value: string;
  highlightOnMobile?: boolean;
  onClick?: () => void;
}

export default function MetricDashboardCard({
  icon: Icon,
  title,
  badge,
  value,
  valueLabel,
  progress,
  details,
  footer,
  onClick,
  className,
}: {
  icon: LucideIcon;
  title: string;
  badge?: { label: string; variant?: "default" | "success" | "warning" | "muted" };
  value: string;
  valueLabel?: string;
  progress?: number;
  details?: MetricDetail[];
  footer?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <DashboardCard
      as={onClick ? "button" : "article"}
      onClick={onClick}
      className={cn("text-left", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{title}</p>
            {valueLabel && (
              <p className="truncate text-xs text-muted-foreground">{valueLabel}</p>
            )}
          </div>
        </div>
        {badge && <StatusPill variant={badge.variant}>{badge.label}</StatusPill>}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
          {value}
        </p>
        {progress != null && <ProgressRing value={progress} size={64} />}
      </div>

      {details && details.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {details.map((item) => {
            const DetailTag = item.onClick ? "button" : "div";
            return (
              <DetailTag
                key={item.label}
                type={item.onClick ? "button" : undefined}
                onClick={
                  item.onClick
                    ? (e) => {
                        e.stopPropagation();
                        item.onClick?.();
                      }
                    : undefined
                }
                className={cn(
                  "rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-left",
                  item.highlightOnMobile && "col-span-2 sm:col-span-1",
                  item.onClick &&
                    "cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/50 active:scale-[0.99]"
                )}
              >
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-0.5 text-sm font-medium tabular-nums">{item.value}</p>
              </DetailTag>
            );
          })}
        </div>
      )}

      {footer && (
        <p className="mt-4 text-xs text-muted-foreground">{footer}</p>
      )}
    </DashboardCard>
  );
}
