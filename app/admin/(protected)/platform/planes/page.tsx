"use client";

import { useEffect, useState } from "react";
import PlatformNav from "@/components/PlatformNav";
import SurfaceCard from "@/components/design/SurfaceCard";
import { Button } from "@/components/ui/Button";
import { formatSubscriptionAmount } from "@/lib/subscription";
import type { SubscriptionPlan } from "@/lib/types";

export default function PlatformPlanesPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    fetch("/api/platform/subscription-plans")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPlans(data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    const res = await fetch("/api/platform/subscription-plans", {
      method: editing._id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const data = await res.json();
    setMessage(data.message ?? data.error);
    if (data.success) {
      setEditing(null);
      load();
    }
  };

  return (
    <>
      <PlatformNav />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Planes de suscripción</h2>
            <p className="text-sm text-muted-foreground">
              Gestiona precios y características
            </p>
          </div>
          <Button
            size="sm"
            onClick={() =>
              setEditing({
                nombre: "",
                descripcion: "",
                precioMensual: 10,
                descuentoSemestralPorcentaje: 10,
                descuentoAnualPorcentaje: 15,
                caracteristicas: [],
                activo: true,
              })
            }
          >
            Nuevo plan
          </Button>
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => (
              <SurfaceCard key={plan._id} padding="default">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-semibold">{plan.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatSubscriptionAmount(plan.precioMensual)}/mes ·{" "}
                      {plan.activo ? "Activo" : "Inactivo"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outlined-secondary"
                    onClick={() => setEditing(plan)}
                  >
                    Editar
                  </Button>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}

        {editing && (
          <SurfaceCard padding="default" className="max-w-lg space-y-3">
            <h3 className="font-semibold">
              {editing._id ? "Editar plan" : "Nuevo plan"}
            </h3>
            <input
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Nombre"
              value={editing.nombre}
              onChange={(e) =>
                setEditing({ ...editing, nombre: e.target.value })
              }
            />
            <textarea
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Descripción"
              value={editing.descripcion}
              onChange={(e) =>
                setEditing({ ...editing, descripcion: e.target.value })
              }
            />
            <input
              type="number"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Precio mensual USD"
              value={editing.precioMensual}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  precioMensual: Number(e.target.value),
                })
              }
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.activo}
                onChange={(e) =>
                  setEditing({ ...editing, activo: e.target.checked })
                }
              />
              Plan activo
            </label>
            <div className="flex gap-2">
              <Button size="sm" onClick={save}>
                Guardar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </Button>
            </div>
          </SurfaceCard>
        )}
      </div>
    </>
  );
}
