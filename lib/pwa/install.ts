export const PWA_INSTALL_DISMISSED_KEY = "reservas:pwa-install-dismissed";
export const PWA_INSTALL_BANNER_SHOWN_KEY = "reservas:pwa-install-banner-shown";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function isPwaInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export function isPwaInstallDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissPwaInstall(): void {
  try {
    localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "1");
  } catch {
    // ignore
  }
}

export function wasPwaBannerShown(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PWA_INSTALL_BANNER_SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPwaBannerShown(): void {
  try {
    localStorage.setItem(PWA_INSTALL_BANNER_SHOWN_KEY, "1");
  } catch {
    // ignore
  }
}

export function canShowPwaBanner(): boolean {
  return (
    !isPwaInstalled() && !isPwaInstallDismissed() && !wasPwaBannerShown()
  );
}
