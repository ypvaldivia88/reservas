"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import DynamicGalleryCarousel from "@/components/DynamicGalleryCarousel";
import DynamicServicesSection from "@/components/DynamicServicesSection";
import StatsSection from "@/components/StatsSection";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import ProcessSection from "@/components/ProcessSection";
import TenantFooter from "@/components/TenantFooter";
import TenantSalonAdminLink from "@/components/TenantSalonAdminLink";
import { SalonPublicProfile } from "@/lib/types";
import { getContrastingForeground, getAccessibleBrandPrimary, normalizeHexColor } from "@/lib/color-utils";
import { useTheme } from "@/contexts/ThemeContext";
import { getTemplateHeroUrl } from "@/lib/placeholder-config";

interface TenantHomePageProps {
  profile: SalonPublicProfile;
}

export default function TenantHomePage({ profile }: TenantHomePageProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { branding, content, contact, social } = profile;
  const brandPrimary = normalizeHexColor(branding.primaryColor || "", "#2563eb");
  const brandSecondary = normalizeHexColor(branding.secondaryColor || "", "#7c3aed");
  const accent = normalizeHexColor(branding.accentColor || "", "#93c5fd");
  const actionPrimary = getAccessibleBrandPrimary(
    brandPrimary,
    brandSecondary,
    accent,
    isDark
  );
  const actionForeground = getContrastingForeground(actionPrimary);
  const ctaForeground = getContrastingForeground(brandPrimary);
  const heroImage = branding.heroImageUrl || getTemplateHeroUrl(profile.businessTemplate);
  const reservaPath = `/reserva?slug=${profile.slug}`;
  const whatsapp =
    social.whatsapp || profile.whatsappNumber || contact.phone || "";
  const whatsappLink = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hola, quiero reservar una cita")}`
    : "#";

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
        <TenantSalonAdminLink slug={profile.slug} />
        {/* Hero */}
        <section
          className="relative py-12 px-4 sm:py-16 md:py-20 lg:py-24 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: `url('${heroImage}')` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom right, ${brandPrimary}cc, ${brandSecondary}cc)`,
            }}
            aria-hidden
          />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                {content.heroTitle}
                {content.heroHighlight && (
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80">
                    {content.heroHighlight}
                  </span>
                )}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-10 md:mb-12 max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-2">
                {content.heroSubtitle}
              </p>
              <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:space-y-0 md:space-x-4 justify-center items-center px-4">
                <Link href={reservaPath} className="w-full sm:w-72">
                  <Button variant="primary" size="lg" fullWidth className="text-base sm:text-lg">
                    Reservar Cita
                  </Button>
                </Link>
                {whatsapp && (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full sm:w-72">
                    <Button
                      variant="outlined-primary"
                      size="lg"
                      fullWidth
                      className="text-base sm:text-lg border-2 border-white/80 text-white hover:bg-white/20"
                    >
                      Llamar / WhatsApp
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <DynamicServicesSection
          slug={profile.slug}
          businessTemplate={profile.businessTemplate}
        />

        {/* Features */}
        {content.features && content.features.length > 0 && (
          <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 sm:mb-12 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                  {content.featuresTitle || "¿Por qué elegirnos?"}
                </h2>
                {content.featuresSubtitle && (
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {content.featuresSubtitle}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                {content.features.map((feature, index) => (
                  <div key={index} className="text-center p-4">
                    <div
                      className="flex justify-center mb-3 sm:mb-4"
                      style={{ color: actionPrimary }}
                    >
                      <svg className="w-12 h-12 sm:w-14 sm:h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <StatsSection stats={content.stats} />

        <section
          id="galeria"
          className="py-12 sm:py-16 md:py-20 bg-muted/40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                {content.galleryTitle || "Nuestros Trabajos"}
              </h2>
              {content.gallerySubtitle && (
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 px-4">
                  {content.gallerySubtitle}
                </p>
              )}
            </div>
            <DynamicGalleryCarousel slug={profile.slug} />
          </div>
        </section>

        <TestimonialCarousel
          testimonials={content.testimonials}
          title={content.testimonialsTitle}
          subtitle={content.testimonialsSubtitle}
        />
        <ProcessSection
          steps={content.processSteps}
          title={content.processTitle}
          subtitle={content.processSubtitle}
          cta={content.processCta}
          reservaPath={reservaPath}
        />

        {/* Contact */}
        <section id="contacto" className="py-12 sm:py-16 md:py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                  Visítanos
                </h2>
                <div className="space-y-4 sm:space-y-6">
                  {contact.address && (
                    <div className="flex items-start space-x-3">
                      <svg className="w-6 h-6 flex-shrink-0" style={{ color: actionPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="font-semibold">Dirección</p>
                        {contact.addressUrl ? (
                          <a href={contact.addressUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                            {contact.address}
                          </a>
                        ) : (
                          <p className="text-muted-foreground">{contact.address}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {(contact.phone || whatsapp) && (
                    <div className="flex items-start space-x-3">
                      <svg className="w-6 h-6 flex-shrink-0" style={{ color: actionPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <p className="font-semibold">Teléfono</p>
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          {contact.phone || whatsapp}
                        </a>
                      </div>
                    </div>
                  )}
                  {contact.hours && (
                    <div className="flex items-start space-x-3">
                      <svg className="w-6 h-6 flex-shrink-0" style={{ color: actionPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-semibold">Horarios</p>
                        <p className="text-muted-foreground">{contact.hours}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div
                className="rounded-2xl p-6 sm:p-8 shadow-xl"
                style={{
                  background: brandPrimary,
                  color: ctaForeground,
                }}
              >
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                  {content.ctaTitle || "Reserva tu cita"}
                </h3>
                <p className="text-sm sm:text-base mb-4 sm:mb-6 opacity-90">
                  {content.ctaSubtitle}
                </p>
                <Link href={reservaPath}>
                  <Button
                    variant="outlined-primary"
                    size="lg"
                    className="border-current bg-background/95 hover:bg-background"
                    style={{ color: actionPrimary, borderColor: actionPrimary }}
                  >
                    Reservar Ahora
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <TenantFooter
          profile={profile}
          reservaPath={reservaPath}
          tagline={content.heroSubtitle}
        />
      </div>
  );
}
