"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageData, Categoria, Servicio } from "@/lib/types";
import { preprocessImage, base64ToDataURL, isValidImageFile, isValidFileSize } from "@/lib/imageUtils";

export default function ContenidoAdmin() {
  const [imagenes, setImagenes] = useState<ImageData[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Filter states
  const [filterCategoria, setFilterCategoria] = useState<string>("");
  const [filterServicio, setFilterServicio] = useState<string>("");
  const [filterGaleria, setFilterGaleria] = useState<string>("");

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [showServicioModal, setShowServicioModal] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    nombre: "",
    titulo: "",
    descripcion: "",
    enGaleriaDashboard: false,
    enGaleriaInspiracion: false,
    categoriaIds: [] as string[],
    servicioIds: [] as string[],
  });

  const [categoriaForm, setCategoriaForm] = useState({ nombre: "", descripcion: "" });
  const [servicioForm, setServicioForm] = useState({ nombre: "", descripcion: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resImagenes, resCategorias, resServicios] = await Promise.all([
        fetch("/api/imagenes"),
        fetch("/api/categorias"),
        fetch("/api/servicios"),
      ]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isValidImageFile(file)) {
        setMessage("❌ Tipo de archivo no válido. Use JPEG, PNG, GIF o WebP");
        return;
      }
      if (!isValidFileSize(file, 5)) {
        setMessage("❌ El archivo es demasiado grande. Máximo 5MB");
        return;
      }
      setUploadedFile(file);
      setMessage("");
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!uploadedFile) {
      setMessage("❌ Debe seleccionar una imagen");
      return;
    }

    try {
      const imageData = await preprocessImage(uploadedFile);
      
      const payload = {
        nombre: formData.nombre,
        titulo: formData.titulo || undefined,
        descripcion: formData.descripcion || undefined,
        enGaleriaDashboard: formData.enGaleriaDashboard,
        enGaleriaInspiracion: formData.enGaleriaInspiracion,
        categoriaIds: formData.categoriaIds,
        servicioIds: formData.servicioIds,
        ...imageData,
      };

      const res = await fetch("/api/imagenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("✅ Imagen subida exitosamente");
        resetForm();
        loadData();
        setTimeout(() => setShowUploadModal(false), 1500);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Error de conexión");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!selectedImage) return;

    try {
      let imageData = null;
      if (uploadedFile) {
        imageData = await preprocessImage(uploadedFile);
      }

      const payload = {
        _id: selectedImage._id,
        nombre: formData.nombre,
        titulo: formData.titulo || undefined,
        descripcion: formData.descripcion || undefined,
        enGaleriaDashboard: formData.enGaleriaDashboard,
        enGaleriaInspiracion: formData.enGaleriaInspiracion,
        categoriaIds: formData.categoriaIds,
        servicioIds: formData.servicioIds,
        ...(imageData && imageData),
      };

      const res = await fetch("/api/imagenes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("✅ Imagen actualizada exitosamente");
        resetForm();
        loadData();
        setTimeout(() => setShowEditModal(false), 1500);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Error de conexión");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta imagen?")) return;

    try {
      const res = await fetch(`/api/imagenes?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setMessage("✅ Imagen eliminada exitosamente");
        loadData();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`❌ ${data.error}`);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Error de conexión");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const openEditModal = (imagen: ImageData) => {
    setSelectedImage(imagen);
    setFormData({
      nombre: imagen.nombre,
      titulo: imagen.titulo || "",
      descripcion: imagen.descripcion || "",
      enGaleriaDashboard: imagen.enGaleriaDashboard || false,
      enGaleriaInspiracion: imagen.enGaleriaInspiracion || false,
      categoriaIds: imagen.categoriaIds || [],
      servicioIds: imagen.servicioIds || [],
    });
    setUploadedFile(null);
    setShowEditModal(true);
  };

  const openViewModal = (imagen: ImageData) => {
    setSelectedImage(imagen);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      titulo: "",
      descripcion: "",
      enGaleriaDashboard: false,
      enGaleriaInspiracion: false,
      categoriaIds: [],
      servicioIds: [],
    });
    setUploadedFile(null);
    setSelectedImage(null);
    setMessage("");
  };

  const handleCreateCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...categoriaForm, activo: true, orden: 0 }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("✅ Categoría creada");
        setCategoriaForm({ nombre: "", descripcion: "" });
        setShowCategoriaModal(false);
        loadData();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Error de conexión");
    }
  };

  const handleCreateServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...servicioForm, activo: true, orden: 0 }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("✅ Servicio creado");
        setServicioForm({ nombre: "", descripcion: "" });
        setShowServicioModal(false);
        loadData();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Error de conexión");
    }
  };

  const toggleCategoria = (id: string) => {
    setFormData(prev => ({
      ...prev,
      categoriaIds: prev.categoriaIds.includes(id)
        ? prev.categoriaIds.filter(cid => cid !== id)
        : [...prev.categoriaIds, id]
    }));
  };

  const toggleServicio = (id: string) => {
    setFormData(prev => ({
      ...prev,
      servicioIds: prev.servicioIds.includes(id)
        ? prev.servicioIds.filter(sid => sid !== id)
        : [...prev.servicioIds, id]
    }));
  };

  // Filter images based on selected filters
  const filteredImages = imagenes.filter(imagen => {
    if (filterCategoria && !(imagen.categoriaIds || []).includes(filterCategoria)) {
      return false;
    }
    if (filterServicio && !(imagen.servicioIds || []).includes(filterServicio)) {
      return false;
    }
    if (filterGaleria === "dashboard" && !imagen.enGaleriaDashboard) {
      return false;
    }
    if (filterGaleria === "inspiracion" && !imagen.enGaleriaInspiracion) {
      return false;
    }
    return true;
  });

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
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← Volver
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                🎨 Gestión de Contenido
              </h1>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowUploadModal(true);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
            >
              + Nueva Imagen
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Message */}
        {message && (
          <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Filters and Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <select
                value={filterGaleria}
                onChange={(e) => setFilterGaleria(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todas las galerías</option>
                <option value="dashboard">Nuestros Trabajos</option>
                <option value="inspiracion">Galería Inspiración</option>
              </select>

              <select
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.nombre}</option>
                ))}
              </select>

              <select
                value={filterServicio}
                onChange={(e) => setFilterServicio(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todos los servicios</option>
                {servicios.map(srv => (
                  <option key={srv._id} value={srv._id}>{srv.nombre}</option>
                ))}
              </select>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowCategoriaModal(true)}
                className="flex-1 sm:flex-none px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50"
              >
                + Categoría
              </button>
              <button
                onClick={() => setShowServicioModal(true)}
                className="flex-1 sm:flex-none px-3 py-2 text-sm bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50"
              >
                + Servicio
              </button>
            </div>
          </div>

          {/* Filter summary */}
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Mostrando {filteredImages.length} de {imagenes.length} imágenes
          </div>
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredImages.map((imagen) => (
            <div
              key={imagen._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group"
            >
              {/* Image */}
              <div 
                className="aspect-square bg-gray-200 dark:bg-gray-700 cursor-pointer relative"
                onClick={() => openViewModal(imagen)}
              >
                <img
                  src={base64ToDataURL(imagen.base64Data, imagen.mimeType)}
                  alt={imagen.nombre}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {/* Gallery badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {imagen.enGaleriaDashboard && (
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded">
                      Dashboard
                    </span>
                  )}
                  {imagen.enGaleriaInspiracion && (
                    <span className="px-2 py-0.5 bg-violet-500 text-white text-xs rounded">
                      Inspiración
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-2 sm:p-3">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate mb-1">
                  {imagen.nombre}
                </h3>
                {imagen.titulo && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {imagen.titulo}
                  </p>
                )}
                
                {/* Action buttons */}
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => openEditModal(imagen)}
                    className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(imagen._id!)}
                    className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredImages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No hay imágenes que coincidan con los filtros.
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Nueva Imagen
              </h2>
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Archivo *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Máximo 5MB. Formatos: JPEG, PNG, GIF, WebP
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del archivo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título (para galerías)
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mostrar en galerías
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.enGaleriaDashboard}
                        onChange={(e) => setFormData({ ...formData, enGaleriaDashboard: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Nuestros Trabajos (Dashboard)
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.enGaleriaInspiracion}
                        onChange={(e) => setFormData({ ...formData, enGaleriaInspiracion: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Galería de Inspiración (Reserva)
                      </span>
                    </label>
                  </div>
                </div>

                {categorias.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categorías (opcional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categorias.map(cat => (
                        <label key={cat._id} className="flex items-center space-x-1 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.categoriaIds.includes(cat._id!)}
                            onChange={() => toggleCategoria(cat._id!)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300">{cat.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {servicios.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Servicios (opcional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {servicios.map(srv => (
                        <label key={srv._id} className="flex items-center space-x-1 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.servicioIds.includes(srv._id!)}
                            onChange={() => toggleServicio(srv._id!)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300">{srv.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {message && <p className="text-sm">{message}</p>}
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    Subir Imagen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Similar to Upload but with update logic */}
      {showEditModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Editar Imagen
              </h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reemplazar imagen (opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del archivo
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título (para galerías)
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mostrar en galerías
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.enGaleriaDashboard}
                        onChange={(e) => setFormData({ ...formData, enGaleriaDashboard: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Nuestros Trabajos (Dashboard)
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.enGaleriaInspiracion}
                        onChange={(e) => setFormData({ ...formData, enGaleriaInspiracion: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Galería de Inspiración (Reserva)
                      </span>
                    </label>
                  </div>
                </div>

                {categorias.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categorías (opcional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categorias.map(cat => (
                        <label key={cat._id} className="flex items-center space-x-1 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.categoriaIds.includes(cat._id!)}
                            onChange={() => toggleCategoria(cat._id!)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300">{cat.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {servicios.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Servicios (opcional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {servicios.map(srv => (
                        <label key={srv._id} className="flex items-center space-x-1 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.servicioIds.includes(srv._id!)}
                            onChange={() => toggleServicio(srv._id!)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300">{srv.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {message && <p className="text-sm">{message}</p>}
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    Actualizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal - Full size image */}
      {showViewModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowViewModal(false)}
        >
          <div className="max-w-4xl w-full">
            <div className="relative">
              <button
                onClick={() => setShowViewModal(false)}
                className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300"
              >
                ✕ Cerrar
              </button>
              <img
                src={base64ToDataURL(selectedImage.base64Data, selectedImage.mimeType)}
                alt={selectedImage.nombre}
                className="w-full h-auto rounded-lg"
              />
              {(selectedImage.titulo || selectedImage.descripcion) && (
                <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg">
                  {selectedImage.titulo && (
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedImage.titulo}
                    </h3>
                  )}
                  {selectedImage.descripcion && (
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedImage.descripcion}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Categoria Modal */}
      {showCategoriaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Nueva Categoría
              </h2>
              <form onSubmit={handleCreateCategoria} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={categoriaForm.nombre}
                    onChange={(e) => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={categoriaForm.descripcion}
                    onChange={(e) => setCategoriaForm({ ...categoriaForm, descripcion: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoriaModal(false);
                      setCategoriaForm({ nombre: "", descripcion: "" });
                    }}
                    className="flex-1 px-6 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Servicio Modal */}
      {showServicioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Nuevo Servicio
              </h2>
              <form onSubmit={handleCreateServicio} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={servicioForm.nombre}
                    onChange={(e) => setServicioForm({ ...servicioForm, nombre: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={servicioForm.descripcion}
                    onChange={(e) => setServicioForm({ ...servicioForm, descripcion: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowServicioModal(false);
                      setServicioForm({ nombre: "", descripcion: "" });
                    }}
                    className="flex-1 px-6 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                  >
                    Crear
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
