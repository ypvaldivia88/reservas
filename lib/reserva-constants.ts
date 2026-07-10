import { FORMAS_UNAS, FormaUna } from "@/lib/types";
import { dateUtils, phoneUtils } from "@/lib/utils";

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
