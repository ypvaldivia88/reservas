"use client";

import { useState } from "react";
import SurfaceCard from "@/components/design/SurfaceCard";
import { Button } from "@/components/ui/Button";
import { SaveIcon, CloseIcon, TrashIcon, EditIcon } from "@/components/ui/Icons";

export interface SalonAdminRecord {
  _id: string;
  nombre: string;
  username?: string;
  fechaCreacion?: string | Date;
}

interface SalonAdminsManagerProps {
  salonId: string;
  admins: SalonAdminRecord[];
  onChanged: () => void;
  onMessage?: (message: string) => void;
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

export default function SalonAdminsManager({
  salonId,
  admins,
  onChanged,
  onMessage,
}: SalonAdminsManagerProps) {
  const [newAdmin, setNewAdmin] = useState({
    nombre: "",
    username: "",
    password: "",
  });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SalonAdminRecord | null>(null);
  const [deleting, setDeleting] = useState<SalonAdminRecord | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    username: "",
    newPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [localMessage, setLocalMessage] = useState("");

  const notify = (message: string) => {
    setLocalMessage(message);
    onMessage?.(message);
  };

  const createAdmin = async () => {
    setCreating(true);
    setLocalMessage("");
    try {
      const res = await fetch(`/api/platform/salons/${salonId}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin),
      });
      const data = await res.json();
      if (data.success) {
        setNewAdmin({ nombre: "", username: "", password: "" });
        notify(data.message ?? "Administrador creado");
        onChanged();
      } else {
        notify(data.error ?? "Error al crear administrador");
      }
    } catch {
      notify("Error de conexión");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (admin: SalonAdminRecord) => {
    setEditing(admin);
    setEditForm({
      nombre: admin.nombre,
      username: admin.username ?? "",
      newPassword: "",
    });
    setLocalMessage("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?._id) return;
    setSaving(true);
    setLocalMessage("");
    try {
      const res = await fetch(`/api/platform/users/${editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editForm.nombre,
          username: editForm.username,
          ...(editForm.newPassword ? { newPassword: editForm.newPassword } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditing(null);
        notify(data.message ?? "Administrador actualizado");
        onChanged();
      } else {
        notify(data.error ?? "Error al actualizar");
      }
    } catch {
      notify("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting?._id) return;
    setDeletingBusy(true);
    setLocalMessage("");
    try {
      const res = await fetch(`/api/platform/users/${deleting._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDeleting(null);
        notify(data.message ?? "Administrador eliminado");
        onChanged();
      } else {
        notify(data.error ?? "Error al eliminar");
      }
    } catch {
      notify("Error de conexión");
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {localMessage && !editing && !deleting && (
        <p className="text-sm text-muted-foreground" role="status">
          {localMessage}
        </p>
      )}

      {admins.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este salón aún no tiene administradores.
        </p>
      ) : (
        <ul className="space-y-2">
          {admins.map((admin) => (
            <li
              key={admin._id}
              className="flex flex-col gap-2 rounded-lg border border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{admin.nombre}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  @{admin.username ?? "—"} · Alta {formatDate(admin.fechaCreacion)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<EditIcon className="size-4" />}
                  onClick={() => openEdit(admin)}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  icon={<TrashIcon className="size-4" />}
                  onClick={() => {
                    setDeleting(admin);
                    setLocalMessage("");
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <SurfaceCard padding="default" className="space-y-3">
        <h4 className="text-sm font-semibold">Agregar administrador</h4>
        <input
          placeholder="Nombre"
          value={newAdmin.nombre}
          onChange={(e) =>
            setNewAdmin({ ...newAdmin, nombre: e.target.value })
          }
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          placeholder="Usuario"
          value={newAdmin.username}
          onChange={(e) =>
            setNewAdmin({ ...newAdmin, username: e.target.value })
          }
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Contraseña (mín. 8 caracteres)"
          value={newAdmin.password}
          onChange={(e) =>
            setNewAdmin({ ...newAdmin, password: e.target.value })
          }
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <Button size="sm" loading={creating} onClick={createAdmin}>
          Crear administrador
        </Button>
      </SurfaceCard>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-bold">Editar administrador</h3>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, nombre: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Usuario</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, username: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Nueva contraseña (opcional)
                </label>
                <input
                  type="password"
                  value={editForm.newPassword}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, newPassword: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  minLength={8}
                  placeholder="Dejar vacío para no cambiar"
                />
              </div>
              {localMessage && (
                <p
                  className={`text-sm ${
                    localMessage.includes("exitosamente") ||
                    localMessage.includes("actualizado")
                      ? "text-primary"
                      : "text-destructive"
                  }`}
                >
                  {localMessage}
                </p>
              )}
              <div className="flex justify-end gap-3">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-bold">Eliminar administrador</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              ¿Eliminar a <strong>{deleting.nombre}</strong>
              {deleting.username ? ` (@${deleting.username})` : ""}?
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Cierra todas sus sesiones activas.</li>
              <li>No se puede eliminar el único admin de un salón.</li>
            </ul>
            {localMessage && !localMessage.includes("eliminado") && (
              <p className="mt-3 text-sm text-destructive">{localMessage}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outlined-secondary"
                icon={<CloseIcon />}
                onClick={() => setDeleting(null)}
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
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
