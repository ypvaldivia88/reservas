"use client";
import { useState, useEffect, useCallback } from "react";
import { DAY_NAMES, DayOfWeek } from "@/lib/types";

interface AvailableSlot {
  date: string;
  slots: { time: string; available: boolean }[];
  isWorkingDay: boolean;
}

interface CalendarPickerProps {
  selectedDate: string;
  selectedTime: string;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
}

export default function CalendarPicker({
  selectedDate,
  selectedTime,
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

      const res = await fetch(
        `/api/availability?startDate=${startDate.toISOString().split("T")[0]}&endDate=${endDate.toISOString().split("T")[0]}`
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
  }, [currentMonth]);

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
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, day);
    return date.toISOString().split("T")[0];
  };

  const getAvailabilityForDate = (day: number) => {
    const dateString = getDateString(day);
    return availability.find((a) => a.date === dateString);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const dateString = getDateString(day);
    const avail = getAvailabilityForDate(day);
    
    if (avail && avail.isWorkingDay && avail.slots.some(s => s.available)) {
      onDateSelect(dateString);
      onTimeSelect(""); // Reset time selection
    }
  };

  const selectedDateAvailability = availability.find((a) => a.date === selectedDate);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
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
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={
              currentMonth.getFullYear() === today.getFullYear() &&
              currentMonth.getMonth() === today.getMonth()
            }
          >
            <span className="text-xl">←</span>
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-xl">→</span>
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
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateString = getDateString(day);
              const dateObj = new Date(dateString + "T00:00:00");
              const avail = getAvailabilityForDate(day);
              const isToday = dateObj.getTime() === today.getTime();
              const isPast = dateObj < today;
              const isSelected = selectedDate === dateString;
              const hasAvailability = avail && avail.isWorkingDay && avail.slots.some(s => s.available);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  disabled={isPast || !hasAvailability}
                  className={`aspect-square p-2 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-lg"
                      : isPast
                      ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                      : hasAvailability
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 border-2 border-green-200 dark:border-green-800"
                      : "bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  } ${isToday ? "ring-2 ring-blue-400" : ""}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Slots de tiempo disponibles */}
      {selectedDate && selectedDateAvailability && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Horarios disponibles para {new Date(selectedDate + "T00:00:00").toLocaleDateString("es-ES", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </h4>
          {selectedDateAvailability.slots.filter(s => s.available).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selectedDateAvailability.slots
                .filter((slot) => slot.available)
                .map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => onTimeSelect(slot.time)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      selectedTime === slot.time
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-25 dark:hover:bg-blue-900/10 text-gray-900 dark:text-white"
                    }`}
                  >
                    <div className="font-semibold">{slot.time}</div>
                  </button>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No hay horarios disponibles para esta fecha
            </p>
          )}
        </div>
      )}

      {/* Leyenda */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Leyenda:</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Días disponibles</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Fecha seleccionada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-50 dark:bg-gray-700 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">No disponible</span>
          </div>
        </div>
      </div>
    </div>
  );
}
