import { cn } from "@/lib/utils";

export default function DashboardCard({
  children,
  className,
  onClick,
  as: Component = "div",
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  as?: "div" | "button" | "article";
}) {
  const interactive = Component === "button" || !!onClick;

  return (
    <Component
      type={Component === "button" ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "dashboard-card rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5",
        interactive &&
          "cursor-pointer transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.99]",
        className
      )}
    >
      {children}
    </Component>
  );
}
