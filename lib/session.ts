import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";
import { SessionData, UserRole } from "@/lib/types";

const ADMIN_ROLES: UserRole[] = ["admin", "salon_admin", "platform_admin"];

export function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export async function getSession(
  request?: NextRequest
): Promise<SessionData | null> {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get("session-token")?.value;
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get("session-token")?.value;
  }

  if (!token || token.length < 20) return null;

  const client = await clientPromise;
  const db = client.db("nailsalon");

  const session = (await db.collection("sessions").findOne({
    token,
    expiresAt: { $gt: new Date() },
  })) as SessionData | null;

  return session;
}

export async function requireSession(
  request: NextRequest,
  allowedRoles?: UserRole[]
): Promise<{ session: SessionData } | { error: string; status: number }> {
  const session = await getSession(request);

  if (!session) {
    return { error: "No autorizado", status: 401 };
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return { error: "Acceso denegado", status: 403 };
  }

  return { session };
}

export async function requireAdmin(
  request: NextRequest
): Promise<{ session: SessionData } | { error: string; status: number }> {
  const session = await getSession(request);

  if (!session || !isAdminRole(session.role)) {
    return { error: "No autorizado", status: 401 };
  }

  return { session };
}

export async function requirePlatformAdmin(
  request: NextRequest
): Promise<{ session: SessionData } | { error: string; status: number }> {
  return requireSession(request, ["platform_admin"]);
}
