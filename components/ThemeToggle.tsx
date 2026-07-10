"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme, type ThemeTone } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const TONE_OPTIONS: { value: ThemeTone; label: string; hint: string }[] = [
  { value: "soft", label: "Suave", hint: "Menos contraste, más cómodo" },
  { value: "balanced", label: "Equilibrado", hint: "Balance estándar" },
  { value: "deep", label: "Profundo", hint: "Máximo contraste" },
];

export default function ThemeToggle() {
  const {
    theme,
    darkTone,
    lightTone,
    toggleTheme,
    setTheme,
    setDarkTone,
    setLightTone,
  } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!mounted) {
    return (
      <button
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted opacity-50"
        disabled
        aria-hidden
      >
        <div className="size-5" />
      </button>
    );
  }

  const activeTone = theme === "dark" ? darkTone : lightTone;
  const setActiveTone = theme === "dark" ? setDarkTone : setLightTone;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Apariencia y tema"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {theme === "light" ? (
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ) : (
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-[60] mt-2 w-56 rounded-xl border border-border bg-popover p-2 shadow-lg"
        >
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Modo
          </p>
          <div className="mb-2 grid grid-cols-2 gap-1">
            <button
              type="button"
              role="menuitemradio"
              aria-checked={theme === "light"}
              onClick={() => setTheme("light")}
              className={cn(
                "rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                theme === "light"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Claro
            </button>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={theme === "dark"}
              onClick={() => setTheme("dark")}
              className={cn(
                "rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                theme === "dark"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Oscuro
            </button>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              toggleTheme();
            }}
            className="mb-2 w-full rounded-lg px-2.5 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Alternar rápido
          </button>

          <div className="my-1 border-t border-border/60" />

          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Tono {theme === "dark" ? "oscuro" : "claro"}
          </p>
          <div className="space-y-0.5">
            {TONE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={activeTone === option.value}
                title={option.hint}
                onClick={() => setActiveTone(option.value)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
                  activeTone === option.value
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span>{option.label}</span>
                {activeTone === option.value && (
                  <span className="text-[10px] text-primary/80">Activo</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
