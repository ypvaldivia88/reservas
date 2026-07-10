"use client";
import { useState, useEffect, useCallback } from "react";
import { dateUtils } from "@/lib/utils";

interface AvailableSlot {
  date: string;
  slots: { time: string; available: boolean }[];
  isWorkingDay: boolean;
  clientHasBooking?: boolean;
}

interface CalendarPickerProps {
  selectedDate: string;
  selectedTime: string;
  telefono?: string;
  salonSlug?: string;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
}

export default function CalendarPicker({
  selectedDate,
  selectedTime,
  telefono,
  salonSlug,
  onDateSelect,
  onTimeSelect,
}: CalendarPickerProps) {
  const [availability, setAvailability] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadAvailability = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentMonth);
      startDate.setDate(1);

      const endDate = new Date(currentMonth);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);

      const telefonoQuery =
        telefono?.trim() ?
          `&telefono=${encodeURIComponent(telefono.trim())}`
        : "";
      const slugQuery =
        salonSlug ? `&slug=${encodeURIComponent(salonSlug)}` : "";
      const res = await fetch(
        `/api/availability?startDate=${dateUtils.formatToYYYYMMDD(startDate)}&endDate=${dateUtils.formatToYYYYMMDD(endDate)}${telefonoQuery}${slugQuery}`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAvailability(data.data.availability);
        }
      }
    } catch (error) {
      console.error("Error cargando disponibilidad:", error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, telefono, salonSlug]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // Días vacíos al inicio
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getDateString = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return dateUtils.formatToYYYYMMDD(date);
  };

  const getAvailabilityForDate = (day: number) => {
    const dateString = getDateString(day);
    return availability.find((a) => a.date === dateString);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (day: number) => {
    const dateString = getDateString(day);
    const avail = getAvailabilityForDate(day);

    if (avail && avail.isWorkingDay && avail.slots.some((s) => s.available)) {
      onDateSelect(dateString);
      onTimeSelect(""); // Reset time selection
    }
  };

  const selectedDateAvailability = availability.find(
    (a) => a.date === selectedDate
  );

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const days = getDaysInMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      {/* Selector de mes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handlePreviousMonth}
            className="min-h-12 min-w-12 rounded-xl p-3 transition-colors hover:bg-muted disabled:opacity-40"
            disabled={
              currentMonth.getFullYear() === today.getFullYear() &&
              currentMonth.getMonth() === today.getMonth()
            }
            aria-label="Mes anterior"
          >
            <span className="text-2xl">←</span>
          </button>
          <h3 className="text-lg font-semibold text-foreground sm:text-xl">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            type="button"
            onClick={handleNextMonth}
            className="min-h-12 min-w-12 rounded-xl p-3 transition-colors hover:bg-muted"
            aria-label="Mes siguiente"
          >
            <span className="text-2xl">→</span>
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendario */}
        {loading ?
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        : <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateString = getDateString(day);
              const dateObj = dateUtils.parseDate(dateString);
              const avail = getAvailabilityForDate(day);
              const isToday = dateObj.getTime() === today.getTime();
              const isPast = dateObj < today;
              const isSelected = selectedDate === dateString;
              const hasAvailability =
                avail &&
                avail.isWorkingDay &&
                avail.slots.some((s) => s.available);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  disabled={isPast || !hasAvailability}
                  className={`flex min-h-12 items-center justify-center rounded-xl p-2 text-base font-semibold transition-all sm:min-h-14 ${
                    isSelected ? "bg-primary text-primary-foreground shadow-lg"
                    : isPast ?
                      "cursor-not-allowed text-muted-foreground/40"
                    : hasAvailability ?
                      "border-2 border-primary/30 bg-primary/5 text-foreground hover:border-primary/60 hover:bg-primary/10"
                    : "cursor-not-allowed bg-muted text-muted-foreground"
                  } ${isToday ? "ring-2 ring-primary/50" : ""}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        }
      </div>

      {/* Slots de tiempo disponibles */}
      {selectedDate && selectedDateAvailability && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Horarios disponibles para{" "}
            {dateUtils.parseDate(selectedDate).toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h4>
          {(
            selectedDateAvailability.slots.filter((s) => s.available).length > 0
          ) ?
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {selectedDateAvailability.slots
                .filter((slot) => slot.available)
                .map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => onTimeSelect(slot.time)}
                    className={`min-h-12 rounded-xl border-2 px-3 py-3 text-center text-base font-semibold transition-all ${
                      selectedTime === slot.time ?
                        "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
            </div>
          : <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              {selectedDateAvailability.clientHasBooking ?
                "Ya tienes una cita activa este día. Cancela la existente o elige otro día."
              : "No hay horarios disponibles para esta fecha"}
            </p>
          }
        </div>
      )}
    </div>
  );
}
