export type OnboardingStepId =
  | "sitio"
  | "servicios"
  | "horario"
  | "galeria"
  | "vista-previa";

/** @deprecated migrated to skipped */
export type LegacyOnboardingStatus = "dismissed";

export type OnboardingStatus =
  | "active"
  | "minimized"
  | "skipped"
  | "completed";

export const ONBOARDING_OPEN_EVENT = "reservas:onboarding-open";

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

/** Rutas de configuración accesibles durante onboarding (incluso con suscripción vencida). */
export const ONBOARDING_SETUP_PATHS = [
  "/admin",
  "/admin/sitio",
  "/admin/servicios",
  "/admin/schedule",
  "/admin/contenido",
  "/admin/galeria",
] as const;

export type OnboardingStepStatus = "completed" | "visited" | "pending";

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

function normalizeOnboardingStatus(
  status: string | undefined
): OnboardingStatus {
  if (status === "dismissed") return "skipped";
  if (
    status === "minimized" ||
    status === "skipped" ||
    status === "completed"
  ) {
    return status;
  }
  return "active";
}

export function isOnboardingFinished(status: OnboardingStatus): boolean {
  return status === "skipped" || status === "completed";
}

export function shouldShowOnboardingPanel(status: OnboardingStatus): boolean {
  return status === "active";
}

export function shouldShowOnboardingHelpFab(status: OnboardingStatus): boolean {
  return status === "minimized";
}

export function dispatchOpenOnboardingGuide(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ONBOARDING_OPEN_EVENT));
}

export function readOnboardingState(salonId: string): OnboardingState {
  if (typeof window === "undefined") {
    return { status: "active", manualCompleted: [] };
  }

  try {
    const raw = localStorage.getItem(onboardingStorageKey(salonId));
    if (!raw) return { status: "active", manualCompleted: [] };
    const parsed = JSON.parse(raw) as Partial<OnboardingState> & {
      status?: string;
    };
    return {
      status: normalizeOnboardingStatus(parsed.status),
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

export function matchOnboardingStepPath(pathname: string): OnboardingStepId | null {
  if (pathname.startsWith("/admin/sitio")) return "sitio";
  if (pathname.startsWith("/admin/servicios")) return "servicios";
  if (pathname.startsWith("/admin/schedule")) return "horario";
  if (
    pathname.startsWith("/admin/contenido") ||
    pathname.startsWith("/admin/galeria")
  ) {
    return "galeria";
  }
  return null;
}

export function isOnboardingSetupPath(pathname: string): boolean {
  return ONBOARDING_SETUP_PATHS.some(
    (path) => path === "/admin"
      ? pathname === "/admin" || pathname === "/admin/"
      : pathname.startsWith(path)
  );
}

function resolveSingleStepStatus(
  stepId: OnboardingStepId,
  visited: Set<OnboardingStepId>,
  manual: Set<OnboardingStepId>,
  dataComplete: boolean
): OnboardingStepStatus {
  if (manual.has(stepId) || dataComplete) return "completed";
  if (stepId === "horario" || stepId === "vista-previa") {
    return visited.has(stepId) ? "completed" : "pending";
  }
  if (visited.has(stepId)) return "visited";
  return "pending";
}

export function resolveStepStatuses(
  input: OnboardingCompletionInput
): Record<OnboardingStepId, OnboardingStepStatus> {
  const visited = new Set(input.visited);
  const manual = new Set(input.manualCompleted);

  return {
    sitio: resolveSingleStepStatus(
      "sitio",
      visited,
      manual,
      input.hasContactInfo || input.hasCustomBranding
    ),
    servicios: resolveSingleStepStatus(
      "servicios",
      visited,
      manual,
      input.hasPricedServices
    ),
    horario: resolveSingleStepStatus("horario", visited, manual, false),
    galeria: resolveSingleStepStatus(
      "galeria",
      visited,
      manual,
      input.hasRealImages
    ),
    "vista-previa": resolveSingleStepStatus(
      "vista-previa",
      visited,
      manual,
      false
    ),
  };
}

/** @deprecated Use resolveStepStatuses for richer UI states */
export function resolveStepCompletion(
  input: OnboardingCompletionInput
): Record<OnboardingStepId, boolean> {
  const statuses = resolveStepStatuses(input);
  return Object.fromEntries(
    Object.entries(statuses).map(([id, status]) => [
      id,
      status === "completed",
    ])
  ) as Record<OnboardingStepId, boolean>;
}

export function stepHref(step: OnboardingStep, slug: string): string {
  if (step.id === "vista-previa" && slug) {
    return `/${slug}`;
  }
  return step.href;
}
