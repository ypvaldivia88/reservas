import Link from "next/link";
import ReservaForm from "@/components/ReservaForm";
import NailShapeGuide from "@/components/NailShapeGuide";
import InspirationGallery from "@/components/InspirationGallery";
import Header from "@/components/Header";

export default function ReservaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      {/* Header */}
      <Header isHomePage={false} />

      {/* Hero Section - Mobile First */}
      <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 sm:mb-8">
            <span className="inline-flex items-center px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              ✨ Paso 1: Reserva tu cita
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
              Reserva tu
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                Cita Perfecta
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto px-2">
              Completa el formulario y agenda tu cita con nuestras
              profesionales. Te contactaremos para confirmar la fecha y hora.
            </p>
          </div>

          {/* Process indicators - Mobile First */}
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-8 sm:mb-12">
            <div className="flex items-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                1
              </div>
              <span className="ml-2 text-blue-700 dark:text-blue-400 font-medium text-sm sm:text-base">
                Reserva
              </span>
            </div>
            <div className="w-8 sm:w-12 h-0.5 bg-blue-200 dark:bg-blue-700 rotate-90 sm:rotate-0"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-200 dark:bg-blue-700 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-bold">
                2
              </div>
              <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                Confirmación
              </span>
            </div>
            <div className="w-8 sm:w-12 h-0.5 bg-blue-200 dark:bg-blue-700 rotate-90 sm:rotate-0"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-200 dark:bg-blue-700 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-bold">
                3
              </div>
              <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                ¡Disfruta!
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section - Mobile First */}
      <section className="pb-12 sm:pb-16 md:pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <ReservaForm />
        </div>
      </section>

      {/* Nail Shape Guide */}
      <NailShapeGuide />

      {/* Inspiration Gallery */}
      <InspirationGallery />

      {/* Benefits Section - Mobile First */}
      <section className="py-12 sm:py-16 bg-white/50 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              ¿Por qué reservar con nosotros?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
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
                className="text-center bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg card-hover"
              >
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section - Mobile First */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-blue-600 to-violet-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
            ¿Necesitas ayuda?
          </h2>
          <p className="text-base sm:text-xl mb-6 sm:mb-8 opacity-90 px-4">
            Si tienes alguna pregunta o prefieres reservar por teléfono, no
            dudes en contactarnos
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <div className="flex items-center space-x-3">
              <span className="text-xl sm:text-2xl">📞</span>
              <div className="text-left">
                <p className="font-semibold text-sm sm:text-base">Llámanos</p>
                <p className="opacity-90 text-sm sm:text-base">
                  +1 (555) 123-4567
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xl sm:text-2xl">💬</span>
              <div className="text-left">
                <p className="font-semibold text-sm sm:text-base">WhatsApp</p>
                <p className="opacity-90 text-sm sm:text-base">
                  Respuesta inmediata
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xl sm:text-2xl">🕒</span>
              <div className="text-left">
                <p className="font-semibold text-sm sm:text-base">Horarios</p>
                <p className="opacity-90 text-sm sm:text-base">
                  Lun-Sáb: 9AM-7PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Mobile First */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-base">
                💅
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold">Nail Studio</h3>
          </div>
          <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
            Tu salón de confianza para el cuidado profesional de uñas
          </p>
          <p className="text-gray-500 text-xs sm:text-sm">
            &copy; 2025 Nail Studio. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
