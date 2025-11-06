"use client";
import { useState, useEffect } from "react";
import { Servicio, ImageData } from "@/lib/types";

export default function DynamicServicesSection() {
  const [servicios, setServicios] = useState<(Servicio & { imagen?: ImageData })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServicios();
  }, []);

  const loadServicios = async () => {
    try {
      const [resServicios, resImagenes] = await Promise.all([
        fetch("/api/servicios"),
        fetch("/api/imagenes"),
      ]);

      if (resServicios.ok && resImagenes.ok) {
        const dataServicios = await resServicios.json();
        const dataImagenes = await resImagenes.json();

        if (dataServicios.success && dataImagenes.success) {
          const serviciosActivos = dataServicios.data.filter((s: Servicio) => s.activo);
          
          // Map servicios with their images
          const serviciosConImagenes = serviciosActivos.map((servicio: Servicio) => {
            const imagen = dataImagenes.data.find((img: ImageData) => img._id === servicio.imagenId);
            return {
              ...servicio,
              imagen,
            };
          });

          setServicios(serviciosConImagenes);
        }
      }
    } catch (error) {
      console.error("Error cargando servicios:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section
        id="servicios"
        className="py-12 sm:py-16 md:py-20 bg-white/50 dark:bg-gray-800/30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Nuestros Servicios
            </h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 dark:border-blue-400 border-t-transparent"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (servicios.length === 0) {
    return null; // No mostrar la sección si no hay servicios
  }

  return (
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
          {servicios.map((servicio) => (
            <div
              key={servicio._id}
              className="group relative rounded-2xl overflow-hidden transition-all duration-500 transform-gpu will-change-transform hover:scale-105 hover:-translate-y-2 hover:shadow-2xl cursor-pointer h-64 sm:h-72 lg:h-80"
              style={{
                backgroundImage:
                  servicio.imagen?.blobUrl ?
                    `url('${servicio.imagen.blobUrl}')`
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundColor: "#667eea",
              }}
            >
              {/* decorative sparkle that appears on hover */}
              <svg
                className="absolute top-3 right-3 w-8 h-8 text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400 drop-shadow-lg z-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
              </svg>

              {/* Text container with blur background - expands on hover/tap */}
              <div className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-white/20 dark:bg-black/30 px-4 sm:px-5 lg:px-6 py-3 sm:py-4 transition-all duration-500 group-hover:py-5 group-hover:sm:py-6 group-hover:backdrop-blur-lg group-hover:bg-white/30 dark:group-hover:bg-black/40 group-active:py-5 group-active:sm:py-6">
                {/* Título - siempre visible */}
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white drop-shadow-lg mb-0 group-hover:mb-2 group-active:mb-2 transition-all duration-300">
                  {servicio.nombre}
                </h3>

                {/* Descripción - se muestra en hover/tap con animación */}
                <p className="text-sm sm:text-base text-white/95 drop-shadow-md leading-relaxed max-h-0 opacity-0 overflow-hidden group-hover:max-h-32 group-hover:opacity-100 group-active:max-h-32 group-active:opacity-100 transition-all duration-500 ease-in-out">
                  {servicio.descripcion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
