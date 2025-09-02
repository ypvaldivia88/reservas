import Link from "next/link";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import StatsSection from "@/components/StatsSection";
import ProcessSection from "@/components/ProcessSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">💅</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Nail Studio</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link
                href="#servicios"
                className="text-gray-700 hover:text-blue-700 transition-colors font-medium"
              >
                Servicios
              </Link>
              <Link
                href="#galeria"
                className="text-gray-700 hover:text-blue-700 transition-colors font-medium"
              >
                Galería
              </Link>
              <Link
                href="#contacto"
                className="text-gray-700 hover:text-blue-700 transition-colors font-medium"
              >
                Contacto
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Belleza en tus
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                Manos
              </span>
            </h1>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl mx-auto">
              Descubre la excelencia en el cuidado de uñas. Diseños únicos,
              técnicas profesionales y la mejor atención para que luzcas
              radiante.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/reserva"
                className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
              >
                ✨ Reservar Cita
              </Link>
              <button className="border-2 border-blue-400 text-blue-700 px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-50 transition-colors duration-300">
                📞 Llamar Ahora
              </button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 text-blue-300 text-6xl opacity-50 animate-bounce">
          💎
        </div>
        <div className="absolute bottom-20 right-10 text-violet-300 text-4xl opacity-50 animate-pulse">
          ✨
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Ofrecemos una amplia gama de servicios para el cuidado y
              embellecimiento de tus uñas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: "💅",
                title: "Manicure Clásico",
                desc: "Cuidado completo de manos y uñas",
              },
              {
                icon: "🎨",
                title: "Nail Art",
                desc: "Diseños personalizados y únicos",
              },
              {
                icon: "✨",
                title: "Gel/Acrílico",
                desc: "Extensiones duraderas y naturales",
              },
              {
                icon: "🌟",
                title: "Spa de Manos",
                desc: "Tratamiento relajante y nutritivo",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-center"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-700">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegirnos?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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
              <div key={index} className="text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-700">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Gallery Preview */}
      <section
        id="galeria"
        className="py-20 bg-gradient-to-r from-blue-100 to-violet-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestros Trabajos
            </h2>
            <p className="text-gray-700">
              Una muestra de nuestras creaciones más recientes
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gradient-to-br from-blue-300 to-violet-400 rounded-lg flex items-center justify-center text-white text-2xl">
                  💅
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button className="bg-white text-blue-700 px-6 py-3 rounded-full font-semibold hover:shadow-md transition-shadow">
              Ver Más Trabajos
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialCarousel />

      {/* Process Section */}
      <ProcessSection />

      {/* Contact Section */}
      <section id="contacto" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Visítanos
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="font-semibold">Dirección</p>
                    <p className="text-gray-700">Calle Principal 123, Centro</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📞</span>
                  <div>
                    <p className="font-semibold">Teléfono</p>
                    <p className="text-gray-700">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🕒</span>
                  <div>
                    <p className="font-semibold">Horarios</p>
                    <p className="text-gray-700">
                      Lun - Sáb: 9:00 AM - 7:00 PM
                    </p>
                    <p className="text-gray-700">Dom: 10:00 AM - 5:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-violet-600 p-8 rounded-2xl text-white">
              <h3 className="text-2xl font-bold mb-4">
                ¿Lista para tu nueva manicure?
              </h3>
              <p className="mb-6">
                Agenda tu cita hoy y descubre por qué somos el salón favorito de
                la ciudad
              </p>
              <Link
                href="/reserva"
                className="bg-white text-blue-700 px-6 py-3 rounded-full font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 inline-block"
              >
                Reservar Ahora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">💅</span>
                </div>
                <h3 className="text-xl font-bold">Nail Studio</h3>
              </div>
              <p className="text-gray-400">
                Tu salón de confianza para el cuidado profesional de uñas
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#servicios" className="hover:text-blue-400">
                    Servicios
                  </Link>
                </li>
                <li>
                  <Link href="#galeria" className="hover:text-blue-400">
                    Galería
                  </Link>
                </li>
                <li>
                  <Link href="/reserva" className="hover:text-blue-400">
                    Reservas
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Síguenos</h4>
              <div className="flex space-x-4">
                <span className="text-2xl cursor-pointer hover:text-blue-400">
                  📘
                </span>
                <span className="text-2xl cursor-pointer hover:text-blue-400">
                  📷
                </span>
                <span className="text-2xl cursor-pointer hover:text-blue-400">
                  🐦
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Nail Studio. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
