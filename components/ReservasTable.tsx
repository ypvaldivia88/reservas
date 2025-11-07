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
}

type ViewMode = "month" | "agenda";

export default function ReservasTable({
  reservas,
  saving,
  onEdit,
  onDelete,
  onUpdateStatus,
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

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getProximoTurnoFecha();
  });
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const fechaProximoTurno = getProximoTurnoFecha();
    return new Date(fechaProximoTurno + "T00:00:00");
  });
  const [agendaLimit, setAgendaLimit] = useState(4); // Límite inicial de 4 reservas

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

  // Filtrar reservas según el modo de vista
  const getFilteredReservas = () => {
    if (viewMode === "month") {
      // En vista mes, mostrar reservas del día seleccionado
      return selectedDate && reservasPorFecha[selectedDate] ?
          reservasPorFecha[selectedDate].sort((a, b) =>
            a.horaCita.localeCompare(b.horaCita)
          )
        : [];
    } else {
      // En vista agenda, mostrar según el límite actual
      return getProximosTurnos(agendaLimit);
    }
  };

  // Variables para la vista agenda
  const todasReservasFuturas = getProximosTurnos(); // Todas las reservas futuras sin límite
  const hayMasReservas = todasReservasFuturas.length > agendaLimit; // ¿Hay más para mostrar?

  // Agrupar reservas para la vista agenda
  const reservasAgrupadas =
    viewMode === "agenda" ?
      getProximosTurnos(agendaLimit).reduce(
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
            onClick={() => setViewMode("month")}
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

      {/* Vista de Mes: Calendario */}
      {viewMode === "month" && (
        <div className="bg-white dark:bg-gray-800/30 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4 max-w-md mx-auto">
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
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
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
              const hasReservas = reservasPorFecha[dateStr];
              const reservasCount =
                hasReservas ? reservasPorFecha[dateStr].length : 0;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(dateStr)}
                  disabled={!isCurrentMonth}
                  className={`
                    aspect-square p-1.5 sm:p-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative
                    ${!isCurrentMonth ? "text-gray-300 dark:text-gray-600 cursor-not-allowed" : ""}
                    ${isToday && isCurrentMonth ? "bg-green-500 text-white font-bold" : ""}
                    ${isSelected && !isToday && isCurrentMonth ? "bg-blue-500 text-white" : ""}
                    ${!isSelected && !isToday && isCurrentMonth ? "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white cursor-pointer" : ""}
                  `}
                >
                  <span className="block">{date.getDate()}</span>
                  {hasReservas && isCurrentMonth && (
                    <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                      {Array.from({ length: Math.min(reservasCount, 3) }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className={`w-1 h-1 rounded-full ${
                              isSelected || isToday ? "bg-white" : (
                                "bg-blue-500 dark:bg-blue-400"
                              )
                            }`}
                          />
                        )
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de reservas */}
      <div className="space-y-6">
        {viewMode === "month" &&
          selectedDate &&
          !reservasPorFecha[selectedDate] && (
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

        {viewMode === "agenda" && fechasOrdenadas.length === 0 && (
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

        {fechasOrdenadas.map((fecha) => {
          const reservasDelDia =
            viewMode === "agenda" ?
              reservasAgrupadas[fecha]
            : reservasPorFecha[fecha].sort((a, b) =>
                a.horaCita.localeCompare(b.horaCita)
              );

          return (
            <div key={fecha}>
              {/* Header de fecha (solo mostrar en vista agenda) */}
              {viewMode === "agenda" && (
                <div className="mb-3 pb-2 border-b-2 border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                    {formatearFecha(fecha)}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {reservasDelDia.length} reserva
                    {reservasDelDia.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

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
                            className="hidden lg:flex items-start gap-2 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {reserva.estado === "pendiente" && (
                              <>
                                <Button
                                  onClick={() =>
                                    onUpdateStatus(reserva, "confirmada", true)
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
                              size="sm"
                              icon={<EditIcon />}
                              title="Editar reserva"
                            >
                              Editar
                            </Button>
                            <Button
                              onClick={() => onDelete(reserva)}
                              disabled={saving}
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

                    {/* Acciones móviles (expandible) */}
                    <div
                      className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 px-3 sm:px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col gap-2">
                        {reserva.estado === "pendiente" && (
                          <>
                            <Button
                              onClick={() =>
                                onUpdateStatus(reserva, "confirmada", true)
                              }
                              disabled={saving}
                              variant="outlined-success"
                              size="sm"
                              icon={<CheckIcon />}
                              fullWidth
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
                              fullWidth
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
                              fullWidth
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
                              fullWidth
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => onEdit(reserva)}
                            disabled={saving}
                            size="sm"
                            icon={<EditIcon />}
                            fullWidth
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => onDelete(reserva)}
                            disabled={saving}
                            size="sm"
                            icon={<TrashIcon />}
                            fullWidth
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Botón "Ver más" para la vista agenda */}
        {viewMode === "agenda" && hayMasReservas && (
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
              Ver más ({todasReservasFuturas.length - agendaLimit} restantes)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}