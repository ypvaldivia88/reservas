import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SalonProcessStep } from "@/lib/types";

const DEFAULT_STEPS: SalonProcessStep[] = [
  { title: "Reserva tu cita", description: "Elige tu fecha y hora preferida online o por teléfono" },
  { title: "Consulta personalizada", description: "Conversamos sobre tus gustos y el diseño que deseas" },
  { title: "Servicio profesional", description: "Nuestras expertas trabajarán con los mejores productos" },
  { title: "Resultado perfecto", description: "Sal con unas uñas hermosas que durarán semanas" },
];

interface ProcessSectionProps {
  steps?: SalonProcessStep[];
  title?: string;
  subtitle?: string;
  cta?: string;
  reservaPath?: string;
  primaryColor?: string;
}

export default function ProcessSection({
  steps = DEFAULT_STEPS,
  title = "Nuestro Proceso",
  subtitle = "Un proceso simple y relajante diseñado para brindarte la mejor experiencia",
  cta = "¿Lista para comenzar?",
  reservaPath = "/reserva",
}: ProcessSectionProps) {
  const badgeStyle = {
    background: "linear-gradient(to right, var(--primary), color-mix(in srgb, var(--primary) 80%, transparent))",
  };
  const iconStyle = { color: "var(--primary)" };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center relative border border-gray-100 dark:border-gray-700">
                <div
                  className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-primary-foreground font-bold text-xs sm:text-sm"
                  style={badgeStyle}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="mb-3 sm:mb-4 mt-3 sm:mt-4 flex justify-center">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10"
                    style={iconStyle}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-2">
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
            {cta}
          </p>
          <Link href={reservaPath}>
            <Button variant="outlined-primary" size="lg" className="text-sm sm:text-base lg:text-lg">
              Iniciar mi Proceso
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
