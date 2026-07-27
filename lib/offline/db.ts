import Dexie, { type Table } from "dexie";
import { BusinessTemplate, Categoria, Reserva, Servicio } from "@/lib/types";

export interface CalendarCacheRecord {
  salonId: string;
  reservas: Reserva[];
  servicios: Servicio[];
  categorias: Categoria[];
  clientesCount: number;
  businessTemplate: BusinessTemplate | null;
  syncedAt: string;
}

export interface OutboxEntry {
  id?: number;
  salonId: string;
  method: "PATCH" | "DELETE";
  url: string;
  body?: string;
  createdAt: string;
}

class ReservasOfflineDb extends Dexie {
  calendarCache!: Table<CalendarCacheRecord, string>;
  outbox!: Table<OutboxEntry, number>;

  constructor() {
    super("reservas_offline");
    this.version(1).stores({
      calendarCache: "salonId",
      outbox: "++id, salonId, createdAt",
    });
  }
}

export const offlineDb =
  typeof window !== "undefined" ? new ReservasOfflineDb() : null;
