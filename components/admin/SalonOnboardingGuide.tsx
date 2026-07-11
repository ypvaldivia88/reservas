"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
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
  ONBOARDING_OPEN_EVENT,
  ONBOARDING_STEPS,
  OnboardingState,
  OnboardingStep,
  OnboardingStepId,
  readOnboardingState,
  readVisitedSteps,
  resolveStepCompletion,
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

function StepRow({
  step,
  stepNumber,
  done,
  slug,
  isCurrent,
  onNavigate,
}: {
  step: OnboardingStep;
  stepNumber: number;
  done: boolean;
  slug: string;
  isCurrent: boolean;
  onNavigate: (stepId: OnboardingStepId, href: string, external?: boolean) => void;
}) {
  const href = stepHref(step, slug);
  const content = (
    <>
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors",
          done
            ? "border-primary/30 bg-primary/15 text-primary"
            : "border-border bg-background text-muted-foreground"
        )}
      >
        {done ? <Check className="size-3.5" strokeWidth={2.5} /> : stepNumber}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "block text-sm font-semibold",
              done && "text-muted-foreground line-through decoration-muted-foreground/50"
            )}
          >
            {step.title}
          </span>
          {step.external && (
            <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
          )}
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
      <div className="flex items-start gap-3 rounded-xl px-2 py-2 opacity-80">
        {content}
      </div>
    );
  }

  if (step.external) {
    return (
      <button
        type="button"
        onClick={() => onNavigate(step.id, href, true)}
        className={cn(
          "flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isCurrent && "bg-primary/5 ring-1 ring-primary/20"
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={() => onNavigate(step.id, href)}
      className={cn(
        "flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isCurrent && "bg-primary/5 ring-1 ring-primary/20"
      )}
    >
      {content}
    </Link>
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
      persistState({ ...state, status: "active" }, salon.salonId);
      setExpanded(true);
      setShowWelcome(false);
    };

    window.addEventListener(ONBOARDING_OPEN_EVENT, handleOpenGuide);
    return () => window.removeEventListener(ONBOARDING_OPEN_EVENT, handleOpenGuide);
  }, [persistState, salon, state]);

  useEffect(() => {
    if (!salon) return;

    const matched = ONBOARDING_STEPS.find((step) => {
      if (step.external) return false;
      return pathname.startsWith(step.href);
    });

    if (!matched) return;

    markStepVisited(salon.salonId, matched.id);
    setVisited((current) =>
      current.includes(matched.id) ? current : [...current, matched.id]
    );
  }, [pathname, salon]);

  const completion = useMemo(() => {
    if (!salon) {
      return {} as Record<OnboardingStepId, boolean>;
    }

    return resolveStepCompletion({
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
    (step) => completion[step.id]
  ).length;
  const allDone = completedCount === ONBOARDING_STEPS.length;

  const currentStep = ONBOARDING_STEPS.find((step) => !completion[step.id]);

  const handleNavigate = (
    stepId: OnboardingStepId,
    href: string,
    external?: boolean
  ) => {
    if (!salon) return;

    markStepVisited(salon.salonId, stepId);
    setVisited((current) =>
      current.includes(stepId) ? current : [...current, stepId]
    );

    if (external) {
      window.open(href, "_blank", "noopener,noreferrer");
      persistState(
        {
          ...state,
          manualCompleted: state.manualCompleted.includes(stepId)
            ? state.manualCompleted
            : [...state.manualCompleted, stepId],
        },
        salon.salonId
      );
    }
  };

  const handleStart = () => {
    setShowWelcome(false);
    restore();
    if (currentStep) {
      const href = stepHref(currentStep, salon?.slug ?? "");
      if (currentStep.external) {
        handleNavigate(currentStep.id, href, true);
      } else {
        router.push(href);
      }
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
                done={completion[step.id]}
                    slug={salon.slug}
                    isCurrent={currentStep?.id === step.id}
                    onNavigate={handleNavigate}
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
                  onClick={() => {
                    const href = stepHref(currentStep, salon.slug);
                    if (currentStep.external) {
                      handleNavigate(currentStep.id, href, true);
                    } else {
                      router.push(href);
                    }
                  }}
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