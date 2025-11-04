"use client";
import { useEffect, useState } from "react";
import { GaleriaItem, ImageData, Categoria } from "@/lib/types";
import { base64ToDataURL } from "@/lib/imageUtils";

// Helper function to get image URL from ImageData
const getImageUrl = (imagen: ImageData | undefined): string => {
  return imagen ? base64ToDataURL(imagen.base64Data, imagen.mimeType) : "";
};

// Reusable badge component for destacado items
const DestacadoBadge = () => (
  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
    <span className="bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-500 dark:to-violet-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-medium">
      ⭐ Popular
    </span>
  </div>
);

// Reusable button component for gallery items
const SelectDesignButton = () => (
  <button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-500 dark:to-violet-500 text-white py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-blue-400/25 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300">
    Elegir este diseño
  </button>
);

// Gallery item card component
const GalleryItemCard = ({ item }: { item: GaleriaItem & { imagen?: ImageData } }) => {
  const imageUrl = getImageUrl(item.imagen);

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden hover:shadow-xl dark:shadow-gray-900/20 dark:hover:shadow-gray-900/30 transition-all duration-300 border border-gray-100 dark:border-gray-700">
      {/* Destacado badge */}
      {item.destacado && <DestacadoBadge />}

      {/* Image preview */}
      <div className="aspect-square">
        <img
          src={imageUrl}
          alt={item.titulo}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Design info */}
      <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-700/50">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
          {item.titulo}
        </h4>
        {item.descripcion && (
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
            {item.descripcion}
          </p>
        )}
        <SelectDesignButton />
      </div>
    </div>
  );
};

export default function DynamicInspirationGallery() {
  const [galleryItems, setGalleryItems] = useState<(GaleriaItem & { imagen?: ImageData })[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch gallery items, images, and categories in parallel
      const [galeriaRes, imagenesRes, categoriasRes] = await Promise.all([
        fetch("/api/galeria"),
        fetch("/api/imagenes"),
        fetch("/api/categorias"),
      ]);

      if (galeriaRes.ok && imagenesRes.ok && categoriasRes.ok) {
        const galeriaData = await galeriaRes.json();
        const imagenesData = await imagenesRes.json();
        const categoriasData = await categoriasRes.json();

        if (galeriaData.success && imagenesData.success && categoriasData.success) {
          const imagenes: ImageData[] = imagenesData.data;
          const galeria: GaleriaItem[] = galeriaData.data;
          const cats: Categoria[] = categoriasData.data;

          // Map gallery items with their images
          const itemsWithImages = galeria
            .map((item) => ({
              ...item,
              imagen: imagenes.find((img) => img._id === item.imagenId),
            }))
            .filter((item) => item.imagen); // Only include items with valid images

          setGalleryItems(itemsWithImages);
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
      <section className="py-12 sm:py-14 lg:py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        </div>
      </section>
    );
  }

  // Group items by category
  const itemsByCategory = categorias.map((categoria) => ({
    categoria,
    items: galleryItems.filter((item) => item.categoriaId === categoria._id),
  }));

  // Items without category
  const itemsWithoutCategory = galleryItems.filter((item) => !item.categoriaId);

  // Filter out empty categories
  const nonEmptyCategories = itemsByCategory.filter((group) => group.items.length > 0);

  return (
    <section className="py-12 sm:py-14 lg:py-16 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Galería de Inspiración
          </h2>
          <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
            Explora nuestros diseños más populares y encuentra la inspiración
            para tu próxima manicure
          </p>
        </div>

        {galleryItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No hay diseños en la galería aún. El administrador puede agregar imágenes desde el panel de control.
            </p>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-10 lg:space-y-12">
            {/* Items grouped by category */}
            {nonEmptyCategories.map((group) => (
              <div key={group.categoria._id}>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 text-center">
                  {group.categoria.nombre}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {group.items.map((item) => (
                    <GalleryItemCard key={item._id} item={item} />
                  ))}
                </div>
              </div>
            ))}

            {/* Items without category */}
            {itemsWithoutCategory.length > 0 && (
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 text-center">
                  Otros Diseños
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {itemsWithoutCategory.map((item) => (
                    <GalleryItemCard key={item._id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Call to action */}
        <div className="text-center mt-8 sm:mt-10 lg:mt-12">
          <div className="bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto border border-blue-100 dark:border-blue-800">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              ¿No encuentras lo que buscas?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
              Nuestras artistas pueden crear cualquier diseño que tengas en
              mente. Trae tu inspiración o déjanos sorprenderte con algo único.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button className="bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-500 dark:to-violet-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-blue-400/25 transition-all transform hover:-translate-y-0.5 text-sm sm:text-base">
                📱 Enviar Referencia por WhatsApp
              </button>
              <button className="border-2 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-sm sm:text-base">
                💬 Consultar Diseño Personalizado
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
