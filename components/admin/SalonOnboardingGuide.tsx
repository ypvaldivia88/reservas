"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  CircleHelp,
  ExternalLink,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  consumeWelcomePending,
  markStepVisited,
  markWelcomePending,
  matchOnboardingStepPath,
  ONBOARDING_OPEN_EVENT,
  ONBOARDING_STEPS,
  OnboardingState,
  OnboardingStep,
  OnboardingStepId,
  OnboardingStepStatus,
  readOnboardingState,
  readVisitedSteps,
  resolveStepStatuses,
  shouldShowOnboardingHelpFab,
  shouldShowOnboardingPanel,
  isOnboardingFinished,
  shouldShowWelcomeFromQuery,
  stepHref,
  writeOnboardingState,
} from "@/lib/salon-onboarding";

interface SalonSnapshot {
  salonId: string;
  slug: string;
  nombre: string;
  hasContactInfo: boolean;
  hasCustomBranding: boolean;
}

function ProgressRing({
  value,
  total,
}: {
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative size-11 shrink-0" aria-hidden>
      <svg className="size-11 -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-muted/40"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums">
        {value}/{total}
      </span>
    </div>
  );
}

function WelcomeModal({
  salonName,
  onStart,
  onExplore,
  onSkip,
  onBackdropClose,
}: {
  salonName: string;
  onStart: () => void;
  onExplore: () => void;
  onSkip: () => void;
  onBackdropClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-welcome-title"
      onClick={onBackdropClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-primary/15 via-transparent to-transparent" />
        <button
          type="button"
          onClick={onBackdropClose}
          className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Cerrar bienvenida"
        >
          <X className="size-4" />
        </button>

        <div className="relative p-6 sm:p-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            Primeros pasos
          </div>

          <h2
            id="onboarding-welcome-title"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {salonName ? `${salonName} ya está en línea` : "Tu salón ya está en línea"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Te guiamos paso a paso para dejar tu sitio listo para recibir reservas.
            Puedes pausar o salir cuando quieras.
          </p>

          <ol className="mt-6 space-y-2.5">
            {ONBOARDING_STEPS.slice(0, 3).map((step, index) => (
              <li
                key={step.id}
                className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold text-primary ring-1 ring-border">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
            <li className="pl-9 text-xs text-muted-foreground">
              + {ONBOARDING_STEPS.length - 3} pasos más cuando quieras
            </li>
          </ol>

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={onStart}
              icon={<ArrowRight className="size-4" />}
              iconPosition="right"
            >
              Empezar configuración
            </Button>
            <Button
              type="button"
              variant="outlined-secondary"
              size="lg"
              fullWidth
              onClick={onExplore}
            >
              Explorar el panel
            </Button>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="mt-4 w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            No mostrar de nuevo
          </button>
        </div>
      </div>
    </div>
  );
}

function StepStatusBadge({ status }: { status: OnboardingStepStatus }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
        <Check className="size-2.5" strokeWidth={3} />
        Completado
      </span>
    );
  }
  if (status === "visited") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
        <Circle className="size-2 fill-current" />
        Visitado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      Pendiente
    </span>
  );
}

function StepRow({
  step,
  stepNumber,
  status,
  isCurrent,
  onGoToStep,
}: {
  step: OnboardingStep;
  stepNumber: number;
  status: OnboardingStepStatus;
  isCurrent: boolean;
  onGoToStep: (step: OnboardingStep) => void;
}) {
  const done = status === "completed";
  const content = (
    <>
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors",
          done
            ? "border-primary/30 bg-primary/15 text-primary"
            : status === "visited"
              ? "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
              : "border-border bg-background text-muted-foreground"
        )}
      >
        {done ? <Check className="size-3.5" strokeWidth={2.5} /> : stepNumber}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "text-sm font-semibold",
              done && "text-muted-foreground"
            )}
          >
            {step.title}
          </span>
          {step.external && (
            <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
          )}
          <StepStatusBadge status={status} />
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
          {step.description}
        </span>
      </span>
      {!done && (
        <ArrowRight
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            isCurrent && "translate-x-0.5 text-primary"
          )}
        />
      )}
    </>
  );

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-xl px-2 py-2 opacity-90">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onGoToStep(step)}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isCurrent && "bg-primary/5 ring-1 ring-primary/20"
      )}
    >
      {content}
    </button>
  );
}

export default function SalonOnboardingGuide() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [salon, setSalon] = useState<SalonSnapshot | null>(null);
  const [state, setState] = useState<OnboardingState>({
    status: "active",
    manualCompleted: [],
  });
  const [visited, setVisited] = useState<OnboardingStepId[]>([]);
  const [hasPricedServices, setHasPricedServices] = useState(false);
  const [hasRealImages, setHasRealImages] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [ready, setReady] = useState(false);

  const persistState = useCallback((next: OnboardingState, salonId: string) => {
    setState(next);
    writeOnboardingState(salonId, next);
  }, []);

  const skipGuide = useCallback(() => {
    if (!salon) return;
    persistState(
      { ...state, status: "skipped", manualCompleted: state.manualCompleted },
      salon.salonId
    );
    setShowWelcome(false);
  }, [persistState, salon, state]);

  const completeGuide = useCallback(() => {
    if (!salon) return;
    persistState(
      { ...state, status: "completed", manualCompleted: state.manualCompleted },
      salon.salonId
    );
    setShowWelcome(false);
  }, [persistState, salon, state]);

  const minimize = useCallback(() => {
    if (!salon) return;
    persistState({ ...state, status: "minimized" }, salon.salonId);
    setShowWelcome(false);
  }, [persistState, salon, state]);

  const restore = useCallback(() => {
    if (!salon) return;
    persistState({ ...state, status: "active" }, salon.salonId);
    setExpanded(true);
  }, [persistState, salon, state]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [salonRes, serviciosRes, imagenesRes] = await Promise.all([
          fetch("/api/salons/current"),
          fetch("/api/servicios"),
          fetch("/api/imagenes"),
        ]);

        if (cancelled) return;

        const salonData = await salonRes.json();
        if (!salonData.success) return;

        const cms = salonData.data.cms;
        const snapshot: SalonSnapshot = {
          salonId: salonData.data.salonId,
          slug: salonData.data.slug || cms.slug,
          nombre: salonData.data.nombre || cms.nombre,
          hasContactInfo: Boolean(
            cms.contact?.address?.trim() ||
              cms.contact?.phone?.trim() ||
              salonData.data.whatsappNumber?.trim()
          ),
          hasCustomBranding: Boolean(
            cms.branding?.logoUrl || cms.branding?.logoSmallUrl
          ),
        };

        setSalon(snapshot);
        setState(readOnboardingState(snapshot.salonId));
        setVisited(readVisitedSteps(snapshot.salonId));

        if (serviciosRes.ok) {
          const serviciosData = await serviciosRes.json();
          if (serviciosData.success && Array.isArray(serviciosData.data)) {
            setHasPricedServices(
              serviciosData.data.some(
                (s: { precio?: number }) => (s.precio ?? 0) > 0
              )
            );
          }
        }

        if (imagenesRes.ok) {
          const imagenesData = await imagenesRes.json();
          if (imagenesData.success && Array.isArray(imagenesData.data)) {
            setHasRealImages(
              imagenesData.data.some(
                (img: { isPlaceholder?: boolean }) => !img.isPlaceholder
              )
            );
          }
        }

        const welcomeFromQuery = shouldShowWelcomeFromQuery(searchParams);
        const welcomeFromSession = consumeWelcomePending();
        const stored = readOnboardingState(snapshot.salonId);
        if (
          !isOnboardingFinished(stored.status) &&
          (welcomeFromQuery || welcomeFromSession)
        ) {
          setShowWelcome(true);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    const handleOpenGuide = () => {
      if (!salon) return;
      setState((prev) => {
        const next = { ...prev, status: "active" as const };
        writeOnboardingState(salon.salonId, next);
        return next;
      });
      setExpanded(true);
      setShowWelcome(false);
    };

    window.addEventListener(ONBOARDING_OPEN_EVENT, handleOpenGuide);
    return () => window.removeEventListener(ONBOARDING_OPEN_EVENT, handleOpenGuide);
  }, [salon]);

  useEffect(() => {
    if (!salon) return;

    const matched = matchOnboardingStepPath(pathname);
    if (!matched) return;

    markStepVisited(salon.salonId, matched);
    setVisited((current) =>
      current.includes(matched) ? current : [...current, matched]
    );
  }, [pathname, salon]);

  const stepStatuses = useMemo(() => {
    if (!salon) {
      return {} as Record<OnboardingStepId, OnboardingStepStatus>;
    }

    return resolveStepStatuses({
      visited,
      manualCompleted: state.manualCompleted,
      hasContactInfo: salon.hasContactInfo,
      hasCustomBranding: salon.hasCustomBranding,
      hasPricedServices,
      hasRealImages,
      slug: salon.slug,
    });
  }, [hasPricedServices, hasRealImages, salon, state.manualCompleted, visited]);

  const completedCount = ONBOARDING_STEPS.filter(
    (step) => stepStatuses[step.id] === "completed"
  ).length;
  const allDone = completedCount === ONBOARDING_STEPS.length;

  const currentStep = ONBOARDING_STEPS.find(
    (step) => stepStatuses[step.id] !== "completed"
  );

  const goToStep = useCallback(
    (step: OnboardingStep) => {
      if (!salon) return;

      const href = stepHref(step, salon.slug);
      markStepVisited(salon.salonId, step.id);
      setVisited((current) =>
        current.includes(step.id) ? current : [...current, step.id]
      );
      setShowWelcome(false);

      if (step.external) {
        window.open(href, "_blank", "noopener,noreferrer");
        const manualCompleted = state.manualCompleted.includes(step.id)
          ? state.manualCompleted
          : [...state.manualCompleted, step.id];
        persistState(
          { status: "active", manualCompleted },
          salon.salonId
        );
        return;
      }

      persistState({ ...state, status: "active" }, salon.salonId);
      router.push(href);
    },
    [persistState, router, salon, state]
  );

  const handleStart = () => {
    setShowWelcome(false);
    restore();
    if (currentStep) {
      goToStep(currentStep);
    }
  };

  useEffect(() => {
    if (!salon || !allDone || isOnboardingFinished(state.status)) return;
    completeGuide();
  }, [allDone, completeGuide, salon, state.status]);

  if (!ready || !salon) {
    return null;
  }

  const finished = isOnboardingFinished(state.status);

  if (finished) {
    return showWelcome ? (
      <WelcomeModal
        salonName={salon.nombre}
        onStart={handleStart}
        onExplore={minimize}
        onSkip={skipGuide}
        onBackdropClose={minimize}
      />
    ) : null;
  }

  if (allDone) {
    return null;
  }

  const showPanel = shouldShowOnboardingPanel(state.status);
  const showFab = shouldShowOnboardingHelpFab(state.status);

  return (
    <>
      {showWelcome && (
        <WelcomeModal
          salonName={salon.nombre}
          onStart={handleStart}
          onExplore={minimize}
          onSkip={skipGuide}
          onBackdropClose={minimize}
        />
      )}

      {showFab && (
        <button
          type="button"
          onClick={restore}
          className="onboarding-help-fab-pulse fixed bottom-24 right-3 z-[70] inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-primary shadow-md transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:bottom-6 md:right-6"
          aria-label="Abrir guía de configuración"
          title="Guía de configuración"
        >
          <CircleHelp className="size-4" strokeWidth={2.25} />
        </button>
      )}

      {showPanel && (
        <section
          className="fixed bottom-24 left-3 right-3 z-[70] mx-auto max-w-md md:bottom-6 md:left-auto md:right-6 md:max-w-sm"
          aria-label="Guía de configuración del salón"
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-xl backdrop-blur-md">
            <div className="flex items-start gap-3 border-b border-border/80 bg-gradient-to-r from-primary/10 via-transparent to-transparent px-4 py-3.5">
              <ProgressRing
                value={completedCount}
                total={ONBOARDING_STEPS.length}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold tracking-tight">
                  Deja tu sitio listo
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentStep
                    ? `Siguiente: ${currentStep.title}`
                    : "Casi terminado"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-expanded={expanded}
                  aria-label={expanded ? "Contraer pasos" : "Expandir pasos"}
                >
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform duration-200",
                      expanded && "rotate-180"
                    )}
                  />
                </button>
                <button
                  type="button"
                  onClick={minimize}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Minimizar guía"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {expanded && (
              <div className="max-h-[min(52vh,22rem)] overflow-y-auto px-2 py-2">
            {ONBOARDING_STEPS.map((step, index) => (
              <StepRow
                key={step.id}
                step={step}
                stepNumber={index + 1}
                status={stepStatuses[step.id] ?? "pending"}
                isCurrent={currentStep?.id === step.id}
                onGoToStep={goToStep}
              />
            ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-border/80 px-4 py-2.5">
              <button
                type="button"
                onClick={skipGuide}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Omitir guía
              </button>
              {currentStep && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => goToStep(currentStep)}
                  icon={
                    currentStep.external ? (
                      <ExternalLink className="size-3.5" />
                    ) : (
                      <ArrowRight className="size-3.5" />
                    )
                  }
                  iconPosition="right"
                >
                  Ir al paso
                </Button>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}