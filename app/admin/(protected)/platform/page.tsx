"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

interface PaymentItem {
  _id: string;
  salonNombre?: string;
  planNombre?: string;
  ciclo: string;
  montoFinal: number;
  descuentoPorcentaje: number;
  codigoReferencia: string;
  status: string;
  fechaCreacion: string;
}

export default function PlatformPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/platform/payments?status=pending");
      const data = await res.json();
      if (data.success) {
        setPayments(data.data);
        setError("");
      } else {
        setError(data.error || "Sin acceso");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleAction = async (paymentId: string, action: "approve" | "reject") => {
    const res = await fetch("/api/platform/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, action }),
    });
    const data = await res.json();
    if (data.success) loadPayments();
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error}</p>
        <p className="text-sm text-gray-400 mt-2">
          Esta sección es solo para administradores de la plataforma.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pagos pendientes
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Verifica y aprueba pagos de suscripción recibidos por WhatsApp
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : payments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500">No hay pagos pendientes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <div
              key={p._id}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {p.salonNombre ?? "Salón"} — {p.planNombre ?? "Plan"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {p.ciclo === "yearly" ? "Anual" : "Mensual"} · Código:{" "}
                    <span className="font-mono font-medium">
                      {p.codigoReferencia}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(p.fechaCreacion).toLocaleString("es")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-600">
                    ${p.montoFinal.toFixed(2)}
                  </p>
                  {p.descuentoPorcentaje > 0 && (
                    <p className="text-xs text-green-600">
                      {p.descuentoPorcentaje}% descuento
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAction(p._id, "approve")}
                >
                  Aprobar
                </Button>
                <Button
                  variant="outlined-secondary"
                  size="sm"
                  onClick={() => handleAction(p._id, "reject")}
                >
                  Rechazar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
