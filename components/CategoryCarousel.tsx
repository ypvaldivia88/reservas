"use client";
import { useEffect, useState, useRef, memo, useCallback } from "react";
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
    const [fullscreenIndex, setFullscreenIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);

    // Paginación: cargar imágenes progresivamente
    const IMAGES_PER_PAGE = 5;
    const [loadedCount, setLoadedCount] = useState(IMAGES_PER_PAGE);
    const visibleImages = images.slice(0, loadedCount);
    const hasMore = loadedCount < images.length;

    // Touch/Mouse drag state
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [dragDistance, setDragDistance] = useState(0);

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

    const totalSlides = Math.ceil(visibleImages.length / imagesPerSlide);

    const nextSlide = useCallback(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, [totalSlides]);

    const prevSlide = useCallback(() => {
      setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    }, [totalSlides]);

    const nextFullscreenSlide = useCallback(() => {
      setFullscreenIndex((prev) => (prev + 1) % images.length);
      setFullscreenImage(images[(fullscreenIndex + 1) % images.length]);
    }, [images, fullscreenIndex]);

    const prevFullscreenSlide = useCallback(() => {
      const newIndex = (fullscreenIndex - 1 + images.length) % images.length;
      setFullscreenIndex(newIndex);
      setFullscreenImage(images[newIndex]);
    }, [images, fullscreenIndex]);

    const getCurrentImages = () => {
      const start = currentIndex * imagesPerSlide;
      return visibleImages.slice(start, start + imagesPerSlide);
    };

    const handleImageClick = (imagen: ImageData, index?: number) => {
      const imageIndex =
        index ?? images.findIndex((img) => img._id === imagen._id);
      setFullscreenIndex(imageIndex);
      setFullscreenImage(imagen);
    };

    const handleSelectDesign = (imagen: ImageData, e: React.MouseEvent) => {
      e.stopPropagation();
      if (onImageSelect) {
        onImageSelect(imagen);
      }
    };

    // Función para cargar más imágenes
    const loadMoreImages = useCallback(() => {
      setLoadedCount((prev) => Math.min(prev + IMAGES_PER_PAGE, images.length));
    }, [images.length]);

    // Touch/Mouse drag handlers for main carousel
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(true);
      const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
      setStartX(pageX);
      setScrollLeft(0);
      setDragDistance(0);
    };

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
      const distance = pageX - startX;
      setDragDistance(distance);
    };

    const handleDragEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);

      // Threshold for swipe (30% of container width)
      const threshold =
        containerRef.current ? containerRef.current.offsetWidth * 0.3 : 100;

      if (Math.abs(dragDistance) > threshold) {
        if (dragDistance > 0) {
          prevSlide();
        } else {
          nextSlide();
        }
      }

      setDragDistance(0);
    };

    // Touch/Mouse drag handlers for fullscreen carousel
    const handleFullscreenDragStart = (
      e: React.MouseEvent | React.TouchEvent
    ) => {
      if (!fullscreenImage) return;
      setIsDragging(true);
      const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
      setStartX(pageX);
      setScrollLeft(0);
      setDragDistance(0);
    };

    const handleFullscreenDragMove = (
      e: React.MouseEvent | React.TouchEvent
    ) => {
      if (!isDragging || !fullscreenImage) return;
      e.preventDefault();

      const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
      const distance = pageX - startX;
      setDragDistance(distance);
    };

    const handleFullscreenDragEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);

      const threshold = 50; // 50px threshold for fullscreen

      if (Math.abs(dragDistance) > threshold) {
        if (dragDistance > 0) {
          prevFullscreenSlide();
        } else {
          nextFullscreenSlide();
        }
      }

      setDragDistance(0);
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
        {/* Carousel container - Single image with drag support */}
        <div
          ref={containerRef}
          className="max-w-md mx-auto relative"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          style={{
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
            touchAction: "pan-y pinch-zoom",
          }}
        >
          <div
            className="transition-transform duration-300 ease-out"
            style={{
              transform:
                isDragging ? `translateX(${dragDistance}px)` : "translateX(0)",
            }}
          >
            {getCurrentImages().map((imagen, idx) => {
              const absoluteIdx = currentIndex * imagesPerSlide + idx;
              const isVisible =
                absoluteIdx >= currentIndex * imagesPerSlide - imagesPerSlide &&
                absoluteIdx <=
                  currentIndex * imagesPerSlide + imagesPerSlide * 2 - 1;

              return (
                <div
                  key={imagen._id}
                  className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden group"
                >
                  {/* Image - Clickable for fullscreen */}
                  <div
                    className="relative aspect-square cursor-pointer"
                    onClick={() =>
                      !isDragging && handleImageClick(imagen, absoluteIdx)
                    }
                  >
                    <Image
                      src={imagen.blobUrl}
                      alt={imagen.titulo || imagen.nombre}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      loading={isVisible ? "eager" : "lazy"}
                      priority={isVisible}
                      quality={60}
                      draggable={false}
                    />

                    {/* Info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 via-30% to-transparent p-4 pt-12">
                      <h4 className="font-semibold text-white text-sm mb-1 line-clamp-1">
                        {imagen.titulo || imagen.nombre}
                      </h4>
                      {imagen.descripcion && (
                        <p className="text-xs text-gray-200 line-clamp-1 mb-3">
                          {imagen.descripcion}
                        </p>
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
              );
            })}
          </div>

          {/* Navigation Arrows - Outside card, centered vertically */}
          {totalSlides > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow-xl backdrop-blur-sm"
                aria-label="Anterior"
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
                    strokeWidth={3}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow-xl backdrop-blur-sm"
                aria-label="Siguiente"
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
                    strokeWidth={3}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* Slide counter */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                <span className="text-xs font-bold text-white bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-lg">
                  {currentIndex + 1} / {totalSlides}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={loadMoreImages}
              className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-lg inline-flex items-center gap-2"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Ver más diseños ({images.length - loadedCount} restantes)
            </button>
          </div>
        )}

        {/* Fullscreen Modal with drag support */}
        {fullscreenImage && (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenImage(null);
              }}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm z-20"
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

            {/* Navigation Arrows for fullscreen */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevFullscreenSlide();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow-xl backdrop-blur-sm"
                  aria-label="Anterior"
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextFullscreenSlide();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow-xl backdrop-blur-sm"
                  aria-label="Siguiente"
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* Slide counter for fullscreen */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                  <span className="text-sm font-bold text-white bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm shadow-lg">
                    {fullscreenIndex + 1} / {images.length}
                  </span>
                </div>
              </>
            )}

            <div
              ref={fullscreenContainerRef}
              className="relative w-full h-full max-w-6xl flex flex-col items-center justify-center gap-4"
              onMouseDown={handleFullscreenDragStart}
              onMouseMove={handleFullscreenDragMove}
              onMouseUp={handleFullscreenDragEnd}
              onMouseLeave={handleFullscreenDragEnd}
              onTouchStart={handleFullscreenDragStart}
              onTouchMove={handleFullscreenDragMove}
              onTouchEnd={handleFullscreenDragEnd}
              onClick={(e) => e.stopPropagation()}
              style={{
                cursor: isDragging ? "grabbing" : "grab",
                userSelect: "none",
                touchAction: "pan-y pinch-zoom",
              }}
            >
              {/* Imagen en fullscreen with drag effect */}
              <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
                <div
                  className="relative w-full h-full transition-transform duration-300 ease-out"
                  style={{
                    transform:
                      isDragging ?
                        `translateX(${dragDistance}px)`
                      : "translateX(0)",
                  }}
                >
                  <Image
                    src={fullscreenImage.blobUrl}
                    alt={fullscreenImage.titulo || fullscreenImage.nombre}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                    quality={85}
                    draggable={false}
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
