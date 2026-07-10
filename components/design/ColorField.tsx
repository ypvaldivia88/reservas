"use client";

import { useId, useRef } from "react";
import { Pipette } from "lucide-react";
import { normalizeHexColor } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

const SALON_PRESETS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#059669",
  "#0d9488",
  "#1e293b",
  "#f43f5e",
] as const;

export default function ColorField({
  label,
  description,
  value,
  onChange,
  fallback = "#2563eb",
  presets = SALON_PRESETS,
  showPresets = true,
  compact = false,
  className,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (hex: string) => void;
  fallback?: string;
  presets?: readonly string[];
  showPresets?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const inputId = useId();
  const pickerRef = useRef<HTMLInputElement>(null);
  const safeValue = normalizeHexColor(value || fallback, fallback);

  const applyColor = (next: string) => {
    onChange(normalizeHexColor(next, fallback));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div>
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      <div
        className={cn(
          "rounded-xl border border-border bg-card shadow-sm",
          compact ? "p-2" : "p-3"
        )}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => pickerRef.current?.click()}
            className={cn(
              "relative shrink-0 overflow-hidden rounded-xl border border-border shadow-inner transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              compact ? "size-10" : "size-12"
            )}
            style={{ backgroundColor: safeValue }}
            aria-label={`Elegir ${label.toLowerCase()}`}
          >
            <span className="absolute inset-0 flex items-center justify-center bg-black/15 opacity-0 transition-opacity hover:opacity-100">
              <Pipette className="size-4 text-white drop-shadow" aria-hidden />
            </span>
          </button>

          <div className="min-w-0 flex-1">
            <input
              id={inputId}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => applyColor(value)}
              placeholder={fallback}
              className="input-field font-mono text-sm uppercase"
              spellCheck={false}
              autoComplete="off"
            />
            {!compact && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Vista previa: {safeValue}
              </p>
            )}
          </div>

          <input
            ref={pickerRef}
            type="color"
            value={safeValue}
            onChange={(e) => applyColor(e.target.value)}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          />
        </div>

        {showPresets && presets.length > 0 && (
        <div className={cn("flex flex-wrap gap-2", compact ? "mt-2" : "mt-3")}>
          {presets.map((preset) => {
            const active = safeValue === preset.toLowerCase();
            return (
              <button
                key={preset}
                type="button"
                onClick={() => applyColor(preset)}
                className={cn(
                  "size-7 rounded-lg border transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-primary ring-2 ring-primary/30" : "border-border",
                  compact ? "size-6" : "size-7"
                )}
                style={{ backgroundColor: preset }}
                aria-label={`Usar ${preset}`}
                aria-pressed={active}
              />
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
