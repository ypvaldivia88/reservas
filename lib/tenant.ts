/**
 * @deprecated Usar resolvePublicTenant / resolveAdminTenant de tenant-context.service
 */
import { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Salon } from "@/lib/types";
import { resolvePublicTenant } from "@/lib/services/tenant-context.service";

export const DEFAULT_SALON_ID = "default";

export interface TenantContext {
  salonId: string;
  slug?: string;
}

/**
 * Filtro MongoDB compatible con datos legacy en producción.
 * Los documentos sin salonId se tratan como pertenecientes al salón "default".
 */
export function tenantQuery(salonId: string): Record<string, unknown> {
  if (salonId === DEFAULT_SALON_ID) {
    return {
      $or: [
        { salonId: DEFAULT_SALON_ID },
        { salonId: { $exists: false } },
        { salonId: null },
      ],
    };
  }
  return { salonId };
}

/** Combina un filtro con el alcance del tenant sin sobrescribir $or. */
export function withTenantScope(
  filter: Record<string, unknown>,
  salonId: string
): Record<string, unknown> {
  const tenant = tenantQuery(salonId);
  const hasFilterOr = Object.prototype.hasOwnProperty.call(filter, "$or");
  const hasTenantOr = Object.prototype.hasOwnProperty.call(tenant, "$or");

  if (!hasFilterOr && !hasTenantOr) {
    return { ...filter, ...tenant };
  }

  const and: Record<string, unknown>[] = [];
  const { $or: filterOr, ...filterRest } = filter;

  if (Object.keys(filterRest).length > 0) {
    and.push(filterRest);
  }
  if (hasFilterOr) {
    and.push({ $or: filterOr });
  }
  if (hasTenantOr) {
    and.push({ $or: tenant.$or });
  } else {
    and.push(tenant);
  }

  return { $and: and };
}

/** @deprecated Usar tenantQuery */
export function tenantFilter(salonId: string): Record<string, unknown> {
  return tenantQuery(salonId);
}

/** @deprecated Usar resolvePublicTenant o buildAdminContext */
export async function getTenantFromRequest(
  request: NextRequest
): Promise<TenantContext> {
  return resolvePublicTenant(request);
}

export async function getSalonBySlug(slug: string): Promise<Salon | null> {
  const client = await clientPromise;
  const db = client.db("nailsalon");
  return (await db
    .collection<Salon>("salons")
    .findOne({ slug, status: "active" })) as Salon | null;
}

export async function getSalonById(salonId: string): Promise<Salon | null> {
  const client = await clientPromise;
  const db = client.db("nailsalon");
  return (await db
    .collection<Salon>("salons")
    .findOne({ salonId })) as Salon | null;
}

export function getTenantContext(): TenantContext {
  return { salonId: DEFAULT_SALON_ID };
}
