import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { AppError } from "@/lib/api/errors";
import { Salon, TenantSubscription } from "@/lib/types";
import {
  getSubscriptionAccessInfo,
  SubscriptionAccessInfo,
  SubscriptionAccessState,
} from "@/lib/subscription";
import { getSalonById } from "@/lib/tenant";

const ADMIN_ALLOWLIST_PATHS = [
  "/api/subscriptions",
  "/api/subscriptions/redeem",
  "/api/subscription-plans",
  "/api/salons/current",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/auth/me",
];

const ADMIN_ALLOWLIST_PREFIXES = ["/api/auth/", "/api/profile"];

export function isAdminPathAllowlisted(pathname: string): boolean {
  if (ADMIN_ALLOWLIST_PATHS.includes(pathname)) return true;
  return ADMIN_ALLOWLIST_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function maybeTransitionPastDue(
  subscription: TenantSubscription | null
): Promise<TenantSubscription | null> {
  if (!subscription?._id || !subscription.periodoFin) return subscription;

  const info = getSubscriptionAccessInfo(subscription, "active");
  if (info.accessState !== "expired") return subscription;

  const shouldTransition =
    subscription.status === "trial" || subscription.status === "active";

  if (!shouldTransition) return subscription;

  const db = await getDb();
  await db.collection(Collections.TENANT_SUBSCRIPTIONS).updateOne(
    { _id: new ObjectId(String(subscription._id)) },
    {
      $set: {
        status: "past_due",
        fechaActualizacion: new Date(),
      },
    }
  );

  return { ...subscription, status: "past_due" };
}

export async function getTenantAccessForSalon(
  salonId: string
): Promise<{
  salon: Salon | null;
  subscription: TenantSubscription | null;
  access: SubscriptionAccessInfo;
}> {
  const db = await getDb();
  const salon = await getSalonById(salonId);

  let subscription = (await db
    .collection<TenantSubscription>(Collections.TENANT_SUBSCRIPTIONS)
    .findOne({ salonId }, { sort: { fechaCreacion: -1 } })) as TenantSubscription | null;

  subscription = await maybeTransitionPastDue(subscription);

  const access = getSubscriptionAccessInfo(
    subscription,
    salon?.status ?? "active"
  );

  return { salon, subscription, access };
}

export async function assertTenantOperational(
  salonId: string,
  options?: { requestPath?: string }
): Promise<SubscriptionAccessInfo> {
  const { access } = await getTenantAccessForSalon(salonId);

  if (access.isOperational) {
    return access;
  }

  if (options?.requestPath && isAdminPathAllowlisted(options.requestPath)) {
    return access;
  }

  if (access.accessState === "suspended") {
    throw AppError.forbidden(
      "Este salón está suspendido. Contacta al soporte de la plataforma."
    );
  }

  if (access.accessState === "grace_period") {
    return access;
  }

  throw new AppError(
    "Tu suscripción ha expirado. Renueva o canjea tu código de activación en Suscripción.",
    403
  );
}

export async function assertPublicTenantOperational(
  salonId: string
): Promise<SubscriptionAccessInfo> {
  const { salon, access } = await getTenantAccessForSalon(salonId);

  if (!salon || salon.status !== "active") {
    throw AppError.notFound("Salón no encontrado");
  }

  if (!access.isOperational) {
    throw AppError.notFound("Salón no disponible");
  }

  return access;
}

export function getAccessStateLabel(state: SubscriptionAccessState): string {
  switch (state) {
    case "active":
      return "Activo";
    case "grace_period":
      return "En gracia";
    case "expired":
      return "Expirado";
    case "suspended":
      return "Suspendido";
    case "no_subscription":
      return "Sin suscripción";
  }
}
