"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Schedule, DaySchedule, TimeSlot, DayOfWeek, DAY_NAMES, AvailabilityOverride } from "@/lib/types";
import AdminNav from "@/components/AdminNav";
import TimePickerInput from "@/components/TimePickerInput";

export default function AdminSchedulePage() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [editingSlots, setEditingSlots] = useState<string>("");
  const [specialDays, setSpecialDays] = useState<AvailabilityOverride[]>([]);
  const [showAddSpecialDay, setShowAddSpecialDay] = useState(false);
  const [newSpecialDay, setNewSpecialDay] = useState({
    date: "",
    reason: "",
    isWorkingDay: false,
    slots: ""
  });
  const router = useRouter();

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

    const updatedSchedule = { ...schedule };
    const dayIndex = updatedSchedule.schedule.findIndex(d => d.dayOfWeek === dayOfWeek);
    
    if (dayIndex >= 0) {
      updatedSchedule.schedule[dayIndex].isWorkingDay = !updatedSchedule.schedule[dayIndex].isWorkingDay;
      
      // Si se activa el día, agregar slots por defecto
      if (updatedSchedule.schedule[dayIndex].isWorkingDay && updatedSchedule.schedule[dayIndex].slots.length === 0) {
        updatedSchedule.schedule[dayIndex].slots = [
          { time: "08:30", available: true },
          { time: "10:30", available: true },
          { time: "14:00", available: true },
          { time: "16:00", available: true }
        ];
      }

      await saveSchedule(updatedSchedule);
    }
  };

  const handleEditSlots = (dayOfWeek: DayOfWeek) => {
    const day = schedule?.schedule.find(d => d.dayOfWeek === dayOfWeek);
    if (day) {
      setEditingDay(dayOfWeek);
      setEditingSlots(day.slots.map(s => s.time).join(", "));
    }
  };

  const handleSaveSlots = async () => {
    if (!schedule || !editingDay) return;

    const updatedSchedule = { ...schedule };
    const dayIndex = updatedSchedule.schedule.findIndex(d => d.dayOfWeek === editingDay);
    
    if (dayIndex >= 0) {
      const times = editingSlots.split(",").map(t => t.trim()).filter(isValidTime);
      
      if (editingSlots.trim() && times.length === 0) {
        setMessage("❌ Los horarios ingresados no son válidos. Use formato HH:mm (00:00 - 23:59)");
        return;
      }
      
      updatedSchedule.schedule[dayIndex].slots = times.map(time => ({ time, available: true }));
      
      await saveSchedule(updatedSchedule);
      setEditingDay(null);
      setEditingSlots("");
    }
  };

  const saveSchedule = async (updatedSchedule: Schedule) => {
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSchedule)
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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const isValidTime = (time: string): boolean => {
    if (!/^\d{2}:\d{2}$/.test(time)) return false;
    const [hours, minutes] = time.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  };

  const handleAddSpecialDay = async () => {
    if (!newSpecialDay.date) {
      setMessage("❌ La fecha es requerida");
      return;
    }

    try {
      const slotsArray = newSpecialDay.isWorkingDay && newSpecialDay.slots
        ? newSpecialDay.slots.split(",").map(t => t.trim()).filter(isValidTime)
        : [];

      if (newSpecialDay.isWorkingDay && newSpecialDay.slots && slotsArray.length === 0) {
        setMessage("❌ Los horarios ingresados no son válidos. Use formato HH:mm (00:00 - 23:59)");
        return;
      }

      const res = await fetch("/api/special-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newSpecialDay.date,
          reason: newSpecialDay.reason,
          isWorkingDay: newSpecialDay.isWorkingDay,
          slots: slotsArray.map(time => ({ time, available: true }))
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage("✅ Día especial creado exitosamente");
        setShowAddSpecialDay(false);
        setNewSpecialDay({ date: "", reason: "", isWorkingDay: false, slots: "" });
        await loadSpecialDays();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ " + (data.error || "Error al crear día especial"));
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Error de conexión");
    }
  };

  const handleDeleteSpecialDay = async (date: string) => {
    if (!confirm("¿Estás seguro de eliminar este día especial?")) {
      return;
    }

    try {
      const res = await fetch(`/api/special-days?date=${date}`, {
        method: "DELETE"
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
    }
  };

  const formatDate = (dateString: string) => {
    // Parse date string (YYYY-MM-DD) correctly to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-violet-600 p-2 rounded-lg">
                <span className="text-2xl">📅</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gestión de Horarios
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 sm:px-6 sm:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base font-medium touch-manipulation min-h-[44px]"
            >
              <span className="hidden sm:inline">🚪 Cerrar Sesión</span>
              <span className="sm:hidden">🚪 Salir</span>
            </button>
          </div>
        </div>
      </header>

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Mensaje */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes("✅") ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}>
            {message}
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📋 Información</h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• Activa/desactiva días hábiles con el interruptor</li>
            <li>• Haz clic en &quot;Editar Horarios&quot; para personalizar los slots de tiempo</li>
            <li>• Usa el selector de hora para agregar horarios fácilmente desde tu móvil</li>
            <li>• Los horarios se agregan ordenados automáticamente</li>
            <li>• Por defecto: Martes a Sábado, 8:30am, 10:30am, 2:00pm, 4:00pm</li>
          </ul>
        </div>

        {/* Tabla de Horarios */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Horario Semanal</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Día
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Horarios Disponibles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {schedule?.schedule.map((day) => (
                  <tr key={day.dayOfWeek} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {DAY_NAMES[day.dayOfWeek]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleWorkingDay(day.dayOfWeek)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          day.isWorkingDay ? "bg-green-600" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            day.isWorkingDay ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                        {day.isWorkingDay ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {editingDay === day.dayOfWeek ? (
                        <div className="space-y-3">
                          <TimePickerInput
                            value={editingSlots}
                            onChange={setEditingSlots}
                            placeholder="Seleccione un horario"
                            className="w-full"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveSlots}
                              className="flex-1 sm:flex-none px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium touch-manipulation min-h-[44px]"
                            >
                              ✓ Guardar
                            </button>
                            <button
                              onClick={() => {
                                setEditingDay(null);
                                setEditingSlots("");
                              }}
                              className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium touch-manipulation min-h-[44px]"
                            >
                              ✕ Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {day.slots.length > 0 ? (
                            day.slots.map((slot, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              >
                                {slot.time}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">Sin horarios</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {day.isWorkingDay && editingDay !== day.dayOfWeek && (
                        <button
                          onClick={() => handleEditSlots(day.dayOfWeek)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium touch-manipulation min-h-[44px] px-2"
                        >
                          ✏️ Editar Horarios
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gestión de fechas especiales */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              📌 Gestión de Días Especiales
            </h2>
            <button
              onClick={() => setShowAddSpecialDay(!showAddSpecialDay)}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium touch-manipulation min-h-[44px]"
            >
              {showAddSpecialDay ? "❌ Cancelar" : "+ Agregar Día Especial"}
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Configura horarios especiales para días específicos (feriados, eventos, cierres temporales, etc.)
          </p>

          {/* Formulario para agregar día especial */}
          {showAddSpecialDay && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={newSpecialDay.date}
                    onChange={(e) => setNewSpecialDay({ ...newSpecialDay, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Motivo
                  </label>
                  <input
                    type="text"
                    value={newSpecialDay.reason}
                    onChange={(e) => setNewSpecialDay({ ...newSpecialDay, reason: e.target.value })}
                    placeholder="Ej: Feriado, Evento especial"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newSpecialDay.isWorkingDay}
                    onChange={(e) => setNewSpecialDay({ ...newSpecialDay, isWorkingDay: e.target.checked, slots: e.target.checked ? newSpecialDay.slots : "" })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Día laborable (con horarios especiales)
                  </span>
                </label>
              </div>

              {newSpecialDay.isWorkingDay && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Horarios disponibles
                  </label>
                  <TimePickerInput
                    value={newSpecialDay.slots}
                    onChange={(value) => setNewSpecialDay({ ...newSpecialDay, slots: value })}
                    placeholder="Seleccione horarios"
                    className="w-full"
                  />
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAddSpecialDay}
                  className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium touch-manipulation min-h-[44px]"
                >
                  💾 Guardar Día Especial
                </button>
              </div>
            </div>
          )}

          {/* Lista de días especiales */}
          {specialDays.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No hay días especiales configurados
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {specialDays.map((day) => (
                <div
                  key={day._id || day.date}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatDate(day.date)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        day.isWorkingDay 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      }`}>
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
                  <button
                    onClick={() => handleDeleteSpecialDay(day.date)}
                    className="ml-4 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Eliminar"
                    aria-label="Eliminar día especial"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
