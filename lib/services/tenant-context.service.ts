import { NextRequest } from "next/server";
import { SessionData, UserRole } from "@/lib/types";
import { getSession, requireSalonAdmin, requirePlatformAdmin, requireAdmin } from "@/lib/session";
import {
  DEFAULT_SALON_ID,
  getSalonBySlug,
  TenantContext,
} from "@/lib/tenant";
import { AppError } from "@/lib/api/errors";

export interface RequestContext {
  request: NextRequest;
  params: Record<string, string>;
  session?: SessionData;
  tenant: TenantContext;
  salonId: string;
}

type AuthLevel = "public" | "admin" | "platform";

/**
 * Resuelve tenant para rutas públicas (reservas, disponibilidad).
 * Solo acepta slug o default — no headers spoofables.
 */
export async function resolvePublicTenant(
  request: NextRequest
): Promise<TenantContext> {
  const slug = request.nextUrl.searchParams.get("slug");
  if (slug) {
    const salon = await getSalonBySlug(slug);
    if (!salon) {
      throw AppError.notFound("Salón no encontrado");
    }
    return { salonId: salon.salonId, slug: salon.slug };
  }
  return { salonId: DEFAULT_SALON_ID };
}

/**
 * Resuelve tenant para rutas admin desde la sesión.
 */
export function resolveAdminTenant(session: SessionData): string {
  return session.salonId || DEFAULT_SALON_ID;
}

export async function buildPublicContext(
  request: NextRequest,
  params: Record<string, string> = {}
): Promise<RequestContext> {
  const tenant = await resolvePublicTenant(request);
  return { request, params, tenant, salonId: tenant.salonId };
}

export async function buildSalonAdminContext(
  request: NextRequest,
  params: Record<string, string> = {}
): Promise<RequestContext> {
  const auth = await requireSalonAdmin(request);
  if ("error" in auth) throw AppError.unauthorized(auth.error);

  const salonId = resolveAdminTenant(auth.session);
  return {
    request,
    params,
    session: auth.session,
    tenant: { salonId },
    salonId,
  };
}

/** @deprecated Usar buildSalonAdminContext */
export async function buildAdminContext(
  request: NextRequest,
  params: Record<string, string> = {}
): Promise<RequestContext> {
  return buildSalonAdminContext(request, params);
}

export async function buildAnyAdminContext(
  request: NextRequest,
  params: Record<string, string> = {}
): Promise<RequestContext> {
  const auth = await requireAdmin(request);
  if ("error" in auth) throw AppError.unauthorized(auth.error);

  const salonId = auth.session.salonId || DEFAULT_SALON_ID;
  return {
    request,
    params,
    session: auth.session,
    tenant: { salonId },
    salonId,
  };
}

export async function buildPlatformContext(
  request: NextRequest,
  params: Record<string, string> = {}
): Promise<RequestContext> {
  const auth = await requirePlatformAdmin(request);
  if ("error" in auth) throw AppError.forbidden(auth.error);

  const salonId = auth.session.salonId || DEFAULT_SALON_ID;
  return {
    request,
    params,
    session: auth.session,
    tenant: { salonId },
    salonId,
  };
}

export async function getOptionalSession(
  request: NextRequest
): Promise<SessionData | null> {
  return getSession(request);
}

export { type UserRole };
