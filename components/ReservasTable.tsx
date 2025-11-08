"use client";
import { useState } from "react";
import { Reserva } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import {
  CheckIcon,
  XIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@/components/ui/Icons";

interface ReservasTableProps {
  reservas: Reserva[];
  saving: boolean;
  onEdit: (reserva: Reserva) => void;
  onDelete: (reserva: Reserva) => void;
  onUpdateStatus: (
    reserva: Reserva,
    estado: Reserva["estado"],
    openWhatsApp?: boolean
  ) => void;
  externalViewMode?: ViewMode;
  externalEstadoFilter?: Reserva["estado"] | "todos";
  onViewModeChange?: (mode: ViewMode) => void;
}

type ViewMode = "month" | "agenda";

export default function ReservasTable({
  reservas,
  saving,
  onEdit,
  onDelete,
  onUpdateStatus,
  externalViewMode,
  externalEstadoFilter,
  onViewModeChange,
}: ReservasTableProps) {
  // Función para obtener el próximo turno
  const getProximoTurnoFecha = () => {
    const now = new Date();
    const nowStr = now.toISOString().split("T")[0];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Encontrar la primera reserva futura
    const proximaReserva = reservas
      .filter((reserva) => {
        const reservaDate = reserva.fechaCita;
        if (reservaDate > nowStr) return true;
        if (reservaDate === nowStr) {
          const [hours, minutes] = reserva.horaCita.split(":").map(Number);
          const reservaTime = hours * 60 + minutes;
          return reservaTime >= currentTime;
        }
        return false;
      })
      .sort((a, b) => {
        if (a.fechaCita !== b.fechaCita) {
          return a.fechaCita.localeCompare(b.fechaCita);
        }
        return a.horaCita.localeCompare(b.horaCita);
      })[0];

    return proximaReserva?.fechaCita || nowStr;
  };

  const [viewMode, setViewMode] = useState<ViewMode>(
    externalViewMode || "month"
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getProximoTurnoFecha();
  });
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const fechaProximoTurno = getProximoTurnoFecha();
    return new Date(fechaProximoTurno + "T00:00:00");
  });
  const [agendaLimit, setAgendaLimit] = useState(4); // Límite inicial de 4 reservas
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<Reserva["estado"] | "todos">(
    externalEstadoFilter || "todos"
  );
  const [searchExpanded, setSearchExpanded] = useState(false);

  // Sync external changes
  if (externalViewMode !== undefined && externalViewMode !== viewMode) {
    setViewMode(externalViewMode);
  }
  if (
    externalEstadoFilter !== undefined &&
    externalEstadoFilter !== estadoFilter
  ) {
    setEstadoFilter(externalEstadoFilter);
  }

  // Agrupar reservas por fecha
  const reservasPorFecha = reservas.reduce(
    (acc, reserva) => {
      const fecha = reserva.fechaCita;
      if (!acc[fecha]) {
        acc[fecha] = [];
      }
      acc[fecha].push(reserva);
      return acc;
    },
    {} as Record<string, Reserva[]>
  );

  // Obtener los próximos turnos (agenda) - con límite opcional
  const getProximosTurnos = (limit?: number) => {
    const now = new Date();
    const nowStr = now.toISOString().split("T")[0];
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutos desde medianoche

    // Filtrar y ordenar todas las reservas futuras
    const reservasFuturas = reservas
      .filter((reserva) => {
        const reservaDate = reserva.fechaCita;

        // Si es una fecha futura, incluirla
        if (reservaDate > nowStr) return true;

        // Si es hoy, verificar que la hora sea futura
        if (reservaDate === nowStr) {
          const [hours, minutes] = reserva.horaCita.split(":").map(Number);
          const reservaTime = hours * 60 + minutes;
          return reservaTime >= currentTime;
        }

        return false;
      })
      .sort((a, b) => {
        // Ordenar primero por fecha, luego por hora
        if (a.fechaCita !== b.fechaCita) {
          return a.fechaCita.localeCompare(b.fechaCita);
        }
        return a.horaCita.localeCompare(b.horaCita);
      });

    // Si se especifica un límite, aplicarlo; si no, devolver todas
    return limit ? reservasFuturas.slice(0, limit) : reservasFuturas;
  };

  // Obtener fechas de la semana actual
  const getWeekDates = () => {
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lunes como primer día
    firstDayOfWeek.setDate(today.getDate() + diff);

    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + i);
      weekDates.push(date.toISOString().split("T")[0]);
    }
    return weekDates;
  };

  // Obtener días del mes para el calendario
  const getMonthCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];

    // Días del mes anterior (para llenar la primera semana)
    const startDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = startDay; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      days.push(prevDate);
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Días del mes siguiente (para completar la última semana)
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  // Función para filtrar reservas por búsqueda y estado
  const filterReservas = (reservasToFilter: Reserva[]) => {
    return reservasToFilter.filter((reserva) => {
      // Filtro de búsqueda
      const matchesSearch =
        !searchQuery ||
        reserva.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reserva.telefono?.includes(searchQuery) ||
        reserva.decoracion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reserva.forma.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtro de estado
      const matchesEstado =
        estadoFilter === "todos" || reserva.estado === estadoFilter;

      return matchesSearch && matchesEstado;
    });
  };

  // Obtener todas las reservas futuras filtradas (sin límite de paginación)
  const todasReservasFiltradas = filterReservas(getProximosTurnos());

  // Aplicar paginación a las reservas filtradas
  const reservasFiltradaPaginadas = todasReservasFiltradas.slice(
    0,
    agendaLimit
  );

  // Filtrar reservas según el modo de vista
  const getFilteredReservas = () => {
    if (viewMode === "month") {
      // En vista mes, mostrar reservas del día seleccionado
      const reservasDelDia =
        selectedDate && reservasPorFecha[selectedDate] ?
          reservasPorFecha[selectedDate].sort((a, b) =>
            a.horaCita.localeCompare(b.horaCita)
          )
        : [];
      return filterReservas(reservasDelDia);
    } else {
      // En vista agenda, mostrar reservas filtradas y paginadas
      return reservasFiltradaPaginadas;
    }
  };

  // Variables para la vista agenda
  const hayMasReservas = todasReservasFiltradas.length > agendaLimit; // ¿Hay más para mostrar?

  // Agrupar reservas para la vista agenda
  const reservasAgrupadas =
    viewMode === "agenda" ?
      reservasFiltradaPaginadas.reduce(
        (acc, reserva) => {
          const fecha = reserva.fechaCita;
          if (!acc[fecha]) {
            acc[fecha] = [];
          }
          acc[fecha].push(reserva);
          return acc;
        },
        {} as Record<string, Reserva[]>
      )
    : {};

  // Ordenar fechas según la vista
  const fechasOrdenadas =
    viewMode === "agenda" ?
      Object.keys(reservasAgrupadas).sort((a, b) => a.localeCompare(b))
    : selectedDate && reservasPorFecha[selectedDate] ? [selectedDate]
    : [];

  // Formatear fecha para mostrar
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr + "T00:00:00");
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // Resetear horas para comparación
    hoy.setHours(0, 0, 0, 0);
    manana.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);

    if (fecha.getTime() === hoy.getTime()) {
      return "Hoy";
    } else if (fecha.getTime() === manana.getTime()) {
      return "Mañana";
    }

    const opciones: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
    };
    return fecha.toLocaleDateString("es-ES", opciones);
  };

  // Obtener color del estado
  const getEstadoColor = (estado?: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-500";
      case "confirmada":
        return "bg-green-500";
      case "completada":
        return "bg-blue-500";
      case "cancelada":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  // Navegación de mes
  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const monthNames = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  const dayNames = ["L", "M", "M", "J", "V", "S", "D"];

  if (reservas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <svg
          className="w-20 h-20 text-gray-300 dark:text-gray-600 mb-4"
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
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
          No hay reservas
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Las nuevas reservas aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con título y toggle de vista */}
      <div className="flex items-center justify-between">
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
          Reservas
        </h2>

        {/* Toggle de vista */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => {
              setViewMode("agenda");
              setAgendaLimit(4); // Resetear al cambiar de vista
              onViewModeChange?.("agenda");
            }}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              viewMode === "agenda" ?
                "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <span className="hidden sm:inline">Agenda</span>
            </span>
          </button>
          <button
            onClick={() => {
              setViewMode("month");
              onViewModeChange?.("month");
            }}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              viewMode === "month" ?
                "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
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
              <span className="hidden sm:inline">Mes</span>
            </span>
          </button>
        </div>
      </div>

      {/* Buscador y Filtro de Estados */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-2">
        {/* Botón de búsqueda / Input expandible */}
        <div
          className="flex-1 flex items-center gap-2 cursor-pointer"
          onClick={() => !searchExpanded && setSearchExpanded(true)}
        >
          {!searchExpanded ?
            <>
              <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <span className="text-sm text-gray-400 dark:text-gray-500 select-none">
                Buscar...
              </span>
            </>
          : <div className="flex-1 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchExpanded(false);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Cerrar búsqueda"
              >
                <svg
                  className="w-4 h-4 text-gray-400 dark:text-gray-500"
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
              </button>
            </div>
          }
        </div>

        {/* Separador - Solo visible cuando no está expandido */}
        {!searchExpanded && (
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
        )}

        {/* Filtros de estado como iconos - Solo visibles cuando no está expandido */}
        {!searchExpanded && (
          <div className="flex items-center gap-1">
            {/* Todos */}
            <button
              onClick={() => setEstadoFilter("todos")}
              className={`p-2 rounded-lg transition-colors ${
                estadoFilter === "todos" ?
                  "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
              title="Todas"
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
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>

            {/* Pendiente */}
            <button
              onClick={() => setEstadoFilter("pendiente")}
              className={`p-2 rounded-lg transition-colors ${
                estadoFilter === "pendiente" ?
                  "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                : "text-yellow-400 dark:text-yellow-500/50 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 hover:text-yellow-500 dark:hover:text-yellow-400"
              }`}
              title="Pendientes"
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* Confirmada */}
            <button
              onClick={() => setEstadoFilter("confirmada")}
              className={`p-2 rounded-lg transition-colors ${
                estadoFilter === "confirmada" ?
                  "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400"
                : "text-green-400 dark:text-green-500/50 hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-500 dark:hover:text-green-400"
              }`}
              title="Confirmadas"
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* Completada */}
            <button
              onClick={() => setEstadoFilter("completada")}
              className={`p-2 rounded-lg transition-colors ${
                estadoFilter === "completada" ?
                  "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                : "text-blue-400 dark:text-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-500 dark:hover:text-blue-400"
              }`}
              title="Completadas"
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </button>

            {/* Cancelada */}
            <button
              onClick={() => setEstadoFilter("cancelada")}
              className={`p-2 rounded-lg transition-colors ${
                estadoFilter === "cancelada" ?
                  "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                : "text-red-400 dark:text-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400"
              }`}
              title="Canceladas"
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
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Vista de Mes: Calendario */}
      {viewMode === "month" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendario */}
          <div className="bg-white dark:bg-gray-800/30 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4 w-full lg:w-auto lg:flex-shrink-0">
            {/* Header del calendario */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day, index) => (
                <div
                  key={index}
                  className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1.5">
              {getMonthCalendar().map((date, index) => {
                if (!date) return <div key={index} />;

                const dateStr = date.toISOString().split("T")[0];
                const isCurrentMonth =
                  date.getMonth() === currentMonth.getMonth();
                const isToday =
                  dateStr === new Date().toISOString().split("T")[0];
                const isSelected = dateStr === selectedDate;

                // Obtener reservas filtradas para este día
                const reservasDelDia = reservasPorFecha[dateStr] || [];
                const reservasFiltradas = filterReservas(reservasDelDia);
                const hasReservas = reservasFiltradas.length > 0;

                // Obtener el estado predominante de las reservas filtradas
                const estadosPendientes = reservasFiltradas.filter(
                  (r) => r.estado === "pendiente"
                ).length;
                const estadosConfirmadas = reservasFiltradas.filter(
                  (r) => r.estado === "confirmada"
                ).length;
                const estadosCompletadas = reservasFiltradas.filter(
                  (r) => r.estado === "completada"
                ).length;
                const estadosCanceladas = reservasFiltradas.filter(
                  (r) => r.estado === "cancelada"
                ).length;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(dateStr)}
                    disabled={!isCurrentMonth}
                    className={`
                    aspect-square p-1.5 sm:p-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative
                    ${!isCurrentMonth ? "text-gray-300 dark:text-gray-600 cursor-not-allowed" : ""}
                    ${isToday && isCurrentMonth ? "border-2 border-green-500 dark:border-green-400 text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-500/10" : ""}
                    ${isSelected && !isToday && isCurrentMonth ? "border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" : ""}
                    ${!isSelected && !isToday && isCurrentMonth ? "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white cursor-pointer" : ""}
                  `}
                  >
                    <span className="block">{date.getDate()}</span>
                    {hasReservas && isCurrentMonth && (
                      <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                        {/* Mostrar hasta 3 puntos con colores según el estado */}
                        {estadosPendientes > 0 && (
                          <div className="w-1 h-1 rounded-full bg-yellow-500 dark:bg-yellow-400" />
                        )}
                        {estadosConfirmadas > 0 && (
                          <div className="w-1 h-1 rounded-full bg-green-500 dark:bg-green-400" />
                        )}
                        {estadosCompletadas > 0 && (
                          <div className="w-1 h-1 rounded-full bg-blue-500 dark:bg-blue-400" />
                        )}
                        {estadosCanceladas > 0 &&
                          reservasFiltradas.length === estadosCanceladas && (
                            <div className="w-1 h-1 rounded-full bg-gray-500 dark:bg-gray-400" />
                          )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de reservas del día seleccionado - A la derecha en desktop */}
          <div className="flex-1 space-y-6">
            {selectedDate && !reservasPorFecha[selectedDate] && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-3 opacity-50"
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
                <p className="text-sm">No hay reservas para este día</p>
              </div>
            )}

            {selectedDate &&
              reservasPorFecha[selectedDate] &&
              getFilteredReservas().length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <p className="text-sm">
                    No se encontraron reservas con los filtros aplicados
                  </p>
                </div>
              )}

            {selectedDate &&
              reservasPorFecha[selectedDate] &&
              getFilteredReservas().length > 0 && (
                <div className="space-y-2">
                  {getFilteredReservas().map((reserva) => (
                    <div
                      key={reserva._id}
                      className="group bg-white dark:bg-gray-800/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 overflow-hidden"
                    >
                      <div className="flex items-center">
                        {/* Indicador de estado (línea vertical) */}
                        <div
                          className={`w-1.5 h-full ${getEstadoColor(reserva.estado)}`}
                        />

                        {/* Contenido principal */}
                        <div
                          className="flex-1 p-3 sm:p-4 cursor-pointer min-w-0"
                          onClick={() => onEdit(reserva)}
                        >
                          <div className="flex items-start justify-between gap-2 sm:gap-3">
                            {/* Hora y nombre */}
                            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                  {reserva.horaCita}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                                    {reserva.nombre}
                                  </h4>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase flex-shrink-0 w-fit ${
                                      reserva.estado === "pendiente" ?
                                        "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
                                      : reserva.estado === "confirmada" ?
                                        "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300"
                                      : reserva.estado === "completada" ?
                                        "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                                      : "bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300"
                                    }`}
                                  >
                                    {reserva.estado}
                                  </span>
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                  <span className="capitalize">
                                    {reserva.forma}
                                  </span>
                                  {" • "}
                                  <span>Largo {reserva.largo}</span>
                                  {reserva.telefono && (
                                    <>
                                      {" • "}
                                      <span className="hidden sm:inline">
                                        {reserva.telefono}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {reserva.decoracion && (
                                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-500 line-clamp-1">
                                    {reserva.decoracion}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Acciones (desktop) */}
                            <div
                              className="hidden lg:flex items-start gap-2 flex-wrap flex-shrink-0 max-w-md"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {reserva.estado === "pendiente" && (
                                <>
                                  <Button
                                    onClick={() =>
                                      onUpdateStatus(
                                        reserva,
                                        "confirmada",
                                        true
                                      )
                                    }
                                    disabled={saving}
                                    variant="outlined-success"
                                    size="sm"
                                    icon={<CheckIcon />}
                                    title="Confirmar reserva"
                                  >
                                    Confirmar
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      onUpdateStatus(reserva, "cancelada", true)
                                    }
                                    disabled={saving}
                                    variant="outlined-danger"
                                    size="sm"
                                    icon={<XIcon />}
                                    title="Cancelar reserva"
                                  >
                                    Cancelar
                                  </Button>
                                </>
                              )}
                              {reserva.estado === "confirmada" && (
                                <>
                                  <Button
                                    onClick={() => onEdit(reserva)}
                                    disabled={saving}
                                    variant="outlined-primary"
                                    size="sm"
                                    icon={<CheckCircleIcon />}
                                    title="Completar reserva"
                                  >
                                    Completar
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      onUpdateStatus(reserva, "cancelada", true)
                                    }
                                    disabled={saving}
                                    variant="outlined-danger"
                                    size="sm"
                                    icon={<XIcon />}
                                    title="Cancelar reserva"
                                  >
                                    Cancelar
                                  </Button>
                                </>
                              )}
                              <Button
                                onClick={() => onEdit(reserva)}
                                disabled={saving}
                                variant="outlined-warning"
                                size="sm"
                                icon={<EditIcon />}
                                title="Editar reserva"
                              >
                                Editar
                              </Button>
                              <Button
                                onClick={() => onDelete(reserva)}
                                disabled={saving}
                                variant="outlined-danger"
                                size="sm"
                                icon={<TrashIcon />}
                                title="Eliminar reserva"
                              >
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Acciones móviles - Botones de estado con texto */}
                      <div
                        className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 px-3 py-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {reserva.estado === "pendiente" && (
                            <>
                              <button
                                onClick={() =>
                                  onUpdateStatus(reserva, "confirmada", true)
                                }
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-green-500 dark:border-green-400 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                              >
                                <CheckIcon className="w-4 h-4" />
                                <span>Confirmar</span>
                              </button>
                              <button
                                onClick={() =>
                                  onUpdateStatus(reserva, "cancelada", true)
                                }
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-red-500 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                              >
                                <XIcon className="w-4 h-4" />
                                <span>Cancelar</span>
                              </button>
                            </>
                          )}
                          {reserva.estado === "confirmada" && (
                            <>
                              <button
                                onClick={() => onEdit(reserva)}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Completar</span>
                              </button>
                              <button
                                onClick={() =>
                                  onUpdateStatus(reserva, "cancelada", true)
                                }
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-red-500 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                              >
                                <XIcon className="w-4 h-4" />
                                <span>Cancelar</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Vista Agenda */}
      {viewMode === "agenda" && (
        <div className="space-y-6">
          {fechasOrdenadas.length === 0 &&
            !searchQuery &&
            estadoFilter === "todos" && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-3 opacity-50"
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
                <p className="text-sm">No hay próximas reservas</p>
              </div>
            )}

          {fechasOrdenadas.length === 0 &&
            (searchQuery || estadoFilter !== "todos") && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-3 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-sm">
                  No se encontraron reservas con los filtros aplicados
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setEstadoFilter("todos");
                  }}
                  className="mt-3 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                >
                  Limpiar filtros
                </button>
              </div>
            )}

          {fechasOrdenadas.map((fecha) => {
            const reservasDelDia = reservasAgrupadas[fecha];

            return (
              <div key={fecha}>
                {/* Header de fecha */}
                <div className="mb-3 pb-2 border-b-2 border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                    {formatearFecha(fecha)}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {reservasDelDia.length} reserva
                    {reservasDelDia.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Lista de reservas del día */}
                <div className="space-y-2">
                  {reservasDelDia.map((reserva) => (
                    <div
                      key={reserva._id}
                      className="group bg-white dark:bg-gray-800/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 overflow-hidden"
                    >
                      <div className="flex items-center">
                        {/* Indicador de estado (línea vertical) */}
                        <div
                          className={`w-1.5 h-full ${getEstadoColor(reserva.estado)}`}
                        />

                        {/* Contenido principal */}
                        <div
                          className="flex-1 p-3 sm:p-4 cursor-pointer min-w-0"
                          onClick={() => onEdit(reserva)}
                        >
                          <div className="flex items-start justify-between gap-2 sm:gap-3">
                            {/* Hora y nombre */}
                            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                  {reserva.horaCita}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                                    {reserva.nombre}
                                  </h4>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase flex-shrink-0 w-fit ${
                                      reserva.estado === "pendiente" ?
                                        "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
                                      : reserva.estado === "confirmada" ?
                                        "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300"
                                      : reserva.estado === "completada" ?
                                        "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                                      : "bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300"
                                    }`}
                                  >
                                    {reserva.estado}
                                  </span>
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                  <span className="capitalize">
                                    {reserva.forma}
                                  </span>
                                  {" • "}
                                  <span>Largo {reserva.largo}</span>
                                  {reserva.telefono && (
                                    <>
                                      {" • "}
                                      <span className="hidden sm:inline">
                                        {reserva.telefono}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {reserva.decoracion && (
                                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-500 line-clamp-1">
                                    {reserva.decoracion}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Acciones (desktop) */}
                            <div
                              className="hidden lg:flex items-start gap-2 flex-wrap flex-shrink-0 max-w-md"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {reserva.estado === "pendiente" && (
                                <>
                                  <Button
                                    onClick={() =>
                                      onUpdateStatus(
                                        reserva,
                                        "confirmada",
                                        true
                                      )
                                    }
                                    disabled={saving}
                                    variant="outlined-success"
                                    size="sm"
                                    icon={<CheckIcon />}
                                    title="Confirmar reserva"
                                  >
                                    Confirmar
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      onUpdateStatus(reserva, "cancelada", true)
                                    }
                                    disabled={saving}
                                    variant="outlined-danger"
                                    size="sm"
                                    icon={<XIcon />}
                                    title="Cancelar reserva"
                                  >
                                    Cancelar
                                  </Button>
                                </>
                              )}
                              {reserva.estado === "confirmada" && (
                                <>
                                  <Button
                                    onClick={() => onEdit(reserva)}
                                    disabled={saving}
                                    variant="outlined-primary"
                                    size="sm"
                                    icon={<CheckCircleIcon />}
                                    title="Completar reserva"
                                  >
                                    Completar
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      onUpdateStatus(reserva, "cancelada", true)
                                    }
                                    disabled={saving}
                                    variant="outlined-danger"
                                    size="sm"
                                    icon={<XIcon />}
                                    title="Cancelar reserva"
                                  >
                                    Cancelar
                                  </Button>
                                </>
                              )}
                              <Button
                                onClick={() => onEdit(reserva)}
                                disabled={saving}
                                variant="outlined-warning"
                                size="sm"
                                icon={<EditIcon />}
                                title="Editar reserva"
                              >
                                Editar
                              </Button>
                              <Button
                                onClick={() => onDelete(reserva)}
                                disabled={saving}
                                variant="outlined-danger"
                                size="sm"
                                icon={<TrashIcon />}
                                title="Eliminar reserva"
                              >
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Acciones móviles - Botones de estado con texto */}
                      <div
                        className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 px-3 py-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {reserva.estado === "pendiente" && (
                            <>
                              <button
                                onClick={() =>
                                  onUpdateStatus(reserva, "confirmada", true)
                                }
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-green-500 dark:border-green-400 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                              >
                                <CheckIcon className="w-4 h-4" />
                                <span>Confirmar</span>
                              </button>
                              <button
                                onClick={() =>
                                  onUpdateStatus(reserva, "cancelada", true)
                                }
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-red-500 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                              >
                                <XIcon className="w-4 h-4" />
                                <span>Cancelar</span>
                              </button>
                            </>
                          )}
                          {reserva.estado === "confirmada" && (
                            <>
                              <button
                                onClick={() => onEdit(reserva)}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Completar</span>
                              </button>
                              <button
                                onClick={() =>
                                  onUpdateStatus(reserva, "cancelada", true)
                                }
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-red-500 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                              >
                                <XIcon className="w-4 h-4" />
                                <span>Cancelar</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Botón "Ver más" para la vista agenda */}
          {hayMasReservas && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setAgendaLimit((prev) => prev + 4)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-xl transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                Ver más ({todasReservasFiltradas.length - agendaLimit}{" "}
                restantes)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}