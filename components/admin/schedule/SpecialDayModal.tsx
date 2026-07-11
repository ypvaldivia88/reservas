"use client";

import TimePickerInput from "@/components/TimePickerInput";
import SegmentedControl from "@/components/design/dashboard/SegmentedControl";
import { Button } from "@/components/ui/Button";
import {
  EditingSpecialDayState,
  SpecialDayDateMode,
} from "@/lib/admin-schedule-types";
import { X } from "lucide-react";

interface SpecialDayModalProps {
  open: boolean;
  editingSpecialDay: EditingSpecialDayState;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (next: EditingSpecialDayState) => void;
}

const DATE_MODE_OPTIONS: { value: SpecialDayDateMode; label: string }[] = [
  { value: "single", label: "Una fecha" },
  { value: "range", label: "Rango" },
  { value: "multiple", label: "Varias" },
];

export default function SpecialDayModal({
  open,
  editingSpecialDay,
  saving,
  onClose,
  onSave,
  onChange,
}: SpecialDayModalProps) {
  if (!open) return null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-card shadow-xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="special-day-modal-title"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-4 sm:px-5">
          <h3 id="special-day-modal-title" className="text-lg font-semibold">
            {editingSpecialDay.isEditing ? "Editar día especial" : "Agregar día especial"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
          {!editingSpecialDay.isEditing && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selección de fechas</p>
              <div className="-mx-1 overflow-x-auto px-1 pb-1">
                <SegmentedControl
                  value={editingSpecialDay.dateMode}
                  options={DATE_MODE_OPTIONS}
                  onChange={(dateMode) => onChange({ ...editingSpecialDay, dateMode })}
                />
              </div>
            </div>
          )}

          {(editingSpecialDay.dateMode === "single" || editingSpecialDay.isEditing) && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Fecha</label>
              <input
                type="date"
                value={editingSpecialDay.singleDate}
                onChange={(e) =>
                  onChange({ ...editingSpecialDay, singleDate: e.target.value })
                }
                className="input-field w-full"
                min={today}
              />
            </div>
          )}

          {!editingSpecialDay.isEditing && editingSpecialDay.dateMode === "range" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Desde</label>
                <input
                  type="date"
                  value={editingSpecialDay.startDate}
                  onChange={(e) =>
                    onChange({ ...editingSpecialDay, startDate: e.target.value })
                  }
                  className="input-field w-full"
                  min={today}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Hasta</label>
                <input
                  type="date"
                  value={editingSpecialDay.endDate}
                  onChange={(e) =>
                    onChange({ ...editingSpecialDay, endDate: e.target.value })
                  }
                  className="input-field w-full"
                  min={editingSpecialDay.startDate || today}
                />
              </div>
            </div>
          )}

          {!editingSpecialDay.isEditing && editingSpecialDay.dateMode === "multiple" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Agregar fechas</label>
              <input
                type="date"
                onChange={(e) => {
                  const date = e.target.value;
                  if (date && !editingSpecialDay.multipleDates.includes(date)) {
                    onChange({
                      ...editingSpecialDay,
                      multipleDates: [...editingSpecialDay.multipleDates, date].sort(),
                    });
                  }
                }}
                className="input-field w-full"
                min={today}
              />
              {editingSpecialDay.multipleDates.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {editingSpecialDay.multipleDates.map((date) => (
                    <span
                      key={date}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1 text-sm"
                    >
                      {new Date(`${date}T00:00:00`).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                      })}
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...editingSpecialDay,
                            multipleDates: editingSpecialDay.multipleDates.filter(
                              (d) => d !== date
                            ),
                          })
                        }
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Quitar ${date}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium">Motivo</label>
            <input
              type="text"
              value={editingSpecialDay.reason}
              onChange={(e) =>
                onChange({ ...editingSpecialDay, reason: e.target.value })
              }
              placeholder="Feriado, evento, vacaciones..."
              className="input-field w-full"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-3">
            <input
              type="checkbox"
              checked={editingSpecialDay.isWorkingDay}
              onChange={(e) =>
                onChange({
                  ...editingSpecialDay,
                  isWorkingDay: e.target.checked,
                  slots: e.target.checked ? editingSpecialDay.slots : "",
                })
              }
              className="mt-0.5 size-4 rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-sm">
              <span className="font-medium">Día laborable</span>
              <span className="mt-0.5 block text-muted-foreground">
                Usa horarios distintos al semanal habitual
              </span>
            </span>
          </label>

          {editingSpecialDay.isWorkingDay && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Horarios</label>
              <TimePickerInput
                value={editingSpecialDay.slots}
                onChange={(slots) => onChange({ ...editingSpecialDay, slots })}
                placeholder="Selecciona horarios"
                className="w-full"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-border/60 bg-muted/20 px-4 py-4 sm:px-5">
          <Button
            type="button"
            onClick={onClose}
            disabled={saving}
            variant="outlined-secondary"
            fullWidth
          >
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={saving} loading={saving} variant="primary" fullWidth>
            {editingSpecialDay.isEditing ? "Guardar cambios" : "Guardar días"}
          </Button>
        </div>
      </div>
    </div>
  );
}
