"use client";
import { useEffect, useState, useRef } from "react";
import { ImageData, Categoria } from "@/lib/types";
import Image from "next/image";

interface CategoryCarouselProps {
  images: ImageData[];
  categoryName: string;
  onImageSelect?: (image: ImageData) => void;
}

const CategoryCarousel = ({ images, categoryName, onImageSelect }: CategoryCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesPerSlide, setImagesPerSlide] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detectar tamaño de pantalla para ajustar imágenes por slide
  useEffect(() => {
    const updateImagesPerSlide = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width < 640) {
          setImagesPerSlide(1); // Mobile
        } else if (width < 1024) {
          setImagesPerSlide(2); // Tablet
        } else {
          setImagesPerSlide(3); // Desktop
        }
      }
    };

    updateImagesPerSlide();
    window.addEventListener('resize', updateImagesPerSlide);
    return () => window.removeEventListener('resize', updateImagesPerSlide);
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

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No hay imágenes en esta categoría
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Carousel container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {getCurrentImages().map((imagen) => (
          <button
            key={imagen._id}
            type="button"
            onClick={() => onImageSelect && onImageSelect(imagen)}
            className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer text-left"
          >
            {/* Image */}
            <div className="relative aspect-square">
              <Image
                src={imagen.blobUrl}
                alt={imagen.titulo || imagen.nombre}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            {/* Info overlay */}
            <div className="p-3 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent absolute bottom-0 left-0 right-0 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <h4 className="font-semibold text-white text-sm mb-1">
                {imagen.titulo || imagen.nombre}
              </h4>
              {imagen.descripcion && (
                <p className="text-xs text-gray-200 line-clamp-2">
                  {imagen.descripcion}
                </p>
              )}
              <span className="inline-block mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                ✓ Seleccionar
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Navigation */}
      {totalSlides > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              prevSlide();
            }}
            className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Anterior"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Dots indicator */}
          <div className="flex gap-2">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentIndex(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-blue-600 w-6"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                aria-label={`Ir a grupo ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              nextSlide();
            }}
            className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Siguiente"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Counter */}
      <div className="text-center mt-3 text-sm text-gray-600 dark:text-gray-400">
        Mostrando {getCurrentImages().length} de {images.length} diseños
      </div>
    </div>
  );
};

interface AccordionItemProps {
  categoria: Categoria;
  images: ImageData[];
  isOpen: boolean;
  onToggle: () => void;
  onImageSelect?: (image: ImageData) => void;
}

const AccordionItem = ({
  categoria,
  images,
  isOpen,
  onToggle,
  onImageSelect,
}: AccordionItemProps) => {
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Accordion Header */}
      <button
        onClick={handleToggle}
        type="button"
        className="w-full px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-gray-800 dark:to-gray-800 hover:from-blue-100 hover:to-violet-100 dark:hover:from-gray-700 dark:hover:to-gray-700 transition-colors flex items-center justify-between group"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold">
            {images.length}
          </div>
          <div className="text-left">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {categoria.nombre}
            </h3>
            {categoria.descripcion && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {categoria.descripcion}
              </p>
            )}
          </div>
        </div>

        {/* Arrow icon */}
        <svg
          className={`w-6 h-6 text-blue-600 dark:text-blue-400 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Accordion Content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="p-4 sm:p-6 bg-white dark:bg-gray-900">
          <CategoryCarousel 
            images={images} 
            categoryName={categoria.nombre}
            onImageSelect={onImageSelect}
          />
        </div>
      </div>
    </div>
  );
};

interface InspirationGalleryAccordionProps {
  onImageSelect?: (image: ImageData) => void;
}

export default function InspirationGalleryAccordion({
  onImageSelect,
}: InspirationGalleryAccordionProps) {
  const [galleryImages, setGalleryImages] = useState<ImageData[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [imagenesRes, categoriasRes] = await Promise.all([
        fetch("/api/imagenes"),
        fetch("/api/categorias"),
      ]);

      if (imagenesRes.ok && categoriasRes.ok) {
        const imagenesData = await imagenesRes.json();
        const categoriasData = await categoriasRes.json();

        if (imagenesData.success && categoriasData.success) {
          const imagenes: ImageData[] = imagenesData.data;
          const cats: Categoria[] = categoriasData.data;

          // Filter images for inspiration gallery
          const inspirationImages = imagenes.filter(
            (img) => img.enGaleriaInspiracion
          );

          setGalleryImages(inspirationImages);
          setCategorias(cats.filter((cat) => cat.activo));
        }
      }
    } catch (error) {
      console.error("Error loading gallery data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Group images by category
  const imagesByCategory = categorias.map((categoria) => ({
    categoria,
    images: galleryImages.filter(
      (img) => img.categoriaIds && img.categoriaIds.includes(categoria._id!)
    ),
  }));

  // Images without category
  const imagesWithoutCategory = galleryImages.filter(
    (img) => !img.categoriaIds || img.categoriaIds.length === 0
  );

  // Filter out empty categories
  const nonEmptyCategories = imagesByCategory.filter(
    (group) => group.images.length > 0
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Galería de Inspiración
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Explora nuestros diseños por categoría (mostrando 3 imágenes a la vez)
        </p>
      </div>

      {galleryImages.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">
            No hay diseños disponibles en este momento
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Categories with images */}
          {nonEmptyCategories.map((group) => (
            <AccordionItem
              key={group.categoria._id}
              categoria={group.categoria}
              images={group.images}
              isOpen={openCategoryId === group.categoria._id}
              onToggle={() =>
                setOpenCategoryId(
                  openCategoryId === group.categoria._id
                    ? null
                    : group.categoria._id!
                )
              }
              onImageSelect={onImageSelect}
            />
          ))}

          {/* Images without category */}
          {imagesWithoutCategory.length > 0 && (
            <AccordionItem
              categoria={{
                _id: "otros",
                nombre: "Otros Diseños",
                descripcion: "Diseños sin categoría específica",
                activo: true,
              }}
              images={imagesWithoutCategory}
              isOpen={openCategoryId === "otros"}
              onToggle={() =>
                setOpenCategoryId(openCategoryId === "otros" ? null : "otros")
              }
              onImageSelect={onImageSelect}
            />
          )}
        </div>
      )}

      {/* Call to action */}
      {galleryImages.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-xl p-4 sm:p-6 border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 text-center">
            💡 <strong>Tip:</strong> Puedes describir cualquiera de estos
            diseños en el campo de decoración
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <a
              href="https://wa.me/+5363233073?text=Hola,%20quiero%20enviar%20una%20referencia%20de%20diseño"
              target="_blank"
              rel="noopener noreferrer"
              className="text-center bg-gradient-to-r from-blue-600 to-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
            >
              📱 Enviar Referencia por WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
