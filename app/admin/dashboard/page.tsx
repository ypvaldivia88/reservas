"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Reserva, User } from "@/lib/types";
import AdminNav from "@/components/AdminNav";

export default function AdminDashboard() {
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
    const reservaId = searchParams.get('reserva');
    if (reservaId && reservas.length > 0) {
      // Find and open the reservation for editing
      const reserva = reservas.find(r => r._id === reservaId);
      if (reserva) {
        setEditingReserva(reserva);
        setActionMessage("📱 Reserva abierta desde WhatsApp. Puedes confirmar, editar o descartar.");
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
        setPasswordMessage("❌ " + (data.error || "Error al cambiar contraseña"));
      }
    } catch (error) {
      console.error("Error:", error);
      setPasswordMessage("❌ Error de conexión");
    }
  };

  // CRUD Handlers for Reservas
  const handleUpdateReserva = async (reserva: Reserva) => {
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
        }),
      });

      const data = await res.json();

      if (data.success) {
        setActionMessage("✅ Reserva actualizada exitosamente");
        setEditingReserva(null);
        loadData();
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
        setActionMessage("❌ " + (data.error || data.message || "Error al crear cliente"));
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
        setActionMessage("❌ " + (data.error || data.message || "Error al eliminar cliente"));
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
                <span className="text-2xl">👨‍💼</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Panel Administrador
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="px-4 py-2 sm:px-4 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium touch-manipulation min-h-[44px] whitespace-nowrap"
              >
                <span className="hidden sm:inline">🔑 Cambiar Contraseña</span>
                <span className="sm:hidden">🔑 Contraseña</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 sm:px-6 sm:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base font-medium touch-manipulation min-h-[44px] whitespace-nowrap"
              >
                <span className="hidden sm:inline">🚪 Cerrar Sesión</span>
                <span className="sm:hidden">🚪 Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Global Action Message */}
        {actionMessage && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-center text-sm font-medium">{actionMessage}</p>
          </div>
        )}

        {/* Cambiar Contraseña Form */}
        {showChangePassword && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Cambiar Contraseña
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  minLength={8}
                  required
                />
              </div>
              {passwordMessage && (
                <p className="text-sm">{passwordMessage}</p>
              )}
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Actualizar Contraseña
              </button>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Reservas</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{reservas.length}</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Clientes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{clientes.length}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Pendientes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {reservas.filter((r) => r.estado === "pendiente").length}
                </p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
        </div>

        {/* Gestión de Contenido */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Gestión de Contenido
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push("/admin/imagenes")}
              className="p-6 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg hover:shadow-lg transition-all text-left"
            >
              <div className="text-4xl mb-3">🖼️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Imágenes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gestionar biblioteca de imágenes
              </p>
            </button>
            <button
              onClick={() => router.push("/admin/servicios")}
              className="p-6 bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/30 rounded-lg hover:shadow-lg transition-all text-left"
            >
              <div className="text-4xl mb-3">💅</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Servicios
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gestionar servicios ofrecidos
              </p>
            </button>
            <button
              onClick={() => router.push("/admin/categorias")}
              className="p-6 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 rounded-lg hover:shadow-lg transition-all text-left"
            >
              <div className="text-4xl mb-3">📁</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Categorías
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gestionar categorías
              </p>
            </button>
            <button
              onClick={() => router.push("/admin/galeria")}
              className="p-6 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-lg hover:shadow-lg transition-all text-left"
            >
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Galería
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gestionar galería de trabajos
              </p>
            </button>
          </div>
        </div>

        {/* Reservas Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Reservas Recientes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Forma
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Largo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Fecha Cita
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((reserva) => (
                  <tr
                    key={reserva._id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {reserva.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {reserva.telefono}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {reserva.forma}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {reserva.largo}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          reserva.estado === "pendiente"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : reserva.estado === "confirmada"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {reserva.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {reserva.fechaCita} {reserva.horaCita}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingReserva(reserva)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => setDeletingReserva(reserva)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clientes Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Clientes Registrados
            </h2>
            <button
              onClick={() => setCreatingCliente(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ➕ Nuevo Cliente
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Fecha Registro
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr
                    key={cliente._id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {cliente.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {cliente.telefono}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {cliente.fechaCreacion
                        ? new Date(cliente.fechaCreacion).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingCliente(cliente)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => setDeletingCliente(cliente)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Editar Reserva
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateReserva(editingReserva);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editingReserva.nombre}
                    onChange={(e) =>
                      setEditingReserva({ ...editingReserva, nombre: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={editingReserva.telefono}
                    onChange={(e) =>
                      setEditingReserva({ ...editingReserva, telefono: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Forma
                  </label>
                  <select
                    value={editingReserva.forma}
                    onChange={(e) =>
                      setEditingReserva({
                        ...editingReserva,
                        forma: e.target.value as "coffin" | "almond" | "stiletto" | "square",
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="coffin">Coffin</option>
                    <option value="almond">Almond</option>
                    <option value="stiletto">Stiletto</option>
                    <option value="square">Square</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Cita
                  </label>
                  <input
                    type="date"
                    value={editingReserva.fechaCita}
                    onChange={(e) =>
                      setEditingReserva({ ...editingReserva, fechaCita: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora Cita
                  </label>
                  <input
                    type="time"
                    value={editingReserva.horaCita}
                    onChange={(e) =>
                      setEditingReserva({ ...editingReserva, horaCita: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={editingReserva.estado}
                    onChange={(e) =>
                      setEditingReserva({
                        ...editingReserva,
                        estado: e.target.value as "pendiente" | "confirmada" | "cancelada" | "completada",
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="cancelada">Cancelada</option>
                    <option value="completada">Completada</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Decoración
                  </label>
                  <textarea
                    value={editingReserva.decoracion || ""}
                    onChange={(e) =>
                      setEditingReserva({ ...editingReserva, decoracion: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
              </div>
              
              {/* Quick Action Buttons */}
              {editingReserva.estado === 'pendiente' && (
                <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Acciones Rápidas:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateReserva({ ...editingReserva, estado: 'confirmada' });
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      ✅ Confirmar Reserva
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateReserva({ ...editingReserva, estado: 'cancelada' });
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      ❌ Cancelar Reserva
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingReserva(null)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              ¿Estás seguro de que deseas eliminar la reserva de <strong>{deletingReserva.nombre}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingReserva(null)}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteReserva(deletingReserva._id!)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Cliente Modal */}
      {creatingCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
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
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  placeholder="+53 12345678"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setCreatingCliente(false)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Editar Cliente
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateCliente(editingCliente);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editingCliente.nombre}
                  onChange={(e) =>
                    setEditingCliente({ ...editingCliente, nombre: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={editingCliente.telefono}
                  onChange={(e) =>
                    setEditingCliente({ ...editingCliente, telefono: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingCliente(null)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              ¿Estás seguro de que deseas eliminar al cliente <strong>{deletingCliente.nombre}</strong>?
              Esta acción no se puede deshacer. No se puede eliminar un cliente con reservas activas.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingCliente(null)}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteCliente(deletingCliente._id!)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
