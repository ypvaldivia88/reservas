"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Schedule,
  DayOfWeek,
  AvailabilityOverride,
} from "@/lib/types";
import {
  EMPTY_EDITING_SPECIAL_DAY,
  EditingSpecialDayState,
} from "@/lib/admin-schedule-types";
import PageHeader from "@/components/design/PageHeader";
import ScheduleAlert from "@/components/admin/schedule/ScheduleAlert";
import ScheduleWeeklySection from "@/components/admin/schedule/ScheduleWeeklySection";
import ScheduleTimeModal from "@/components/admin/schedule/ScheduleTimeModal";
import SpecialDaysSection from "@/components/admin/schedule/SpecialDaysSection";
import SpecialDayModal from "@/components/admin/schedule/SpecialDayModal";

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
  const [editingSpecialDay, setEditingSpecialDay] =
    useState<EditingSpecialDayState>(EMPTY_EDITING_SPECIAL_DAY);

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

        updatedSlots.sort((a, b) => {
          const [aHour, aMin] = a.time.split(":").map(Number);
          const [bHour, bMin] = b.time.split(":").map(Number);
          return aHour * 60 + aMin - (bHour * 60 + bMin);
        });

        updatedSchedule.schedule[dayIndex].slots = updatedSlots;
        await saveSchedule(updatedSchedule);
        handleCloseModal();
      } else {
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

        const existingTimes = updatedSchedule.schedule[dayIndex].slots.map(
          (s) => s.time
        );
        const allTimes = [...new Set([...existingTimes, ...newTimes])];

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
    if (editingSpecialDay.isEditing) {
      if (!editingSpecialDay.singleDate) {
        setMessage("❌ La fecha es requerida");
        return;
      }

      setSaving(true);
      try {
        const slotsArray =
          editingSpecialDay.isWorkingDay && editingSpecialDay.slots
            ? editingSpecialDay.slots
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

        if (editingSpecialDay._id) {
          await fetch(`/api/special-days?date=${editingSpecialDay._id}`, {
            method: "DELETE",
          });
        }

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
          setEditingSpecialDay(EMPTY_EDITING_SPECIAL_DAY);
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
        editingSpecialDay.isWorkingDay && editingSpecialDay.slots
          ? editingSpecialDay.slots
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
        setEditingSpecialDay(EMPTY_EDITING_SPECIAL_DAY);
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
    setEditingSpecialDay(EMPTY_EDITING_SPECIAL_DAY);
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
    setEditingSpecialDay(EMPTY_EDITING_SPECIAL_DAY);
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

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando horarios...</p>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="dashboard-card rounded-2xl px-6 py-10 text-center text-sm text-muted-foreground">
        No se pudo cargar el horario del salón
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Horarios"
        description="Configura la agenda semanal y excepciones por fecha"
      />

      {message && <ScheduleAlert message={message} />}

      <ScheduleWeeklySection
        schedule={schedule}
        saving={saving}
        onToggleWorkingDay={handleToggleWorkingDay}
        onAddSlots={handleEditSlots}
        onEditSlot={handleEditExistingSlot}
      />

      <SpecialDaysSection
        upcomingSpecialDays={upcomingSpecialDays}
        pastSpecialDays={pastSpecialDays}
        saving={saving}
        onAdd={handleOpenSpecialDayModal}
        onEdit={handleEditSpecialDay}
        onDelete={handleDeleteSpecialDay}
      />

      {editingDay && (
        <ScheduleTimeModal
          open={showTimePickerModal}
          editingDay={editingDay}
          editingSlots={editingSlots}
          editingSlotIndex={editingSlotIndex}
          saving={saving}
          onChangeSlots={setEditingSlots}
          onClose={handleCloseModal}
          onSave={handleSaveSlots}
          onDelete={handleDeleteSlot}
        />
      )}

      <SpecialDayModal
        open={showSpecialDayModal}
        editingSpecialDay={editingSpecialDay}
        saving={saving}
        onClose={handleCloseSpecialDayModal}
        onSave={handleAddSpecialDay}
        onChange={setEditingSpecialDay}
      />
    </div>
  );
}
