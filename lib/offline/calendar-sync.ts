import { BusinessTemplate, Categoria, Reserva, Servicio } from "@/lib/types";
import { CalendarCacheRecord, offlineDb, OutboxEntry } from "@/lib/offline/db";

const LAST_SALON_KEY = "reservas:offline:last-salon-id";

export interface CalendarBundle {
  reservas: Reserva[];
  servicios: Servicio[];
  categorias: Categoria[];
  clientesCount: number;
  businessTemplate: BusinessTemplate | null;
  fromCache: boolean;
  syncedAt: string | null;
}

export function isBrowserOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.success ? (data.data as T) : null;
}

async function readCache(salonId: string): Promise<CalendarCacheRecord | null> {
  if (!offlineDb) return null;
  return (await offlineDb.calendarCache.get(salonId)) ?? null;
}

async function writeCache(
  salonId: string,
  bundle: Omit<CalendarCacheRecord, "salonId" | "syncedAt">
): Promise<string> {
  const syncedAt = new Date().toISOString();
  if (!offlineDb) return syncedAt;

  await offlineDb.calendarCache.put({
    salonId,
    ...bundle,
    syncedAt,
  });
  return syncedAt;
}

export async function loadCalendarBundle(): Promise<CalendarBundle> {
  const empty: CalendarBundle = {
    reservas: [],
    servicios: [],
    categorias: [],
    clientesCount: 0,
    businessTemplate: null,
    fromCache: false,
    syncedAt: null,
  };

  if (!isBrowserOnline()) {
    const salonId =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(LAST_SALON_KEY)
        : null;
    const cached = salonId ? await readCache(salonId) : null;
    if (!cached) return { ...empty, fromCache: true };

    return {
      reservas: cached.reservas,
      servicios: cached.servicios,
      categorias: cached.categorias,
      clientesCount: cached.clientesCount,
      businessTemplate: cached.businessTemplate,
      fromCache: true,
      syncedAt: cached.syncedAt,
    };
  }

  try {
    const salon = await fetchJson<{
      salonId: string;
      cms?: { businessTemplate?: BusinessTemplate };
      businessTemplate?: BusinessTemplate;
    }>("/api/salons/current");

    if (!salon?.salonId) {
      throw new Error("No salon context");
    }

    const [reservas, servicios, categorias, clientes, salonId] =
      await Promise.all([
        fetchJson<Reserva[]>("/api/reservas"),
        fetchJson<Servicio[]>("/api/servicios"),
        fetchJson<Categoria[]>("/api/categorias"),
        fetchJson<unknown[]>("/api/clientes"),
        Promise.resolve(salon.salonId),
      ]);

    const businessTemplate =
      salon.cms?.businessTemplate ?? salon.businessTemplate ?? null;

    const bundle = {
      reservas: reservas ?? [],
      servicios: servicios ?? [],
      categorias: categorias ?? [],
      clientesCount: Array.isArray(clientes) ? clientes.length : 0,
      businessTemplate,
    };

    const syncedAt = await writeCache(salonId, bundle);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LAST_SALON_KEY, salonId);
    }

    return {
      ...bundle,
      fromCache: false,
      syncedAt,
    };
  } catch {
    const salonId =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(LAST_SALON_KEY)
        : null;
    const cached = salonId ? await readCache(salonId) : null;
    if (!cached) return empty;

    return {
      reservas: cached.reservas,
      servicios: cached.servicios,
      categorias: cached.categorias,
      clientesCount: cached.clientesCount,
      businessTemplate: cached.businessTemplate,
      fromCache: true,
      syncedAt: cached.syncedAt,
    };
  }
}

export async function queueOutboxEntry(
  entry: Omit<OutboxEntry, "id" | "createdAt">
): Promise<void> {
  if (!offlineDb) return;
  await offlineDb.outbox.add({
    ...entry,
    createdAt: new Date().toISOString(),
  });
}

export async function flushOutbox(salonId: string): Promise<number> {
  if (!offlineDb || !isBrowserOnline()) return 0;

  const pending = await offlineDb.outbox
    .where("salonId")
    .equals(salonId)
    .sortBy("createdAt");

  let synced = 0;
  for (const item of pending) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers:
          item.method === "PATCH"
            ? { "Content-Type": "application/json" }
            : undefined,
        body: item.body,
      });
      if (res.ok) {
        if (item.id != null) await offlineDb.outbox.delete(item.id);
        synced++;
      }
    } catch {
      break;
    }
  }
  return synced;
}
