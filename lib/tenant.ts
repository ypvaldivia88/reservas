import { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Salon } from "@/lib/types";
import { getSession } from "@/lib/session";

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

/** @deprecated Usar tenantQuery para compatibilidad con datos legacy */
export function tenantFilter(salonId: string): Record<string, unknown> {
  return tenantQuery(salonId);
}

/** Resuelve el tenant desde request: header, query, path slug o sesión. */
export async function getTenantFromRequest(
  request: NextRequest
): Promise<TenantContext> {
  const headerSalonId = request.headers.get("x-salon-id");
  if (headerSalonId) {
    return { salonId: headerSalonId };
  }

  const querySalonId = request.nextUrl.searchParams.get("salonId");
  if (querySalonId) {
    return { salonId: querySalonId };
  }

  const slug = request.nextUrl.searchParams.get("slug");
  if (slug) {
    const salon = await getSalonBySlug(slug);
    if (salon) {
      return { salonId: salon.salonId, slug: salon.slug };
    }
  }

  const session = await getSession(request);
  if (session?.salonId) {
    return { salonId: session.salonId };
  }

  return { salonId: DEFAULT_SALON_ID };
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

/** Contexto de tenant actual (compatibilidad). */
export function getTenantContext(): TenantContext {
  return { salonId: DEFAULT_SALON_ID };
}
