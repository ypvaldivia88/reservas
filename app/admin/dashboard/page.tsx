"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Reserva, User } from "@/lib/types";
import AdminNav from "@/components/AdminNav";
import { openConfirmationWhatsApp, openCancellationWhatsApp } from "@/lib/whatsapp";

// Componente interno que usa useSearchParams
function DashboardContent() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [clientes, setClientes] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  // Modal states for Reservas
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null);
  const [deletingReserva, setDeletingReserva] = useState<Reserva | null>(null);

  // Modal states for Clientes
  const [creatingCliente, setCreatingCliente] = useState(false);
  const [editingCliente, setEditingCliente] = useState<User | null>(null);
  const [deletingCliente, setDeletingCliente] = useState<User | null>(null);

  const [actionMessage, setActionMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    loadData();
  }, []);

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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage("");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setPasswordMessage("✅ Contraseña actualizada exitosamente");
        setCurrentPassword("");
        setNewPassword("");
        setTimeout(() => setShowChangePassword(false), 2000);
      } else {
        setPasswordMessage(
          "❌ " + (data.error || "Error al cambiar contraseña")
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setPasswordMessage("❌ Error de conexión");
    }
  };

  // CRUD Handlers for Reservas
  const handleUpdateReserva = async (reserva: Reserva, openWhatsApp: boolean = false) => {
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
    }
  };

  const handleDeleteReserva = async (id: string) => {
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
    }
  };

  // CRUD Handlers for Clientes
  const handleCreateCliente = async (nombre: string, telefono: string) => {
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
    }
  };

  const handleUpdateCliente = async (cliente: User) => {
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
    }
  };

  const handleDeleteCliente = async (id: string) => {
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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-violet-900 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white dark:text-gray-300 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-violet-900 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-purple-400 to-pink-400 p-3 rounded-xl shadow-lg">
                <span className="text-2xl">💎</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Panel Administrador
                </h1>
                <p className="text-purple-200 text-sm">Beauty Salon Management</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 touch-manipulation min-h-[44px] whitespace-nowrap"
              >
                <span className="hidden sm:inline">🔑 Cambiar Contraseña</span>
                <span className="sm:hidden">🔑</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition-all duration-300 text-sm sm:text-base font-medium border border-white/20 hover:border-white/40 touch-manipulation min-h-[44px] whitespace-nowrap"
              >
                <span className="hidden sm:inline">🚪 Cerrar Sesión</span>
                <span className="sm:hidden">🚪</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Global Action Message */}
        {actionMessage && (
          <div className="mb-6 p-4 glass-strong rounded-xl border-l-4 border-purple-400 shadow-lg animate-fadeInUp">
            <p className="text-center text-sm font-semibold text-white">{actionMessage}</p>
          </div>
        )}

        {/* Cambiar Contraseña Form */}
        {showChangePassword && (
          <div className="glass-strong rounded-2xl shadow-2xl p-8 mb-8 border border-white/20 animate-fadeInUp">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-3xl">🔒</span>
              Cambiar Contraseña
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-3">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-white placeholder-white/50 transition-all"
                  placeholder="Ingresa tu contraseña actual"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-3">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-white placeholder-white/50 transition-all"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                />
              </div>
              {passwordMessage && (
                <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-sm font-medium text-white">{passwordMessage}</p>
                </div>
              )}
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Actualizar Contraseña
              </button>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group glass-strong rounded-2xl shadow-xl p-6 border border-white/20 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-semibold uppercase tracking-wide mb-2">
                  Total Reservas
                </p>
                <p className="text-4xl font-bold text-white">
                  {reservas.length}
                </p>
              </div>
              <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform">
                📅
              </div>
            </div>
          </div>
          <div className="group glass-strong rounded-2xl shadow-xl p-6 border border-white/20 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-semibold uppercase tracking-wide mb-2">
                  Total Clientes
                </p>
                <p className="text-4xl font-bold text-white">
                  {clientes.length}
                </p>
              </div>
              <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform">
                👥
              </div>
            </div>
          </div>
          <div className="group glass-strong rounded-2xl shadow-xl p-6 border border-white/20 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-semibold uppercase tracking-wide mb-2">
                  Pendientes
                </p>
                <p className="text-4xl font-bold text-white">
                  {reservas.filter((r) => r.estado === "pendiente").length}
                </p>
              </div>
              <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform">
                ⏳
              </div>
            </div>
          </div>
        </div>

        {/* Reservas Table */}
        <div className="glass-strong rounded-2xl shadow-2xl p-6 sm:p-8 mb-8 border border-white/20">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">📋</span>
            Reservas Recientes
          </h2>
          <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b-2 border-white/20">
                  <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-wider hidden sm:table-cell">
                    Teléfono
                  </th>
                  <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-wider hidden md:table-cell">
                    Forma
                  </th>
                  <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-wider hidden md:table-cell">
                    Largo
                  </th>
                  <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-wider">
                    Fecha Cita
                  </th>
                  <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((reserva, index) => (
                  <tr
                    key={reserva._id}
                    onClick={() => setEditingReserva(reserva)}
                    className={`border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors ${
                      index % 2 === 0 ? 'bg-white/5' : ''
                    }`}
                  >
                    <td className="px-4 py-4 text-sm font-medium text-white">
                      {reserva.nombre}
                    </td>
                    <td className="px-4 py-4 text-sm text-purple-200 hidden sm:table-cell">
                      {reserva.telefono}
                    </td>
                    <td className="px-4 py-4 text-sm text-purple-200 hidden md:table-cell capitalize">
                      {reserva.forma}
                    </td>
                    <td className="px-4 py-4 text-sm text-purple-200 hidden md:table-cell">
                      {reserva.largo}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                          reserva.estado === "pendiente" ?
                            "bg-yellow-500/20 text-yellow-300 border border-yellow-400/50"
                          : reserva.estado === "confirmada" ?
                            "bg-green-500/20 text-green-300 border border-green-400/50"
                          : reserva.estado === "completada" ?
                            "bg-blue-500/20 text-blue-300 border border-blue-400/50"
                          : "bg-gray-500/20 text-gray-300 border border-gray-400/50"
                        }`}
                      >
                        {reserva.estado}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-purple-200">
                      <div className="flex flex-col">
                        <span className="font-medium">{reserva.fechaCita}</span>
                        <span className="text-xs text-purple-300">{reserva.horaCita}</span>
                      </div>
                    </td>
                    <td
                      className="px-4 py-4 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2 flex-wrap">
                        {reserva.estado === "pendiente" && (
                          <>
                            <button
                              onClick={() => {
                                handleUpdateReserva(
                                  {
                                    ...reserva,
                                    estado: "confirmada",
                                  },
                                  true
                                );
                              }}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                              ✅
                            </button>
                            <button
                              onClick={() => {
                                handleUpdateReserva(
                                  {
                                    ...reserva,
                                    estado: "cancelada",
                                  },
                                  true
                                );
                              }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                              ❌
                            </button>
                          </>
                        )}
                        {reserva.estado === "confirmada" && (
                          <>
                            <button
                              onClick={() => setEditingReserva(reserva)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                              title="Completar reserva (debe agregar el costo)"
                            >
                              ✔️
                            </button>
                            <button
                              onClick={() => {
                                handleUpdateReserva(
                                  {
                                    ...reserva,
                                    estado: "cancelada",
                                  },
                                  true
                                );
                              }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                              ❌
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setDeletingReserva(reserva)}
                          className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                        >
                          🗑️
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
        <div className="glass-strong rounded-2xl shadow-2xl p-6 sm:p-8 mb-8 border border-white/20">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">🎨</span>
            Gestión de Contenido
          </h2>
          <button
            onClick={() => router.push("/admin/contenido")}
            className="group w-full p-6 sm:p-8 bg-gradient-to-br from-purple-600/30 to-pink-600/30 hover:from-purple-600/50 hover:to-pink-600/50 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-300 text-left relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-pink-400/10 to-purple-400/0 group-hover:via-pink-400/20 transition-all"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-5xl mb-4">💅</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Gestión Unificada de Contenido
                </h3>
                <p className="text-sm text-purple-200">
                  Administra imágenes, galerías, categorías y servicios en un solo lugar
                </p>
              </div>
              <div className="text-3xl text-white opacity-60 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                →
              </div>
            </div>
          </button>
        </div>

        {/* Clientes Table */}
        <div className="glass-strong rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
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
                <tr className="border-b-2 border-white/20">
                  <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-wider hidden sm:table-cell">
                    Fecha Registro
                  </th>
                  <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente, index) => (
                  <tr
                    key={cliente._id}
                    onClick={() => setEditingCliente(cliente)}
                    className={`border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors ${
                      index % 2 === 0 ? 'bg-white/5' : ''
                    }`}
                  >
                    <td className="px-4 py-4 text-sm font-medium text-white">
                      {cliente.nombre}
                    </td>
                    <td className="px-4 py-4 text-sm text-purple-200">
                      {cliente.telefono}
                    </td>
                    <td className="px-4 py-4 text-sm text-purple-200 hidden sm:table-cell">
                      {cliente.fechaCreacion ?
                        new Date(cliente.fechaCreacion).toLocaleDateString()
                      : "-"}
                    </td>
                    <td
                      className="px-4 py-4 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setDeletingCliente(cliente)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Reserva Modal */}
      {editingReserva && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-strong rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-fadeInUp">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-2xl">✏️</span>
              Editar Reserva
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateReserva(editingReserva);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2">
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
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-white placeholder-white/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2">
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
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-white placeholder-white/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2">
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
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-white"
                  >
                    <option value="coffin" className="bg-gray-800">Coffin</option>
                    <option value="almond" className="bg-gray-800">Almond</option>
                    <option value="stiletto" className="bg-gray-800">Stiletto</option>
                    <option value="square" className="bg-gray-800">Square</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2">
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
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-white placeholder-white/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2">
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
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-white placeholder-white/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2">
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
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-white placeholder-white/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-200 mb-2">
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
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-white"
                  >
                    <option value="pendiente" className="bg-gray-800">Pendiente</option>
                    <option value="confirmada" className="bg-gray-800">Confirmada</option>
                    <option value="cancelada" className="bg-gray-800">Cancelada</option>
                    <option value="completada" className="bg-gray-800">Completada</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-purple-200 mb-2">
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
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-white placeholder-white/50"
                    rows={3}
                  />
                </div>
                {(editingReserva.estado === "completada" ||
                  editingReserva.estado === "confirmada") && (
                  <div>
                    <label className="block text-sm font-semibold text-purple-200 mb-2">
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
                      className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-white placeholder-white/50"
                      required={editingReserva.estado === "completada"}
                    />
                  </div>
                )}
              </div>

              {/* Quick Action Buttons */}
              {editingReserva.estado === "pendiente" && (
                <div className="border-t-2 border-white/20 pt-6">
                  <h4 className="text-sm font-bold text-purple-200 mb-4 uppercase tracking-wide">
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
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
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
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      ❌ Cancelar Reserva
                    </button>
                  </div>
                </div>
              )}

              {editingReserva.estado === "confirmada" && (
                <div className="border-t-2 border-white/20 pt-6">
                  <h4 className="text-sm font-bold text-purple-200 mb-4 uppercase tracking-wide">
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
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
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
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
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
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all font-semibold border border-white/20"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Reserva Modal */}
      {deletingReserva && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-strong rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20 animate-fadeInUp">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              Confirmar Eliminación
            </h3>
            <p className="text-purple-200 mb-6">
              ¿Estás seguro de que deseas eliminar la reserva de{" "}
              <strong className="text-white">{deletingReserva.nombre}</strong>? Esta acción no se puede
              deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingReserva(null)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all font-semibold border border-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteReserva(deletingReserva._id!)}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Cliente Modal */}
      {creatingCliente && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-strong rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20 animate-fadeInUp">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-2xl">➕</span>
              Crear Nuevo Cliente
            </h3>
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
                <label className="block text-sm font-semibold text-purple-200 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-white placeholder-white/50"
                  required
                  minLength={2}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  placeholder="+53 12345678"
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-white placeholder-white/50"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setCreatingCliente(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all font-semibold border border-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Crear Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cliente Modal */}
      {editingCliente && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-strong rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20 animate-fadeInUp">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-2xl">✏️</span>
              Editar Cliente
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateCliente(editingCliente);
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">
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
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-white placeholder-white/50"
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">
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
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-white placeholder-white/50"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setEditingCliente(null)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all font-semibold border border-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Cliente Modal */}
      {deletingCliente && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-strong rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20 animate-fadeInUp">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              Confirmar Eliminación
            </h3>
            <p className="text-purple-200 mb-6">
              ¿Estás seguro de que deseas eliminar al cliente{" "}
              <strong className="text-white">{deletingCliente.nombre}</strong>? Esta acción no se puede
              deshacer. No se puede eliminar un cliente con reservas activas.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingCliente(null)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all font-semibold border border-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteCliente(deletingCliente._id!)}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente exportado que envuelve DashboardContent en Suspense
export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
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