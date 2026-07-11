"use client";

import { DayOfWeek, DAY_NAMES } from "@/lib/types";
import TimePickerInput from "@/components/TimePickerInput";
import { Button } from "@/components/ui/Button";
import { Trash2, Check, X } from "lucide-react";

interface ScheduleTimeModalProps {
  open: boolean;
  editingDay: DayOfWeek;
  editingSlots: string;
  editingSlotIndex: number | null;
  saving: boolean;
  onChangeSlots: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export default function ScheduleTimeModal({
  open,
  editingDay,
  editingSlots,
  editingSlotIndex,
  saving,
  onChangeSlots,
  onClose,
  onSave,
  onDelete,
}: ScheduleTimeModalProps) {
  if (!open) return null;

  const isEdit = editingSlotIndex !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-card shadow-xl sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-time-modal-title"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-4 sm:px-5">
          <h3 id="schedule-time-modal-title" className="text-lg font-semibold">
            {isEdit ? "Editar horario" : "Agregar horario"} · {DAY_NAMES[editingDay]}
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

        <div className="space-y-2 px-4 py-5 sm:px-5">
          <label className="block text-sm font-medium">
            {isEdit ? "Horario" : "Horarios (separados por comas)"}
          </label>
          <TimePickerInput
            value={editingSlots}
            onChange={onChangeSlots}
            placeholder={isEdit ? "HH:mm" : "HH:mm, HH:mm, ..."}
            className="w-full"
            singleMode={isEdit}
          />
          {!isEdit && (
            <p className="text-xs text-muted-foreground">
              Puedes agregar varios horarios en una sola vez
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-border/60 bg-muted/20 px-4 py-4 sm:px-5">
          {isEdit && (
            <Button
              onClick={onDelete}
              disabled={saving}
              variant="outlined-danger"
              loading={saving}
              fullWidth
              icon={<Trash2 className="size-4" />}
            >
              Eliminar
            </Button>
          )}
          <Button
            onClick={onSave}
            disabled={saving}
            variant="primary"
            loading={saving}
            fullWidth
            icon={<Check className="size-4" />}
          >
            {isEdit ? "Guardar" : "Agregar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
