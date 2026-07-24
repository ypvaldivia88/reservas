"use client";

import { useEffect, useState } from "react";
import PlatformNav from "@/components/PlatformNav";

interface SalonItem {
  _id?: string;
  salonId: string;
  slug: string;
  nombre: string;
  status: string;
  whatsappNumber?: string;
  fechaCreacion?: string;
  planNombre?: string;
  subscription?: {
    status: string;
    periodoFin?: string;
  };
  pendingPayments: number;
}

export default function PlatformSalonesPage() {
  const [salons, setSalons] = useState<SalonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/salons", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSalons(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PlatformNav />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Salones registrados
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {salons.length} salón(es) en la plataforma
            </p>
          </div>
          <a
            href="/registro"
            className="text-sm text-violet-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            + Ver página de registro
          </a>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left">Salón</th>
                  <th className="px-4 py-3 text-left">Slug</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Vence</th>
                  <th className="px-4 py-3 text-right">Pagos pend.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {salons.map((s) => (
                  <tr key={s.salonId}>
                    <td className="px-4 py-3 font-medium">{s.nombre}</td>
                    <td className="px-4 py-3 font-mono text-gray-500">{s.slug}</td>
                    <td className="px-4 py-3">{s.planNombre ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.subscription?.status === "active"
                            ? "bg-green-100 text-green-800"
                            : s.subscription?.status === "trial"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {s.subscription?.status ?? s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {s.subscription?.periodoFin
                        ? new Date(s.subscription.periodoFin).toLocaleDateString("es")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.pendingPayments > 0 ? (
                        <span className="text-yellow-600 font-medium">
                          {s.pendingPayments}
                        </span>
                      ) : (
                        "0"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
