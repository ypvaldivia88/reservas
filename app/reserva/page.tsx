import Link from "next/link";
import ReservaForm from "@/components/ReservaForm";
import NailShapeGuide from "@/components/NailShapeGuide";
import InspirationGallery from "@/components/InspirationGallery";

export default function ReservaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link
              href="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">💅</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Nail Studio</h1>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link
                href="/"
                className="text-gray-700 hover:text-blue-700 transition-colors font-medium"
              >
                Inicio
              </Link>
              <Link
                href="/#servicios"
                className="text-gray-700 hover:text-blue-700 transition-colors font-medium"
              >
                Servicios
              </Link>
              <Link
                href="/#contacto"
                className="text-gray-700 hover:text-blue-700 transition-colors font-medium"
              >
                Contacto
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
              ✨ Paso 1: Reserva tu cita
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Reserva tu
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                Cita Perfecta
              </span>
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Completa el formulario y agenda tu cita con nuestras
              profesionales. Te contactaremos para confirmar la fecha y hora.
            </p>
          </div>

          {/* Process indicators */}
          <div className="flex justify-center items-center space-x-4 mb-12">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                1
              </div>
              <span className="ml-2 text-blue-700 font-medium">Reserva</span>
            </div>
            <div className="w-12 h-0.5 bg-blue-200"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">
                2
              </div>
              <span className="ml-2 text-gray-500">Confirmación</span>
            </div>
            <div className="w-12 h-0.5 bg-blue-200"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">
                3
              </div>
              <span className="ml-2 text-gray-500">¡Disfruta!</span>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <ReservaForm />
        </div>
      </section>

      {/* Nail Shape Guide */}
      <NailShapeGuide />

      {/* Inspiration Gallery */}
      <InspirationGallery />

      {/* Benefits Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Por qué reservar con nosotros?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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
              <div
                key={index}
                className="text-center bg-white p-6 rounded-2xl shadow-lg"
              >
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-700">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-violet-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">¿Necesitas ayuda?</h2>
          <p className="text-xl mb-8 opacity-90">
            Si tienes alguna pregunta o prefieres reservar por teléfono, no
            dudes en contactarnos
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📞</span>
              <div className="text-left">
                <p className="font-semibold">Llámanos</p>
                <p className="opacity-90">+1 (555) 123-4567</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-2xl">💬</span>
              <div className="text-left">
                <p className="font-semibold">WhatsApp</p>
                <p className="opacity-90">Respuesta inmediata</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-2xl">🕒</span>
              <div className="text-left">
                <p className="font-semibold">Horarios</p>
                <p className="opacity-90">Lun-Sáb: 9AM-7PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">💅</span>
            </div>
            <h3 className="text-xl font-bold">Nail Studio</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Tu salón de confianza para el cuidado profesional de uñas
          </p>
          <p className="text-gray-500 text-sm">
            &copy; 2025 Nail Studio. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
