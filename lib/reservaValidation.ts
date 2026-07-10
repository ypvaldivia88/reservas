import { Db, ObjectId } from "mongodb";
import { Reserva, FORMAS_UNAS, FormaUna } from "@/lib/types";
import { dateUtils, phoneUtils } from "@/lib/utils";
import { withTenantScope } from "@/lib/tenant";

export const ACTIVE_RESERVATION_STATES = ["pendiente", "confirmada"] as const;

/** Neutral DB values for non-manicure templates (details live in decoracion). */
export const RESERVA_NEUTRAL_FORMA: FormaUna = "square";
export const RESERVA_NEUTRAL_LARGO = 3;

export interface ReservaInput {
  nombre?: string;
  telefono?: string;
  forma?: string;
  largo?: number | string;
  fechaCita?: string;
  horaCita?: string;
  decoracion?: string;
}

export interface ValidateReservaOptions {
  /** When false, forma/largo are not manicure fields — stored as neutral defaults. */
  isManicure?: boolean;
}

export function normalizeReservaInput(
  data: ReservaInput,
  options?: ValidateReservaOptions
): ReservaInput {
  const isManicure = options?.isManicure ?? true;
  const normalized = { ...data };

  if (!isManicure) {
    normalized.forma = RESERVA_NEUTRAL_FORMA;
    normalized.largo = RESERVA_NEUTRAL_LARGO;
    return normalized;
  }

  if (
    !normalized.forma ||
    !FORMAS_UNAS.includes(normalized.forma as FormaUna)
  ) {
    normalized.forma = RESERVA_NEUTRAL_FORMA;
  }

  const largo = Number(normalized.largo);
  normalized.largo =
    largo >= 1 && largo <= 8 ? largo : RESERVA_NEUTRAL_LARGO;

  return normalized;
}

export function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: number }).code === 11000
  );
}

export function validateReservaInput(
  data: ReservaInput
): { isValid: boolean; errors: string[]; data: ReservaInput } {
  const normalized = normalizeReservaInput(data, { isManicure: true });
  const errors: string[] = [];

  if (
    !normalized.nombre ||
    typeof normalized.nombre !== "string" ||
    normalized.nombre.trim().length < 2
  ) {
    errors.push("El nombre es requerido y debe tener al menos 2 caracteres");
  }

  if (
    !normalized.telefono ||
    typeof normalized.telefono !== "string" ||
    !phoneUtils.isValid(normalized.telefono)
  ) {
    errors.push("El teléfono debe ser un número cubano válido de 8 dígitos");
  }

  if (!normalized.fechaCita || typeof normalized.fechaCita !== "string") {
    errors.push("La fecha de cita es requerida");
  } else if (!dateUtils.isFutureDate(normalized.fechaCita)) {
    errors.push("La fecha de cita no puede ser en el pasado");
  }

  if (
    !normalized.horaCita ||
    typeof normalized.horaCita !== "string" ||
    !dateUtils.isValidTimeFormat(normalized.horaCita)
  ) {
    errors.push("La hora de cita es requerida y debe tener formato HH:mm");
  }

  return { isValid: errors.length === 0, errors, data: normalized };
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
