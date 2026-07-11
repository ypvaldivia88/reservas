"use client";

import { AvailabilityOverride } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import StatusPill from "@/components/design/dashboard/StatusPill";
import { CalendarDays, ChevronDown, Clock3, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpecialDaysSectionProps {
  upcomingSpecialDays: AvailabilityOverride[];
  pastSpecialDays: AvailabilityOverride[];
  showPastSpecialDays: boolean;
  saving: boolean;
  formatDate: (dateString: string) => string;
  onTogglePast: () => void;
  onAdd: () => void;
  onEdit: (day: AvailabilityOverride) => void;
  onDelete: (date: string) => void;
}

function SpecialDayCard({
  day,
  muted,
  saving,
  formatDate,
  onEdit,
  onDelete,
}: {
  day: AvailabilityOverride;
  muted?: boolean;
  saving: boolean;
  formatDate: (dateString: string) => string;
  onEdit: (day: AvailabilityOverride) => void;
  onDelete: (date: string) => void;
}) {
  return (
    <article
      className={cn(
        "dashboard-card rounded-2xl p-4 sm:p-5",
        muted && "opacity-80"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold capitalize leading-snug">
            {formatDate(day.date)}
          </p>
          {day.reason && (
            <p className="mt-1 truncate text-sm text-muted-foreground">{day.reason}</p>
          )}
          <div className="mt-2">
            <StatusPill variant={day.isWorkingDay ? "success" : "warning"}>
              {day.isWorkingDay ? "Abierto" : "Cerrado"}
            </StatusPill>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onEdit(day)}
            disabled={saving}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:opacity-50"
            aria-label="Editar día especial"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(day.date)}
            disabled={saving}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            aria-label="Eliminar día especial"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {day.isWorkingDay && day.slots && day.slots.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
          {day.slots.map((slot, idx) => (
            <span
              key={`${day.date}-${slot.time}-${idx}`}
              className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-1 text-xs font-medium text-foreground"
            >
              <Clock3 className="size-3" aria-hidden />
              {slot.time}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export default function SpecialDaysSection({
  upcomingSpecialDays,
  pastSpecialDays,
  showPastSpecialDays,
  saving,
  formatDate,
  onTogglePast,
  onAdd,
  onEdit,
  onDelete,
}: SpecialDaysSectionProps) {
  const isEmpty = upcomingSpecialDays.length === 0 && pastSpecialDays.length === 0;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Días especiales</h2>
          <p className="text-sm text-muted-foreground">
            Feriados, cierres o horarios distintos por fecha
          </p>
        </div>
        <Button onClick={onAdd} disabled={saving} size="sm" icon={<Plus className="size-4" />}>
          Agregar
        </Button>
      </div>

      {isEmpty ? (
        <div className="dashboard-card flex flex-col items-center gap-2 rounded-2xl px-6 py-10 text-center">
          <CalendarDays className="size-10 text-muted-foreground/70" aria-hidden />
          <p className="font-medium">No hay días especiales</p>
          <p className="text-sm text-muted-foreground">
            Agrega feriados, eventos o cierres temporales
          </p>
        </div>
      ) : (
        <>
          {upcomingSpecialDays.length === 0 ? (
            <div className="dashboard-card rounded-2xl px-4 py-6 text-center text-sm text-muted-foreground">
              No hay días especiales próximos
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingSpecialDays.map((day) => (
                <SpecialDayCard
                  key={day._id || day.date}
                  day={day}
                  saving={saving}
                  formatDate={formatDate}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}

          {pastSpecialDays.length > 0 && (
            <div className="dashboard-card overflow-hidden rounded-2xl">
              <button
                type="button"
                onClick={onTogglePast}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/30 sm:px-5"
                aria-expanded={showPastSpecialDays}
              >
                <div>
                  <p className="text-sm font-semibold">Días pasados</p>
                  <p className="text-xs text-muted-foreground">
                    {pastSpecialDays.length}{" "}
                    {pastSpecialDays.length === 1 ? "registro" : "registros"}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-muted-foreground transition-transform",
                    showPastSpecialDays && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>

              {showPastSpecialDays && (
                <div className="space-y-2.5 border-t border-border/60 p-3 sm:p-4">
                  {pastSpecialDays.map((day) => (
                    <SpecialDayCard
                      key={day._id || day.date}
                      day={day}
                      muted
                      saving={saving}
                      formatDate={formatDate}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
