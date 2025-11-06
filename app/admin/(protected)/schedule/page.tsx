"use client";
import { useState, useEffect } from "react";
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
  const [editingSpecialDay, setEditingSpecialDay] = useState<{
    date: string;
    reason: string;
    isWorkingDay: boolean;
    slots: string;
    isEditing: boolean;
  }>({
    date: "",
    reason: "",
    isWorkingDay: false,
    slots: "",
    isEditing: false,
  });

  useEffect(() => {
    loadSchedule();
    loadSpecialDays();
  }, []);

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
    if (!editingSpecialDay.date) {
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

      const res = await fetch("/api/special-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: editingSpecialDay.date,
          reason: editingSpecialDay.reason,
          isWorkingDay: editingSpecialDay.isWorkingDay,
          slots: slotsArray.map((time: string) => ({ time, available: true })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("✅ Día especial creado exitosamente");
        setShowSpecialDayModal(false);
        setEditingSpecialDay({
          date: "",
          reason: "",
          isWorkingDay: false,
          slots: "",
          isEditing: false,
        });
        await loadSpecialDays();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ " + (data.error || "Error al crear día especial"));
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
      date: "",
      reason: "",
      isWorkingDay: false,
      slots: "",
      isEditing: false,
    });
    setShowSpecialDayModal(true);
  };

  const handleCloseSpecialDayModal = () => {
    setShowSpecialDayModal(false);
    setEditingSpecialDay({
      date: "",
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
        <div
          className={`mb-6 p-4 rounded-lg ${message.includes("✅") ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}
        >
          {message}
        </div>
      )}

      {/* Tabla de Horarios */}
      <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg overflow-hidden mb-6 sm:mb-8 border border-gray-200 dark:border-white/20">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            Horario Semanal
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Día
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Horarios
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {schedule?.schedule.map((day) => (
                <tr
                  key={day.dayOfWeek}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {DAY_NAMES[day.dayOfWeek]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleToggleWorkingDay(day.dayOfWeek)}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${
                        day.isWorkingDay ? "bg-green-600" : (
                          "bg-gray-300 dark:bg-gray-600"
                        )
                      }`}
                      aria-label={`${day.isWorkingDay ? "Desactivar" : "Activar"} ${DAY_NAMES[day.dayOfWeek]}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          day.isWorkingDay ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    {day.isWorkingDay ?
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
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
                                className="inline-flex items-center px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all touch-manipulation"
                              >
                                {slot.time}
                              </button>
                            ))}
                          </>
                        )}
                        {day.slots.length === 0 && (
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-2">
                            Sin horarios
                          </span>
                        )}
                      </div>
                    : <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                        Cerrado
                      </span>
                    }
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                    {/* Botón para agregar nuevo horario */}
                    {day.isWorkingDay && (
                      <Button
                        onClick={() => handleEditSlots(day.dayOfWeek)}
                        disabled={saving}
                        size="sm"
                        icon={<PlusIcon />}
                        title="Agregar horario"
                        aria-label="Agregar nuevo horario"
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full"
                      />
                    )}
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
      <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-white/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            📌 Gestión de Días Especiales
          </h2>
          <Button
            onClick={handleOpenSpecialDayModal}
            disabled={saving}
            icon={<PlusIcon />}
          >
            Agregar Día Especial
          </Button>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          Configura horarios especiales para días específicos (feriados,
          eventos, cierres temporales, etc.)
        </p>

        {/* Lista de días especiales */}
        {specialDays.length === 0 ?
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No hay días especiales configurados
            </p>
          </div>
        : <div className="space-y-3">
            {specialDays.map((day) => (
              <div
                key={day._id || day.date}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatDate(day.date)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        day.isWorkingDay ?
                          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {day.isWorkingDay ? "Día laborable" : "Cerrado"}
                    </span>
                  </div>
                  {day.reason && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {day.reason}
                    </p>
                  )}
                  {day.isWorkingDay && day.slots && day.slots.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {day.slots.map((slot, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          {slot.time}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => handleDeleteSpecialDay(day.date)}
                  disabled={saving}
                  variant="ghost"
                  size="sm"
                  loading={saving}
                  icon={
                    <TrashIcon className="text-red-600 dark:text-red-400" />
                  }
                  title="Eliminar"
                  aria-label="Eliminar día especial"
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                />
              </div>
            ))}
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Agregar Día Especial
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
            <div className="px-4 sm:px-6 py-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={editingSpecialDay.date}
                    onChange={(e) =>
                      setEditingSpecialDay({
                        ...editingSpecialDay,
                        date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    placeholder="Ej: Feriado, Evento especial"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
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
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Día laborable (con horarios especiales)
                  </span>
                </label>
              </div>

              {editingSpecialDay.isWorkingDay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                onClick={handleAddSpecialDay}
                disabled={saving}
                loading={saving}
                variant="primary"
                icon={<SaveIcon />}
                fullWidth
              >
                Guardar Día Especial
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
