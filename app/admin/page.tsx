"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Reserva, ApiResponse } from "@/lib/types";

export default function AdminPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("todas");
  const [mensaje, setMensaje] = useState("");
  const [editando, setEditando] = useState<Reserva | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    cargarReservas();
  }, []);

  const cargarReservas = async () => {
    try {
      const res = await fetch("/api/reservas");
      const data: ApiResponse<Reserva[]> = await res.json();

      if (data.success && data.data) {
        setReservas(data.data);
      }
    } catch (error) {
      console.error("Error cargando reservas:", error);
      setMensaje("Error al cargar las reservas");
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstado = async (id: string, estado: string) => {
    if (!id) {
      setMensaje("ID de reserva inválido");
      return;
    }

    try {
      const res = await fetch(`/api/reservas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });

      const data: ApiResponse = await res.json();

      if (data.success) {
        setMensaje(`Reserva ${estado} exitosamente`);
        cargarReservas();
        setTimeout(() => setMensaje(""), 3000);
      } else {
        setMensaje(data.error || "Error al actualizar la reserva");
      }
    } catch (error) {
      console.error("Error actualizando reserva:", error);
      setMensaje("Error de conexión");
    }
  };

  const eliminarReserva = async (id: string) => {
    if (!id) {
      setMensaje("ID de reserva inválido");
      return;
    }

    if (!confirm("¿Estás seguro de eliminar esta reserva?")) return;

    try {
      const res = await fetch(`/api/reservas/${id}`, {
        method: "DELETE",
      });

      const data: ApiResponse = await res.json();

      if (data.success) {
        setMensaje("Reserva eliminada exitosamente");
        cargarReservas();
        setTimeout(() => setMensaje(""), 3000);
      } else {
        setMensaje(data.error || "Error al eliminar la reserva");
      }
    } catch (error) {
      console.error("Error eliminando reserva:", error);
      setMensaje("Error de conexión");
    }
  };

  const abrirEdicion = (reserva: Reserva) => {
    setEditando({
      ...reserva,
      fechaCita: reserva.fechaCita || undefined,
      horaCita: reserva.horaCita || "",
    });
    setShowEditModal(true);
  };

  const guardarEdicion = async () => {
    if (!editando || !editando._id) return;

    try {
      const res = await fetch(`/api/reservas/${editando._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechaCita: editando.fechaCita,
          horaCita: editando.horaCita,
          nombre: editando.nombre,
          telefono: editando.telefono,
          forma: editando.forma,
          largo: editando.largo,
          decoracion: editando.decoracion,
        }),
      });

      const data: ApiResponse = await res.json();

      if (data.success) {
        setMensaje("Reserva actualizada exitosamente");
        setShowEditModal(false);
        setEditando(null);
        cargarReservas();
        setTimeout(() => setMensaje(""), 3000);
      } else {
        setMensaje(data.error || "Error al actualizar la reserva");
      }
    } catch (error) {
      console.error("Error actualizando reserva:", error);
      setMensaje("Error de conexión");
    }
  };

  const reservasFiltradas =
    filtroEstado === "todas"
      ? reservas
      : reservas.filter((r) => r.estado === filtroEstado);

  const getEstadoColor = (estado?: string) => {
    switch (estado) {
      case "confirmada":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "cancelada":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "completada":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    }
  };

  const formatearFecha = (fecha?: Date) => {
    if (!fecha) return "No asignada";
    return new Date(fecha).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Cargando reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Panel de Administración
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Gestión de reservas
              </p>
            </div>
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensaje de notificación */}
        {mensaje && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              mensaje.includes("Error") || mensaje.includes("error")
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            }`}
          >
            {mensaje}
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📋</div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reservas.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">⏳</div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pendientes
                </p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {reservas.filter((r) => r.estado === "pendiente").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">✅</div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Confirmadas
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {reservas.filter((r) => r.estado === "confirmada").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🎉</div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completadas
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {reservas.filter((r) => r.estado === "completada").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroEstado("todas")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroEstado === "todas"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Todas ({reservas.length})
            </button>
            <button
              onClick={() => setFiltroEstado("pendiente")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroEstado === "pendiente"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Pendientes (
              {reservas.filter((r) => r.estado === "pendiente").length})
            </button>
            <button
              onClick={() => setFiltroEstado("confirmada")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroEstado === "confirmada"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Confirmadas (
              {reservas.filter((r) => r.estado === "confirmada").length})
            </button>
            <button
              onClick={() => setFiltroEstado("completada")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroEstado === "completada"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Completadas (
              {reservas.filter((r) => r.estado === "completada").length})
            </button>
            <button
              onClick={() => setFiltroEstado("cancelada")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroEstado === "cancelada"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Canceladas (
              {reservas.filter((r) => r.estado === "cancelada").length})
            </button>
          </div>
        </div>

        {/* Lista de reservas */}
        <div className="space-y-4">
          {reservasFiltradas.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No hay reservas
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No se encontraron reservas con el filtro seleccionado
              </p>
            </div>
          ) : (
            reservasFiltradas.map((reserva) => (
              <div
                key={reserva._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {reserva.nombre}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                          reserva.estado
                        )}`}
                      >
                        {reserva.estado?.toUpperCase() || "PENDIENTE"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center text-gray-700 dark:text-gray-300">
                        <span className="mr-2">📞</span>
                        <span>{reserva.telefono}</span>
                      </div>
                      <div className="flex items-center text-gray-700 dark:text-gray-300">
                        <span className="mr-2">💅</span>
                        <span>
                          {reserva.forma.charAt(0).toUpperCase() +
                            reserva.forma.slice(1)}{" "}
                          - Largo {reserva.largo}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-700 dark:text-gray-300">
                        <span className="mr-2">📅</span>
                        <span>{formatearFecha(reserva.fechaCita)}</span>
                      </div>
                      <div className="flex items-center text-gray-700 dark:text-gray-300">
                        <span className="mr-2">🕐</span>
                        <span>{reserva.horaCita || "No asignada"}</span>
                      </div>
                    </div>
                    {reserva.decoracion && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Decoración:</span>{" "}
                        {reserva.decoracion}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      Creada: {formatearFecha(reserva.fechaCreacion)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {reserva.estado === "pendiente" && reserva._id && (
                      <>
                        <button
                          onClick={() =>
                            actualizarEstado(reserva._id!, "confirmada")
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          ✅ Confirmar
                        </button>
                        <button
                          onClick={() =>
                            actualizarEstado(reserva._id!, "cancelada")
                          }
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          ❌ Cancelar
                        </button>
                      </>
                    )}
                    {reserva.estado === "confirmada" && reserva._id && (
                      <button
                        onClick={() =>
                          actualizarEstado(reserva._id!, "completada")
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        🎉 Completar
                      </button>
                    )}
                    {reserva._id && (
                      <>
                        <button
                          onClick={() => abrirEdicion(reserva)}
                          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => eliminarReserva(reserva._id!)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          🗑️ Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal de edición */}
      {showEditModal && editando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Editar Reserva
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editando.nombre}
                    onChange={(e) =>
                      setEditando({ ...editando, nombre: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={editando.telefono}
                    onChange={(e) =>
                      setEditando({ ...editando, telefono: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha de Cita
                    </label>
                    <input
                      type="date"
                      value={
                        editando.fechaCita
                          ? new Date(editando.fechaCita)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setEditando({
                          ...editando,
                          fechaCita: new Date(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hora de Cita
                    </label>
                    <input
                      type="time"
                      value={editando.horaCita || ""}
                      onChange={(e) =>
                        setEditando({ ...editando, horaCita: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Decoración
                  </label>
                  <textarea
                    value={editando.decoracion || ""}
                    onChange={(e) =>
                      setEditando({ ...editando, decoracion: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditando(null);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarEdicion}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
