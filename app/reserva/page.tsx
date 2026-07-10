import { Suspense } from "react";
import Header from "@/components/Header";
import TenantHeader from "@/components/TenantHeader";
import TenantBrandingProvider from "@/components/TenantBrandingProvider";
import TenantFooter from "@/components/TenantFooter";
import ReservaForm from "@/components/ReservaForm";
import SurfaceCard from "@/components/design/SurfaceCard";
import { salonCmsService } from "@/lib/services/salon-cms.service";
import {
  buildSalonWhatsAppLink,
  resolveSalonWhatsapp,
} from "@/lib/whatsapp";

interface ReservaPageProps {
  searchParams: Promise<{ slug?: string }>;
}

export default async function ReservaPage({ searchParams }: ReservaPageProps) {
  const { slug } = await searchParams;

  let header = <Header isHomePage={false} />;
  let profile = null;

  if (slug) {
    try {
      profile = await salonCmsService.getPublicBySlug(slug);
      header = <TenantHeader profile={profile} isHomePage={false} />;
    } catch {
      // Sin slug válido, se mantiene el header genérico
    }
  }

  const salonWhatsapp = profile ? resolveSalonWhatsapp(profile) : undefined;
  const referenciaWaLink = buildSalonWhatsAppLink(
    salonWhatsapp,
    "Hola, quiero enviar una referencia de diseño"
  );
  const contactWaLink = buildSalonWhatsAppLink(
    salonWhatsapp,
    "Hola Quiero reservar una cita"
  );
  const displayPhone =
    profile?.contact?.phone || profile?.whatsappNumber || salonWhatsapp;

  const pageContent = (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <section className="px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 sm:mb-8">
            <span className="mb-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:mb-4 sm:px-4 sm:py-2 sm:text-sm">
              Reserva en pocos pasos
            </span>
            <h1 className="mb-4 text-2xl font-bold leading-tight sm:mb-6 sm:text-3xl md:text-4xl lg:text-5xl">
              Reserva tu
              <span className="block text-primary">cita</span>
            </h1>
            <p className="mx-auto max-w-2xl px-2 text-base text-muted-foreground sm:text-lg">
              Solo necesitamos lo esencial. Los colores y la decoración son
              opcionales — puedes decidirlo después con tu manicurista.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-12 sm:pb-16 md:pb-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="py-12 text-center text-muted-foreground">
                Cargando formulario...
              </div>
            }
          >
            <ReservaForm salonSlug={slug} salonWhatsapp={salonWhatsapp} />
          </Suspense>

          <SurfaceCard padding="default" className="mt-8 text-center">
            <h3 className="mb-2 text-lg font-bold sm:text-xl">
              ¿Tienes una imagen de referencia?
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Si encontraste un diseño que te gusta, envíanoslo por WhatsApp y
              lo recrearemos para ti
            </p>
            <a
              href={referenciaWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg sm:text-base"
            >
              Enviar Referencia por WhatsApp
            </a>
          </SurfaceCard>
        </div>
      </section>

      <section className="bg-muted/30 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl">
              ¿Por qué reservar con nosotros?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            {[
              {
                icon: "⏰",
                title: "Horarios Flexibles",
                desc: "Disponibilidad de lunes a sábado con horarios que se adaptan a ti",
              },
              {
                icon: "💎",
                title: "Calidad Premium",
                desc: "Solo utilizamos los mejores productos y técnicas profesionales",
              },
              {
                icon: "🎯",
                title: "Atención Personalizada",
                desc: "Cada servicio se adapta a tus gustos y necesidades específicas",
              },
            ].map((benefit, index) => (
              <SurfaceCard key={index} padding="default" className="text-center">
                <div className="mb-3 text-3xl sm:mb-4 sm:text-4xl">{benefit.icon}</div>
                <h3 className="mb-2 text-lg font-semibold sm:text-xl">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground sm:text-base">{benefit.desc}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-12 text-primary-foreground sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl">
            ¿Necesitas ayuda?
          </h2>
          <p className="mb-6 px-4 text-base opacity-90 sm:mb-8 sm:text-xl">
            Si tienes alguna pregunta o prefieres reservar por teléfono, no
            dudes en contactarnos
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <a href={contactWaLink} target="_blank" rel="noopener noreferrer">
              <div className="flex items-center space-x-3">
                <span className="text-xl sm:text-2xl">📞</span>
                <div className="text-left">
                  <p className="text-sm font-semibold sm:text-base">Llámanos</p>
                  <p className="text-sm opacity-90 sm:text-base">
                    {displayPhone || "Contáctanos"}
                  </p>
                </div>
              </div>
            </a>

            <a href={contactWaLink} target="_blank" rel="noopener noreferrer">
              <div className="flex items-center space-x-3">
                <span className="text-xl sm:text-2xl">💬</span>
                <div className="text-left">
                  <p className="text-sm font-semibold sm:text-base">WhatsApp</p>
                  <p className="text-sm opacity-90 sm:text-base">Respuesta inmediata</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {profile ? (
        <TenantFooter profile={profile} reservaPath={`/reserva?slug=${profile.slug}`} />
      ) : (
        <footer className="tenant-footer">
          <div className="tenant-footer-accent" aria-hidden />
          <div className="mx-auto max-w-7xl px-5 py-10 text-center sm:px-6 lg:px-8">
            <p className="text-sm text-white/70">
              Tu salón de confianza para el cuidado profesional de uñas
            </p>
            <p className="mt-3 text-xs text-white/45">
              &copy; {new Date().getFullYear()} ReservaSalón
            </p>
          </div>
        </footer>
      )}
    </div>
  );

  return profile ? (
    <TenantBrandingProvider branding={profile.branding}>
      {header}
      {pageContent}
    </TenantBrandingProvider>
  ) : (
    <>
      {header}
      {pageContent}
    </>
  );
}
