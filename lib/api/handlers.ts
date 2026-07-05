import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types";
import { handleError } from "@/lib/api/responses";
import {
  buildAdminContext,
  buildPlatformContext,
  buildPublicContext,
  RequestContext,
} from "@/lib/services/tenant-context.service";

type RouteParams = { params: Promise<Record<string, string>> };

type HandlerFn<T = unknown> = (
  ctx: RequestContext
) => Promise<NextResponse<ApiResponse<T>>>;

async function resolveParams(
  params?: Promise<Record<string, string>>
): Promise<Record<string, string>> {
  return params ? await params : {};
}

function wrapHandler(
  handler: HandlerFn,
  buildContext: (
    request: NextRequest,
    params: Record<string, string>
  ) => Promise<RequestContext>
) {
  return async (
    request: NextRequest,
    routeCtx?: RouteParams
  ): Promise<NextResponse<ApiResponse>> => {
    try {
      const params = await resolveParams(routeCtx?.params);
      const ctx = await buildContext(request, params);
      return await handler(ctx);
    } catch (error) {
      return handleError(error);
    }
  };
}

/** Handler para rutas públicas (reservas, disponibilidad) */
export function publicHandler(handler: HandlerFn) {
  return wrapHandler(handler, buildPublicContext);
}

/** Handler para rutas admin autenticadas */
export function adminHandler(handler: HandlerFn) {
  return wrapHandler(handler, buildAdminContext);
}

/** Handler para administradores de plataforma */
export function platformHandler(handler: HandlerFn) {
  return wrapHandler(handler, buildPlatformContext);
}

/** Handler público GET + admin para mutaciones */
export function publicReadAdminWrite(
  getHandler: HandlerFn,
  writeHandler: HandlerFn
) {
  const publicGet = publicHandler(getHandler);
  const adminWrite = adminHandler(writeHandler);
  return { GET: publicGet, POST: adminWrite, PATCH: adminWrite, DELETE: adminWrite };
}

export type { RequestContext, HandlerFn };
