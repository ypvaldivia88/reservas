"use client";
import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { BusinessTemplate, Categoria, Reserva, Servicio } from "@/lib/types";
import { openConfirmationWhatsApp, openCancellationWhatsApp } from "@/lib/whatsapp";
import { uploadReservaWorkPhotos } from "@/lib/reserva-work-photos";
import { Button } from "@/components/ui/Button";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import ReservasTable from "@/components/ReservasTable";
import ReservaWorkPhotosUpload from "@/components/admin/ReservaWorkPhotosUpload";
import OfflineBanner from "@/components/admin/OfflineBanner";
import { ReservationMetricsSection } from "@/components/admin/TenantMetricSections";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { loadCalendarBundle } from "@/lib/offline/calendar-sync";
import {
  getReservaTemplateConfig,
  isManicureReservation,
} from "@/lib/reserva-template-config";
import {
  EditIcon,
  TrashIcon,
  ExclamationIcon,
  SaveIcon,
  CloseIcon,
  SwapIcon,
  InfoIcon,
} from "@/components/ui/Icons";

function isActiveReserva(estado: Reserva["estado"]): boolean {
  return estado === "pendiente" || estado === "confirmada";
}

function getSwappableReservas(
  reservas: Reserva[],
  current: Reserva
): Reserva[] {
  return reservas
    .filter(
      (reserva) =>
        reserva._id !== current._id && isActiveReserva(reserva.estado)
    )
    .sort((a, b) => {
      if (a.fechaCita !== b.fechaCita) {
        return a.fechaCita.localeCompare(b.fechaCita);
      }
      return a.horaCita.localeCompare(b.horaCita);
    });
}

function formatReservaFecha(fechaCita: string): string {
  const fecha = new Date(`${fechaCita}T00:00:00`);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);
  fecha.setHours(0, 0, 0, 0);

  if (fecha.getTime() === hoy.getTime()) return "Hoy";
  if (fecha.getTime() === manana.getTime()) return "Mañana";

  return fecha.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatReservaSlot(reserva: Reserva): string {
  return `${formatReservaFecha(reserva.fechaCita)} • ${reserva.horaCita}`;
}

function getReservaServicioIds(reserva: Reserva): string[] {
  if (reserva.servicioIds && reserva.servicioIds.length > 0) {
    return reserva.servicioIds;
  }
  return reserva.servicioId ? [reserva.servicioId] : [];
}

function normalizeReservaForEdit(reserva: Reserva): Reserva {
  const base: Reserva = {
    ...reserva,
    servicioIds: getReservaServicioIds(reserva),
    servicioId: getReservaServicioIds(reserva)[0],
  };

  if (
    reserva.costo != null &&
    reserva.cobroEfectivo == null &&
    reserva.cobroTransferencia == null
  ) {
    if (reserva.metodoPago === "transferencia") {
      return { ...base, cobroTransferencia: reserva.costo };
    }
    return { ...base, cobroEfectivo: reserva.costo };
  }

  return base;
}

// Componente interno que usa useSearchParams
function CalendarioAdminPanel() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [clientesCount, setClientesCount] = useState(0);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const pendingWorkPhotosRef = useRef<File[]>([]);
  const pendingCategoriaIdsRef = useRef<string[]>([]);

  // Modal states for Reservas
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null);
  const [deletingReserva, setDeletingReserva] = useState<Reserva | null>(null);

  // Control states for ReservasTable
  const [reservasViewMode, setReservasViewMode] = useState<"month" | "agenda">(
    "month"
  );
  const [reservasEstadoFilter, setReservasEstadoFilter] = useState<
    Reserva["estado"] | "todos"
  >("todos");

  const [actionMessage, setActionMessage] = useState("");
  const [editError, setEditError] = useState("");
  const [swapMode, setSwapMode] = useState(false);
  const [swapTarget, setSwapTarget] = useState<Reserva | null>(null);
  const [swapSearchQuery, setSwapSearchQuery] = useState("");
  const [businessTemplate, setBusinessTemplate] = useState<BusinessTemplate | null>(
    null
  );
  const [fromCache, setFromCache] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const online = useOnlineStatus();
  const searchParams = useSearchParams();
  const isManicure = isManicureReservation(businessTemplate);
  const templateConfig = getReservaTemplateConfig(businessTemplate);

  const getCobroTotal = (reserva: Reserva): number => {
    const efectivo = Number(reserva.cobroEfectivo) || 0;
    const transferencia = Number(reserva.cobroTransferencia) || 0;
    const fromCobro = efectivo + transferencia;
    if (fromCobro > 0) return fromCobro;
    return Number(reserva.costo) || 0;
  };

  const buildReservaForSave = (reserva: Reserva): Reserva => {
    const isCobroState =
      reserva.estado === "confirmada" || reserva.estado === "completada";
    const efectivo =
      reserva.cobroEfectivo != null ? Number(reserva.cobroEfectivo) : 0;
    const transferencia =
      reserva.cobroTransferencia != null ? Number(reserva.cobroTransferencia) : 0;
    const safeEfectivo = isNaN(efectivo) ? 0 : Math.max(0, efectivo);
    const safeTransferencia = isNaN(transferencia) ? 0 : Math.max(0, transferencia);
    const total = safeEfectivo + safeTransferencia;

    if (!isCobroState) {
      return {
        ...reserva,
        costo: total > 0 ? total : reserva.costo,
      };
    }

    return {
      ...reserva,
      cobroEfectivo: safeEfectivo,
      cobroTransferencia: safeTransferencia,
      costo: total > 0 ? total : reserva.costo,
    };
  };

  const handlePendingPhotosChange = useCallback((files: File[]) => {
    pendingWorkPhotosRef.current = files;
  }, []);

  const handleCategoriaIdsChange = useCallback((ids: string[]) => {
    pendingCategoriaIdsRef.current = ids;
  }, []);

  const uploadPendingWorkPhotos = async (
    reserva: Reserva
  ): Promise<string | null> => {
    const files = pendingWorkPhotosRef.current;
    if (files.length === 0 || !reserva._id) return null;

    const result = await uploadReservaWorkPhotos(files, {
      reservaId: reserva._id,
      servicioIds: getReservaServicioIds(reserva),
      categoriaIds: pendingCategoriaIdsRef.current,
      clienteNombre: reserva.nombre,
      fechaCita: reserva.fechaCita,
    });

    pendingWorkPhotosRef.current = [];

    if (result.uploaded > 0 && result.failed === 0) {
      return `${result.uploaded} foto(s) agregada(s) a Nuestros Trabajos`;
    }
    if (result.uploaded > 0 && result.failed > 0) {
      return `${result.uploaded} foto(s) subida(s), ${result.failed} con error`;
    }
    if (result.failed > 0) {
      return `Error al subir fotos: ${result.errors[0]}`;
    }
    return null;
  };

  const sumServiciosPrecio = (servicioIds: string[]): number =>
    servicioIds.reduce((total, servicioId) => {
      const servicio = servicios.find((s) => s._id === servicioId);
      return total + (servicio?.precio ?? 0);
    }, 0);

  const handleReservaServiciosChange = (servicioIds: string[]) => {
    if (!editingReserva) return;
    const suggestedTotal = sumServiciosPrecio(servicioIds);
    const hasCobro =
      editingReserva.cobroEfectivo != null ||
      editingReserva.cobroTransferencia != null;

    setEditingReserva({
      ...editingReserva,
      servicioIds,
      servicioId: servicioIds[0],
      ...(suggestedTotal > 0 && !hasCobro
        ? { cobroEfectivo: suggestedTotal }
        : {}),
    });
  };

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const bundle = await loadCalendarBundle();
      setReservas(bundle.reservas);
      setServicios(bundle.servicios);
      setCategorias(bundle.categorias);
      setClientesCount(bundle.clientesCount);
      if (bundle.businessTemplate) {
        setBusinessTemplate(bundle.businessTemplate);
      }
      setFromCache(bundle.fromCache);
      setSyncedAt(bundle.syncedAt);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      if (!options?.silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const wasOfflineRef = useRef(false);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!online) {
      wasOfflineRef.current = true;
      return;
    }
    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      void loadData({ silent: true });
    }
  }, [online, loadData]);

  useEffect(() => {
    const view = searchParams.get("view");
    const estadoParam = searchParams.get("estado");

    if (view === "month" || view === "agenda") {
      setReservasViewMode(view);
    } else {
      setReservasViewMode("month");
    }

    if (estadoParam === "pendiente" || estadoParam === "confirmada" || estadoParam === "completada" || estadoParam === "cancelada") {
      setReservasEstadoFilter(estadoParam);
    } else if (view === "agenda") {
      setReservasEstadoFilter("pendiente");
    } else {
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

  const closeEditModal = () => {
    pendingWorkPhotosRef.current = [];
    pendingCategoriaIdsRef.current = [];
    setEditingReserva(null);
    setEditError("");
    setSwapMode(false);
    setSwapTarget(null);
    setSwapSearchQuery("");
  };

  const openEditModal = (reserva: Reserva) => {
    pendingWorkPhotosRef.current = [];
    pendingCategoriaIdsRef.current = [];
    setEditingReserva(normalizeReservaForEdit(reserva));
    setEditError("");
    setSwapMode(false);
    setSwapTarget(null);
    setSwapSearchQuery("");
  };

  const swappableReservas = editingReserva
    ? getSwappableReservas(reservas, editingReserva)
    : [];
  const swapCandidates = swappableReservas;
  const filteredSwapCandidates = swapCandidates.filter((reserva) => {
    if (!swapSearchQuery.trim()) return true;
    const query = swapSearchQuery.trim().toLowerCase();
    return (
      reserva.nombre.toLowerCase().includes(query) ||
      reserva.telefono?.includes(query) ||
      reserva.fechaCita.includes(query) ||
      reserva.horaCita.includes(query)
    );
  });

  const handleSwapReservas = async () => {
    if (!editingReserva || !swapTarget) return;

    if (!online) {
      setEditError(
        "Sin conexión. El intercambio se aplica cuando vuelvas a estar en línea."
      );
      return;
    }

    setSaving(true);
    setEditError("");

    try {
      const res = await fetch("/api/reservas/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservaIdA: editingReserva._id,
          reservaIdB: swapTarget._id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setActionMessage(
          `✅ Citas intercambiadas: ${editingReserva.nombre} (${formatReservaSlot(editingReserva)}) ↔ ${swapTarget.nombre} (${formatReservaSlot(swapTarget)})`
        );
        closeEditModal();
        loadData();
        setTimeout(() => setActionMessage(""), 4000);
      } else {
        setEditError(data.error || "No se pudo intercambiar los horarios");
      }
    } catch (error) {
      console.error("Error:", error);
      setEditError("Error de conexión al intercambiar horarios");
    } finally {
      setSaving(false);
    }
  };

  // CRUD Handlers for Reservas
  const handleUpdateReserva = async (
    reserva: Reserva,
    openWhatsApp: boolean = false
  ) => {
    if (!online) {
      const message =
        "Sin conexión. Los cambios se aplican cuando vuelvas a estar en línea.";
      setEditError(message);
      setActionMessage(message);
      setTimeout(() => setActionMessage(""), 4000);
      return;
    }
    setSaving(true);
    setEditError("");
    const payload = buildReservaForSave(reserva);
    try {
      const res = await fetch(`/api/reservas/${payload._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: payload.nombre,
          telefono: payload.telefono,
          ...(isManicure
            ? { forma: payload.forma, largo: payload.largo }
            : {}),
          decoracion: payload.decoracion,
          fechaCita: payload.fechaCita,
          horaCita: payload.horaCita,
          estado: payload.estado,
          costo: payload.costo,
          servicioIds: getReservaServicioIds(payload),
          servicioId: getReservaServicioIds(payload)[0],
          cobroEfectivo: payload.cobroEfectivo,
          cobroTransferencia: payload.cobroTransferencia,
        }),
      });

      const data = await res.json();

      if (data.success) {
        let message = "✅ Reserva actualizada exitosamente";

        if (
          payload.estado === "completada" &&
          pendingWorkPhotosRef.current.length > 0
        ) {
          const photoMessage = await uploadPendingWorkPhotos(payload);
          if (photoMessage) {
            message += `. ${photoMessage}`;
          }
        }

        setActionMessage(message);
        closeEditModal();
        pendingCategoriaIdsRef.current = [];
        loadData();

        // Open WhatsApp if requested (for confirm/cancel actions)
        if (openWhatsApp) {
          setTimeout(() => {
            if (reserva.estado === "confirmada") {
              openConfirmationWhatsApp(
                reserva.telefono,
                {
                  nombre: reserva.nombre,
                  telefono: reserva.telefono,
                  fechaCita: reserva.fechaCita,
                  horaCita: reserva.horaCita,
                  forma: reserva.forma,
                  largo: reserva.largo,
                  decoracion: reserva.decoracion,
                },
                businessTemplate
              );
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
        const errorMessage = data.error || "Error al actualizar reserva";
        setEditError(errorMessage);
        setActionMessage("❌ " + errorMessage);
        setTimeout(() => setActionMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = "Error de conexión";
      setEditError(errorMessage);
      setActionMessage("❌ " + errorMessage);
      setTimeout(() => setActionMessage(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReserva = async (id: string) => {
    if (!online) {
      setActionMessage("Sin conexión. Los cambios se aplican cuando vuelvas a estar en línea.");
      setTimeout(() => setActionMessage(""), 4000);
      return;
    }
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
      <OfflineBanner
        fromCache={fromCache}
        syncedAt={syncedAt}
        online={online}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          void loadData({ silent: true });
        }}
      />

      {/* Global Action Message */}
      {actionMessage && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border-l-4 border-blue-500 dark:border-blue-400 shadow-lg animate-fadeInUp">
          <p className="text-center text-sm font-semibold text-blue-900 dark:text-white">
            {actionMessage}
          </p>
        </div>
      )}

      <ReservationMetricsSection
        reservas={reservas}
        clientesCount={clientesCount}
      />

      {/* Reservas / Calendario */}
      <div
        id="reservas-section"
        className="dashboard-card mb-8 overflow-hidden rounded-2xl p-4 sm:p-6 md:p-8"
      >
        <ReservasTable
          reservas={reservas}
          saving={saving}
          businessTemplate={businessTemplate}
          onEdit={openEditModal}
          onDelete={setDeletingReserva}
          onUpdateStatus={(reserva, estado, openWhatsApp = false) => {
            handleUpdateReserva({ ...reserva, estado }, openWhatsApp);
          }}
          externalViewMode={reservasViewMode}
          externalEstadoFilter={reservasEstadoFilter}
          onViewModeChange={setReservasViewMode}
        />
      </div>

      {/* Edit Reserva Modal */}
      {editingReserva && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeEditModal}
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
                onClick={closeEditModal}
                variant="ghost"
                size="sm"
                icon={<CloseIcon className="w-6 h-6" />}
                aria-label="Cerrar"
              />
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-6">
              {editError && (
                <div
                  className="mb-4 p-4 bg-rose-50 dark:bg-rose-900/30 rounded-xl border-l-4 border-rose-500 dark:border-rose-400"
                  role="alert"
                >
                  <p className="text-sm font-medium text-rose-900 dark:text-rose-100">
                    {editError}
                  </p>
                </div>
              )}

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
                      onChange={(e) => {
                        setEditError("");
                        setEditingReserva({
                          ...editingReserva,
                          nombre: e.target.value,
                        });
                      }}
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
                      onChange={(e) => {
                        setEditError("");
                        setEditingReserva({
                          ...editingReserva,
                          telefono: e.target.value,
                        });
                      }}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      required
                    />
                  </div>
                  {isManicure && (
                    <>
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
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Fecha Cita
                    </label>
                    <input
                      type="date"
                      value={editingReserva.fechaCita}
                      onChange={(e) => {
                        setEditError("");
                        setEditingReserva({
                          ...editingReserva,
                          fechaCita: e.target.value,
                        });
                      }}
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
                      onChange={(e) => {
                        setEditError("");
                        setEditingReserva({
                          ...editingReserva,
                          horaCita: e.target.value,
                        });
                      }}
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
                      {isManicure
                        ? "Decoración"
                        : templateConfig.reservation.summaryDetailsLabel}
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
                          Cobro en efectivo (CUP)
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
                          Cobro por transferencia (CUP)
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
                      </div>
                      {getCobroTotal(editingReserva) > 0 && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Total del turno:{" "}
                            <span className="text-blue-600 dark:text-blue-400">
                              {getCobroTotal(editingReserva).toFixed(2)} CUP
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Se registra automáticamente en finanzas al guardar.
                            Puedes dividir el pago entre efectivo y
                            transferencia.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  {(editingReserva.estado === "completada" ||
                    editingReserva.estado === "confirmada") && (
                    <ReservaWorkPhotosUpload
                      key={editingReserva._id}
                      reservaId={editingReserva._id}
                      servicioIds={getReservaServicioIds(editingReserva)}
                      servicios={servicios}
                      categorias={categorias}
                      disabled={saving}
                      onPendingChange={handlePendingPhotosChange}
                      onCategoriaIdsChange={handleCategoriaIdsChange}
                    />
                  )}
                </div>

                {isActiveReserva(editingReserva.estado) && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-2">
                    <div className="flex items-start gap-3 mb-4">
                      <SwapIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          Intercambiar horario
                        </h4>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Cambia el turno de dos clientes sin modificar sus datos.
                          Puedes elegir cualquier otra cita activa ya programada.
                        </p>
                      </div>
                    </div>

                    {!swapMode ? (
                      <Button
                        type="button"
                        onClick={() => {
                          setSwapMode(true);
                          setSwapTarget(null);
                          setSwapSearchQuery("");
                          setEditError("");
                        }}
                        disabled={saving || swapCandidates.length === 0}
                        variant="outlined-primary"
                        fullWidth
                        icon={<SwapIcon />}
                      >
                        {swapCandidates.length === 0
                          ? "No hay otras citas activas para intercambiar"
                          : "Intercambiar con otra cita"}
                      </Button>
                    ) : !swapTarget ? (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Selecciona la cita con la que quieres intercambiar:
                        </p>
                        {swapCandidates.length > 5 && (
                          <input
                            type="search"
                            value={swapSearchQuery}
                            onChange={(e) => setSwapSearchQuery(e.target.value)}
                            placeholder="Buscar por nombre, teléfono o fecha..."
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                          />
                        )}
                        <div className="space-y-2 max-h-56 overflow-y-auto">
                          {filteredSwapCandidates.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                              No se encontraron citas con esa búsqueda.
                            </p>
                          ) : (
                            filteredSwapCandidates.map((reserva) => (
                            <button
                              key={reserva._id}
                              type="button"
                              onClick={() => setSwapTarget(reserva)}
                              className="w-full text-left p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 bg-gray-50 dark:bg-gray-700/50 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                                    {reserva.nombre}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatReservaSlot(reserva)}
                                  </p>
                                </div>
                                <SwapIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              </div>
                            </button>
                          )))}
                        </div>
                        <Button
                          type="button"
                          onClick={() => setSwapMode(false)}
                          disabled={saving}
                          variant="ghost"
                          fullWidth
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                          <div className="flex items-start gap-2 mb-3">
                            <InfoIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              Confirma el intercambio de citas:
                            </p>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/70 dark:bg-gray-800/70">
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {editingReserva.nombre}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap text-right">
                                {formatReservaSlot(editingReserva)}
                              </span>
                            </div>
                            <div className="flex justify-center">
                              <SwapIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/70 dark:bg-gray-800/70">
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {swapTarget.nombre}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap text-right">
                                {formatReservaSlot(swapTarget)}
                              </span>
                            </div>
                          </div>
                          <p className="mt-3 text-xs text-blue-800 dark:text-blue-200">
                            Después del intercambio, {editingReserva.nombre} quedará
                            el {formatReservaFecha(swapTarget.fechaCita)} a las{" "}
                            {swapTarget.horaCita} y {swapTarget.nombre} el{" "}
                            {formatReservaFecha(editingReserva.fechaCita)} a las{" "}
                            {editingReserva.horaCita}.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Button
                            type="button"
                            onClick={() => setSwapTarget(null)}
                            disabled={saving}
                            variant="outlined-secondary"
                            fullWidth
                          >
                            Elegir otra
                          </Button>
                          <Button
                            type="button"
                            onClick={handleSwapReservas}
                            disabled={saving}
                            variant="primary"
                            loading={saving}
                            icon={<SwapIcon />}
                            fullWidth
                          >
                            Confirmar intercambio
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                          if (getCobroTotal(editingReserva) <= 0) {
                            setEditError(
                              "Indica el cobro en efectivo y/o transferencia antes de completar"
                            );
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
                    onClick={closeEditModal}
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

    </>
  );
}

export default function CalendarioAdminPage() {
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
      <CalendarioAdminPanel />
    </Suspense>
  );
}
