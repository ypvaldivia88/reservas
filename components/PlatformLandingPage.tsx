import Link from "next/link";
import { Button } from "@/components/ui/Button";

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Reservas en línea",
    description:
      "Tus clientes reservan citas 24/7 desde su móvil. Sin llamadas ni mensajes perdidos.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: "Página web propia",
    description:
      "Cada salón tiene su URL personalizada con servicios, galería y contacto listos para compartir.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    title: "Calendario y agenda",
    description:
      "Gestiona citas, horarios y disponibilidad desde un panel de administración intuitivo.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Base de clientes",
    description:
      "Historial de reservas, datos de contacto y seguimiento de tus clientes frecuentes.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Control financiero",
    description:
      "Registra ingresos, gastos y categorías para tener claridad sobre la salud de tu negocio.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    title: "Personalizable",
    description:
      "Elige plantillas por tipo de negocio, colores, servicios y contenido de tu sitio web.",
  },
];

const steps = [
  {
    number: "1",
    title: "Regístrate gratis",
    description: "Crea tu cuenta en minutos. 14 días de prueba sin tarjeta de crédito.",
  },
  {
    number: "2",
    title: "Configura tu salón",
    description: "Añade servicios, horarios, fotos y datos de contacto desde el panel admin.",
  },
  {
    number: "3",
    title: "Comparte tu enlace",
    description: "Recibe tu URL personalizada y compártela con clientes por WhatsApp o redes.",
  },
];

export default function PlatformLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      {/* Hero */}
      <section className="relative py-16 sm:py-20 md:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-blue-600/10 dark:from-violet-900/20 dark:to-blue-900/20"
          aria-hidden
        />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
            Plataforma de reservas para salones de belleza
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Tu salón online con
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600">
              reservas automáticas
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Crea la página web de tu salón, gestiona citas y comparte un enlace
            único con tus clientes. Todo en un solo lugar, listo en minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/registro" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-blue-600 border-violet-600 hover:from-violet-700 hover:to-blue-700">
                Empezar gratis — 14 días de prueba
              </Button>
            </Link>
            <Link href="/admin" className="w-full sm:w-auto">
              <Button variant="outlined-primary" size="lg" className="w-full sm:w-auto">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funciones" className="py-16 sm:py-20 bg-white dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Todo lo que necesita tu salón
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Una plataforma completa para digitalizar tu negocio y que tus
              clientes reserven cuando quieran.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:shadow-lg transition-shadow"
              >
                <div className="text-violet-600 dark:text-violet-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Cómo funciona?
            </h2>
          </div>
          <div className="space-y-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex gap-6 items-start p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* URL example */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-violet-600 to-blue-600 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Tu salón, tu enlace
          </h2>
          <p className="text-violet-100 mb-8">
            Al registrarte recibes una URL única para compartir con tus clientes:
          </p>
          <div className="bg-white/10 backdrop-blur rounded-xl px-6 py-4 font-mono text-lg sm:text-xl break-all">
            tudominio.com/<span className="text-yellow-300">mi-salon</span>
          </div>
          <p className="text-violet-100 mt-6 text-sm">
            Tus clientes visitan tu página, ven tus servicios y reservan directamente.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            ¿Listo para digitalizar tu salón?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Únete a la plataforma y empieza a recibir reservas hoy mismo.
          </p>
          <Link href="/registro">
            <Button variant="primary" size="lg" className="bg-gradient-to-r from-violet-600 to-blue-600 border-violet-600">
              Crear mi salón gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-gray-950 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                R
              </div>
              <span className="font-semibold">ReservaSalón</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/registro" className="hover:text-white transition-colors">
                Registrar salón
              </Link>
              <Link href="/admin" className="hover:text-white transition-colors">
                Admin
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-400 text-xs sm:text-sm">
            <p>&copy; {new Date().getFullYear()} ReservaSalón. Plataforma de reservas para salones.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
