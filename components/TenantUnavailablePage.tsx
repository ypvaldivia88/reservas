import Link from "next/link";
import { CalendarOff, MessageCircle } from "lucide-react";
import SurfaceCard from "@/components/design/SurfaceCard";
import TenantFooter from "@/components/TenantFooter";
import TenantSalonAdminLink from "@/components/TenantSalonAdminLink";
import { getPublicUnavailableCopy } from "@/lib/public-tenant-status";
import type { SubscriptionAccessState } from "@/lib/subscription";
import type { SalonPublicProfile } from "@/lib/types";
import { buildSalonWhatsAppLink, resolveSalonWhatsapp } from "@/lib/whatsapp";

interface TenantUnavailablePageProps {
  profile: SalonPublicProfile;
  accessState: SubscriptionAccessState;
}

export default function TenantUnavailablePage({
  profile,
  accessState,
}: TenantUnavailablePageProps) {
  const copy = getPublicUnavailableCopy(accessState);
  const whatsapp = resolveSalonWhatsapp(profile);
  const whatsappLink = buildSalonWhatsAppLink(
    whatsapp,
    `Hola ${profile.nombre}, quisiera consultar sobre una cita`
  );
  const displayPhone = profile.contact?.phone || whatsapp;

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <TenantSalonAdminLink slug={profile.slug} />

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-lg">
          <SurfaceCard padding="lg" className="text-center">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <CalendarOff className="size-7" aria-hidden />
            </div>

            <p className="text-sm font-medium text-muted-foreground">
              {profile.nombre}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {copy.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {copy.description}
            </p>
            {copy.hint && (
              <p className="mt-2 text-sm text-muted-foreground">{copy.hint}</p>
            )}

            {(whatsappLink || displayPhone) && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <MessageCircle className="size-4" />
                    Contactar por WhatsApp
                  </a>
                )}
                {displayPhone && !whatsappLink && (
                  <p className="text-sm text-muted-foreground">
                    Teléfono:{" "}
                    <span className="font-medium text-foreground">
                      {displayPhone}
                    </span>
                  </p>
                )}
              </div>
            )}

            <p className="mt-6 text-xs text-muted-foreground">
              ¿Eres el dueño de este salón?{" "}
              <Link
                href="/admin"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Ir al panel de administración
              </Link>
            </p>
          </SurfaceCard>
        </div>
      </section>

      <TenantFooter
        profile={profile}
        reservaPath={`/reserva?slug=${profile.slug}`}
      />
    </div>
  );
}
