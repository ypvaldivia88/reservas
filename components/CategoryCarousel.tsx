"use client";
import { useEffect, useState, useRef, memo } from "react";
import { ImageData } from "@/lib/types";
import Image from "next/image";

interface CategoryCarouselProps {
  images: ImageData[];
  categoryName: string;
  onImageSelect?: (image: ImageData) => void;
}

const CategoryCarousel = memo(
  ({ images, categoryName, onImageSelect }: CategoryCarouselProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imagesPerSlide, setImagesPerSlide] = useState(1);
    const [fullscreenImage, setFullscreenImage] = useState<ImageData | null>(
      null
    );
    const containerRef = useRef<HTMLDivElement>(null);

    // Detectar tamaño de pantalla para ajustar imágenes por slide
    useEffect(() => {
      const updateImagesPerSlide = () => {
        if (typeof window !== "undefined") {
          const width = window.innerWidth;
          // Siempre mostrar 1 imagen a la vez (mobile-first)
          setImagesPerSlide(1);
        }
      };

      updateImagesPerSlide();
      window.addEventListener("resize", updateImagesPerSlide);
      return () => window.removeEventListener("resize", updateImagesPerSlide);
    }, []);

    const totalSlides = Math.ceil(images.length / imagesPerSlide);

    const nextSlide = () => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    };

    const prevSlide = () => {
      setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    const getCurrentImages = () => {
      const start = currentIndex * imagesPerSlide;
      return images.slice(start, start + imagesPerSlide);
    };

    const handleImageClick = (imagen: ImageData) => {
      setFullscreenImage(imagen);
    };

    const handleSelectDesign = (imagen: ImageData, e: React.MouseEvent) => {
      e.stopPropagation();
      if (onImageSelect) {
        onImageSelect(imagen);
      }
    };

    if (images.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay imágenes en esta categoría
        </div>
      );
    }

    return (
      <div className="relative">
        {/* Carousel container - Single image */}
        <div className="max-w-md mx-auto">
          {getCurrentImages().map((imagen) => (
            <div
              key={imagen._id}
              className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden group"
            >
              {/* Image - Clickable for fullscreen */}
              <div
                className="relative aspect-square cursor-pointer"
                onClick={() => handleImageClick(imagen)}
              >
                <Image
                  src={imagen.blobUrl}
                  alt={imagen.titulo || imagen.nombre}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading="lazy"
                  quality={75}
                />

                {/* Info overlay con blur progresivo más sutil */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 via-30% to-transparent p-4 pt-12">
                  <h4 className="font-semibold text-white text-sm mb-1 line-clamp-1">
                    {imagen.titulo || imagen.nombre}
                  </h4>
                  {imagen.descripcion && (
                    <p className="text-xs text-gray-200 line-clamp-1 mb-3">
                      {imagen.descripcion}
                    </p>
                  )}

                  {/* Navigation Controls - Inside card */}
                  {totalSlides > 1 && (
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          prevSlide();
                        }}
                        className="flex-shrink-0 p-2 rounded-full bg-white/90 hover:bg-white text-gray-900 transition-all shadow-lg backdrop-blur-sm"
                        aria-label="Anterior"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>

                      <div className="flex-1 text-center">
                        <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                          {currentIndex + 1} / {totalSlides}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextSlide();
                        }}
                        className="flex-shrink-0 p-2 rounded-full bg-white/90 hover:bg-white text-gray-900 transition-all shadow-lg backdrop-blur-sm"
                        aria-label="Siguiente"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Select Button */}
                  <button
                    type="button"
                    onClick={(e) => handleSelectDesign(imagen, e)}
                    className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Seleccionar Diseño
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fullscreen Modal */}
        {fullscreenImage && (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              type="button"
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm z-10"
              aria-label="Cerrar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="relative w-full h-full max-w-6xl flex flex-col items-center justify-center gap-4">
              {/* Imagen en fullscreen */}
              <div className="relative w-full flex-1 flex items-center justify-center">
                <div className="relative w-full h-full">
                  <Image
                    src={fullscreenImage.blobUrl}
                    alt={fullscreenImage.titulo || fullscreenImage.nombre}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </div>
              </div>

              {/* Info en fullscreen - Más compacta */}
              <div className="w-full max-w-2xl text-center bg-black/60 backdrop-blur-md rounded-xl p-4 flex-shrink-0">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  {fullscreenImage.titulo || fullscreenImage.nombre}
                </h3>
                {fullscreenImage.descripcion && (
                  <p className="text-sm text-gray-300 mb-4">
                    {fullscreenImage.descripcion}
                  </p>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    handleSelectDesign(fullscreenImage, e);
                    setFullscreenImage(null);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg inline-flex items-center gap-2"
                >
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Seleccionar Este Diseño
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CategoryCarousel.displayName = "CategoryCarousel";

export default CategoryCarousel;
