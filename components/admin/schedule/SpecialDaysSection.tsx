"use client";

import { useEffect, useMemo, useState } from "react";
import { AvailabilityOverride } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import StatusPill from "@/components/design/dashboard/StatusPill";
import { CalendarDays, ChevronDown, Clock3, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpecialDaysSectionProps {
  upcomingSpecialDays: AvailabilityOverride[];
  pastSpecialDays: AvailabilityOverride[];
  saving: boolean;
  onAdd: () => void;
  onEdit: (day: AvailabilityOverride) => void;
  onDelete: (date: string) => void;
}

interface MonthGroup {
  key: string;
  label: string;
  days: AvailabilityOverride[];
}

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function formatDayLabel(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
  }).format(date);
}

function groupByMonth(days: AvailabilityOverride[]): MonthGroup[] {
  const map = new Map<string, AvailabilityOverride[]>();

  for (const day of days) {
    const key = getMonthKey(day.date);
    const list = map.get(key) ?? [];
    list.push(day);
    map.set(key, list);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, groupedDays]) => ({
      key,
      label: formatMonthLabel(key),
      days: groupedDays.sort((a, b) => a.date.localeCompare(b.date)),
    }));
}

function SpecialDayCard({
  day,
  muted,
  saving,
  onEdit,
  onDelete,
}: {
  day: AvailabilityOverride;
  muted?: boolean;
  saving: boolean;
  onEdit: (day: AvailabilityOverride) => void;
  onDelete: (date: string) => void;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border border-border/60 bg-muted/15 p-3.5 sm:p-4",
        muted && "opacity-80"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold capitalize leading-snug">
            {formatDayLabel(day.date)}
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

function MonthAccordion({
  group,
  muted,
  expanded,
  saving,
  onToggle,
  onEdit,
  onDelete,
}: {
  group: MonthGroup;
  muted?: boolean;
  expanded: boolean;
  saving: boolean;
  onToggle: () => void;
  onEdit: (day: AvailabilityOverride) => void;
  onDelete: (date: string) => void;
}) {
  return (
    <div className="dashboard-card overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/30 sm:px-5"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold capitalize">{group.label}</p>
          <p className="text-xs text-muted-foreground">
            {group.days.length} {group.days.length === 1 ? "día" : "días"}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-border/60 p-3 sm:p-4">
          {group.days.map((day) => (
            <SpecialDayCard
              key={day._id || day.date}
              day={day}
              muted={muted}
              saving={saving}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SpecialDaysSection({
  upcomingSpecialDays,
  pastSpecialDays,
  saving,
  onAdd,
  onEdit,
  onDelete,
}: SpecialDaysSectionProps) {
  const upcomingByMonth = useMemo(
    () => groupByMonth(upcomingSpecialDays),
    [upcomingSpecialDays]
  );
  const pastByMonth = useMemo(() => groupByMonth(pastSpecialDays), [pastSpecialDays]);

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [showPastMonths, setShowPastMonths] = useState(false);

  useEffect(() => {
    if (upcomingByMonth.length === 0) return;
    setExpandedMonths((prev) => {
      if (prev.size > 0) return prev;
      const keys = new Set<string>();
      if (upcomingByMonth.some((g) => g.key === currentMonthKey)) {
        keys.add(currentMonthKey);
      } else {
        keys.add(upcomingByMonth[0].key);
      }
      return keys;
    });
  }, [upcomingByMonth, currentMonthKey]);

  const isEmpty = upcomingSpecialDays.length === 0 && pastSpecialDays.length === 0;

  const toggleMonth = (key: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

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
          {upcomingByMonth.length === 0 ? (
            <div className="dashboard-card rounded-2xl px-4 py-6 text-center text-sm text-muted-foreground">
              No hay días especiales próximos
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingByMonth.map((group) => (
                <MonthAccordion
                  key={group.key}
                  group={group}
                  expanded={expandedMonths.has(group.key)}
                  saving={saving}
                  onToggle={() => toggleMonth(group.key)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}

          {pastByMonth.length > 0 && (
            <div className="dashboard-card overflow-hidden rounded-2xl">
              <button
                type="button"
                onClick={() => setShowPastMonths((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/30 sm:px-5"
                aria-expanded={showPastMonths}
              >
                <div>
                  <p className="text-sm font-semibold">Meses anteriores</p>
                  <p className="text-xs text-muted-foreground">
                    {pastSpecialDays.length}{" "}
                    {pastSpecialDays.length === 1 ? "día" : "días"} en{" "}
                    {pastByMonth.length} {pastByMonth.length === 1 ? "mes" : "meses"}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-muted-foreground transition-transform",
                    showPastMonths && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>

              {showPastMonths && (
                <div className="space-y-2.5 border-t border-border/60 p-3 sm:p-4">
                  {pastByMonth
                    .slice()
                    .reverse()
                    .map((group) => (
                      <MonthAccordion
                        key={group.key}
                        group={group}
                        muted
                        expanded={expandedMonths.has(`past-${group.key}`)}
                        saving={saving}
                        onToggle={() => toggleMonth(`past-${group.key}`)}
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
