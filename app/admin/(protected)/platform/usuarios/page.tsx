"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PlatformNav from "@/components/PlatformNav";
import { Button } from "@/components/ui/Button";
import { SaveIcon, CloseIcon, TrashIcon, EditIcon } from "@/components/ui/Icons";
import { PlatformUserListItem, UserRole } from "@/lib/types";

interface SalonOption {
  salonId: string;
  nombre: string;
}

function formatDate(value?: Date | string) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function roleLabel(role?: UserRole) {
  if (role === "salon_admin") return "Admin salón";
  if (role === "admin") return "Admin legacy";
  return role || "—";
}

export default function PlatformUsuariosPage() {
  const [tab, setTab] = useState<"admins" | "clientes">("admins");
  const [salons, setSalons] = useState<SalonOption[]>([]);
  const [salonFilter, setSalonFilter] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<PlatformUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PlatformUserListItem | null>(null);
  const [deleting, setDeleting] = useState<PlatformUserListItem | null>(null);
  const [forceDelete, setForceDelete] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    username: "",
    telefono: "",
    salonId: "",
    newPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async (type: "admins" | "clientes", salonId?: string) => {
    setLoading(true);
    const params = new URLSearchParams({ type });
    if (salonId) params.set("salonId", salonId);
    const res = await fetch(`/api/platform/users?${params}`);
    const data = await res.json();
    if (data.success) setUsers(data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/salons")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSalons(
            data.data.map((s: SalonOption) => ({
              salonId: s.salonId,
              nombre: s.nombre,
            }))
          );
        }
      });
    loadUsers("admins");
  }, [loadUsers]);

  useEffect(() => {
    loadUsers(tab, salonFilter || undefined);
  }, [tab, salonFilter, loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const haystack = [
        user.nombre,
        user.username,
        user.telefono,
        user.salonId,
        user.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search]);

  const salonName = (salonId?: string) =>
    salons.find((s) => s.salonId === salonId)?.nombre || salonId || "—";

  const openEdit = (user: PlatformUserListItem) => {
    setEditing(user);
    setForm({
      nombre: user.nombre,
      username: user.username || "",
      telefono: user.telefono || "",
      salonId: user.salonId || "",
      newPassword: "",
    });
    setMessage("");
  };

  const openDelete = (user: PlatformUserListItem) => {
    setDeleting(user);
    setForceDelete(false);
    setMessage("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?._id) return;
    setSaving(true);
    setMessage("");

    try {
      const url =
        tab === "admins"
          ? `/api/platform/users/${editing._id}`
          : `/api/platform/clientes/${editing._id}`;

      const body =
        tab === "admins"
          ? {
              nombre: form.nombre,
              username: form.username,
              salonId: form.salonId || undefined,
              ...(form.newPassword ? { newPassword: form.newPassword } : {}),
            }
          : { nombre: form.nombre, telefono: form.telefono };

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setMessage("Actualizado exitosamente");
        setEditing(null);
        loadUsers(tab, salonFilter || undefined);
      } else {
        setMessage(data.error || "Error al actualizar");
      }
    } catch {
      setMessage("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting?._id) return;
    setDeletingBusy(true);
    setMessage("");

    try {
      const url =
        tab === "admins"
          ? `/api/platform/users/${deleting._id}`
          : `/api/platform/clientes/${deleting._id}${forceDelete ? "?force=1" : ""}`;

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setDeleting(null);
        setForceDelete(false);
        loadUsers(tab, salonFilter || undefined);
      } else if (res.status === 409 && tab === "clientes") {
        setMessage(data.error || "El cliente tiene reservas activas");
        setForceDelete(true);
      } else {
        setMessage(data.error || "Error al eliminar");
      }
    } catch {
      setMessage("Error de conexión");
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <>
      <PlatformNav />
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de usuarios
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Edita, reasigna salones, restablece contraseñas o elimina cuentas
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTab("admins")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "admins"
                ? "bg-violet-600 text-white"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            Administradores de salón
          </button>
          <button
            onClick={() => setTab("clientes")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "clientes"
                ? "bg-violet-600 text-white"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            Clientes de reservas
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              tab === "admins"
                ? "Buscar por nombre o usuario..."
                : "Buscar por nombre o teléfono..."
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 sm:max-w-xs"
          />
          <select
            value={salonFilter}
            onChange={(e) => setSalonFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="">Todos los salones</option>
            {salons.map((s) => (
              <option key={s.salonId} value={s.salonId}>
                {s.nombre}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500">
            {filteredUsers.length} de {users.length} registros
          </p>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  {tab === "admins" ? (
                    <>
                      <th className="px-4 py-3 text-left">Usuario</th>
                      <th className="px-4 py-3 text-left">Rol</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left">Teléfono</th>
                      <th className="px-4 py-3 text-left">Reservas</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-left">Salón</th>
                  <th className="px-4 py-3 text-left">Alta</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No hay registros
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-900/30">
                      <td className="px-4 py-3 font-medium">{user.nombre}</td>
                      {tab === "admins" ? (
                        <>
                          <td className="px-4 py-3 font-mono text-gray-500">
                            {user.username}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
                              {roleLabel(user.role)}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-gray-500">{user.telefono}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {user.reservasTotal ?? 0}
                            {(user.reservasActivas ?? 0) > 0 && (
                              <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">
                                ({user.reservasActivas} activas)
                              </span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-gray-500">
                        {salonName(user.salonId)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(user.fechaCreacion)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(user)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                          >
                            <EditIcon className="size-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => openDelete(user)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <TrashIcon className="size-4" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
              Editar {tab === "admins" ? "administrador" : "cliente"}
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              ID: <span className="font-mono">{editing._id}</span>
            </p>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nombre: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  required
                />
              </div>

              {tab === "admins" ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Usuario</label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, username: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Salón</label>
                    <select
                      value={form.salonId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, salonId: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                      required
                    >
                      <option value="">Seleccionar salón</option>
                      {salons.map((s) => (
                        <option key={s.salonId} value={s.salonId}>
                          {s.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Nueva contraseña (opcional)
                    </label>
                    <input
                      type="password"
                      value={form.newPassword}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, newPassword: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                      minLength={8}
                      placeholder="Dejar vacío para no cambiar"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Rol actual: {roleLabel(editing.role)} · Alta:{" "}
                    {formatDate(editing.fechaCreacion)}
                  </p>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Teléfono</label>
                    <input
                      type="text"
                      value={form.telefono}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, telefono: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Reservas: {editing.reservasTotal ?? 0} total ·{" "}
                    {editing.reservasActivas ?? 0} activas · Alta:{" "}
                    {formatDate(editing.fechaCreacion)}
                  </p>
                </>
              )}

              {message && (
                <p
                  className={`text-sm ${
                    message.includes("exitosamente")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {message}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outlined-secondary"
                  icon={<CloseIcon />}
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<SaveIcon />}
                  loading={saving}
                >
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Eliminar {tab === "admins" ? "administrador" : "cliente"}
            </h3>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              ¿Eliminar a <strong>{deleting.nombre}</strong>
              {tab === "admins" ? ` (@${deleting.username})` : ` (${deleting.telefono})`}?
            </p>
            {tab === "admins" ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-500">
                <li>Cierra todas sus sesiones activas.</li>
                <li>No se puede eliminar el único admin de un salón.</li>
              </ul>
            ) : (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-500">
                <li>Las reservas históricas se conservan en el sistema.</li>
                {(deleting.reservasActivas ?? 0) > 0 && (
                  <li className="text-amber-600 dark:text-amber-400">
                    Tiene {deleting.reservasActivas} reserva(s) activa(s).
                  </li>
                )}
              </ul>
            )}
            {forceDelete && tab === "clientes" && (
              <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                Este cliente tiene reservas activas. Confirma de nuevo para eliminar
                la cuenta de todos modos.
              </p>
            )}
            {message && !message.includes("exitosamente") && (
              <p className="mt-3 text-sm text-red-600">{message}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outlined-secondary"
                icon={<CloseIcon />}
                onClick={() => {
                  setDeleting(null);
                  setForceDelete(false);
                  setMessage("");
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                icon={<TrashIcon />}
                loading={deletingBusy}
                onClick={handleDelete}
              >
                {forceDelete ? "Eliminar de todos modos" : "Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
