"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  BeforeInstallPromptEvent,
  canShowPwaBanner,
  dismissPwaInstall,
  isPwaInstalled,
  markPwaBannerShown,
} from "@/lib/pwa/install";

type PwaInstallContextValue = {
  canInstall: boolean;
  showBanner: boolean;
  installing: boolean;
  dismissBanner: () => void;
  installApp: () => Promise<void>;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [showBanner, setShowBanner] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || isPwaInstalled()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setDeferred(promptEvent);

      if (canShowPwaBanner()) {
        markPwaBannerShown();
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismissBanner = useCallback(() => {
    dismissPwaInstall();
    setShowBanner(false);
  }, []);

  const installApp = useCallback(async () => {
    if (!deferred) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      setShowBanner(false);
      if (outcome === "dismissed") {
        dismissPwaInstall();
      }
      setDeferred(null);
    } finally {
      setInstalling(false);
    }
  }, [deferred]);

  const value: PwaInstallContextValue = {
    canInstall: Boolean(deferred) && !isPwaInstalled(),
    showBanner: showBanner && Boolean(deferred),
    installing,
    dismissBanner,
    installApp,
  };

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstallOptional() {
  return useContext(PwaInstallContext);
}
