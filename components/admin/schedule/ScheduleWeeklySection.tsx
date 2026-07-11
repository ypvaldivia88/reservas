"use client";

import { DayOfWeek, DAY_NAMES, Schedule } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import StatusPill from "@/components/design/dashboard/StatusPill";
import { Plus, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleWeeklySectionProps {
  schedule: Schedule;
  saving: boolean;
  onToggleWorkingDay: (dayOfWeek: DayOfWeek) => void;
  onAddSlots: (dayOfWeek: DayOfWeek) => void;
  onEditSlot: (dayOfWeek: DayOfWeek, slotIndex: number, time: string) => void;
}

function WorkingDayToggle({
  active,
  disabled,
  label,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active ? "bg-emerald-500/90" : "bg-muted"
      )}
      aria-label={label}
      aria-pressed={active}
    >
      <span
        className={cn(
          "inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform",
          active ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

export default function ScheduleWeeklySection({
  schedule,
  saving,
  onToggleWorkingDay,
  onAddSlots,
  onEditSlot,
}: ScheduleWeeklySectionProps) {
  return (
    <section className="space-y-3">
      <div className="mb-1">
        <h2 className="text-lg font-semibold tracking-tight">Horario semanal</h2>
        <p className="text-sm text-muted-foreground">
          Activa cada día y define los turnos disponibles
        </p>
      </div>

      <div className="space-y-2.5">
        {schedule.schedule.map((day) => (
          <article
            key={day.dayOfWeek}
            className="dashboard-card rounded-2xl p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                    day.isWorkingDay
                      ? "bg-primary/12 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {DAY_NAMES[day.dayOfWeek].slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{DAY_NAMES[day.dayOfWeek]}</p>
                  <StatusPill variant={day.isWorkingDay ? "success" : "muted"}>
                    {day.isWorkingDay ? "Abierto" : "Cerrado"}
                  </StatusPill>
                </div>
              </div>
              <WorkingDayToggle
                active={day.isWorkingDay}
                disabled={saving}
                label={`${day.isWorkingDay ? "Cerrar" : "Abrir"} ${DAY_NAMES[day.dayOfWeek]}`}
                onClick={() => onToggleWorkingDay(day.dayOfWeek)}
              />
            </div>

            {day.isWorkingDay && (
              <div className="mt-4 border-t border-border/60 pt-4">
                {day.slots.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {day.slots.map((slot, idx) => (
                      <button
                        key={`${day.dayOfWeek}-${slot.time}-${idx}`}
                        type="button"
                        onClick={() => onEditSlot(day.dayOfWeek, idx, slot.time)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/30 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                      >
                        <Clock3 className="size-3.5" aria-hidden />
                        {slot.time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Sin horarios configurados
                  </p>
                )}
                <Button
                  onClick={() => onAddSlots(day.dayOfWeek)}
                  disabled={saving}
                  size="sm"
                  variant="outlined-secondary"
                  className="mt-3 w-full sm:w-auto"
                  icon={<Plus className="size-4" />}
                >
                  Agregar horario
                </Button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
