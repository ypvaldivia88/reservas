"use client";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("-mx-1 w-[calc(100%+0.5rem)] overflow-x-auto px-1 scrollbar-none", className)}>
      <div
        className="inline-flex min-w-max flex-nowrap rounded-full border border-border bg-muted/50 p-1"
        role="tablist"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-9 shrink-0 whitespace-nowrap rounded-full px-3 text-xs font-medium transition-colors sm:px-4 sm:text-sm",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
