import { Db, ObjectId } from "mongodb";
import { Reserva } from "@/lib/types";
import { withTenantScope } from "@/lib/tenant";

export {
  RESERVA_NEUTRAL_FORMA,
  RESERVA_NEUTRAL_LARGO,
  normalizeReservaInput,
  validateReservaInput,
} from "@/lib/reserva-constants";
export type { ReservaInput, ValidateReservaOptions } from "@/lib/reserva-constants";

export const ACTIVE_RESERVATION_STATES = ["pendiente", "confirmada"] as const;

export function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: number }).code === 11000
  );
}

function buildExcludeIdFilter(excludeId?: string): Record<string, unknown> {
  if (!excludeId || !ObjectId.isValid(excludeId)) return {};
  return { _id: { $ne: new ObjectId(excludeId) } };
}

function buildClientMatchFilter(options: {
  clienteId?: string;
  telefono?: string;
}): Record<string, unknown> {
  const { clienteId, telefono } = options;

  if (clienteId) {
    return { clienteId };
  }

  if (telefono) {
    return { telefono };
  }

  return {};
}

/** Evita dos reservas activas en el mismo horario. */
export async function findActiveSlotConflict(
  db: Db,
  fechaCita: string,
  horaCita: string,
  excludeId?: string,
  salonId?: string
): Promise<Reserva | null> {
  const baseFilter: Record<string, unknown> = {
    fechaCita,
    horaCita,
    estado: { $in: ACTIVE_RESERVATION_STATES },
    ...buildExcludeIdFilter(excludeId),
  };

  const filter =
    salonId ?
      withTenantScope(baseFilter, salonId)
    : baseFilter;

  return (await db.collection("reservas").findOne(filter)) as Reserva | null;
}

/** Evita más de una reserva activa por cliente en el mismo día. */
export async function findClientDayConflict(
  db: Db,
  fechaCita: string,
  options: {
    clienteId?: string;
    telefono?: string;
    excludeId?: string;
    salonId?: string;
  }
): Promise<Reserva | null> {
  const { clienteId, telefono, excludeId, salonId } = options;
  const clientMatch = buildClientMatchFilter({ clienteId, telefono });

  if (Object.keys(clientMatch).length === 0) return null;

  const baseFilter: Record<string, unknown> = {
    fechaCita,
    estado: { $in: ACTIVE_RESERVATION_STATES },
    ...clientMatch,
    ...buildExcludeIdFilter(excludeId),
  };

  const filter =
    salonId ?
      withTenantScope(baseFilter, salonId)
    : baseFilter;

  return (await db.collection("reservas").findOne(filter)) as Reserva | null;
}

export function clientDayConflictMessage(existingHora?: string): string {
  if (existingHora) {
    return `Ya tienes una cita activa ese día a las ${existingHora}. Solo puedes tener una cita por día. Cancela la existente o elige otro día.`;
  }
  return "Ya tienes una cita activa ese día. Solo puedes tener una cita por día. Cancela la existente o elige otro día.";
}
