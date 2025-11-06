"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Categoria, ImageData } from "@/lib/types";
import { base64ToDataURL } from "@/lib/imageUtils";
import Image from "next/image";

export default function CategoriasAdmin() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [imagenes, setImagenes] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(
    null
  );
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    imagenId: "",
    activo: true,
    orden: 0,
  });
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resCategorias, resImagenes] = await Promise.all([
        fetch("/api/categorias"),
        fetch("/api/imagenes"),
      ]);

      if (resCategorias.ok) {
        const data = await resCategorias.json();
        if (data.success) setCategorias(data.data);
      }

      if (resImagenes.ok) {
        const data = await resImagenes.json();
        if (data.success) setImagenes(data.data);
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
    setSaving(true);

    try {
      const payload =
        editingCategoria ?
          { _id: editingCategoria._id, ...formData }
        : formData;

      const url = "/api/categorias";
      const method = editingCategoria ? "PATCH" : "POST";

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
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta categoría?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/categorias?id=${id}`, { method: "DELETE" });
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
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
      imagenId: categoria.imagenId || "",
      activo: categoria.activo,
      orden: categoria.orden || 0,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      imagenId: "",
      activo: true,
      orden: 0,
    });
    setEditingCategoria(null);
    setMessage("");
  };

  const getImageById = (id: string | undefined) => {
    if (!id) return null;
    return imagenes.find((img) => img._id === id);
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
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="text-blue-600 hover:text-blue-700"
              >
                ← Volver
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                📁 Gestión de Categorías
              </h1>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Nueva Categoría
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p>{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categorias.map((categoria) => {
            const imagen = getImageById(categoria.imagenId);
            return (
              <div
                key={categoria._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
              >
                <div className="h-40 bg-gray-200 dark:bg-gray-700">
                  {imagen ?
                    <Image
                      src={base64ToDataURL(imagen.base64Data, imagen.mimeType)}
                      alt={`Category image for ${categoria.nombre}`}
                      className="w-full h-full object-cover"
                      fill
                    />
                  : <div className="w-full h-full flex items-center justify-center text-4xl">
                      📁
                    </div>
                  }
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {categoria.nombre}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        categoria.activo ?
                          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {categoria.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  {categoria.descripcion && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {categoria.descripcion}
                    </p>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(categoria)}
                      disabled={saving}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(categoria._id!)}
                      disabled={saving}
                      className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Eliminando...
                        </span>
                      ) : (
                        "Eliminar"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {categorias.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No hay categorías. Crea una nueva para comenzar.
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
                {editingCategoria ? "Editar Categoría" : "Nueva Categoría"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
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
                    Imagen
                  </label>
                  <select
                    value={formData.imagenId}
                    onChange={(e) =>
                      setFormData({ ...formData, imagenId: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Sin imagen</option>
                    {imagenes.map((img) => (
                      <option key={img._id} value={img._id}>
                        {img.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) =>
                        setFormData({ ...formData, activo: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Activo
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
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    disabled={saving}
                    className="flex-1 px-6 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        {editingCategoria ? "Actualizando..." : "Creando..."}
                      </span>
                    ) : (
                      editingCategoria ? "Actualizar" : "Crear"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
