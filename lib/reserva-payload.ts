import { BusinessTemplate, FormaUna, FORMAS_UNAS, ReservaFormData } from "@/lib/types";
import {
  getReservaTemplateConfig,
  isManicureReservation,
  usesServicePicker,
} from "@/lib/reserva-template-config";
import {
  RESERVA_NEUTRAL_FORMA,
  RESERVA_NEUTRAL_LARGO,
  ReservaInput,
} from "@/lib/reserva-constants";

/**
 * Field ownership per template (stored in `reservas` collection):
 *
 * | Field        | manicure | peluquería | barbería / tatuajes / generic |
 * |--------------|----------|------------|-------------------------------|
 * | nombre       | ✓        | ✓          | ✓                             |
 * | telefono     | ✓        | ✓          | ✓                             |
 * | fechaCita    | ✓        | ✓          | ✓                             |
 * | horaCita     | ✓        | ✓          | ✓                             |
 * | forma        | nail shape | neutral  | neutral (ignored on input)    |
 * | largo        | 1–8      | neutral    | neutral (ignored on input)    |
 * | decoracion   | notes + decorations + colors | service notes + optional colors | service notes only |
 * | colores*     | merged into decoracion | merged if color picker | ignored |
 *
 * *`colores` is form-only; never persisted as its own column.
 *
 * Always use `buildReservaCreatePayload` before save or API validation so
 * template-specific fields never leak across business types.
 */

export interface ReservaRawInput {
  nombre?: string;
  telefono?: string;
  fechaCita?: string;
  horaCita?: string;
  forma?: string;
  largo?: string | number;
  colores?: string;
  decoracion?: string;
  servicioIds?: string[];
  serviceLabels?: string[];
}

export interface ReservaCreatePayload {
  nombre: string;
  telefono: string;
  fechaCita: string;
  horaCita: string;
  forma: FormaUna;
  largo: number;
  decoracion: string;
  servicioIds?: string[];
}

function resolveManicureForma(forma?: string): FormaUna {
  if (forma && FORMAS_UNAS.includes(forma as FormaUna)) {
    return forma as FormaUna;
  }
  return RESERVA_NEUTRAL_FORMA;
}

function resolveManicureLargo(largo?: string | number): number {
  const n = Number(largo);
  return n >= 1 && n <= 8 ? n : RESERVA_NEUTRAL_LARGO;
}

function appendColores(
  parts: string[],
  colores: string | undefined,
  enabled: boolean
): void {
  const trimmed = colores?.trim();
  if (enabled && trimmed) {
    parts.push(`Colores: ${trimmed}`);
  }
}

/**
 * Builds the API/DB payload for a new reservation, scoped to the salon template.
 * Strips or neutralizes fields that do not belong to the active template.
 */
export function buildReservaCreatePayload(
  raw: ReservaRawInput,
  businessTemplate?: BusinessTemplate | null
): ReservaCreatePayload {
  const isManicure = isManicureReservation(businessTemplate);
  const usesServices = usesServicePicker(businessTemplate);
  const config = getReservaTemplateConfig(businessTemplate);
  const decoracionParts: string[] = [];

  const serviceLabels = (raw.serviceLabels ?? []).filter(Boolean);
  if (usesServices && serviceLabels.length > 0) {
    decoracionParts.push(serviceLabels.join(", "));
  }

  const notes = raw.decoracion?.trim();
  if (notes) {
    decoracionParts.push(notes);
  }

  if (isManicure) {
    appendColores(decoracionParts, raw.colores, true);
    return {
      nombre: raw.nombre?.trim() ?? "",
      telefono: raw.telefono?.trim() ?? "",
      fechaCita: raw.fechaCita ?? "",
      horaCita: raw.horaCita ?? "",
      forma: resolveManicureForma(raw.forma),
      largo: resolveManicureLargo(raw.largo),
      decoracion: decoracionParts.join("; "),
    };
  }

  appendColores(
    decoracionParts,
    raw.colores,
    config.reservation.optionalPreferences.showColorPicker
  );

  const servicioIds = Array.isArray(raw.servicioIds)
    ? raw.servicioIds.filter((id) => typeof id === "string" && id)
    : undefined;

  return {
    nombre: raw.nombre?.trim() ?? "",
    telefono: raw.telefono?.trim() ?? "",
    fechaCita: raw.fechaCita ?? "",
    horaCita: raw.horaCita ?? "",
    forma: RESERVA_NEUTRAL_FORMA,
    largo: RESERVA_NEUTRAL_LARGO,
    decoracion: decoracionParts.join("; "),
    ...(usesServices && servicioIds && servicioIds.length > 0
      ? { servicioIds }
      : {}),
  };
}

export function buildReservaCreatePayloadFromForm(
  form: ReservaFormData,
  businessTemplate?: BusinessTemplate | null,
  serviceLabels?: string[]
): ReservaCreatePayload {
  return buildReservaCreatePayload(
    { ...form, serviceLabels },
    businessTemplate
  );
}

/** Sync form nail fields with template-safe defaults (step 3 → 4). */
export function applyTemplateFormDefaults(
  form: ReservaFormData,
  businessTemplate?: BusinessTemplate | null
): ReservaFormData {
  const payload = buildReservaCreatePayload(form, businessTemplate);
  return {
    ...form,
    forma: payload.forma,
    largo: String(payload.largo),
  };
}

/** @deprecated Use applyTemplateFormDefaults */
export function applyGenericDefaults(form: ReservaFormData): ReservaFormData {
  return applyTemplateFormDefaults(form, "tatuajes");
}

/** @deprecated Use applyTemplateFormDefaults */
export function applyManicureDefaults(form: ReservaFormData): ReservaFormData {
  return applyTemplateFormDefaults(form, "manicure");
}

export function toReservaInput(payload: ReservaCreatePayload): ReservaInput {
  return {
    nombre: payload.nombre,
    telefono: payload.telefono,
    fechaCita: payload.fechaCita,
    horaCita: payload.horaCita,
    forma: payload.forma,
    largo: payload.largo,
    decoracion: payload.decoracion,
  };
}

export interface ReservaPatchInput {
  forma?: string;
  largo?: number | string;
  decoracion?: string;
  colores?: string;
}

/**
 * Applies template rules to admin PATCH fields so non-manicure salons
 * never persist nail-specific updates. Only fields present in `raw` are returned.
 */
export function applyReservaPatchFields(
  raw: ReservaPatchInput,
  businessTemplate?: BusinessTemplate | null
): Partial<Pick<ReservaCreatePayload, "forma" | "largo" | "decoracion">> {
  const isManicure = isManicureReservation(businessTemplate);
  const out: Partial<Pick<ReservaCreatePayload, "forma" | "largo" | "decoracion">> =
    {};

  if (isManicure) {
    if (raw.forma !== undefined) {
      out.forma = resolveManicureForma(raw.forma);
    }
    if (raw.largo !== undefined) {
      out.largo = resolveManicureLargo(raw.largo);
    }
  }

  if (raw.decoracion !== undefined || raw.colores !== undefined) {
    const prepared = buildReservaCreatePayload(
      {
        decoracion: raw.decoracion,
        colores: raw.colores,
      },
      businessTemplate
    );
    out.decoracion = prepared.decoracion;
  }

  return out;
}
