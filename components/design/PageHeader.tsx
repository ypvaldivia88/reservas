import { cn } from "@/lib/utils";

export default function PageHeader({
  title,
  description,
  className,
  actions,
}: {
  title: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions ? <div className="shrink-0 sm:pt-1">{actions}</div> : null}
    </div>
  );
}
