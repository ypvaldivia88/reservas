import { cn } from "@/lib/utils";

export default function SurfaceCard({
  children,
  className,
  padding = "default",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "default" | "lg";
}) {
  const paddingClass = {
    none: "",
    sm: "p-4",
    default: "p-5 sm:p-6",
    lg: "p-6 sm:p-8",
  }[padding];

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
        paddingClass,
        className
      )}
    >
      {children}
    </div>
  );
}
