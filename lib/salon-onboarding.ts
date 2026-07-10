export type OnboardingStepId =
  | "sitio"
  | "servicios"
  | "horario"
  | "galeria"
  | "vista-previa";

export type OnboardingStatus = "active" | "minimized" | "dismissed";

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  duration: string;
  href: string;
  external?: boolean;
}

export interface OnboardingState {
  status: OnboardingStatus;
  manualCompleted: OnboardingStepId[];
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "sitio",
    title: "Personaliza tu sitio",
    description: "Colores, textos de bienvenida y datos de contacto.",
    duration: "~5 min",
    href: "/admin/sitio",
  },
  {
    id: "servicios",
    title: "Ajusta tus servicios",
    description: "Revisa precios, duración y qué ofreces a tus clientes.",
    duration: "~3 min",
    href: "/admin/servicios",
  },
  {
    id: "horario",
    title: "Confirma tus horarios",
    description: "Verifica los días y franjas en que aceptas reservas.",
    duration: "~2 min",
    href: "/admin/schedule",
  },
  {
    id: "galeria",
    title: "Sube fotos reales",
    description: "Reemplaza las imágenes de ejemplo con tu trabajo.",
    duration: "~4 min",
    href: "/admin/contenido",
  },
  {
    id: "vista-previa",
    title: "Mira cómo lo ven tus clientes",
    description: "Abre tu página pública y comparte el enlace.",
    duration: "~1 min",
    href: "",
    external: true,
  },
];

const STORAGE_PREFIX = "reservas:onboarding";
const VISITS_PREFIX = "reservas:onboarding-visits";
const WELCOME_SESSION_KEY = "reservas:onboarding-welcome-pending";

export function onboardingStorageKey(salonId: string): string {
  return `${STORAGE_PREFIX}:${salonId}`;
}

export function onboardingVisitsKey(salonId: string): string {
  return `${VISITS_PREFIX}:${salonId}`;
}

export function readOnboardingState(salonId: string): OnboardingState {
  if (typeof window === "undefined") {
    return { status: "active", manualCompleted: [] };
  }

  try {
    const raw = localStorage.getItem(onboardingStorageKey(salonId));
    if (!raw) return { status: "active", manualCompleted: [] };
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      status: parsed.status ?? "active",
      manualCompleted: Array.isArray(parsed.manualCompleted)
        ? parsed.manualCompleted
        : [],
    };
  } catch {
    return { status: "active", manualCompleted: [] };
  }
}

export function writeOnboardingState(salonId: string, state: OnboardingState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(onboardingStorageKey(salonId), JSON.stringify(state));
}

export function readVisitedSteps(salonId: string): OnboardingStepId[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(onboardingVisitsKey(salonId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markStepVisited(salonId: string, stepId: OnboardingStepId): void {
  if (typeof window === "undefined") return;

  const visits = new Set(readVisitedSteps(salonId));
  visits.add(stepId);
  localStorage.setItem(
    onboardingVisitsKey(salonId),
    JSON.stringify([...visits])
  );
}

export function markWelcomePending(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(WELCOME_SESSION_KEY, "1");
}

export function consumeWelcomePending(): boolean {
  if (typeof window === "undefined") return false;
  const pending = sessionStorage.getItem(WELCOME_SESSION_KEY) === "1";
  if (pending) sessionStorage.removeItem(WELCOME_SESSION_KEY);
  return pending;
}

export function shouldShowWelcomeFromQuery(
  searchParams: URLSearchParams
): boolean {
  return (
    searchParams.get("bienvenida") === "1" ||
    searchParams.get("onboarding") === "start"
  );
}

export interface OnboardingCompletionInput {
  visited: OnboardingStepId[];
  manualCompleted: OnboardingStepId[];
  hasContactInfo: boolean;
  hasCustomBranding: boolean;
  hasPricedServices: boolean;
  hasRealImages: boolean;
  slug: string;
}

export function resolveStepCompletion(
  input: OnboardingCompletionInput
): Record<OnboardingStepId, boolean> {
  const visited = new Set(input.visited);
  const manual = new Set(input.manualCompleted);

  return {
    sitio:
      manual.has("sitio") ||
      visited.has("sitio") ||
      input.hasContactInfo ||
      input.hasCustomBranding,
    servicios:
      manual.has("servicios") ||
      visited.has("servicios") ||
      input.hasPricedServices,
    horario: manual.has("horario") || visited.has("horario"),
    galeria:
      manual.has("galeria") ||
      visited.has("galeria") ||
      input.hasRealImages,
    "vista-previa": manual.has("vista-previa") || visited.has("vista-previa"),
  };
}

export function stepHref(step: OnboardingStep, slug: string): string {
  if (step.id === "vista-previa" && slug) {
    return `/${slug}`;
  }
  return step.href;
}
