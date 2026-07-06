"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import DynamicGalleryCarousel from "@/components/DynamicGalleryCarousel";
import DynamicServicesSection from "@/components/DynamicServicesSection";
import StatsSection from "@/components/StatsSection";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import ProcessSection from "@/components/ProcessSection";
import TenantBrandingProvider from "@/components/TenantBrandingProvider";
import { SalonPublicProfile } from "@/lib/types";

interface TenantHomePageProps {
  profile: SalonPublicProfile;
}

export default function TenantHomePage({ profile }: TenantHomePageProps) {
  const { branding, content, contact, social } = profile;
  const primary = branding.primaryColor || "#2563eb";
  const secondary = branding.secondaryColor || "#7c3aed";
  const heroImage = branding.heroImageUrl || "/main.avif";
  const reservaPath = `/reserva?slug=${profile.slug}`;
  const whatsapp =
    social.whatsapp || profile.whatsappNumber || contact.phone || "";
  const whatsappLink = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hola, quiero reservar una cita")}`
    : "#";

  return (
    <TenantBrandingProvider branding={branding}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
        {/* Hero */}
        <section
          className="relative py-12 px-4 sm:py-16 md:py-20 lg:py-24 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: `url('${heroImage}')` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom right, ${primary}cc, ${secondary}cc)`,
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

        {/* Features */}
        {content.features && content.features.length > 0 && (
          <section className="py-12 sm:py-16 md:py-20 bg-white/50 dark:bg-gray-800/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 sm:mb-12 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  {content.featuresTitle || "¿Por qué elegirnos?"}
                </h2>
                {content.featuresSubtitle && (
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                    {content.featuresSubtitle}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                {content.features.map((feature, index) => (
                  <div key={index} className="text-center p-4">
                    <div
                      className="flex justify-center mb-3 sm:mb-4"
                      style={{ color: primary }}
                    >
                      <svg className="w-12 h-12 sm:w-14 sm:h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <StatsSection stats={content.stats} primaryColor={primary} />
        <DynamicServicesSection slug={profile.slug} />

        <section
          id="galeria"
          className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-blue-100 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/30"
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
          primaryColor={primary}
        />
        <ProcessSection
          steps={content.processSteps}
          title={content.processTitle}
          subtitle={content.processSubtitle}
          cta={content.processCta}
          reservaPath={reservaPath}
          primaryColor={primary}
        />

        {/* Contact */}
        <section id="contacto" className="py-12 sm:py-16 md:py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                  Visítanos
                </h2>
                <div className="space-y-4 sm:space-y-6">
                  {contact.address && (
                    <div className="flex items-start space-x-3">
                      <svg className="w-6 h-6 flex-shrink-0" style={{ color: primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Dirección</p>
                        {contact.addressUrl ? (
                          <a href={contact.addressUrl} target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300">
                            {contact.address}
                          </a>
                        ) : (
                          <p className="text-gray-700 dark:text-gray-300">{contact.address}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {(contact.phone || whatsapp) && (
                    <div className="flex items-start space-x-3">
                      <svg className="w-6 h-6 flex-shrink-0" style={{ color: primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Teléfono</p>
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300">
                          {contact.phone || whatsapp}
                        </a>
                      </div>
                    </div>
                  )}
                  {contact.hours && (
                    <div className="flex items-start space-x-3">
                      <svg className="w-6 h-6 flex-shrink-0" style={{ color: primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Horarios</p>
                        <p className="text-gray-700 dark:text-gray-300">{contact.hours}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div
                className="p-6 sm:p-8 rounded-2xl text-white shadow-2xl"
                style={{ background: `linear-gradient(to bottom right, ${primary}, ${secondary})` }}
              >
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                  {content.ctaTitle || "Reserva tu cita"}
                </h3>
                <p className="text-sm sm:text-base mb-4 sm:mb-6 text-white/90">
                  {content.ctaSubtitle}
                </p>
                <Link href={reservaPath}>
                  <Button variant="outlined-primary" size="lg" className="bg-white border-white hover:bg-white/90" style={{ color: primary }}>
                    Reservar Ahora
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-800 dark:bg-gray-950 text-white py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              <div>
                {branding.logoUrl ? (
                  <div className="relative w-28 h-28">
                    <Image src={branding.logoUrl} alt={profile.nombre} fill className="object-contain" />
                  </div>
                ) : (
                  <h3 className="text-xl font-bold">{profile.nombre}</h3>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-3">Enlaces</h4>
                <ul className="space-y-1 text-gray-300 text-sm">
                  <li><Link href={`${profile.slug ? `/${profile.slug}` : "/"}#servicios`} className="hover:text-white">Servicios</Link></li>
                  <li><Link href={reservaPath} className="hover:text-white">Reservas</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Síguenos</h4>
                <div className="flex space-x-3">
                  {social.facebook && (
                    <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-400">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                    </a>
                  )}
                  {social.instagram && (
                    <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-pink-400">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                    </a>
                  )}
                  {whatsapp && (
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-green-400">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-300 text-xs sm:text-sm">
              <p>&copy; {new Date().getFullYear()} {profile.nombre}. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </TenantBrandingProvider>
  );
}
