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

export function adminClientDayConflictMessage(
  existingHora?: string,
  existingNombre?: string
): string {
  const citaInfo =
    existingHora && existingNombre ?
      ` a las ${existingHora} (${existingNombre})`
    : existingHora ? ` a las ${existingHora}`
    : "";
  return `Este cliente ya tiene otra cita activa ese día${citaInfo}. No puedes asignarle un segundo turno. Si quieres intercambiar horarios entre dos clientes distintos, usa la opción "Intercambiar horario".`;
}

function isActiveReservationState(estado: Reserva["estado"]): boolean {
  return ACTIVE_RESERVATION_STATES.includes(
    estado as (typeof ACTIVE_RESERVATION_STATES)[number]
  );
}

export type SwapValidationResult =
  | { ok: true }
  | { ok: false; error: string };

/** Valida si dos reservas activas pueden intercambiar fecha/hora. */
export function validateSwapReservas(a: Reserva, b: Reserva): SwapValidationResult {
  if (a._id === b._id) {
    return { ok: false, error: "Selecciona dos reservas distintas." };
  }

  if (!isActiveReservationState(a.estado)) {
    return {
      ok: false,
      error: `La reserva de ${a.nombre} no está activa (estado: ${a.estado}).`,
    };
  }

  if (!isActiveReservationState(b.estado)) {
    return {
      ok: false,
      error: `La reserva de ${b.nombre} no está activa (estado: ${b.estado}).`,
    };
  }

  if (
    a.fechaCita === b.fechaCita &&
    a.horaCita === b.horaCita
  ) {
    return { ok: false, error: "Las dos reservas ya tienen el mismo horario." };
  }

  return { ok: true };
}

/** Busca conflicto de día al mover una reserva a otra fecha (excluye ambas del swap). */
export async function findClientDayConflictForSwap(
  db: Db,
  fechaCita: string,
  options: {
    clienteId?: string;
    telefono?: string;
    excludeIds: string[];
    salonId?: string;
  }
): Promise<Reserva | null> {
  const { clienteId, telefono, excludeIds, salonId } = options;
  const clientMatch = buildClientMatchFilter({ clienteId, telefono });

  if (Object.keys(clientMatch).length === 0) return null;

  const excludeObjectIds = excludeIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const baseFilter: Record<string, unknown> = {
    fechaCita,
    estado: { $in: ACTIVE_RESERVATION_STATES },
    ...clientMatch,
    ...(excludeObjectIds.length > 0 ?
      { _id: { $nin: excludeObjectIds } }
    : {}),
  };

  const filter =
    salonId ?
      withTenantScope(baseFilter, salonId)
    : baseFilter;

  return (await db.collection("reservas").findOne(filter)) as Reserva | null;
}
