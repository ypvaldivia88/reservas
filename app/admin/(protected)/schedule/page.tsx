"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Schedule,
  DayOfWeek,
  DAY_NAMES,
  AvailabilityOverride,
} from "@/lib/types";
import TimePickerInput from "@/components/TimePickerInput";
import { Button } from "@/components/ui/Button";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  SaveIcon,
  CloseIcon,
  CheckIcon,
} from "@/components/ui/Icons";

export default function AdminSchedulePage() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [editingSlots, setEditingSlots] = useState<string>("");
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [specialDays, setSpecialDays] = useState<AvailabilityOverride[]>([]);
  const [showSpecialDayModal, setShowSpecialDayModal] = useState(false);
  const [openMenuSpecialDayId, setOpenMenuSpecialDayId] = useState<
    string | null
  >(null);
  const [showPastSpecialDays, setShowPastSpecialDays] = useState(false);
  const [editingSpecialDay, setEditingSpecialDay] = useState<{
    _id?: string;
    dateMode: "single" | "range" | "multiple";
    singleDate: string;
    startDate: string;
    endDate: string;
    multipleDates: string[];
    reason: string;
    isWorkingDay: boolean;
    slots: string;
    isEditing: boolean;
  }>({
    dateMode: "single",
    singleDate: "",
    startDate: "",
    endDate: "",
    multipleDates: [],
    reason: "",
    isWorkingDay: false,
    slots: "",
    isEditing: false,
  });

  useEffect(() => {
    loadSchedule();
    loadSpecialDays();
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = () => {
      if (openMenuSpecialDayId) {
        setOpenMenuSpecialDayId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuSpecialDayId]);

  const loadSchedule = async () => {
    try {
      const res = await fetch("/api/schedules?name=default");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSchedule(data.data);
        }
      }
    } catch (error) {
      console.error("Error cargando horario:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSpecialDays = async () => {
    try {
      const res = await fetch("/api/special-days");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSpecialDays(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error cargando días especiales:", error);
    }
  };

  const handleToggleWorkingDay = async (dayOfWeek: DayOfWeek) => {
    if (!schedule) return;

    setSaving(true);
    const updatedSchedule = { ...schedule };
    const dayIndex = updatedSchedule.schedule.findIndex(
      (d) => d.dayOfWeek === dayOfWeek
    );

    if (dayIndex >= 0) {
      updatedSchedule.schedule[dayIndex].isWorkingDay =
        !updatedSchedule.schedule[dayIndex].isWorkingDay;

      // Si se activa el día, agregar slots por defecto
      if (
        updatedSchedule.schedule[dayIndex].isWorkingDay &&
        updatedSchedule.schedule[dayIndex].slots.length === 0
      ) {
        updatedSchedule.schedule[dayIndex].slots = [
          { time: "08:30", available: true },
          { time: "10:30", available: true },
          { time: "14:00", available: true },
          { time: "16:00", available: true },
        ];
      }

      await saveSchedule(updatedSchedule);
    }
    setSaving(false);
  };

  const handleEditSlots = (dayOfWeek: DayOfWeek) => {
    setEditingDay(dayOfWeek);
    setEditingSlots("");
    setEditingSlotIndex(null);
    setShowTimePickerModal(true);
  };

  const handleEditExistingSlot = (
    dayOfWeek: DayOfWeek,
    slotIndex: number,
    time: string
  ) => {
    setEditingDay(dayOfWeek);
    setEditingSlots(time);
    setEditingSlotIndex(slotIndex);
    setShowTimePickerModal(true);
  };

  const handleCloseModal = () => {
    setShowTimePickerModal(false);
    setEditingDay(null);
    setEditingSlots("");
    setEditingSlotIndex(null);
  };

  const handleSaveSlots = async () => {
    if (!schedule || !editingDay) return;

    setSaving(true);
    const updatedSchedule = { ...schedule };
    const dayIndex = updatedSchedule.schedule.findIndex(
      (d) => d.dayOfWeek === editingDay
    );

    if (dayIndex >= 0) {
      // Si estamos editando un slot existente
      if (editingSlotIndex !== null) {
        if (!editingSlots.trim()) {
          setMessage(
            "❌ Debe ingresar un horario válido o usar el botón Eliminar"
          );
          setSaving(false);
          return;
        }

        const newTime = editingSlots.trim();
        if (!isValidTime(newTime)) {
          setMessage(
            "❌ El horario ingresado no es válido. Use formato HH:mm (00:00 - 23:59)"
          );
          setSaving(false);
          return;
        }

        const updatedSlots = [...updatedSchedule.schedule[dayIndex].slots];
        updatedSlots[editingSlotIndex] = { time: newTime, available: true };

        // Ordenar horarios
        updatedSlots.sort((a, b) => {
          const [aHour, aMin] = a.time.split(":").map(Number);
          const [bHour, bMin] = b.time.split(":").map(Number);
          return aHour * 60 + aMin - (bHour * 60 + bMin);
        });

        updatedSchedule.schedule[dayIndex].slots = updatedSlots;
        await saveSchedule(updatedSchedule);
        handleCloseModal();
      } else {
        // Modo agregar: agregar múltiples horarios
        const newTimes = editingSlots
          .split(",")
          .map((t) => t.trim())
          .filter(isValidTime);

        if (editingSlots.trim() && newTimes.length === 0) {
          setMessage(
            "❌ Los horarios ingresados no son válidos. Use formato HH:mm (00:00 - 23:59)"
          );
          setSaving(false);
          return;
        }

        if (newTimes.length === 0) {
          setMessage("❌ Debe ingresar al menos un horario");
          setSaving(false);
          return;
        }

        // Agregar nuevos horarios
        const existingTimes = updatedSchedule.schedule[dayIndex].slots.map(
          (s) => s.time
        );
        const allTimes = [...new Set([...existingTimes, ...newTimes])];

        // Ordenar horarios
        allTimes.sort((a, b) => {
          const [aHour, aMin] = a.split(":").map(Number);
          const [bHour, bMin] = b.split(":").map(Number);
          return aHour * 60 + aMin - (bHour * 60 + bMin);
        });

        updatedSchedule.schedule[dayIndex].slots = allTimes.map((time) => ({
          time,
          available: true,
        }));

        await saveSchedule(updatedSchedule);
        handleCloseModal();
      }
    }
    setSaving(false);
  };

  const handleDeleteSlot = async () => {
    if (!schedule || !editingDay || editingSlotIndex === null) return;

    setSaving(true);
    const updatedSchedule = { ...schedule };
    const dayIndex = updatedSchedule.schedule.findIndex(
      (d) => d.dayOfWeek === editingDay
    );

    if (dayIndex >= 0) {
      updatedSchedule.schedule[dayIndex].slots.splice(editingSlotIndex, 1);
      await saveSchedule(updatedSchedule);
      handleCloseModal();
    }
    setSaving(false);
  };

  const saveSchedule = async (updatedSchedule: Schedule) => {
    try {
      // Only send the necessary fields to avoid serialization issues
      const schedulePayload = {
        name: updatedSchedule.name || "default",
        description: updatedSchedule.description || "",
        schedule: updatedSchedule.schedule,
      };

      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedulePayload),
      });

      const data = await res.json();
      if (data.success) {
        setSchedule(data.data);
        setMessage("✅ Horario actualizado exitosamente");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Error al actualizar horario");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Error de conexión");
    }
  };

  const isValidTime = (time: string): boolean => {
    if (!/^\d{2}:\d{2}$/.test(time)) return false;
    const [hours, minutes] = time.split(":").map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  };

  const handleAddSpecialDay = async () => {
    // Si está en modo edición, validar fecha única
    if (editingSpecialDay.isEditing) {
      if (!editingSpecialDay.singleDate) {
        setMessage("❌ La fecha es requerida");
        return;
      }

      setSaving(true);
      try {
        const slotsArray =
          editingSpecialDay.isWorkingDay && editingSpecialDay.slots ?
            editingSpecialDay.slots
              .split(",")
              .map((t: string) => t.trim())
              .filter(isValidTime)
          : [];

        if (
          editingSpecialDay.isWorkingDay &&
          editingSpecialDay.slots &&
          slotsArray.length === 0
        ) {
          setMessage(
            "❌ Los horarios ingresados no son válidos. Use formato HH:mm (00:00 - 23:59)"
          );
          setSaving(false);
          return;
        }

        // Primero eliminar el día especial anterior
        if (editingSpecialDay._id) {
          await fetch(`/api/special-days?date=${editingSpecialDay._id}`, {
            method: "DELETE",
          });
        }

        // Crear el día especial con la nueva fecha
        const res = await fetch("/api/special-days", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: editingSpecialDay.singleDate,
            reason: editingSpecialDay.reason,
            isWorkingDay: editingSpecialDay.isWorkingDay,
            slots: slotsArray.map((time: string) => ({
              time,
              available: true,
            })),
          }),
        });

        const data = await res.json();
        if (data.success) {
          setMessage("✅ Día especial actualizado exitosamente");
          setShowSpecialDayModal(false);
          setEditingSpecialDay({
            dateMode: "single",
            singleDate: "",
            startDate: "",
            endDate: "",
            multipleDates: [],
            reason: "",
            isWorkingDay: false,
            slots: "",
            isEditing: false,
          });
          await loadSpecialDays();
          setTimeout(() => setMessage(""), 3000);
        } else {
          setMessage(
            "❌ " + (data.error || "Error al actualizar día especial")
          );
        }
      } catch (error) {
        console.error("Error:", error);
        setMessage("❌ Error de conexión");
      } finally {
        setSaving(false);
      }
      return;
    }

    // Modo creación (múltiples fechas)
    let datesToProcess: string[] = [];

    if (editingSpecialDay.dateMode === "single") {
      if (!editingSpecialDay.singleDate) {
        setMessage("❌ La fecha es requerida");
        return;
      }
      datesToProcess = [editingSpecialDay.singleDate];
    } else if (editingSpecialDay.dateMode === "range") {
      if (!editingSpecialDay.startDate || !editingSpecialDay.endDate) {
        setMessage("❌ Debe seleccionar fecha de inicio y fin");
        return;
      }
      // Generar todas las fechas en el rango
      const start = new Date(editingSpecialDay.startDate);
      const end = new Date(editingSpecialDay.endDate);
      if (start > end) {
        setMessage("❌ La fecha de inicio debe ser anterior a la fecha de fin");
        return;
      }
      const current = new Date(start);
      while (current <= end) {
        datesToProcess.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }
    } else if (editingSpecialDay.dateMode === "multiple") {
      if (editingSpecialDay.multipleDates.length === 0) {
        setMessage("❌ Debe seleccionar al menos una fecha");
        return;
      }
      datesToProcess = editingSpecialDay.multipleDates;
    }

    setSaving(true);
    try {
      const slotsArray =
        editingSpecialDay.isWorkingDay && editingSpecialDay.slots ?
          editingSpecialDay.slots
            .split(",")
            .map((t: string) => t.trim())
            .filter(isValidTime)
        : [];

      if (
        editingSpecialDay.isWorkingDay &&
        editingSpecialDay.slots &&
        slotsArray.length === 0
      ) {
        setMessage(
          "❌ Los horarios ingresados no son válidos. Use formato HH:mm (00:00 - 23:59)"
        );
        setSaving(false);
        return;
      }

      // Crear días especiales para todas las fechas
      let successCount = 0;
      let errorCount = 0;

      for (const date of datesToProcess) {
        const res = await fetch("/api/special-days", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: date,
            reason: editingSpecialDay.reason,
            isWorkingDay: editingSpecialDay.isWorkingDay,
            slots: slotsArray.map((time: string) => ({
              time,
              available: true,
            })),
          }),
        });

        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        setMessage(
          `✅ ${successCount} día${successCount > 1 ? "s" : ""} especial${successCount > 1 ? "es" : ""} creado${successCount > 1 ? "s" : ""} exitosamente${errorCount > 0 ? ` (${errorCount} error${errorCount > 1 ? "es" : ""})` : ""}`
        );
        setShowSpecialDayModal(false);
        setEditingSpecialDay({
          dateMode: "single",
          singleDate: "",
          startDate: "",
          endDate: "",
          multipleDates: [],
          reason: "",
          isWorkingDay: false,
          slots: "",
          isEditing: false,
        });
        await loadSpecialDays();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Error al crear días especiales");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSpecialDayModal = () => {
    setEditingSpecialDay({
      dateMode: "single",
      singleDate: "",
      startDate: "",
      endDate: "",
      multipleDates: [],
      reason: "",
      isWorkingDay: false,
      slots: "",
      isEditing: false,
    });
    setShowSpecialDayModal(true);
  };

  const handleEditSpecialDay = (day: AvailabilityOverride) => {
    setEditingSpecialDay({
      _id: day._id,
      dateMode: "single",
      singleDate: day.date,
      startDate: "",
      endDate: "",
      multipleDates: [],
      reason: day.reason || "",
      isWorkingDay: day.isWorkingDay,
      slots: day.slots?.map((s) => s.time).join(", ") || "",
      isEditing: true,
    });
    setShowSpecialDayModal(true);
  };

  const handleCloseSpecialDayModal = () => {
    setShowSpecialDayModal(false);
    setEditingSpecialDay({
      dateMode: "single",
      singleDate: "",
      startDate: "",
      endDate: "",
      multipleDates: [],
      reason: "",
      isWorkingDay: false,
      slots: "",
      isEditing: false,
    });
  };

  const handleDeleteSpecialDay = async (date: string) => {
    if (!confirm("¿Estás seguro de eliminar este día especial?")) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/special-days?date=${date}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setMessage("✅ Día especial eliminado exitosamente");
        await loadSpecialDays();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Error al eliminar día especial");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Parse date string (YYYY-MM-DD) correctly to avoid timezone issues
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const { upcomingSpecialDays, pastSpecialDays } = useMemo(() => {
    const today = getTodayDateString();
    const upcoming: AvailabilityOverride[] = [];
    const past: AvailabilityOverride[] = [];

    for (const day of specialDays) {
      if (day.date >= today) {
        upcoming.push(day);
      } else {
        past.push(day);
      }
    }

    upcoming.sort((a, b) => a.date.localeCompare(b.date));
    past.sort((a, b) => b.date.localeCompare(a.date));

    return { upcomingSpecialDays: upcoming, pastSpecialDays: past };
  }, [specialDays]);

  const renderSpecialDayRow = (
    day: AvailabilityOverride,
    index: number,
    muted = false
  ) => (
    <tr
      key={day._id || day.date}
      onClick={() => handleEditSpecialDay(day)}
      className={`border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors ${
        muted ? "opacity-75" : ""
      } ${
        index % 2 === 0 ?
          "bg-gray-50 dark:bg-white/5"
        : "bg-white dark:bg-transparent"
      }`}
    >
      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
        {formatDate(day.date)}
      </td>
      <td className="px-4 py-4 text-sm">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            day.isWorkingDay ?
              "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
          }`}
        >
          {day.isWorkingDay ?
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          : <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          }
          {day.isWorkingDay ? "Abierto" : "Cerrado"}
        </span>
      </td>
      <td className="px-4 py-4 text-sm text-gray-600 dark:text-blue-200 hidden sm:table-cell">
        {day.reason || "-"}
      </td>
      <td className="px-4 py-4 text-sm hidden md:table-cell">
        {day.isWorkingDay && day.slots && day.slots.length > 0 ?
          <div className="flex flex-wrap gap-1.5">
            {day.slots.map((slot, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {slot.time}
              </span>
            ))}
          </div>
        : <span className="text-gray-400 dark:text-gray-500 italic text-xs">
            -
          </span>
        }
      </td>
      <td className="px-4 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
        <div className="md:hidden relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuSpecialDayId(
                openMenuSpecialDayId === (day._id || day.date) ?
                  null
                : (day._id || day.date)!
              );
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Menú de acciones"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>

          {openMenuSpecialDayId === (day._id || day.date) && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  handleEditSpecialDay(day);
                  setOpenMenuSpecialDayId(null);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors flex items-center gap-3"
              >
                <EditIcon className="w-5 h-5" />
                Editar
              </button>
              <button
                onClick={() => {
                  handleDeleteSpecialDay(day.date);
                  setOpenMenuSpecialDayId(null);
                }}
                className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 font-medium transition-colors flex items-center gap-3"
              >
                <TrashIcon className="w-5 h-5" />
                Eliminar
              </button>
            </div>
          )}
        </div>

        <div className="hidden md:flex gap-2">
          <Button
            onClick={() => handleEditSpecialDay(day)}
            disabled={saving}
            variant="outlined-warning"
            size="sm"
            icon={<EditIcon />}
          >
            Editar
          </Button>
          <Button
            onClick={() => handleDeleteSpecialDay(day.date)}
            disabled={saving}
            variant="outlined-danger"
            size="sm"
            icon={<TrashIcon />}
          >
            Eliminar
          </Button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">
            Cargando horarios...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mensaje */}
      {message && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border-l-4 border-blue-500 dark:border-blue-400 shadow-lg animate-fadeInUp">
          <p className="text-center text-sm font-semibold text-blue-900 dark:text-white">
            {message}
          </p>
        </div>
      )}

      {/* Tabla de Horarios */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-2xl p-6 sm:p-8 mb-8 border border-gray-200 dark:border-white/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Horario Semanal
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Configura los días y horarios de atención
            </p>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-white/20">
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Día
                </th>
                <th className="px-4 py-4 text-center text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Horarios Disponibles
                </th>
              </tr>
            </thead>
            <tbody>
              {schedule?.schedule.map((day, index) => (
                <tr
                  key={day.dayOfWeek}
                  className={`border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                    index % 2 === 0 ?
                      "bg-gray-50 dark:bg-white/5"
                    : "bg-white dark:bg-transparent"
                  }`}
                >
                  <td className="px-4 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          day.isWorkingDay ?
                            "bg-blue-600 dark:bg-blue-500 text-white shadow-md"
                          : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {DAY_NAMES[day.dayOfWeek].substring(0, 2)}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {DAY_NAMES[day.dayOfWeek]}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <button
                      onClick={() => handleToggleWorkingDay(day.dayOfWeek)}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 shadow-inner touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${
                        day.isWorkingDay ?
                          "bg-green-600 dark:bg-green-500"
                        : "bg-gray-300 dark:bg-gray-600"
                      }`}
                      aria-label={`${day.isWorkingDay ? "Desactivar" : "Activar"} ${DAY_NAMES[day.dayOfWeek]}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                          day.isWorkingDay ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-5">
                    {day.isWorkingDay ?
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2 items-center">
                          {day.slots.length > 0 && (
                            <>
                              {day.slots.map((slot, idx) => (
                                <button
                                  key={idx}
                                  onClick={() =>
                                    handleEditExistingSlot(
                                      day.dayOfWeek,
                                      idx,
                                      slot.time
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all touch-manipulation"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  {slot.time}
                                </button>
                              ))}
                            </>
                          )}
                          {day.slots.length === 0 && (
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              <span className="text-sm font-medium">
                                Sin horarios
                              </span>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleEditSlots(day.dayOfWeek)}
                          disabled={saving}
                          size="sm"
                          icon={<PlusIcon />}
                          className="w-full sm:w-auto"
                        >
                          Agregar Horario
                        </Button>
                      </div>
                    : <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/30 px-3 py-2 rounded-lg w-fit">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                        <span className="text-sm font-medium italic">
                          Cerrado
                        </span>
                      </div>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Time Picker */}
      {showTimePickerModal && editingDay && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingSlotIndex !== null ?
                  "Editar Horario"
                : "Agregar Horario"}{" "}
                - {DAY_NAMES[editingDay]}
              </h3>
              <Button
                onClick={handleCloseModal}
                variant="ghost"
                size="sm"
                icon={<CloseIcon />}
                aria-label="Cerrar"
              />
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {editingSlotIndex !== null ?
                  "Modificar horario"
                : "Agregar horarios (separados por comas)"}
              </label>
              <TimePickerInput
                value={editingSlots}
                onChange={setEditingSlots}
                placeholder={
                  editingSlotIndex !== null ? "HH:mm" : "HH:mm, HH:mm, ..."
                }
                className="w-full"
                singleMode={editingSlotIndex !== null}
              />
              {editingSlotIndex === null && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  💡 Puedes agregar varios horarios separados por comas
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex gap-3">
              {editingSlotIndex !== null ?
                <>
                  <Button
                    onClick={handleDeleteSlot}
                    disabled={saving}
                    variant="outlined-danger"
                    loading={saving}
                    icon={<TrashIcon />}
                    fullWidth
                    title="Eliminar horario"
                  >
                    Eliminar
                  </Button>
                  <Button
                    onClick={handleSaveSlots}
                    disabled={saving}
                    variant="primary"
                    loading={saving}
                    icon={<SaveIcon />}
                    fullWidth
                  >
                    Guardar
                  </Button>
                </>
              : <Button
                  onClick={handleSaveSlots}
                  disabled={saving}
                  variant="primary"
                  loading={saving}
                  icon={<CheckIcon />}
                  fullWidth
                >
                  Agregar Horarios
                </Button>
              }
            </div>
          </div>
        </div>
      )}

      {/* Gestión de fechas especiales */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-white/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Días Especiales
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Configura horarios para fechas específicas
            </p>
          </div>
          <Button
            onClick={handleOpenSpecialDayModal}
            disabled={saving}
            icon={<PlusIcon />}
          >
            Agregar Días
          </Button>
        </div>

        {/* Lista de días especiales */}
        {specialDays.length === 0 ?
          <div className="flex flex-col items-center gap-3 py-12">
            <svg
              className="w-16 h-16 text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
              No hay días especiales configurados
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Agrega feriados, eventos o cierres temporales
            </p>
          </div>
        : <div className="space-y-4">
            <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-white/20">
                    <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider hidden sm:table-cell">
                      Motivo
                    </th>
                    <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider hidden md:table-cell">
                      Horarios
                    </th>
                    <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingSpecialDays.length === 0 ?
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No hay días especiales próximos
                      </td>
                    </tr>
                  : upcomingSpecialDays.map((day, index) =>
                      renderSpecialDayRow(day, index)
                    )
                  }
                </tbody>
              </table>
            </div>

            {pastSpecialDays.length > 0 && (
              <div className="border border-gray-200 dark:border-white/20 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowPastSpecialDays((prev) => !prev)}
                  className="w-full px-4 sm:px-6 py-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center justify-between gap-3"
                  aria-expanded={showPastSpecialDays}
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Días pasados
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {pastSpecialDays.length}{" "}
                      {pastSpecialDays.length === 1 ? "día" : "días"} anteriores
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 shrink-0 ${
                      showPastSpecialDays ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    showPastSpecialDays ?
                      "max-h-[5000px] opacity-100"
                    : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8 border-t border-gray-200 dark:border-white/10">
                    <table className="w-full min-w-full">
                      <tbody>
                        {pastSpecialDays.map((day, index) =>
                          renderSpecialDayRow(day, index, true)
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        }
      </div>

      {/* Modal de Día Especial */}
      {showSpecialDayModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={handleCloseSpecialDayModal}
        >
          <div
            className="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                {editingSpecialDay.isEditing ?
                  <>
                    <EditIcon className="w-6 h-6" />
                    Editar Día Especial
                  </>
                : <>
                    <PlusIcon className="w-6 h-6" />
                    Agregar Día Especial
                  </>
                }
              </h3>
              <Button
                onClick={handleCloseSpecialDayModal}
                variant="ghost"
                size="sm"
                icon={<CloseIcon />}
                aria-label="Cerrar"
              />
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-6 space-y-5">
              {/* Selector de modo de fecha - Solo mostrar en modo creación */}
              {!editingSpecialDay.isEditing && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Modo de selección
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() =>
                        setEditingSpecialDay({
                          ...editingSpecialDay,
                          dateMode: "single",
                        })
                      }
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                        editingSpecialDay.dateMode === "single" ?
                          "bg-blue-600 dark:bg-blue-500 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Una fecha
                    </button>
                    <button
                      onClick={() =>
                        setEditingSpecialDay({
                          ...editingSpecialDay,
                          dateMode: "range",
                        })
                      }
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                        editingSpecialDay.dateMode === "range" ?
                          "bg-blue-600 dark:bg-blue-500 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 4h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Rango
                    </button>
                    <button
                      onClick={() =>
                        setEditingSpecialDay({
                          ...editingSpecialDay,
                          dateMode: "multiple",
                        })
                      }
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                        editingSpecialDay.dateMode === "multiple" ?
                          "bg-blue-600 dark:bg-blue-500 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Múltiple
                    </button>
                  </div>
                </div>
              )}

              {/* Campos de fecha según el modo */}
              {(editingSpecialDay.dateMode === "single" ||
                editingSpecialDay.isEditing) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={editingSpecialDay.singleDate}
                    onChange={(e) =>
                      setEditingSpecialDay({
                        ...editingSpecialDay,
                        singleDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              )}

              {!editingSpecialDay.isEditing &&
                editingSpecialDay.dateMode === "range" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Fecha inicio *
                      </label>
                      <input
                        type="date"
                        value={editingSpecialDay.startDate}
                        onChange={(e) =>
                          setEditingSpecialDay({
                            ...editingSpecialDay,
                            startDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Fecha fin *
                      </label>
                      <input
                        type="date"
                        value={editingSpecialDay.endDate}
                        onChange={(e) =>
                          setEditingSpecialDay({
                            ...editingSpecialDay,
                            endDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        min={
                          editingSpecialDay.startDate ||
                          new Date().toISOString().split("T")[0]
                        }
                      />
                    </div>
                  </div>
                )}

              {!editingSpecialDay.isEditing &&
                editingSpecialDay.dateMode === "multiple" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selecciona fechas *
                    </label>
                    <input
                      type="date"
                      onChange={(e) => {
                        const date = e.target.value;
                        if (
                          date &&
                          !editingSpecialDay.multipleDates.includes(date)
                        ) {
                          setEditingSpecialDay({
                            ...editingSpecialDay,
                            multipleDates: [
                              ...editingSpecialDay.multipleDates,
                              date,
                            ].sort(),
                          });
                        }
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                      min={new Date().toISOString().split("T")[0]}
                    />
                    {editingSpecialDay.multipleDates.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {editingSpecialDay.multipleDates.map((date) => (
                          <div
                            key={date}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg text-sm font-medium"
                          >
                            <span>
                              {new Date(date + "T00:00:00").toLocaleDateString(
                                "es-ES",
                                { day: "2-digit", month: "short" }
                              )}
                            </span>
                            <button
                              onClick={() =>
                                setEditingSpecialDay({
                                  ...editingSpecialDay,
                                  multipleDates:
                                    editingSpecialDay.multipleDates.filter(
                                      (d) => d !== date
                                    ),
                                })
                              }
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                            >
                              <CloseIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Motivo
                </label>
                <input
                  type="text"
                  value={editingSpecialDay.reason}
                  onChange={(e) =>
                    setEditingSpecialDay({
                      ...editingSpecialDay,
                      reason: e.target.value,
                    })
                  }
                  placeholder="Ej: Feriado, Evento especial, Vacaciones"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSpecialDay.isWorkingDay}
                    onChange={(e) =>
                      setEditingSpecialDay({
                        ...editingSpecialDay,
                        isWorkingDay: e.target.checked,
                        slots: e.target.checked ? editingSpecialDay.slots : "",
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Día laborable (con horarios especiales)
                  </span>
                </label>
              </div>

              {editingSpecialDay.isWorkingDay && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Horarios disponibles
                  </label>
                  <TimePickerInput
                    value={editingSpecialDay.slots}
                    onChange={(value) =>
                      setEditingSpecialDay({
                        ...editingSpecialDay,
                        slots: value,
                      })
                    }
                    placeholder="Seleccione horarios"
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex gap-3">
              <Button
                type="button"
                onClick={handleCloseSpecialDayModal}
                disabled={saving}
                variant="outlined-secondary"
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddSpecialDay}
                disabled={saving}
                loading={saving}
                variant="primary"
                icon={<SaveIcon />}
                fullWidth
              >
                {editingSpecialDay.isEditing ?
                  "Guardar Cambios"
                : "Guardar Días"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
