import Link from "next/link";
import Image from "next/image";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import StatsSection from "@/components/StatsSection";
import ProcessSection from "@/components/ProcessSection";
import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      {/* Header */}
      <Header isHomePage={true} />

      {/* Hero Section - Mobile First */}
      <section className="relative py-12 px-4 sm:py-16 md:py-20 lg:py-24 bg-[url('/main.avif')] bg-center bg-cover bg-no-repeat">
        {/* overlay to improve text contrast */}
        <div
          className="absolute inset-0 bg-black/75 dark:bg-black/75"
          aria-hidden
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            {/* Mobile: text-3xl, SM: text-4xl, MD: text-5xl, LG: text-6xl, XL: text-7xl */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
              Belleza en tus
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                Manos
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 sm:mb-10 md:mb-12 max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-2">
              Descubre la excelencia en el cuidado de uñas. Diseños únicos,
              técnicas profesionales y la mejor atención para que luzcas
              radiante.
            </p>

            {/* Mobile-first button layout */}
            <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:space-y-0 md:space-x-4 lg:space-x-6 justify-center items-center px-4 sm:px-6">
              <Link
                href="/reserva"
                className="w-full sm:w-72 bg-gradient-to-r from-blue-600 to-violet-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-center"
              >
                ✨ Reservar Cita
              </Link>
              <a
                href="https://wa.me/+5363233073?text=Hola%20Quiero%20reservar%20una%20cita"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-72 border-2 border-green-400 dark:border-green-500 text-green-700 dark:text-green-400 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-300 text-center"
              >
                <svg
                  className="w-5 h-5 inline-block mr-2 mb-1 align-middle text-white dark:text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.09 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12 1.05.37 2.07.74 3.03a2 2 0 0 1-.45 2.11L9.91 10.09a16 16 0 0 0 6 6l1.22-1.22a2 2 0 0 1 2.11-.45c.96.37 1.98.62 3.03.74A2 2 0 0 1 22 16.92z" />
                </svg>{" "}
                Llamar / WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Decorative elements - Hidden on mobile, visible on larger screens */}
        <div className="hidden md:block absolute top-20 left-4 lg:left-10 text-blue-300 dark:text-blue-400 text-4xl lg:text-6xl opacity-50 animate-bounce">
          💎
        </div>
        <div className="hidden md:block absolute bottom-20 right-4 lg:right-10 text-violet-300 dark:text-violet-400 text-3xl lg:text-4xl opacity-50 animate-pulse">
          ✨
        </div>
      </section>

      {/* Services Section - Mobile First */}
      <section
        id="servicios"
        className="py-12 sm:py-16 md:py-20 bg-white/50 dark:bg-gray-800/30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 max-w-2xl mx-auto px-4">
              Ofrecemos una amplia gama de servicios para el cuidado y
              embellecimiento de tus uñas
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                icon: "✨",
                title: "Gel/Softgel",
                desc: "Tratamiento relajante y nutritivo",
                fondo: "gel.png",
              },
              {
                icon: "💅",
                title: "Manicure Clásico",
                desc: "Cuidado completo de manos y uñas",
                fondo: "manicure.png",
              },
              {
                icon: "🎨",
                title: "Nail Art",
                desc: "Diseños personalizados y únicos",
                fondo: "nailart.png",
              },
              {
                icon: "🌟",
                title: "Spa de Pies",
                desc: "Tratamiento relajante y nutritivo",
                fondo: "spa.png",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="relative rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-center overflow-hidden"
                style={{
                  backgroundImage: `url('/servicios/${service.fondo}')`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundColor: "#fff",
                }}
              >
                {/* overlay to improve text contrast */}
                <div
                  className="absolute inset-0 bg-black/40 dark:bg-black/50"
                  aria-hidden
                />
                <div className="p-4 sm:p-6 relative z-10">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">
                    {service.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm sm:text-base text-white/90">
                    {service.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                icon: "👩‍🎨",
                title: "Profesionales Expertas",
                desc: "Nuestro equipo cuenta con años de experiencia y certificaciones profesionales",
              },
              {
                icon: "🧴",
                title: "Productos Premium",
                desc: "Utilizamos solo los mejores productos y esmaltes de marcas reconocidas",
              },
              {
                icon: "🏆",
                title: "Resultados Garantizados",
                desc: "Satisfacción total garantizada en cada servicio que realizamos",
              },
            ].map((feature, index) => (
              <div key={index} className="text-center p-4">
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">
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
        className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30"
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-md hover:shadow-lg transition-shadow card-hover"
              >
                <div className="aspect-square bg-gradient-to-br from-blue-300 to-violet-400 dark:from-blue-600 dark:to-violet-600 rounded-lg flex items-center justify-center text-white text-xl sm:text-2xl">
                  💅
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6 sm:mt-8">
            <button className="bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold hover:shadow-md transition-shadow text-sm sm:text-base">
              Ver Más Trabajos
            </button>
          </div>
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
                  <span className="text-xl sm:text-2xl">📍</span>
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
                  <span className="text-xl sm:text-2xl">📞</span>
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
                  <span className="text-xl sm:text-2xl">🕒</span>
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

            <div className="bg-gradient-to-br from-blue-600 to-violet-600 p-6 sm:p-8 rounded-2xl text-white">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                ¿Lista para tu nueva manicure?
              </h3>
              <p className="text-sm sm:text-base mb-4 sm:mb-6">
                Agenda tu cita hoy y descubre por qué somos el salón favorito de
                la ciudad
              </p>
              <Link
                href="/reserva"
                className="bg-white text-blue-700 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 inline-block text-sm sm:text-base"
              >
                Reservar Ahora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Mobile First */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center justify-start sm:justify-center space-x-2 mb-3 sm:mb-4">
                <div className="relative w-28 h-28 flex-shrink-0 overflow-hidden">
                  <Image src="/logo.png" alt="Nail Studio Logo" fill />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                Enlaces Rápidos
              </h4>
              <ul className="space-y-1 sm:space-y-2 text-gray-400 text-sm sm:text-base">
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
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                Síguenos
              </h4>
              <div className="flex space-x-3 sm:space-x-4">
                <span className="text-xl sm:text-2xl cursor-pointer hover:text-blue-400 transition-colors">
                  📘
                </span>
                <span className="text-xl sm:text-2xl cursor-pointer hover:text-blue-400 transition-colors">
                  📷
                </span>
                <span className="text-xl sm:text-2xl cursor-pointer hover:text-blue-400 transition-colors">
                  🐦
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 dark:border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400 text-xs sm:text-sm">
            <p>&copy; 2025 Nail Studio. Todos los derechos reservados.</p>
            <Link
              href="/admin"
              className="text-gray-600 hover:text-gray-400 mt-2 inline-block"
            >
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
