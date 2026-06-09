import { Db, ObjectId } from "mongodb";
import { Reserva, FORMAS_UNAS } from "@/lib/types";
import { dateUtils, phoneUtils } from "@/lib/utils";

export const ACTIVE_RESERVATION_STATES = ["pendiente", "confirmada"] as const;

export interface ReservaInput {
  nombre?: string;
  telefono?: string;
  forma?: string;
  largo?: number | string;
  fechaCita?: string;
  horaCita?: string;
  decoracion?: string;
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
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (
    !data.nombre ||
    typeof data.nombre !== "string" ||
    data.nombre.trim().length < 2
  ) {
    errors.push("El nombre es requerido y debe tener al menos 2 caracteres");
  }

  if (
    !data.telefono ||
    typeof data.telefono !== "string" ||
    !phoneUtils.isValid(data.telefono)
  ) {
    errors.push("El teléfono debe ser un número cubano válido de 8 dígitos");
  }

  if (!data.forma || !FORMAS_UNAS.includes(data.forma as (typeof FORMAS_UNAS)[number])) {
    errors.push("La forma debe ser una opción válida");
  }

  const largo = Number(data.largo);
  if (!largo || largo < 1 || largo > 8) {
    errors.push("El largo debe ser un número entre 1 y 8");
  }

  if (!data.fechaCita || typeof data.fechaCita !== "string") {
    errors.push("La fecha de cita es requerida");
  } else if (!dateUtils.isFutureDate(data.fechaCita)) {
    errors.push("La fecha de cita no puede ser en el pasado");
  }

  if (
    !data.horaCita ||
    typeof data.horaCita !== "string" ||
    !dateUtils.isValidTimeFormat(data.horaCita)
  ) {
    errors.push("La hora de cita es requerida y debe tener formato HH:mm");
  }

  return { isValid: errors.length === 0, errors };
}

function buildExcludeIdFilter(excludeId?: string): Record<string, unknown> {
  if (!excludeId || !ObjectId.isValid(excludeId)) return {};
  return { _id: { $ne: new ObjectId(excludeId) } };
}

/** Evita dos reservas activas en el mismo horario. */
export async function findActiveSlotConflict(
  db: Db,
  fechaCita: string,
  horaCita: string,
  excludeId?: string
): Promise<Reserva | null> {
  return (await db.collection("reservas").findOne({
    fechaCita,
    horaCita,
    estado: { $in: ACTIVE_RESERVATION_STATES },
    ...buildExcludeIdFilter(excludeId),
  })) as Reserva | null;
}

/** Evita más de una reserva activa por cliente en el mismo día. */
export async function findClientDayConflict(
  db: Db,
  fechaCita: string,
  options: { clienteId?: string; telefono?: string; excludeId?: string }
): Promise<Reserva | null> {
  const { clienteId, telefono, excludeId } = options;

  const clientFilters: Record<string, unknown>[] = [];
  if (clienteId) clientFilters.push({ clienteId });
  if (telefono) clientFilters.push({ telefono });

  if (clientFilters.length === 0) return null;

  return (await db.collection("reservas").findOne({
    fechaCita,
    estado: { $in: ACTIVE_RESERVATION_STATES },
    $or: clientFilters,
    ...buildExcludeIdFilter(excludeId),
  })) as Reserva | null;
}

export function clientDayConflictMessage(existingHora?: string): string {
  if (existingHora) {
    return `Ya tienes una cita activa ese día a las ${existingHora}. Solo puedes tener una cita por día. Cancela la existente o elige otro día.`;
  }
  return "Ya tienes una cita activa ese día. Solo puedes tener una cita por día. Cancela la existente o elige otro día.";
}
