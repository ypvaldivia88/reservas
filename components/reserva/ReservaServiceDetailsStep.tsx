"use client";

import { FORMAS_UNAS, FormaUna, LARGOS_UNAS, ReservaFormData } from "@/lib/types";
import {
  FORMA_LABELS,
  LARGO_LABELS,
  getLargoSummary,
} from "@/lib/nail-form-labels";

function NailShapeIcon({ shape }: { shape: FormaUna }) {
  const base =
    "bg-gradient-to-t from-muted-foreground to-muted-foreground/35 dark:from-muted-foreground/90 dark:to-muted-foreground/50";

  switch (shape) {
    case "stiletto":
      return (
        <div
          className={`h-9 w-7 ${base}`}
          style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
          aria-hidden
        />
      );
    case "almond":
      return (
        <div
          className={`h-9 w-6 rounded-full ${base}`}
          style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}
          aria-hidden
        />
      );
    case "coffin":
      return (
        <div
          className={`h-9 w-6 rounded-b-full ${base}`}
          style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)" }}
          aria-hidden
        />
      );
    case "square":
    default:
      return <div className={`h-9 w-6 rounded-sm ${base}`} aria-hidden />;
  }
}

function NailLengthPreview({ selected }: { selected: string }) {
  const level = parseInt(selected, 10) || 3;

  return (
    <div
      className="mb-4 flex items-end justify-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-5"
      aria-hidden
    >
      {LARGOS_UNAS.map((n) => (
        <div
          key={n}
          className={`w-3 rounded-t-sm transition-all ${
            n === level ? "bg-primary" : "bg-muted-foreground/25"
          }`}
          style={{ height: `${n * 5 + 14}px` }}
        />
      ))}
    </div>
  );
}

interface ReservaServiceDetailsStepProps {
  form: ReservaFormData;
  errors: { forma?: string; largo?: string };
  onFieldChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onApplyRecommended: () => void;
}

export default function ReservaServiceDetailsStep({
  form,
  errors,
  onFieldChange,
  onApplyRecommended,
}: ReservaServiceDetailsStepProps) {
  const isRecommended = form.forma === "square" && form.largo === "3";

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
        <p className="text-sm font-medium text-foreground">
          ¿No estás segura? Puedes dejar la recomendación del salón y continuar.
        </p>
        <button
          type="button"
          onClick={onApplyRecommended}
          className={`mt-3 min-h-12 w-full rounded-xl border-2 px-4 text-left text-sm font-semibold transition-colors ${
            isRecommended
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground hover:border-primary/40"
          }`}
        >
          Usar recomendación del salón (cuadrada · largo natural)
        </button>
      </div>

      <div>
        <p className="mb-3 text-base font-semibold">Forma de la uña</p>
        <p className="mb-4 text-sm text-muted-foreground">
          Toca la tarjeta de la forma que prefieras.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {FORMAS_UNAS.map((forma) => {
            const meta = FORMA_LABELS[forma];
            const selected = form.forma === forma;
            return (
              <label
                key={forma}
                className={`relative flex min-h-[6.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-center transition-all ${
                  selected
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <input
                  type="radio"
                  name="forma"
                  value={forma}
                  checked={selected}
                  onChange={onFieldChange}
                  className="sr-only"
                />
                <NailShapeIcon shape={forma} />
                <span className="text-base font-semibold">{meta.label}</span>
                <span className="text-xs text-muted-foreground">{meta.hint}</span>
                {selected && (
                  <span className="absolute right-2 top-2 text-primary" aria-hidden>
                    ✓
                  </span>
                )}
              </label>
            );
          })}
        </div>
        {errors.forma && (
          <p className="mt-2 text-sm text-destructive">{errors.forma}</p>
        )}
      </div>

      <div>
        <p className="mb-3 text-base font-semibold">Largo deseado</p>
        <p className="mb-4 text-sm text-muted-foreground">
          Del 1 (muy corto) al 8 (muy largo). El 3 es el largo natural.
        </p>

        <NailLengthPreview selected={form.largo} />

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {LARGOS_UNAS.map((n) => {
            const selected = form.largo === n.toString();
            return (
              <button
                key={n}
                type="button"
                onClick={() =>
                  onFieldChange({
                    target: { name: "largo", value: n.toString() },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
                className={`min-h-12 rounded-xl border-2 text-sm font-bold transition-all ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
                aria-pressed={selected}
              >
                {n}
              </button>
            );
          })}
        </div>

        {form.largo && (
          <p className="mt-3 rounded-xl bg-muted/50 px-4 py-3 text-sm text-foreground">
            <strong>{LARGO_LABELS[parseInt(form.largo, 10)] ?? "Largo"}:</strong>{" "}
            {getLargoSummary(form.largo)}
          </p>
        )}
        {errors.largo && (
          <p className="mt-2 text-sm text-destructive">{errors.largo}</p>
        )}
      </div>
    </div>
  );
}
