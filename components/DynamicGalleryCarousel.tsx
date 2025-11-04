"use client";
import { useEffect, useRef, useState } from "react";
import { ImageData } from "@/lib/types";
import { base64ToDataURL } from "@/lib/imageUtils";

export default function DynamicGalleryCarousel() {
  const [galleryImages, setGalleryImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // drag state stored in refs to avoid re-renders
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);
  // flag to detect if user actually moved (dragged) — prevents opening on release after drag
  const movedRef = useRef(false);

  useEffect(() => {
    loadGalleryData();
  }, []);

  const loadGalleryData = async () => {
    try {
      const imagenesRes = await fetch("/api/imagenes");

      if (imagenesRes.ok) {
        const imagenesData = await imagenesRes.json();

        if (imagenesData.success) {
          const imagenes: ImageData[] = imagenesData.data;
          
          // Filter images that are marked for dashboard gallery
          const dashboardImages = imagenes.filter(img => img.enGaleriaDashboard);

          setGalleryImages(dashboardImages);
        }
      }
    } catch (error) {
      console.error("Error loading gallery data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const scrollByViewport = (dir: 1 | -1) => {
    const el = carouselRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.9;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  // Pointer (mouse/touch) drag handlers to enable click-and-drag horizontal scroll
  const onPointerDown = (e: React.PointerEvent) => {
    const el = carouselRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    movedRef.current = false; // reset moved flag on new pointer down
    startXRef.current = e.clientX;
    startScrollRef.current = el.scrollLeft;
    (e.target as Element).setPointerCapture(e.pointerId);
    // prevent text/image selection while dragging
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = carouselRef.current;
    if (!el || !isDraggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    // mark as moved if exceed small threshold (prevents click after drag)
    if (Math.abs(dx) > 8) movedRef.current = true;
    // invert movement so dragging left scrolls right and viceversa feels natural
    el.scrollLeft = startScrollRef.current - dx;
  };

  const endDrag = (e?: React.PointerEvent | PointerEvent) => {
    if (e && carouselRef.current && "pointerId" in e && e.pointerId != null) {
      try {
        carouselRef.current.releasePointerCapture(e.pointerId);
      } catch (error) {
        // Silently ignore - pointer may already be released
        console.debug("Failed to release pointer capture:", error);
      }
    }
    isDraggingRef.current = false;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (galleryImages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          No hay trabajos en la galería aún. El administrador puede agregar imágenes desde el panel de control.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {/* Prev / Next */}
        <button
          aria-label="Anterior"
          onClick={() => scrollByViewport(-1)}
          className="hidden md:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm hover:scale-105 transition-transform ml-2"
        >
          ‹
        </button>
        <button
          aria-label="Siguiente"
          onClick={() => scrollByViewport(1)}
          className="hidden md:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm hover:scale-105 transition-transform mr-2"
        >
          ›
        </button>

        {/* Scrollable row */}
        <div className="relative">
          {/* soft fade edges to mask scrollbar/thumb on wide screens */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 hidden md:block bg-gradient-to-r from-white/100 dark:from-gray-900/100" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 hidden md:block bg-gradient-to-l from-white/100 dark:from-gray-900/100" />

          <div
            ref={carouselRef}
            // attach pointer handlers here to enable drag-to-scroll
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={endDrag}
            className="flex gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory px-2 py-2 touch-pan-x"
            style={{ scrollBehavior: "smooth" }}
          >
            {galleryImages.map((imagen) => {
              const imageUrl = base64ToDataURL(imagen.base64Data, imagen.mimeType);

              return (
                <div
                  key={imagen._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    // ignore clicks that are actually drags
                    if (movedRef.current) {
                      movedRef.current = false;
                      return;
                    }
                    setSelected(imageUrl);
                  }}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && setSelected(imageUrl)
                  }
                  className="snap-center flex-shrink-0 group cursor-pointer rounded-2xl overflow-hidden bg-white/5 shadow-sm"
                  style={{
                    minWidth: "clamp(180px, 22vw, calc(25% - 0.75rem))",
                    maxWidth: "clamp(180px, 22vw, 360px)",
                    height: 260,
                  }}
                >
                  <div className="relative w-full h-full">
                    <img
                      src={imageUrl}
                      alt={imagen.titulo || imagen.nombre}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1"
                      onDragStart={(e) => e.preventDefault()} // prevent image drag interfering with carousel drag
                    />
                    {/* overlay CTA visible on hover */}
                    <div className="absolute inset-0 flex items-end justify-center p-3 pointer-events-none">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 text-white text-sm px-3 py-1 rounded-full pointer-events-none">
                        Ver foto
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lightbox modal (mobile tap / desktop click) */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-w-3xl w-full rounded-2xl overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Cerrar"
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center shadow-md hover:scale-105 transition-transform"
            >
              ✕
            </button>
            <div className="relative w-full h-[70vh] sm:h-[60vh] bg-black">
              <img
                src={selected}
                alt="Foto grande"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
