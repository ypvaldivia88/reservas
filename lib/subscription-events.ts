export const SUBSCRIPTION_REFRESH_EVENT = "reservas:subscription-refresh";

/** Notifica a banners/gates del admin que vuelvan a leer /api/subscriptions */
export function notifySubscriptionRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SUBSCRIPTION_REFRESH_EVENT));
}
