"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Reserva, User } from "@/lib/types";
import { openConfirmationWhatsApp, openCancellationWhatsApp } from "@/lib/whatsapp";

// Componente interno que usa useSearchParams
function DashboardContent() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [clientes, setClientes] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states for Reservas
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null);
  const [deletingReserva, setDeletingReserva] = useState<Reserva | null>(null);
  const [openMenuReservaId, setOpenMenuReservaId] = useState<string | null>(
    null
  );

  // Modal states for Clientes
  const [creatingCliente, setCreatingCliente] = useState(false);
  const [editingCliente, setEditingCliente] = useState<User | null>(null);
  const [deletingCliente, setDeletingCliente] = useState<User | null>(null);
  const [openMenuClienteId, setOpenMenuClienteId] = useState<string | null>(
    null
  );

  const [actionMessage, setActionMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = () => {
      if (openMenuReservaId) {
        setOpenMenuReservaId(null);
      }
      if (openMenuClienteId) {
        setOpenMenuClienteId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuReservaId, openMenuClienteId]);

  useEffect(() => {
    // Check if there's a reserva parameter in the URL
    const reservaId = searchParams.get("reserva");
    if (reservaId && reservas.length > 0) {
      // Find and open the reservation for editing
      const reserva = reservas.find((r) => r._id === reservaId);
      if (reserva) {
        setEditingReserva(reserva);
        setActionMessage(
          "📱 Reserva abierta desde WhatsApp. Puedes confirmar, editar o descartar."
        );
        setTimeout(() => setActionMessage(""), 5000);
      }
    }
  }, [searchParams, reservas]);

  const loadData = async () => {
    try {
      // Cargar reservas
      const resReservas = await fetch("/api/reservas");
      if (resReservas.ok) {
        const dataReservas = await resReservas.json();
        if (dataReservas.success) {
          setReservas(dataReservas.data);
        }
      }

      // Cargar clientes
      const resClientes = await fetch("/api/clientes");
      if (resClientes.ok) {
        const dataClientes = await resClientes.json();
        if (dataClientes.success) {
          setClientes(dataClientes.data);
        }
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Handlers for Reservas
  const handleUpdateReserva = async (
    reserva: Reserva,
    openWhatsApp: boolean = false
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/reservas/${reserva._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: reserva.nombre,
          telefono: reserva.telefono,
          forma: reserva.forma,
          largo: reserva.largo,
          decoracion: reserva.decoracion,
          fechaCita: reserva.fechaCita,
          horaCita: reserva.horaCita,
          estado: reserva.estado,
          costo: reserva.costo,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setActionMessage("✅ Reserva actualizada exitosamente");
        setEditingReserva(null);
        loadData();

        // Open WhatsApp if requested (for confirm/cancel actions)
        if (openWhatsApp) {
          setTimeout(() => {
            if (reserva.estado === "confirmada") {
              openConfirmationWhatsApp(reserva.telefono, {
                nombre: reserva.nombre,
                telefono: reserva.telefono,
                fechaCita: reserva.fechaCita,
                horaCita: reserva.horaCita,
                forma: reserva.forma,
                largo: reserva.largo,
                decoracion: reserva.decoracion,
              });
            } else if (reserva.estado === "cancelada") {
              openCancellationWhatsApp(reserva.telefono, {
                nombre: reserva.nombre,
                telefono: reserva.telefono,
                fechaCita: reserva.fechaCita,
                horaCita: reserva.horaCita,
                forma: reserva.forma,
                largo: reserva.largo,
                decoracion: reserva.decoracion,
              });
            }
          }, 500);
        }

        setTimeout(() => setActionMessage(""), 3000);
      } else {
        setActionMessage("❌ " + (data.error || "Error al actualizar reserva"));
        setTimeout(() => setActionMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error:", error);
      setActionMessage("❌ Error de conexión");
      setTimeout(() => setActionMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReserva = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/reservas/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setActionMessage("✅ Reserva eliminada exitosamente");
        setDeletingReserva(null);
        loadData();
        setTimeout(() => setActionMessage(""), 3000);
      } else {
        setActionMessage("❌ " + (data.error || "Error al eliminar reserva"));
        setTimeout(() => setActionMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error:", error);
      setActionMessage("❌ Error de conexión");
      setTimeout(() => setActionMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  // CRUD Handlers for Clientes
  const handleCreateCliente = async (nombre: string, telefono: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, telefono }),
      });

      const data = await res.json();

      if (data.success) {
        setActionMessage("✅ Cliente creado exitosamente");
        setCreatingCliente(false);
        loadData();
        setTimeout(() => setActionMessage(""), 3000);
      } else {
        setActionMessage(
          "❌ " + (data.error || data.message || "Error al crear cliente")
        );
        setTimeout(() => setActionMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error:", error);
      setActionMessage("❌ Error de conexión");
      setTimeout(() => setActionMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCliente = async (cliente: User) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/clientes/${cliente._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: cliente.nombre,
          telefono: cliente.telefono,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setActionMessage("✅ Cliente actualizado exitosamente");
        setEditingCliente(null);
        loadData();
        setTimeout(() => setActionMessage(""), 3000);
      } else {
        setActionMessage("❌ " + (data.error || "Error al actualizar cliente"));
        setTimeout(() => setActionMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error:", error);
      setActionMessage("❌ Error de conexión");
      setTimeout(() => setActionMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCliente = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setActionMessage("✅ Cliente eliminado exitosamente");
        setDeletingCliente(null);
        loadData();
        setTimeout(() => setActionMessage(""), 3000);
      } else {
        setActionMessage(
          "❌ " + (data.error || data.message || "Error al eliminar cliente")
        );
        setTimeout(() => setActionMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error:", error);
      setActionMessage("❌ Error de conexión");
      setTimeout(() => setActionMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            Cargando dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global Action Message */}
      {actionMessage && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border-l-4 border-blue-500 dark:border-blue-400 shadow-lg animate-fadeInUp">
          <p className="text-center text-sm font-semibold text-blue-900 dark:text-white">
            {actionMessage}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
        <div className="group bg-white dark:bg-gray-800/50 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-3 sm:p-6 border border-gray-200 dark:border-white/20 hover:scale-105 transition-all duration-300">
          <div className="flex flex-col items-center text-center">
            <div className="text-3xl sm:text-5xl mb-2 sm:mb-3 opacity-80 group-hover:scale-110 transition-transform">
              📅
            </div>
            <p className="text-gray-600 dark:text-blue-200 text-[10px] sm:text-sm font-semibold uppercase tracking-wide mb-1 sm:mb-2">
              Reservas
            </p>
            <p className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              {reservas.length}
            </p>
          </div>
        </div>
        <div className="group bg-white dark:bg-gray-800/50 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-3 sm:p-6 border border-gray-200 dark:border-white/20 hover:scale-105 transition-all duration-300">
          <div className="flex flex-col items-center text-center">
            <div className="text-3xl sm:text-5xl mb-2 sm:mb-3 opacity-80 group-hover:scale-110 transition-transform">
              👥
            </div>
            <p className="text-gray-600 dark:text-blue-200 text-[10px] sm:text-sm font-semibold uppercase tracking-wide mb-1 sm:mb-2">
              Clientes
            </p>
            <p className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              {clientes.length}
            </p>
          </div>
        </div>
        <div className="group bg-white dark:bg-gray-800/50 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-3 sm:p-6 border border-gray-200 dark:border-white/20 hover:scale-105 transition-all duration-300">
          <div className="flex flex-col items-center text-center">
            <div className="text-3xl sm:text-5xl mb-2 sm:mb-3 opacity-80 group-hover:scale-110 transition-transform">
              ⏳
            </div>
            <p className="text-gray-600 dark:text-blue-200 text-[10px] sm:text-sm font-semibold uppercase tracking-wide mb-1 sm:mb-2">
              Pendientes
            </p>
            <p className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              {reservas.filter((r) => r.estado === "pendiente").length}
            </p>
          </div>
        </div>
      </div>

      {/* Reservas Table */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-2xl p-6 sm:p-8 mb-8 border border-gray-200 dark:border-white/20">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <span className="text-3xl">📋</span>
          Reservas Recientes
        </h2>
        <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-white/20">
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider hidden sm:table-cell">
                  Teléfono
                </th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider hidden md:table-cell">
                  Forma
                </th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider hidden md:table-cell">
                  Largo
                </th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Fecha Cita
                </th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((reserva, index) => (
                <tr
                  key={reserva._id}
                  onClick={() => setEditingReserva(reserva)}
                  className={`border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors ${
                    index % 2 === 0 ?
                      "bg-gray-50 dark:bg-white/5"
                    : "bg-white dark:bg-transparent"
                  }`}
                >
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {reserva.nombre}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-blue-200 hidden sm:table-cell">
                    {reserva.telefono}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-blue-200 hidden md:table-cell capitalize">
                    {reserva.forma}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-blue-200 hidden md:table-cell">
                    {reserva.largo}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                        reserva.estado === "pendiente" ?
                          "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-400/50"
                        : reserva.estado === "confirmada" ?
                          "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-400/50"
                        : reserva.estado === "completada" ?
                          "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-400/50"
                        : "bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-400/50"
                      }`}
                    >
                      {reserva.estado}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-blue-200">
                    <div className="flex flex-col">
                      <span className="font-medium">{reserva.fechaCita}</span>
                      <span className="text-xs text-gray-500 dark:text-blue-300">
                        {reserva.horaCita}
                      </span>
                    </div>
                  </td>
                  <td
                    className="px-4 py-4 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Mobile: Dropdown Menu */}
                    <div className="md:hidden relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuReservaId(
                            openMenuReservaId === reserva._id ?
                              null
                            : reserva._id!
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

                      {/* Dropdown Menu */}
                      {openMenuReservaId === reserva._id && (
                        <div
                          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {reserva.estado === "pendiente" && (
                            <>
                              <button
                                onClick={() => {
                                  handleUpdateReserva(
                                    { ...reserva, estado: "confirmada" },
                                    true
                                  );
                                  setOpenMenuReservaId(null);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-green-50 dark:hover:bg-green-900/20 text-green-700 dark:text-green-300 font-medium transition-colors flex items-center gap-3"
                              >
                                <span className="text-lg">✅</span>
                                Confirmar
                              </button>
                              <button
                                onClick={() => {
                                  handleUpdateReserva(
                                    { ...reserva, estado: "cancelada" },
                                    true
                                  );
                                  setOpenMenuReservaId(null);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 font-medium transition-colors flex items-center gap-3"
                              >
                                <span className="text-lg">❌</span>
                                Cancelar
                              </button>
                            </>
                          )}
                          {reserva.estado === "confirmada" && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingReserva(reserva);
                                  setOpenMenuReservaId(null);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium transition-colors flex items-center gap-3"
                              >
                                <span className="text-lg">✔️</span>
                                Completar
                              </button>
                              <button
                                onClick={() => {
                                  handleUpdateReserva(
                                    { ...reserva, estado: "cancelada" },
                                    true
                                  );
                                  setOpenMenuReservaId(null);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 font-medium transition-colors flex items-center gap-3"
                              >
                                <span className="text-lg">❌</span>
                                Cancelar
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setEditingReserva(reserva);
                              setOpenMenuReservaId(null);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors flex items-center gap-3 border-t border-gray-200 dark:border-gray-700"
                          >
                            <span className="text-lg">✏️</span>
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              setDeletingReserva(reserva);
                              setOpenMenuReservaId(null);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 font-medium transition-colors flex items-center gap-3"
                          >
                            <span className="text-lg">🗑️</span>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Desktop: Botones con Iconos y Texto */}
                    <div className="hidden md:flex gap-2 flex-wrap">
                      {reserva.estado === "pendiente" && (
                        <>
                          <button
                            onClick={() => {
                              handleUpdateReserva(
                                { ...reserva, estado: "confirmada" },
                                true
                              );
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                          >
                            <span>✅</span>
                            <span>Confirmar</span>
                          </button>
                          <button
                            onClick={() => {
                              handleUpdateReserva(
                                { ...reserva, estado: "cancelada" },
                                true
                              );
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                          >
                            <span>❌</span>
                            <span>Cancelar</span>
                          </button>
                        </>
                      )}
                      {reserva.estado === "confirmada" && (
                        <>
                          <button
                            onClick={() => setEditingReserva(reserva)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                            title="Completar reserva (debe agregar el costo)"
                          >
                            <span>✔️</span>
                            <span>Completar</span>
                          </button>
                          <button
                            onClick={() => {
                              handleUpdateReserva(
                                { ...reserva, estado: "cancelada" },
                                true
                              );
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                          >
                            <span>❌</span>
                            <span>Cancelar</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setEditingReserva(reserva)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                      >
                        <span>✏️</span>
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => setDeletingReserva(reserva)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                      >
                        <span>🗑️</span>
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gestión de Contenido */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-2xl p-6 sm:p-8 mb-8 border border-gray-200 dark:border-white/20">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <span className="text-3xl">🎨</span>
          Gestión de Contenido
        </h2>
        <button
          onClick={() => router.push("/admin/contenido")}
          className="group w-full p-6 sm:p-8 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-600/30 dark:to-blue-600/30 hover:from-blue-200 hover:to-blue-100 dark:hover:from-blue-600/50 dark:hover:to-blue-600/50 rounded-xl border border-blue-200 dark:border-white/20 hover:border-blue-300 dark:hover:border-white/40 transition-all duration-300 text-left relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 group-hover:via-blue-400/20 transition-all"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-5xl mb-4">💅</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Gestión Unificada de Contenido
              </h3>
              <p className="text-sm text-gray-700 dark:text-blue-200">
                Administra imágenes, galerías, categorías y servicios en un solo
                lugar
              </p>
            </div>
            <div className="text-3xl text-gray-700 dark:text-white opacity-60 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
              →
            </div>
          </div>
        </button>
      </div>

      {/* Clientes Table */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-white/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="text-3xl">👥</span>
            Clientes Registrados
          </h2>
          <button
            onClick={() => setCreatingCliente(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            ➕ Nuevo Cliente
          </button>
        </div>
        <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-white/20">
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider hidden sm:table-cell">
                  Fecha Registro
                </th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-gray-700 dark:text-blue-200 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente, index) => (
                <tr
                  key={cliente._id}
                  onClick={() => setEditingCliente(cliente)}
                  className={`border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors ${
                    index % 2 === 0 ?
                      "bg-gray-50 dark:bg-white/5"
                    : "bg-white dark:bg-transparent"
                  }`}
                >
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {cliente.nombre}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-blue-200">
                    {cliente.telefono}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-blue-200 hidden sm:table-cell">
                    {cliente.fechaCreacion ?
                      new Date(cliente.fechaCreacion).toLocaleDateString()
                    : "-"}
                  </td>
                  <td
                    className="px-4 py-4 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Mobile: Dropdown Menu */}
                    <div className="md:hidden relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuClienteId(
                            openMenuClienteId === cliente._id ?
                              null
                            : cliente._id!
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

                      {/* Dropdown Menu */}
                      {openMenuClienteId === cliente._id && (
                        <div
                          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setEditingCliente(cliente);
                              setOpenMenuClienteId(null);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors flex items-center gap-3"
                          >
                            <span className="text-lg">✏️</span>
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              setDeletingCliente(cliente);
                              setOpenMenuClienteId(null);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 font-medium transition-colors flex items-center gap-3"
                          >
                            <span className="text-lg">🗑️</span>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Desktop: Botones con Iconos y Texto */}
                    <div className="hidden md:flex gap-2 flex-wrap">
                      <button
                        onClick={() => setEditingCliente(cliente)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                      >
                        <span>✏️</span>
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => setDeletingCliente(cliente)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                      >
                        <span>🗑️</span>
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Reserva Modal */}
      {editingReserva && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setEditingReserva(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-2xl">✏️</span>
                Editar Reserva
              </h3>
              <button
                onClick={() => setEditingReserva(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Cerrar"
              >
                <svg
                  className="w-6 h-6"
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

            {/* Content */}
            <div className="px-4 sm:px-6 py-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateReserva(editingReserva);
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={editingReserva.nombre}
                      onChange={(e) =>
                        setEditingReserva({
                          ...editingReserva,
                          nombre: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={editingReserva.telefono}
                      onChange={(e) =>
                        setEditingReserva({
                          ...editingReserva,
                          telefono: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Forma
                    </label>
                    <select
                      value={editingReserva.forma}
                      onChange={(e) =>
                        setEditingReserva({
                          ...editingReserva,
                          forma: e.target.value as
                            | "coffin"
                            | "almond"
                            | "stiletto"
                            | "square",
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white"
                    >
                      <option value="coffin">Coffin</option>
                      <option value="almond">Almond</option>
                      <option value="stiletto">Stiletto</option>
                      <option value="square">Square</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Largo
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={editingReserva.largo}
                      onChange={(e) =>
                        setEditingReserva({
                          ...editingReserva,
                          largo: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Fecha Cita
                    </label>
                    <input
                      type="date"
                      value={editingReserva.fechaCita}
                      onChange={(e) =>
                        setEditingReserva({
                          ...editingReserva,
                          fechaCita: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Hora Cita
                    </label>
                    <input
                      type="time"
                      value={editingReserva.horaCita}
                      onChange={(e) =>
                        setEditingReserva({
                          ...editingReserva,
                          horaCita: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Estado
                    </label>
                    <select
                      value={editingReserva.estado}
                      onChange={(e) =>
                        setEditingReserva({
                          ...editingReserva,
                          estado: e.target.value as
                            | "pendiente"
                            | "confirmada"
                            | "cancelada"
                            | "completada",
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmada">Confirmada</option>
                      <option value="cancelada">Cancelada</option>
                      <option value="completada">Completada</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Decoración
                    </label>
                    <textarea
                      value={editingReserva.decoracion || ""}
                      onChange={(e) =>
                        setEditingReserva({
                          ...editingReserva,
                          decoracion: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      rows={3}
                    />
                  </div>
                  {(editingReserva.estado === "completada" ||
                    editingReserva.estado === "confirmada") && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Costo{" "}
                        {editingReserva.estado === "completada" ?
                          "(requerido)"
                        : "(opcional)"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingReserva.costo || ""}
                        onChange={(e) =>
                          setEditingReserva({
                            ...editingReserva,
                            costo:
                              e.target.value ?
                                parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        required={editingReserva.estado === "completada"}
                      />
                    </div>
                  )}
                </div>

                {/* Quick Action Buttons */}
                {editingReserva.estado === "pendiente" && (
                  <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                      Acciones Rápidas:
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateReserva(
                            {
                              ...editingReserva,
                              estado: "confirmada",
                            },
                            true
                          );
                        }}
                        disabled={saving}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✅ Confirmar Reserva
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateReserva(
                            {
                              ...editingReserva,
                              estado: "cancelada",
                            },
                            true
                          );
                        }}
                        disabled={saving}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ❌ Cancelar Reserva
                      </button>
                    </div>
                  </div>
                )}

                {editingReserva.estado === "confirmada" && (
                  <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                      Acciones Rápidas:
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (editingReserva.costo == null) {
                            setActionMessage(
                              "❌ Por favor ingresa el costo antes de completar la reserva"
                            );
                            setTimeout(() => setActionMessage(""), 3000);
                            return;
                          }
                          handleUpdateReserva(
                            {
                              ...editingReserva,
                              estado: "completada",
                            },
                            false
                          );
                        }}
                        disabled={saving}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✔️ Completar Reserva
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateReserva(
                            {
                              ...editingReserva,
                              estado: "cancelada",
                            },
                            true
                          );
                        }}
                        disabled={saving}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ❌ Cancelar Reserva
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingReserva(null)}
                    disabled={saving}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-500 hover:from-blue-600 hover:to-blue-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ?
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Guardando...
                      </span>
                    : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Reserva Modal */}
      {deletingReserva && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setDeletingReserva(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                Confirmar Eliminación
              </h3>
              <button
                onClick={() => setDeletingReserva(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Cerrar"
              >
                <svg
                  className="w-6 h-6"
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

            {/* Content */}
            <div className="px-4 sm:px-6 py-6">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                ¿Estás seguro de que deseas eliminar la reserva de{" "}
                <strong className="text-gray-900 dark:text-white">
                  {deletingReserva.nombre}
                </strong>
                ? Esta acción no se puede deshacer.
              </p>
            </div>

            {/* Actions */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex gap-3">
              <button
                onClick={() => setDeletingReserva(null)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-xl transition-all font-medium touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteReserva(deletingReserva._id!)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ?
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Eliminando...
                  </span>
                : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Cliente Modal */}
      {creatingCliente && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setCreatingCliente(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-2xl">➕</span>
                Crear Nuevo Cliente
              </h3>
              <button
                onClick={() => setCreatingCliente(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Cerrar"
              >
                <svg
                  className="w-6 h-6"
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

            {/* Content */}
            <div className="px-4 sm:px-6 py-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleCreateCliente(
                    formData.get("nombre") as string,
                    formData.get("telefono") as string
                  );
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    required
                    minLength={2}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    placeholder="+53 12345678"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    required
                  />
                </div>
              </form>
            </div>

            {/* Actions */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex gap-3">
              <button
                type="button"
                onClick={() => setCreatingCliente(false)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-xl transition-all font-medium touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget
                    .closest("div")
                    ?.previousElementSibling?.querySelector("form");
                  if (form) {
                    const formData = new FormData(form as HTMLFormElement);
                    handleCreateCliente(
                      formData.get("nombre") as string,
                      formData.get("telefono") as string
                    );
                  }
                }}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ?
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Creando...
                  </span>
                : "Crear Cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Cliente Modal */}
      {editingCliente && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setEditingCliente(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-2xl">✏️</span>
                Editar Cliente
              </h3>
              <button
                onClick={() => setEditingCliente(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Cerrar"
              >
                <svg
                  className="w-6 h-6"
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

            {/* Content */}
            <div className="px-4 sm:px-6 py-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateCliente(editingCliente);
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editingCliente.nombre}
                    onChange={(e) =>
                      setEditingCliente({
                        ...editingCliente,
                        nombre: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    required
                    minLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={editingCliente.telefono}
                    onChange={(e) =>
                      setEditingCliente({
                        ...editingCliente,
                        telefono: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    required
                  />
                </div>
              </form>
            </div>

            {/* Actions */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingCliente(null)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-xl transition-all font-medium touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleUpdateCliente(editingCliente)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ?
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Guardando...
                  </span>
                : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Cliente Modal */}
      {deletingCliente && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setDeletingCliente(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                Confirmar Eliminación
              </h3>
              <button
                onClick={() => setDeletingCliente(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Cerrar"
              >
                <svg
                  className="w-6 h-6"
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

            {/* Content */}
            <div className="px-4 sm:px-6 py-6">
              <p className="text-gray-600 dark:text-gray-300">
                ¿Estás seguro de que deseas eliminar al cliente{" "}
                <strong className="text-gray-900 dark:text-white">
                  {deletingCliente.nombre}
                </strong>
                ? Esta acción no se puede deshacer. No se puede eliminar un
                cliente con reservas activas.
              </p>
            </div>

            {/* Actions */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex gap-3">
              <button
                onClick={() => setDeletingCliente(null)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-xl transition-all font-medium touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteCliente(deletingCliente._id!)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ?
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Eliminando...
                  </span>
                : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Componente exportado que envuelve DashboardContent en Suspense
export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">
              Cargando dashboard...
            </p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
