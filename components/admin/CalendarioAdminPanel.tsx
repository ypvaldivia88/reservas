"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BusinessTemplate, Reserva, Servicio } from "@/lib/types";
import { openConfirmationWhatsApp, openCancellationWhatsApp } from "@/lib/whatsapp";
import { Button } from "@/components/ui/Button";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import ReservasTable from "@/components/ReservasTable";
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
} from "@/components/ui/Icons";

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
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
  const [businessTemplate, setBusinessTemplate] = useState<BusinessTemplate | null>(
    null
  );
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

  useEffect(() => {
    loadData();
  }, []);

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

      // Cargar servicios (categorías de ingreso)
      const resServicios = await fetch("/api/servicios");
      if (resServicios.ok) {
        const dataServicios = await resServicios.json();
        if (dataServicios.success) {
          setServicios(dataServicios.data);
        }
      }

      const resSalon = await fetch("/api/salons/current");
      if (resSalon.ok) {
        const salonData = await resSalon.json();
        if (salonData.success) {
          const template =
            salonData.data?.cms?.businessTemplate ??
            salonData.data?.businessTemplate;
          if (template) {
            setBusinessTemplate(template);
          }
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
        setActionMessage("✅ Reserva actualizada exitosamente");
        setEditingReserva(null);
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
        className="dashboard-card mb-8 overflow-hidden rounded-2xl p-4 sm:p-6 md:p-8"
      >
        <ReservasTable
          reservas={reservas}
          saving={saving}
          businessTemplate={businessTemplate}
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
                          if (getCobroTotal(editingReserva) <= 0) {
                            setActionMessage(
                              "❌ Indica el cobro en efectivo y/o transferencia antes de completar"
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
