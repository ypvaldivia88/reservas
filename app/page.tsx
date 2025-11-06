import Link from "next/link";
import Image from "next/image";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import StatsSection from "@/components/StatsSection";
import ProcessSection from "@/components/ProcessSection";
import DynamicGalleryCarousel from "@/components/DynamicGalleryCarousel";
import DynamicServicesSection from "@/components/DynamicServicesSection";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      {/* Hero Section - Mobile First */}
      <section className="relative py-12 px-4 sm:py-16 md:py-20 lg:py-24 bg-[url('/main.avif')] bg-center bg-cover bg-no-repeat">
        {/* overlay to improve text contrast */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-800/70 to-blue-900/70 dark:bg-gradient-to-br dark:from-black/85 dark:via-blue-950/85 dark:to-black/85"
          aria-hidden
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            {/* Mobile: text-3xl, SM: text-4xl, MD: text-5xl, LG: text-6xl, XL: text-7xl */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Belleza en tus
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-400">
                Manos
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-8 sm:mb-10 md:mb-12 max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-2">
              Descubre la excelencia en el cuidado de uñas. Diseños únicos,
              técnicas profesionales y la mejor atención para que luzcas
              radiante.
            </p>

            {/* Mobile-first button layout */}
            <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:space-y-0 md:space-x-4 lg:space-x-6 justify-center items-center px-4 sm:px-6">
              <Link href="/reserva" className="w-full sm:w-72">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="text-base sm:text-lg"
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  }
                >
                  Reservar Cita
                </Button>
              </Link>
              <a
                href="https://wa.me/+5363233073?text=Hola%20Quiero%20reservar%20una%20cita"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-72"
              >
                <Button
                  variant="outlined-primary"
                  size="lg"
                  fullWidth
                  className="text-base sm:text-lg border-2 border-white/80 text-white hover:bg-white/20 hover:border-white backdrop-blur-md bg-white/5"
                  icon={
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.09 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12 1.05.37 2.07.74 3.03a2 2 0 0 1-.45 2.11L9.91 10.09a16 16 0 0 0 6 6l1.22-1.22a2 2 0 0 1 2.11-.45c.96.37 1.98.62 3.03.74A2 2 0 0 1 22 16.92z" />
                    </svg>
                  }
                >
                  Llamar / WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Decorative elements - Hidden on mobile, visible on larger screens */}
        <div className="hidden md:block absolute top-20 left-4 lg:left-10 text-blue-300 dark:text-blue-400 opacity-50 animate-bounce">
          <svg
            className="w-12 h-12 lg:w-16 lg:h-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        </div>
        <div className="hidden md:block absolute bottom-20 right-4 lg:right-10 text-blue-300 dark:text-blue-400 opacity-50 animate-pulse">
          <svg
            className="w-10 h-10 lg:w-12 lg:h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        </div>
      </section>

      {/* Services Section - Now Dynamic */}
      <DynamicServicesSection />

      {/* Features Section - Mobile First */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              ¿Por qué elegirnos?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: (
                  <svg
                    className="w-12 h-12 sm:w-14 sm:h-14"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                ),
                title: "Profesionales Expertas",
                desc: "Nuestro equipo cuenta con años de experiencia y certificaciones profesionales",
              },
              {
                icon: (
                  <svg
                    className="w-12 h-12 sm:w-14 sm:h-14"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                ),
                title: "Productos Premium",
                desc: "Utilizamos solo los mejores productos y esmaltes de marcas reconocidas",
              },
              {
                icon: (
                  <svg
                    className="w-12 h-12 sm:w-14 sm:h-14"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                ),
                title: "Resultados Garantizados",
                desc: "Satisfacción total garantizada en cada servicio que realizamos",
              },
            ].map((feature, index) => (
              <div key={index} className="text-center p-4">
                <div className="flex justify-center mb-3 sm:mb-4 text-blue-600 dark:text-blue-400">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Gallery Preview - Mobile First */}
      <section
        id="galeria"
        className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-blue-100 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Nuestros Trabajos
            </h2>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 px-4">
              Una muestra de nuestras creaciones más recientes
            </p>
          </div>

          {/*
            Carousel: muestra 4 por vista (desktop), desplazable horizontalmente,
            animaciones al pasar el mouse y lightbox/tap para ver la foto.
            Ahora usando datos dinámicos de la base de datos.
          */}
          <DynamicGalleryCarousel />
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialCarousel />

      {/* Process Section */}
      <ProcessSection />

      {/* Contact Section - Mobile First */}
      <section
        id="contacto"
        className="py-12 sm:py-16 md:py-20 bg-white dark:bg-gray-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                Visítanos
              </h2>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Dirección
                    </p>
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                      <a
                        href="https://maps.app.goo.gl/nBPRvXugQ7N1BECY7"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Calle Cuba #9A, Olivos 1, SSP.
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Teléfono
                    </p>
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                      <a
                        href="https://wa.me/+5363233073?text=Hola%20Quiero%20reservar%20una%20cita"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        +5 (363) 233-073
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Horarios
                    </p>
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                      Mart - Sáb: 8:30 AM - 6:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-600 p-6 sm:p-8 rounded-2xl text-white shadow-2xl">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                ¿Lista para tu nueva manicure?
              </h3>
              <p className="text-sm sm:text-base mb-4 sm:mb-6 text-blue-50">
                Agenda tu cita hoy y descubre por qué somos el salón favorito de
                la ciudad
              </p>
              <Link href="/reserva">
                <Button
                  variant="outlined-primary"
                  size="lg"
                  className="text-sm sm:text-base bg-white text-blue-600 border-white hover:bg-blue-50 hover:text-blue-700"
                >
                  Reservar Ahora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Mobile First */}
      <footer className="bg-gray-800 dark:bg-gray-950 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center justify-start sm:justify-center space-x-2 mb-3 sm:mb-4">
                <div className="relative w-28 h-28 flex-shrink-0 overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="Oh`Diosa Salón Logo"
                    height={72}
                    width={72}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base text-white">
                Enlaces Rápidos
              </h4>
              <ul className="space-y-1 sm:space-y-2 text-gray-300 dark:text-gray-400 text-sm sm:text-base">
                <li>
                  <Link
                    href="#servicios"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Servicios
                  </Link>
                </li>
                <li>
                  <Link
                    href="#galeria"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Galería
                  </Link>
                </li>
                <li>
                  <Link
                    href="/reserva"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Reservas
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base text-white">
                Síguenos
              </h4>
              <div className="flex space-x-3 sm:space-x-4">
                {/* Facebook */}
                <a
                  href="https://www.facebook.com/sandra.puerto.sanchez.2025"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-blue-500 transition-colors duration-300 transform hover:scale-110"
                  aria-label="Síguenos en Facebook"
                >
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/sandrapuertos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-pink-500 transition-colors duration-300 transform hover:scale-110"
                  aria-label="Síguenos en Instagram"
                >
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/+5363233073?text=Hola%20Quiero%20reservar%20una%20cita"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-green-500 transition-colors duration-300 transform hover:scale-110"
                  aria-label="Contáctanos por WhatsApp"
                >
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-300 dark:text-gray-400 text-xs sm:text-sm">
            <p>&copy; 2025 Oh`Diosa Salón. Todos los derechos reservados.</p>
            <Link
              href="/admin"
              className="text-gray-500 dark:text-gray-600 hover:text-gray-400 mt-2 inline-block"
            >
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
