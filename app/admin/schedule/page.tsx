"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Schedule, DaySchedule, TimeSlot, DayOfWeek, DAY_NAMES } from "@/lib/types";
import AdminNav from "@/components/AdminNav";

export default function AdminSchedulePage() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [editingSlots, setEditingSlots] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    loadSchedule();
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
      const times = editingSlots.split(",").map(t => t.trim()).filter(t => /^\d{2}:\d{2}$/.test(t));
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
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🚪 Cerrar Sesión
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
            <li>• Los horarios deben estar en formato 24h (HH:mm), ej: 08:30, 14:00</li>
            <li>• Separa múltiples horarios con comas</li>
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
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={editingSlots}
                            onChange={(e) => setEditingSlots(e.target.value)}
                            placeholder="08:30, 10:30, 14:00, 16:00"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <button
                            onClick={handleSaveSlots}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => {
                              setEditingDay(null);
                              setEditingSlots("");
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                          >
                            Cancelar
                          </button>
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
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📌 Gestión de Fechas Especiales
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Próximamente: Podrás configurar horarios especiales para días específicos (feriados, eventos, etc.)
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Esta funcionalidad estará disponible pronto
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
