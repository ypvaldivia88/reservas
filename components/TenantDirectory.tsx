import Image from "next/image";
import Link from "next/link";
import { SalonDirectoryItem } from "@/lib/types";

interface TenantDirectoryProps {
  salons: SalonDirectoryItem[];
}

export default function TenantDirectory({ salons }: TenantDirectoryProps) {
  if (salons.length === 0) {
    return null;
  }

  return (
    <section id="salones" className="py-16 sm:py-20 bg-white dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Salones en la plataforma
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explora los salones registrados y accede directamente a su página o
            reserva una cita.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {salons.map((salon) => (
            <article
              key={salon.slug}
              className="group flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className="h-2"
                style={{
                  background: `linear-gradient(to right, ${salon.primaryColor}, ${salon.secondaryColor})`,
                }}
              />

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start gap-4 mb-4">
                  {salon.logoUrl ? (
                    <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <Image
                        src={salon.logoUrl}
                        alt={`Logo de ${salon.nombre}`}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-14 h-14 flex-shrink-0 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                      style={{ background: salon.primaryColor }}
                    >
                      {salon.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {salon.nombre}
                    </h3>
                    <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">
                      {salon.categoryLabel}
                    </p>
                  </div>
                </div>

                {salon.subtitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-2 flex-1">
                    {salon.subtitle}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                  <Link
                    href={`/${salon.slug}`}
                    className="flex-1 text-center px-4 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
                    style={{
                      background: `linear-gradient(to right, ${salon.primaryColor}, ${salon.secondaryColor})`,
                    }}
                  >
                    Ver salón
                  </Link>
                  <Link
                    href={`/reserva?slug=${salon.slug}`}
                    className="flex-1 text-center px-4 py-2.5 rounded-full text-sm font-semibold border-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                    style={{
                      borderColor: salon.primaryColor,
                      color: salon.primaryColor,
                    }}
                  >
                    Reservar
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
