import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ProcessSection() {
  const steps = [
    {
      number: "01",
      title: "Reserva tu cita",
      description: "Elige tu fecha y hora preferida online o por teléfono",
      icon: (
        <svg
          className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto text-blue-600 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      number: "02",
      title: "Consulta personalizada",
      description: "Conversamos sobre tus gustos y el diseño que deseas",
      icon: (
        <svg
          className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto text-blue-600 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Servicio profesional",
      description: "Nuestras expertas trabajarán con los mejores productos",
      icon: (
        <svg
          className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto text-blue-600 dark:text-blue-400"
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
      ),
    },
    {
      number: "04",
      title: "Resultado perfecto",
      description: "Sal con unas uñas hermosas que durarán semanas",
      icon: (
        <svg
          className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto text-blue-600 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Nuestro Proceso
          </h2>
          <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
            Un proceso simple y relajante diseñado para brindarte la mejor
            experiencia
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-400 to-violet-400 dark:from-blue-500 dark:to-violet-500 transform translate-x-4 -translate-y-1/2"></div>
              )}

              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl dark:shadow-gray-900/20 dark:hover:shadow-gray-900/30 transition-all duration-300 text-center relative border border-gray-100 dark:border-gray-700">
                <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-500 dark:to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                  {step.number}
                </div>

                <div className="mb-3 sm:mb-4 mt-3 sm:mt-4 flex justify-center">
                  {step.icon}
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 sm:mt-10 lg:mt-12">
          <p className="text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
            ¿Lista para comenzar tu transformación?
          </p>
          <Link href="/reserva">
            <Button
              variant="outlined-primary"
              size="lg"
              className="text-sm sm:text-base lg:text-lg"
            >
              Iniciar mi Proceso
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
