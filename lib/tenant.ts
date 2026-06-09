/**
 * Punto central para el futuro soporte multi-tenant.
 * Hoy la app opera como un solo salón; al migrar a MVP multi-tenant,
 * agregar salonId a los documentos y filtrar todas las consultas por este valor.
 */
export const DEFAULT_SALON_ID = "default";

export interface TenantContext {
  salonId: string;
}

/** Contexto de tenant actual (single-tenant por ahora). */
export function getTenantContext(): TenantContext {
  return { salonId: DEFAULT_SALON_ID };
}
