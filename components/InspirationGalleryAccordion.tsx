"use client";
import { useEffect, useState, useMemo, memo } from "react";
import { ImageData, Categoria } from "@/lib/types";
import CategoryCarousel from "./CategoryCarousel";

interface AccordionItemProps {
  categoria: Categoria;
  images: ImageData[];
  isOpen: boolean;
  onToggle: () => void;
  onImageSelect?: (image: ImageData) => void;
}

const AccordionItem = memo(
  ({
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
          <div className="sm:p-6 bg-white dark:bg-gray-900">
            <CategoryCarousel
              images={images}
              categoryName={categoria.nombre}
              onImageSelect={onImageSelect}
            />
          </div>
        </div>
      </div>
    );
  }
);

AccordionItem.displayName = "AccordionItem";

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

  // Group images by category - Memoized to avoid recalculation
  const imagesByCategory = useMemo(
    () =>
      categorias.map((categoria) => ({
        categoria,
        images: galleryImages.filter(
          (img) => img.categoriaIds && img.categoriaIds.includes(categoria._id!)
        ),
      })),
    [categorias, galleryImages]
  );

  // Images without category - Memoized
  const imagesWithoutCategory = useMemo(
    () =>
      galleryImages.filter(
        (img) => !img.categoriaIds || img.categoriaIds.length === 0
      ),
    [galleryImages]
  );

  // Filter out empty categories - Memoized
  const nonEmptyCategories = useMemo(
    () => imagesByCategory.filter((group) => group.images.length > 0),
    [imagesByCategory]
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [imagenesRes, categoriasRes] = await Promise.all([
        fetch("/api/imagenes", {
          next: { revalidate: 60 }, // Cache for 60 seconds
        }),
        fetch("/api/categorias", {
          next: { revalidate: 60 }, // Cache for 60 seconds
        }),
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
          Explora nuestros diseños por categoría
        </p>
      </div>

      {galleryImages.length === 0 ?
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
      : <div className="space-y-3">
          {/* Categories with images */}
          {nonEmptyCategories.map((group) => (
            <AccordionItem
              key={group.categoria._id}
              categoria={group.categoria}
              images={group.images}
              isOpen={openCategoryId === group.categoria._id}
              onToggle={() =>
                setOpenCategoryId(
                  openCategoryId === group.categoria._id ?
                    null
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
      }
    </div>
  );
}
