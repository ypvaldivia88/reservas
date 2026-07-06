"use client";

import { useEffect, useState } from "react";
import PlatformNav from "@/components/PlatformNav";
import { Button } from "@/components/ui/Button";
import { SaveIcon, CloseIcon } from "@/components/ui/Icons";
import { User } from "@/lib/types";

interface SalonOption {
  salonId: string;
  nombre: string;
}

export default function PlatformUsuariosPage() {
  const [tab, setTab] = useState<"admins" | "clientes">("admins");
  const [salons, setSalons] = useState<SalonOption[]>([]);
  const [salonFilter, setSalonFilter] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    username: "",
    telefono: "",
    newPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadUsers = async (type: "admins" | "clientes", salonId?: string) => {
    setLoading(true);
    const params = new URLSearchParams({ type });
    if (salonId) params.set("salonId", salonId);
    const res = await fetch(`/api/platform/users?${params}`);
    const data = await res.json();
    if (data.success) setUsers(data.data);
    setLoading(false);
  };

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
  }, []);

  useEffect(() => {
    loadUsers(tab, salonFilter || undefined);
  }, [tab, salonFilter]);

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      nombre: user.nombre,
      username: user.username || "",
      telefono: user.telefono || "",
      newPassword: "",
    });
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

  const salonName = (salonId?: string) =>
    salons.find((s) => s.salonId === salonId)?.nombre || salonId || "—";

  return (
    <>
      <PlatformNav />
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de usuarios
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Administra cuentas de salones y clientes de reservas
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTab("admins")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "admins"
                ? "bg-violet-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            Administradores de salón
          </button>
          <button
            onClick={() => setTab("clientes")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "clientes"
                ? "bg-violet-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            Clientes de reservas
          </button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Filtrar por salón:
          </label>
          <select
            value={salonFilter}
            onChange={(e) => setSalonFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="">Todos los salones</option>
            {salons.map((s) => (
              <option key={s.salonId} value={s.salonId}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  {tab === "admins" ? (
                    <th className="px-4 py-3 text-left">Usuario</th>
                  ) : (
                    <th className="px-4 py-3 text-left">Teléfono</th>
                  )}
                  <th className="px-4 py-3 text-left">Salón</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No hay registros
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-4 py-3 font-medium">{user.nombre}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {tab === "admins" ? user.username : user.telefono}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {salonName(user.salonId)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(user)}
                          className="text-violet-600 hover:underline text-sm font-medium"
                        >
                          Editar
                        </button>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Editar {tab === "admins" ? "administrador" : "cliente"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nombre: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                  required
                />
              </div>

              {tab === "admins" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Usuario
                    </label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, username: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nueva contraseña (opcional)
                    </label>
                    <input
                      type="password"
                      value={form.newPassword}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, newPassword: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                      minLength={8}
                      placeholder="Dejar vacío para no cambiar"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, telefono: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                    required
                  />
                </div>
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

              <div className="flex gap-3 justify-end pt-2">
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
    </>
  );
}
