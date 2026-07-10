import { cn } from "@/lib/utils";

type PillVariant = "default" | "success" | "warning" | "muted";

const variants: Record<PillVariant, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  muted: "bg-muted text-muted-foreground",
};

export default function StatusPill({
  children,
  variant = "muted",
  className,
}: {
  children: React.ReactNode;
  variant?: PillVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium leading-none",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
