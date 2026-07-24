"use client";

import { Servicio } from "@/lib/types";
import { CheckIcon } from "@/components/ui/Icons";

interface ReservaServicesPickerStepProps {
  heading: string;
  description: string;
  servicios: Servicio[];
  selectedIds: string[];
  onToggle: (servicioId: string) => void;
  loading: boolean;
  error?: string;
  notes: string;
  onNotesChange: (value: string) => void;
  notesPlaceholder?: string;
}

function formatPrecio(precio?: number): string | null {
  if (precio === undefined || precio === null || precio <= 0) return null;
  return `${precio} CUP`;
}

export default function ReservaServicesPickerStep({
  heading,
  description,
  servicios,
  selectedIds,
  onToggle,
  loading,
  error,
  notes,
  onNotesChange,
  notesPlaceholder,
}: ReservaServicesPickerStepProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (servicios.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        No hay servicios disponibles en este momento. Contacta al salón para
        reservar.
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 sm:p-5">
        <h3 className="text-base font-semibold text-foreground">{heading}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {servicios.map((servicio) => {
          const selected = selectedIds.includes(servicio._id!);
          const precio = formatPrecio(servicio.precio);

          return (
            <button
              key={servicio._id}
              type="button"
              onClick={() => onToggle(servicio._id!)}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {selected && (
                <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <CheckIcon className="size-3.5" />
                </span>
              )}
              <p className="pr-8 font-semibold text-foreground">
                {servicio.nombre}
              </p>
              {servicio.descripcion && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {servicio.descripcion}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {servicio.duracion ? (
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {servicio.duracion} min
                  </span>
                ) : null}
                {precio ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
                    {precio}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}

      <div>
        <label
          htmlFor="reserva-service-notes"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Notas adicionales (opcional)
        </label>
        <textarea
          id="reserva-service-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder={
            notesPlaceholder ||
            "Ej: preferencia de horario, alergias, estilo deseado…"
          }
          className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}
