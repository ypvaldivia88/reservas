"use client";

import { lazy, Suspense } from "react";
import ColorField from "@/components/design/ColorField";
import { isValidHexColor } from "@/lib/color-utils";
import { ReservaOptionalPreferencesCopy } from "@/lib/reserva-template-config";

const InspirationGalleryAccordion = lazy(
  () => import("@/components/InspirationGalleryAccordion")
);

const PREDEFINED_COLORS = [
  { name: "Rosa", color: "#FFB6C1" },
  { name: "Rojo", color: "#DC143C" },
  { name: "Dorado", color: "#FFD700" },
  { name: "Plata", color: "#C0C0C0" },
  { name: "Negro", color: "#000000" },
  { name: "Blanco", color: "#FFFFFF" },
  { name: "Azul", color: "#4169E1" },
  { name: "Morado", color: "#9370DB" },
];

interface ReservaOptionalPreferencesProps {
  open: boolean;
  onToggle: () => void;
  salonSlug?: string;
  preferences: ReservaOptionalPreferencesCopy;
  selectedColors: string[];
  customColor: string;
  selectedDecorations: string[];
  customDecoration: string;
  onToggleColor: (name: string) => void;
  onCustomColorChange: (value: string) => void;
  onAddCustomColor: () => void;
  onRemoveColor: (name: string) => void;
  onToggleDecoration: (name: string) => void;
  onCustomDecorationChange: (value: string) => void;
  onImageSelect: (image: {
    blobUrl: string;
    titulo?: string;
    nombre?: string;
    descripcion?: string;
  }) => void;
}

export default function ReservaOptionalPreferences({
  open,
  onToggle,
  salonSlug,
  preferences,
  selectedColors,
  customColor,
  selectedDecorations,
  customDecoration,
  onToggleColor,
  onCustomColorChange,
  onAddCustomColor,
  onRemoveColor,
  onToggleDecoration,
  onCustomDecorationChange,
  onImageSelect,
}: ReservaOptionalPreferencesProps) {
  const decorations = preferences.decorations;

  return (
    <div className="rounded-xl border border-border/80 bg-muted/20">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-base font-semibold">{preferences.title}</p>
          <p className="text-sm text-muted-foreground">{preferences.subtitle}</p>
        </div>
        <span className="text-xl text-muted-foreground" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="space-y-5 border-t border-border/60 px-4 pb-4 pt-4">
          {preferences.showColorPicker && (
          <div>
            <p className="mb-3 text-sm font-medium">
              {preferences.colorsSectionTitle ?? "Colores que te gustan"}
            </p>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_COLORS.map((colorOption) => {
                const selected = selectedColors.includes(colorOption.name);
                return (
                  <button
                    key={colorOption.name}
                    type="button"
                    onClick={() => onToggleColor(colorOption.name)}
                    className={`min-h-11 rounded-full border-2 px-4 text-sm font-medium transition-colors ${
                      selected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-4 rounded-full border border-border"
                        style={{ backgroundColor: colorOption.color }}
                      />
                      {colorOption.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <ColorField
                label="Otro color"
                description="Opcional"
                value={customColor}
                onChange={onCustomColorChange}
                fallback="#e11d48"
                compact
                presets={[
                  "#f8b4c4",
                  "#e11d48",
                  "#dc2626",
                  "#f97316",
                  "#eab308",
                  "#22c55e",
                  "#3b82f6",
                  "#8b5cf6",
                ]}
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={onAddCustomColor}
                disabled={!isValidHexColor(customColor.trim())}
                className="min-h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Agregar
              </button>
            </div>

            {selectedColors.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedColors.map((color) => {
                  const colorData = PREDEFINED_COLORS.find((c) => c.name === color);
                  const isHex = color.startsWith("#");
                  return (
                    <span
                      key={color}
                      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm"
                    >
                      <span
                        className="size-4 rounded-full border border-border"
                        style={{
                          backgroundColor: isHex ? color : colorData?.color,
                        }}
                      />
                      {isHex ? colorData?.name ?? "Personalizado" : color}
                      <button
                        type="button"
                        onClick={() => onRemoveColor(color)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Quitar ${color}`}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {decorations.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-medium">
              {preferences.decorationsSectionTitle ?? "Decoración o diseño"}
            </p>
            <div className="flex flex-wrap gap-2">
              {decorations.map((decoration) => {
                const selected = selectedDecorations.includes(decoration);
                return (
                  <button
                    key={decoration}
                    type="button"
                    onClick={() => onToggleDecoration(decoration)}
                    className={`min-h-11 rounded-full border-2 px-4 text-sm font-medium transition-colors ${
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    {decoration}
                  </button>
                );
              })}
            </div>

            <textarea
              rows={3}
              value={customDecoration}
              onChange={(e) => onCustomDecorationChange(e.target.value)}
              placeholder={
                preferences.customDecorationPlaceholder ??
                "Cuéntanos con tus palabras qué te gustaría (opcional)"
              }
              className="input-field mt-3 min-h-[5.5rem] text-base"
            />
          </div>
          )}

          <div className="border-t border-border/60 pt-4">
            <p className="mb-3 text-sm font-medium">
              {preferences.gallerySectionTitle ?? "Inspiración de la galería"}
            </p>
            <Suspense
              fallback={
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Cargando galería...
                </div>
              }
            >
              <InspirationGalleryAccordion
                salonSlug={salonSlug}
                onImageSelect={onImageSelect}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
