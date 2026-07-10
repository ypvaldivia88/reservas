"use client";

import { useTheme, type DarkTone } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const TONE_OPTIONS: { value: DarkTone; label: string; hint: string }[] = [
  { value: "soft", label: "Suave", hint: "Recomendado" },
  { value: "balanced", label: "Equilibrado", hint: "Anterior" },
  { value: "deep", label: "Profundo", hint: "Máximo contraste" },
];

export default function DarkToneSelect({ className }: { className?: string }) {
  const { theme, darkTone, setDarkTone } = useTheme();

  if (theme !== "dark") return null;

  return (
    <div className={cn("flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1", className)}>
      {TONE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setDarkTone(option.value)}
          title={option.hint}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
            darkTone === option.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
