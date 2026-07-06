"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Reserva, User, Servicio } from "@/lib/types";
import { openConfirmationWhatsApp, openCancellationWhatsApp } from "@/lib/whatsapp";
import { Button } from "@/components/ui/Button";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import ReservasTable from "@/components/ReservasTable";
import {
  EditIcon,
  TrashIcon,
  PlusIcon,
  ExclamationIcon,
  SaveIcon,
  CloseIcon,
} from "@/components/ui/Icons";

// Componente interno que usa useSearchParams
function DashboardContent() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [clientes, setClientes] = useState<User[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states for Reservas
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null);
  const [deletingReserva, setDeletingReserva] = useState<Reserva | null>(null);

  // Modal states for Clientes
  const [creatingCliente, setCreatingCliente] = useState(false);
  const [editingCliente, setEditingCliente] = useState<User | null>(null);
  const [deletingCliente, setDeletingCliente] = useState<User | null>(null);
  const [openMenuClienteId, setOpenMenuClienteId] = useState<string | null>(
    null
  );

  // Pagination and filters for Clientes
  const [clientesPage, setClientesPage] = useState(1);
  const [clientesPerPage] = useState(10);
  const [clientesSearch, setClientesSearch] = useState("");

  // Control states for ReservasTable
  const [reservasViewMode, setReservasViewMode] = useState<"month" | "agenda">(
    "month"
  );
  const [reservasEstadoFilter, setReservasEstadoFilter] = useState<
    Reserva["estado"] | "todos"
  >("todos");

  const [actionMessage, setActionMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const getReservaServicioIds = (reserva: Reserva): string[] => {
    if (reserva.servicioIds && reserva.servicioIds.length > 0) {
      return reserva.servicioIds;
    }
    return reserva.servicioId ? [reserva.servicioId] : [];
  };

  const normalizeReservaForEdit = (reserva: Reserva): Reserva => ({
    ...reserva,
    servicioIds: getReservaServicioIds(reserva),
    servicioId: getReservaServicioIds(reserva)[0],
  });

  const sumServiciosPrecio = (servicioIds: string[]): number =>
    servicioIds.reduce((total, servicioId) => {
      const servicio = servicios.find((s) => s._id === servicioId);
      return total + (servicio?.precio ?? 0);
    }, 0);

  const handleReservaServiciosChange = (servicioIds: string[]) => {
    if (!editingReserva) return;
    const nextCosto = sumServiciosPrecio(servicioIds);

    setEditingReserva({
      ...editingReserva,
      servicioIds,
      servicioId: servicioIds[0],
      costo: servicioIds.length > 0 ? nextCosto : editingReserva.costo,
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "month" || view === "agenda") {
      setReservasViewMode(view);
      setReservasEstadoFilter(view === "agenda" ? "pendiente" : "todos");
    } else {
      setReservasViewMode("month");
      setReservasEstadoFilter("todos");
    }

    const reservaId = searchParams.get("reserva");
    if (!reservaId && view) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }, [searchParams]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = () => {
      if (openMenuClienteId) {
        setOpenMenuClienteId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuClienteId]);

  useEffect(() => {
    // Check if there's a reserva parameter in the URL
    const reservaId = searchParams.get("reserva");
    if (reservaId && reservas.length > 0) {
      // Find and open the reservation for editing
      const reserva = reservas.find((r) => r._id === reservaId);
      if (reserva) {
        setEditingReserva(normalizeReservaForEdit(reserva));
        setActionMessage(
          "Reserva abierta desde WhatsApp. Puedes confirmar, editar o descartar."
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

      // Cargar servicios (categorías de ingreso)
      const resServicios = await fetch("/api/servicios");
      if (resServicios.ok) {
        const dataServicios = await resServicios.json();
        if (dataServicios.success) {
          setServicios(dataServicios.data);
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
          servicioIds: getReservaServicioIds(reserva),
          servicioId: getReservaServicioIds(reserva)[0],
          cobroEfectivo: reserva.cobroEfectivo,
          cobroTransferencia: reserva.cobroTransferencia,
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

  // Filter and paginate Clientes
  const filteredClientes = clientes.filter((cliente) => {
    return (
      cliente.nombre.toLowerCase().includes(clientesSearch.toLowerCase()) ||
      (cliente.telefono?.includes(clientesSearch) ?? false)
    );
  });

  const totalClientesPages = Math.ceil(
    filteredClientes.length / clientesPerPage
  );
  const paginatedClientes = filteredClientes.slice(
    (clientesPage - 1) * clientesPerPage,
    clientesPage * clientesPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            Cargando calendario...
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

      {/* Reservas / Calendario */}
      <div
        id="reservas-section"
        className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 mb-8 border border-gray-200 dark:border-white/20"
      >
        <ReservasTable
          reservas={reservas}
          saving={saving}
          onEdit={(reserva) => setEditingReserva(normalizeReservaForEdit(reserva))}
          onDelete={setDeletingReserva}
          onUpdateStatus={(reserva, estado, openWhatsApp = false) => {
            handleUpdateReserva({ ...reserva, estado }, openWhatsApp);
          }}
          externalViewMode={reservasViewMode}
          externalEstadoFilter={reservasEstadoFilter}
          onViewModeChange={setReservasViewMode}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-6 mb-8">
        <button
          onClick={() => {
            setReservasViewMode("month");
            setReservasEstadoFilter("todos");
            document
              .querySelector("#reservas-section")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="group bg-white dark:bg-gray-800/50 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg sm:shadow-xl p-2 sm:p-3 md:p-6 border border-gray-200 dark:border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-1 sm:mb-2 md:mb-3 opacity-80 group-hover:scale-110 transition-transform">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 text-blue-600 dark:text-blue-400"
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
            </div>
            <p className="text-gray-600 dark:text-blue-200 text-[9px] sm:text-[10px] md:text-sm font-semibold uppercase tracking-wide mb-0.5 sm:mb-1 md:mb-2">
              Reservas
            </p>
            <p className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {reservas.length}
            </p>
          </div>
        </button>
        <button
          onClick={() => {
            document
              .querySelector("#clientes-section")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="group bg-white dark:bg-gray-800/50 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg sm:shadow-xl p-2 sm:p-3 md:p-6 border border-gray-200 dark:border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-1 sm:mb-2 md:mb-3 opacity-80 group-hover:scale-110 transition-transform">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-blue-200 text-[9px] sm:text-[10px] md:text-sm font-semibold uppercase tracking-wide mb-0.5 sm:mb-1 md:mb-2">
              Clientes
            </p>
            <p className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {clientes.length}
            </p>
          </div>
        </button>
        <button
          onClick={() => {
            setReservasViewMode("agenda");
            setReservasEstadoFilter("pendiente");
            document
              .querySelector("#reservas-section")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="group bg-white dark:bg-gray-800/50 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg sm:shadow-xl p-2 sm:p-3 md:p-6 border border-gray-200 dark:border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-1 sm:mb-2 md:mb-3 opacity-80 group-hover:scale-110 transition-transform">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 text-blue-600 dark:text-blue-400"
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
            </div>
            <p className="text-gray-600 dark:text-blue-200 text-[9px] sm:text-[10px] md:text-sm font-semibold uppercase tracking-wide mb-0.5 sm:mb-1 md:mb-2">
              Pendientes
            </p>
            <p className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {reservas.filter((r) => r.estado === "pendiente").length}
            </p>
          </div>
        </button>
      </div>

      {/* Clientes Table */}
      <div
        id="clientes-section"
        className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-white/20"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="text-3xl">👥</span>
            Clientes Registrados
          </h2>
          <Button
            onClick={() => setCreatingCliente(true)}
            disabled={saving}
            icon={<PlusIcon />}
          >
            Nuevo Cliente
          </Button>
        </div>

        {/* Filters for Clientes */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre o teléfono..."
                  value={clientesSearch}
                  onChange={(e) => {
                    setClientesSearch(e.target.value);
                    setClientesPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
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
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Mostrando {paginatedClientes.length} de {filteredClientes.length}{" "}
              cliente{filteredClientes.length !== 1 ? "s" : ""}
            </span>
            {clientesSearch && (
              <button
                onClick={() => {
                  setClientesSearch("");
                  setClientesPage(1);
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
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
              {paginatedClientes.length === 0 ?
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <svg
                        className="w-16 h-16 text-gray-300 dark:text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <p className="text-lg font-medium">
                        No se encontraron clientes
                      </p>
                      {clientesSearch && (
                        <p className="text-sm">Intenta ajustar la búsqueda</p>
                      )}
                    </div>
                  </td>
                </tr>
              : paginatedClientes.map((cliente, index) => (
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setDeletingCliente(cliente);
                                setOpenMenuClienteId(null);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 font-medium transition-colors flex items-center gap-3"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Desktop: Botones con Iconos y Texto */}
                      <div className="hidden md:flex gap-2 flex-wrap">
                        <Button
                          onClick={() => setEditingCliente(cliente)}
                          disabled={saving}
                          variant="outlined-warning"
                          size="sm"
                          icon={<EditIcon />}
                        >
                          Editar
                        </Button>
                        <Button
                          onClick={() => setDeletingCliente(cliente)}
                          disabled={saving}
                          variant="outlined-danger"
                          size="sm"
                          icon={<TrashIcon />}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination for Clientes */}
        {totalClientesPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Página {clientesPage} de {totalClientesPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setClientesPage(1)}
                disabled={clientesPage === 1}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Primera página"
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
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={() => setClientesPage((prev) => Math.max(1, prev - 1))}
                disabled={clientesPage === 1}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Página anterior"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Page numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalClientesPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalClientesPages <= 7) return true;
                    if (page === 1 || page === totalClientesPages) return true;
                    if (page >= clientesPage - 1 && page <= clientesPage + 1)
                      return true;
                    return false;
                  })
                  .map((page, idx, arr) => (
                    <div key={page} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-2 text-gray-500 dark:text-gray-400">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => setClientesPage(page)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          clientesPage === page ?
                            "bg-blue-600 dark:bg-blue-500 text-white font-bold"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() =>
                  setClientesPage((prev) =>
                    Math.min(totalClientesPages, prev + 1)
                  )
                }
                disabled={clientesPage === totalClientesPages}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Página siguiente"
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <button
                onClick={() => setClientesPage(totalClientesPages)}
                disabled={clientesPage === totalClientesPages}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Última página"
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
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
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
                <EditIcon className="w-6 h-6" />
                Editar Reserva
              </h3>
              <Button
                onClick={() => setEditingReserva(null)}
                variant="ghost"
                size="sm"
                icon={<CloseIcon className="w-6 h-6" />}
                aria-label="Cerrar"
              />
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const efectivo = Number(editingReserva.cobroEfectivo) || 0;
                  const transferencia =
                    Number(editingReserva.cobroTransferencia) || 0;
                  if (
                    editingReserva.costo != null &&
                    efectivo + transferencia > editingReserva.costo
                  ) {
                    setActionMessage(
                      "❌ El desglose de cobro no puede superar el total"
                    );
                    setTimeout(() => setActionMessage(""), 3000);
                    return;
                  }
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
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Servicios consumidos
                        </label>
                        <MultiSelectDropdown
                          options={servicios
                            .filter((s) => s.activo)
                            .map((servicio) => ({
                              value: servicio._id!,
                              label: `${servicio.nombre}${
                                servicio.precio
                                  ? ` (${servicio.precio.toFixed(2)} CUP)`
                                  : ""
                              }`,
                            }))}
                          selected={getReservaServicioIds(editingReserva)}
                          onChange={handleReservaServiciosChange}
                          placeholder="Seleccionar servicios..."
                        />
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                          Puedes seleccionar varios servicios. El ingreso se
                          registra una sola vez con el total del turno.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Ingreso / Costo (CUP){" "}
                          {editingReserva.estado === "completada"
                            ? "(editable)"
                            : "(opcional)"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingReserva.costo ?? ""}
                          onChange={(e) =>
                            setEditingReserva({
                              ...editingReserva,
                              costo:
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder="0.00"
                        />
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                          Se registra automáticamente en finanzas al guardar.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Cobro en efectivo (CUP){" "}
                          <span className="font-normal text-gray-500">
                            (opcional)
                          </span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingReserva.cobroEfectivo ?? ""}
                          onChange={(e) =>
                            setEditingReserva({
                              ...editingReserva,
                              cobroEfectivo:
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Cobro por transferencia (CUP){" "}
                          <span className="font-normal text-gray-500">
                            (opcional)
                          </span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingReserva.cobroTransferencia ?? ""}
                          onChange={(e) =>
                            setEditingReserva({
                              ...editingReserva,
                              cobroTransferencia:
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder="0.00"
                        />
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                          Puedes dividir el pago entre efectivo y transferencia.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Quick Action Buttons */}
                {editingReserva.estado === "pendiente" && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                      Acciones Rápidas
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className="px-5 py-2.5 border-2 border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-600 dark:hover:border-emerald-300"
                      >
                        <span className="text-lg">✅</span>
                        <span>Confirmar Reserva</span>
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
                        className="px-5 py-2.5 border-2 border-rose-500 dark:border-rose-400 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:border-rose-600 dark:hover:border-rose-300"
                      >
                        <span className="text-lg">❌</span>
                        <span>Cancelar Reserva</span>
                      </button>
                    </div>
                  </div>
                )}

                {editingReserva.estado === "confirmada" && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                      Acciones Rápidas
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          const efectivo =
                            Number(editingReserva.cobroEfectivo) || 0;
                          const transferencia =
                            Number(editingReserva.cobroTransferencia) || 0;
                          if (efectivo + transferencia > editingReserva.costo) {
                            setActionMessage(
                              "❌ El desglose de cobro no puede superar el total"
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
                        className="px-5 py-2.5 border-2 border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-600 dark:hover:border-emerald-300"
                      >
                        <span className="text-lg">✔️</span>
                        <span>Completar Reserva</span>
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
                        className="px-5 py-2.5 border-2 border-gray-500 dark:border-gray-400 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-500/10 rounded-xl transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600 dark:hover:border-gray-300"
                      >
                        <span className="text-lg">❌</span>
                        <span>Cancelar Reserva</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    type="button"
                    onClick={() => setEditingReserva(null)}
                    disabled={saving}
                    variant="outlined-secondary"
                  >
                    Cerrar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    variant="primary"
                    loading={saving}
                    icon={<SaveIcon />}
                  >
                    Guardar Cambios
                  </Button>
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
                <ExclamationIcon className="w-6 h-6 text-yellow-500" />
                Confirmar Eliminación
              </h3>
              <Button
                onClick={() => setDeletingReserva(null)}
                variant="ghost"
                size="sm"
                icon={<CloseIcon className="w-6 h-6" />}
                aria-label="Cerrar"
              />
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
              <Button
                onClick={() => setDeletingReserva(null)}
                disabled={saving}
                variant="outlined-secondary"
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleDeleteReserva(deletingReserva._id!)}
                disabled={saving}
                variant="danger"
                loading={saving}
                fullWidth
              >
                Eliminar
              </Button>
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
                <PlusIcon className="w-6 h-6" />
                Crear Nuevo Cliente
              </h3>
              <Button
                onClick={() => setCreatingCliente(false)}
                variant="ghost"
                size="sm"
                icon={<CloseIcon className="w-6 h-6" />}
                aria-label="Cerrar"
              />
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
              <Button
                type="button"
                onClick={() => setCreatingCliente(false)}
                disabled={saving}
                variant="outlined-secondary"
                fullWidth
              >
                Cancelar
              </Button>
              <Button
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
                loading={saving}
                fullWidth
              >
                Crear Cliente
              </Button>
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
                <EditIcon className="w-6 h-6" />
                Editar Cliente
              </h3>
              <Button
                onClick={() => setEditingCliente(null)}
                variant="ghost"
                size="sm"
                icon={<CloseIcon className="w-6 h-6" />}
                aria-label="Cerrar"
              />
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
              <Button
                type="button"
                onClick={() => setEditingCliente(null)}
                disabled={saving}
                variant="outlined-secondary"
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => handleUpdateCliente(editingCliente)}
                disabled={saving}
                variant="primary"
                loading={saving}
                icon={<SaveIcon />}
                fullWidth
              >
                Guardar Cambios
              </Button>
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
                <ExclamationIcon className="w-6 h-6 text-yellow-500" />
                Confirmar Eliminación
              </h3>
              <Button
                onClick={() => setDeletingCliente(null)}
                variant="ghost"
                size="sm"
                icon={<CloseIcon className="w-6 h-6" />}
                aria-label="Cerrar"
              />
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
              <Button
                onClick={() => setDeletingCliente(null)}
                disabled={saving}
                variant="outlined-secondary"
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleDeleteCliente(deletingCliente._id!)}
                disabled={saving}
                variant="danger"
                loading={saving}
                fullWidth
              >
                Eliminar
              </Button>
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
              Cargando calendario...
            </p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
