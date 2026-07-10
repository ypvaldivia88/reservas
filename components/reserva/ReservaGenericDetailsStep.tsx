"use client";

import { ReservaFormData } from "@/lib/types";
import { ReservaTemplateConfig } from "@/lib/reserva-template-config";

interface ReservaGenericDetailsStepProps {
  config: ReservaTemplateConfig;
  notes: string;
  onNotesChange: (value: string) => void;
  onQuickOption: (option: string) => void;
}

export default function ReservaGenericDetailsStep({
  config,
  notes,
  onNotesChange,
  onQuickOption,
}: ReservaGenericDetailsStepProps) {
  const details = config.reservation.genericDetails;

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 sm:p-5">
        <h3 className="text-base font-semibold text-foreground">
          {details.heading}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {details.description}
        </p>
      </div>

      {details.quickOptions.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">
            Opciones rápidas
          </p>
          <div className="flex flex-wrap gap-2">
            {details.quickOptions.map((option) => {
              const selected = notes.trim() === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onQuickOption(option)}
                  className={`min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="reserva-generic-notes"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          {details.notesLabel}
        </label>
        <textarea
          id="reserva-generic-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          placeholder={details.notesPlaceholder}
          className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Puedes dejarlo en blanco y confirmar los detalles con el negocio.
        </p>
      </div>
    </div>
  );
}

export function applyGenericDefaults(
  form: ReservaFormData,
  config: ReservaTemplateConfig
): ReservaFormData {
  return {
    ...form,
    forma: config.reservation.genericDetails.defaultForma,
    largo: "3",
  };
}
