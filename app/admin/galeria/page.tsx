"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GaleriaItem, ImageData, Categoria, Servicio } from "@/lib/types";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  SaveIcon,
  CloseIcon,
} from "@/components/ui/Icons";

export default function GaleriaAdmin() {
  const [galeria, setGaleria] = useState<GaleriaItem[]>([]);
  const [imagenes, setImagenes] = useState<ImageData[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GaleriaItem | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    imagenId: "",
    categoriaId: "",
    servicioId: "",
    destacado: false,
    orden: 0,
  });
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resGaleria, resImagenes, resCategorias, resServicios] =
        await Promise.all([
          fetch("/api/galeria"),
          fetch("/api/imagenes"),
          fetch("/api/categorias"),
          fetch("/api/servicios"),
        ]);

      if (resGaleria.ok) {
        const data = await resGaleria.json();
        if (data.success) setGaleria(data.data);
      }

      if (resImagenes.ok) {
        const data = await resImagenes.json();
        if (data.success) setImagenes(data.data);
      }

      if (resCategorias.ok) {
        const data = await resCategorias.json();
        if (data.success) setCategorias(data.data);
      }

      if (resServicios.ok) {
        const data = await resServicios.json();
        if (data.success) setServicios(data.data);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const payload =
        editingItem ? { _id: editingItem._id, ...formData } : formData;

      const url = "/api/galeria";
      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        resetForm();
        loadData();
        setTimeout(() => setShowModal(false), 1500);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Error de conexión");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este item de la galería?")) return;

    try {
      const res = await fetch(`/api/galeria?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        loadData();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Error de conexión");
    }
  };

  const handleEdit = (item: GaleriaItem) => {
    setEditingItem(item);
    setFormData({
      titulo: item.titulo,
      descripcion: item.descripcion || "",
      imagenId: item.imagenId,
      categoriaId: item.categoriaId || "",
      servicioId: item.servicioId || "",
      destacado: item.destacado,
      orden: item.orden || 0,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      descripcion: "",
      imagenId: "",
      categoriaId: "",
      servicioId: "",
      destacado: false,
      orden: 0,
    });
    setEditingItem(null);
    setMessage("");
  };

  const getImageById = (id: string) => {
    return imagenes.find((img) => img._id === id);
  };

  const getCategoriaById = (id: string | undefined) => {
    if (!id) return null;
    return categorias.find((cat) => cat._id === id);
  };

  const getServicioById = (id: string | undefined) => {
    if (!id) return null;
    return servicios.find((srv) => srv._id === id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push("/admin/dashboard")}
                variant="ghost"
                size="sm"
              >
                ← Volver
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg
                  className="w-7 h-7 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
                Gestión de Galería
              </h1>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              icon={<PlusIcon />}
            >
              Nuevo Item
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p>{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {galeria.map((item) => {
            const imagen = getImageById(item.imagenId);
            const categoria = getCategoriaById(item.categoriaId);
            const servicio = getServicioById(item.servicioId);

            return (
              <div
                key={item._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
              >
                <div className="relative aspect-square bg-gray-200 dark:bg-gray-700">
                  {imagen && imagen.blobUrl ?
                    <Image
                      src={imagen.blobUrl}
                      alt={`Gallery image: ${item.titulo}`}
                      className="w-full h-full object-cover"
                      fill
                    />
                  : <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                        />
                      </svg>
                    </div>
                  }
                  {item.destacado && (
                    <span className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Destacado
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {item.titulo}
                  </h3>
                  {item.descripcion && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {item.descripcion}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-500 mb-3 space-y-1">
                    {categoria && (
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          />
                        </svg>
                        {categoria.nombre}
                      </div>
                    )}
                    {servicio && (
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
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
                        {servicio.nombre}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEdit(item)}
                      icon={<EditIcon />}
                      size="sm"
                      className="flex-1"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(item._id!)}
                      variant="outlined-danger"
                      icon={<TrashIcon />}
                      size="sm"
                      className="flex-1"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {galeria.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No hay items en la galería. Crea uno nuevo para comenzar.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {editingItem ?
                  "Editar Item de Galería"
                : "Nuevo Item de Galería"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Imagen *
                  </label>
                  <select
                    value={formData.imagenId}
                    onChange={(e) =>
                      setFormData({ ...formData, imagenId: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Seleccionar imagen</option>
                    {imagenes.map((img) => (
                      <option key={img._id} value={img._id}>
                        {img.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoría (opcional)
                  </label>
                  <select
                    value={formData.categoriaId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoriaId: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Servicio (opcional)
                  </label>
                  <select
                    value={formData.servicioId}
                    onChange={(e) =>
                      setFormData({ ...formData, servicioId: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Sin servicio</option>
                    {servicios.map((srv) => (
                      <option key={srv._id} value={srv._id}>
                        {srv.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.destacado}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          destacado: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Destacado
                    </span>
                  </label>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Orden
                    </label>
                    <input
                      type="number"
                      value={formData.orden}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          orden: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="0"
                    />
                  </div>
                </div>
                {message && <p className="text-sm">{message}</p>}
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    variant="outlined-secondary"
                    icon={<CloseIcon />}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    icon={<SaveIcon />}
                    className="flex-1"
                  >
                    {editingItem ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
