"use client";

import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/design/PageHeader";
import { SearchInput } from "@/components/design/IconInput";
import {
  EditIcon,
  TrashIcon,
  PlusIcon,
  ExclamationIcon,
  SaveIcon,
  CloseIcon,
} from "@/components/ui/Icons";

export default function ClientesAdminPanel() {
  const [clientes, setClientes] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const [creatingCliente, setCreatingCliente] = useState(false);
  const [editingCliente, setEditingCliente] = useState<User | null>(null);
  const [deletingCliente, setDeletingCliente] = useState<User | null>(null);
  const [openMenuClienteId, setOpenMenuClienteId] = useState<string | null>(null);

  const [clientesPage, setClientesPage] = useState(1);
  const [clientesPerPage] = useState(10);
  const [clientesSearch, setClientesSearch] = useState("");

  const loadClientes = async () => {
    try {
      const res = await fetch("/api/clientes");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setClientes(data.data);
        }
      }
    } catch (error) {
      console.error("Error cargando clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuClienteId) {
        setOpenMenuClienteId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuClienteId]);

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
        loadClientes();
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
        loadClientes();
        setTimeout(() => setActionMessage(""), 3000);
      } else {
        setActionMessage(
          "❌ " + (data.error || data.message || "Error al actualizar cliente")
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
        loadClientes();
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

  const filteredClientes = clientes.filter((cliente) => {
    return (
      cliente.nombre.toLowerCase().includes(clientesSearch.toLowerCase()) ||
      (cliente.telefono?.includes(clientesSearch) ?? false)
    );
  });

  const totalClientesPages = Math.ceil(filteredClientes.length / clientesPerPage);
  const paginatedClientes = filteredClientes.slice(
    (clientesPage - 1) * clientesPerPage,
    clientesPage * clientesPerPage
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent dark:border-blue-400" />
          <p className="font-medium text-gray-700 dark:text-gray-300">
            Cargando clientes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestiona la base de contactos de tu salón"
        actions={
          <Button
            onClick={() => setCreatingCliente(true)}
            disabled={saving}
            icon={<PlusIcon />}
          >
            Nuevo Cliente
          </Button>
        }
      />

      {actionMessage && (
        <div className="mb-6 animate-fadeInUp rounded-xl border-l-4 border-blue-500 bg-blue-50 p-4 shadow-lg dark:border-blue-400 dark:bg-blue-900/30">
          <p className="text-center text-sm font-semibold text-blue-900 dark:text-white">
            {actionMessage}
          </p>
        </div>
      )}

      <div className="dashboard-card overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="mb-6 space-y-3">
          <SearchInput
            placeholder="Buscar por nombre o teléfono..."
            value={clientesSearch}
            onChange={(e) => {
              setClientesSearch(e.target.value);
              setClientesPage(1);
            }}
            aria-label="Buscar clientes por nombre o teléfono"
          />

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
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        </div>

        <div className="-mx-6 overflow-x-auto px-6 sm:-mx-8 sm:px-8">
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-white/20">
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-blue-200 sm:text-sm">
                  Nombre
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-blue-200 sm:text-sm">
                  Teléfono
                </th>
                <th className="hidden px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-blue-200 sm:table-cell sm:text-sm">
                  Fecha Registro
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-blue-200 sm:text-sm">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedClientes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <svg
                        className="h-16 w-16 text-gray-300 dark:text-gray-600"
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
                      <p className="text-lg font-medium">No se encontraron clientes</p>
                      {clientesSearch && (
                        <p className="text-sm">Intenta ajustar la búsqueda</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedClientes.map((cliente, index) => (
                  <tr
                    key={cliente._id}
                    onClick={() => setEditingCliente(cliente)}
                    className={`cursor-pointer border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5 ${
                      index % 2 === 0
                        ? "bg-gray-50 dark:bg-white/5"
                        : "bg-white dark:bg-transparent"
                    }`}
                  >
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {cliente.nombre}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-blue-200">
                      {cliente.telefono}
                    </td>
                    <td className="hidden px-4 py-4 text-sm text-gray-600 dark:text-blue-200 sm:table-cell">
                      {cliente.fechaCreacion
                        ? new Date(cliente.fechaCreacion).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                      <div className="relative md:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuClienteId(
                              openMenuClienteId === cliente._id ? null : cliente._id!
                            );
                          }}
                          className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Menú de acciones"
                        >
                          <svg
                            className="h-5 w-5 text-gray-600 dark:text-gray-300"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>

                        {openMenuClienteId === cliente._id && (
                          <div
                            className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setEditingCliente(cliente);
                                setOpenMenuClienteId(null);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <EditIcon className="h-5 w-5" />
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setDeletingCliente(cliente);
                                setOpenMenuClienteId(null);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left font-medium text-red-700 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20"
                            >
                              <TrashIcon className="h-5 w-5" />
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="hidden flex-wrap gap-2 md:flex">
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
              )}
            </tbody>
          </table>
        </div>

        {totalClientesPages > 1 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Página {clientesPage} de {totalClientesPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setClientesPage(1)}
                disabled={clientesPage === 1}
                className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                aria-label="Primera página"
              >
                «
              </button>
              <button
                onClick={() => setClientesPage((prev) => Math.max(1, prev - 1))}
                disabled={clientesPage === 1}
                className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                aria-label="Página anterior"
              >
                ‹
              </button>
              <button
                onClick={() =>
                  setClientesPage((prev) => Math.min(totalClientesPages, prev + 1))
                }
                disabled={clientesPage === totalClientesPages}
                className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                aria-label="Página siguiente"
              >
                ›
              </button>
              <button
                onClick={() => setClientesPage(totalClientesPages)}
                disabled={clientesPage === totalClientesPages}
                className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                aria-label="Última página"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {creatingCliente && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setCreatingCliente(false)}
        >
          <div
            className="animate-slide-up max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl dark:bg-gray-800 sm:max-w-md sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
              <h3 className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
                <PlusIcon className="h-6 w-6" />
                Crear Nuevo Cliente
              </h3>
              <Button
                onClick={() => setCreatingCliente(false)}
                variant="ghost"
                size="sm"
                icon={<CloseIcon className="h-6 w-6" />}
                aria-label="Cerrar"
              />
            </div>

            <div className="px-4 py-6 sm:px-6">
              <form
                id="create-cliente-form"
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
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    className="w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-400"
                    required
                    minLength={2}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    placeholder="+53 12345678"
                    className="w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-400"
                    required
                  />
                </div>
              </form>
            </div>

            <div className="flex gap-3 bg-gray-50 px-4 py-4 dark:bg-gray-700/50 sm:px-6">
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
                form="create-cliente-form"
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

      {editingCliente && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setEditingCliente(null)}
        >
          <div
            className="animate-slide-up w-full rounded-t-2xl bg-white shadow-2xl dark:bg-gray-800 sm:max-w-md sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
              <h3 className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
                <EditIcon className="h-6 w-6" />
                Editar Cliente
              </h3>
              <Button
                onClick={() => setEditingCliente(null)}
                variant="ghost"
                size="sm"
                icon={<CloseIcon className="h-6 w-6" />}
                aria-label="Cerrar"
              />
            </div>

            <div className="px-4 py-6 sm:px-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateCliente(editingCliente);
                }}
                className="space-y-6"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                    className="w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
                    required
                    minLength={2}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                    className="w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
                    required
                  />
                </div>
              </form>
            </div>

            <div className="flex gap-3 bg-gray-50 px-4 py-4 dark:bg-gray-700/50 sm:px-6">
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

      {deletingCliente && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setDeletingCliente(null)}
        >
          <div
            className="animate-slide-up w-full rounded-t-2xl bg-white shadow-2xl dark:bg-gray-800 sm:max-w-md sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
              <h3 className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
                <ExclamationIcon className="h-6 w-6 text-yellow-500" />
                Confirmar Eliminación
              </h3>
              <Button
                onClick={() => setDeletingCliente(null)}
                variant="ghost"
                size="sm"
                icon={<CloseIcon className="h-6 w-6" />}
                aria-label="Cerrar"
              />
            </div>

            <div className="px-4 py-6 sm:px-6">
              <p className="text-gray-600 dark:text-gray-300">
                ¿Estás seguro de que deseas eliminar al cliente{" "}
                <strong className="text-gray-900 dark:text-white">
                  {deletingCliente.nombre}
                </strong>
                ? Esta acción no se puede deshacer. No se puede eliminar un
                cliente con reservas activas.
              </p>
            </div>

            <div className="flex gap-3 bg-gray-50 px-4 py-4 dark:bg-gray-700/50 sm:px-6">
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
    </div>
  );
}
