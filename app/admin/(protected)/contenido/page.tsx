"use client";
import { useState, useEffect } from "react";
import { ImageData, Categoria, Servicio } from "@/lib/types";
import { preprocessImage, base64ToDataURL, isValidImageFile, isValidFileSize } from "@/lib/imageUtils";
import Image from "next/image";

export default function ContenidoAdmin() {
  const [imagenes, setImagenes] = useState<ImageData[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

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

  const [categoriaForm, setCategoriaForm] = useState({
    nombre: "",
    descripcion: "",
  });
  const [servicioForm, setServicioForm] = useState({
    nombre: "",
    descripcion: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Initialize loading state for all images
    if (imagenes.length > 0) {
      setLoadingImages(new Set(imagenes.map((img) => img._id!)));
    }
  }, [imagenes]);

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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];

    for (const file of fileArray) {
      if (!isValidImageFile(file)) {
        setMessage(
          `❌ ${file.name}: Tipo de archivo no válido. Use JPEG, PNG, GIF o WebP`
        );
        return;
      }
      if (!isValidFileSize(file, 5)) {
        setMessage(
          `❌ ${file.name}: El archivo es demasiado grande. Máximo 5MB`
        );
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 1) {
      setUploadedFile(validFiles[0]);
      setUploadedFiles([]);
    } else {
      setUploadedFile(null);
      setUploadedFiles(validFiles);
    }
    setMessage("");
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    // Multiple files upload
    if (uploadedFiles.length > 0) {
      setSaving(true);
      try {
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          const imageData = await preprocessImage(file);

          // Auto-generate name from filename without extension
          const autoName = file.name.replace(/\.[^/.]+$/, "");

          const payload = {
            nombre: autoName,
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
            successCount++;
          } else {
            errorCount++;
          }
        }

        if (errorCount === 0) {
          setMessage(
            `✅ ${successCount} ${successCount === 1 ? "imagen subida" : "imágenes subidas"} exitosamente`
          );
        } else {
          setMessage(`⚠️ ${successCount} subidas, ${errorCount} errores`);
        }

        resetForm();
        loadData();
        setTimeout(() => setShowUploadModal(false), 1500);
      } catch (error) {
        console.error("Error:", error);
        setMessage("❌ Error de conexión");
      } finally {
        setSaving(false);
      }
      return;
    }

    // Single file upload (original logic)
    if (!uploadedFile) {
      setMessage("❌ Debe seleccionar una imagen");
      return;
    }

    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!selectedImage) return;

    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta imagen?")) return;

    setSaving(true);
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
    } finally {
      setSaving(false);
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
    setUploadedFiles([]);
    setSelectedImage(null);
    setMessage("");
  };

  const handleCreateCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const handleCreateServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const toggleCategoria = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      categoriaIds:
        prev.categoriaIds.includes(id) ?
          prev.categoriaIds.filter((cid) => cid !== id)
        : [...prev.categoriaIds, id],
    }));
  };

  const toggleServicio = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      servicioIds:
        prev.servicioIds.includes(id) ?
          prev.servicioIds.filter((sid) => sid !== id)
        : [...prev.servicioIds, id],
    }));
  };

  // Filter images based on selected filters
  const filteredImages = imagenes.filter((imagen) => {
    if (
      filterCategoria &&
      !(imagen.categoriaIds || []).includes(filterCategoria)
    ) {
      return false;
    }
    if (
      filterServicio &&
      !(imagen.servicioIds || []).includes(filterServicio)
    ) {
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            Cargando contenido...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global Message */}
      {message && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border-l-4 border-blue-500 dark:border-blue-400 shadow-lg animate-fadeInUp">
          <p className="text-center text-sm font-semibold text-blue-900 dark:text-white">
            {message}
          </p>
        </div>
      )}

      {/* Action Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            resetForm();
            setShowUploadModal(true);
          }}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          ➕ Nueva Imagen
        </button>
      </div>

      {/* Filters and Quick Actions */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 dark:border-white/20">
        <div className="flex flex-col justify-between items-start gap-4">
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
              {categorias.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.nombre}
                </option>
              ))}
            </select>

            <select
              value={filterServicio}
              onChange={(e) => setFilterServicio(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos los servicios</option>
              {servicios.map((srv) => (
                <option key={srv._id} value={srv._id}>
                  {srv.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowCategoriaModal(true)}
              disabled={saving}
              className="flex-1 sm:flex-none px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              + Categoría
            </button>
            <button
              onClick={() => setShowServicioModal(true)}
              disabled={saving}
              className="flex-1 sm:flex-none px-3 py-2 text-sm bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {filteredImages.map((imagen) => (
          <div
            key={imagen._id}
            className="group bg-white dark:bg-gray-800/50 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-white/10 hover:scale-105"
          >
            {/* Image */}
            <div
              className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 cursor-pointer relative overflow-hidden"
              onClick={() => openViewModal(imagen)}
            >
              {loadingImages.has(imagen._id!) && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"></div>
              )}
              <Image
                src={base64ToDataURL(imagen.base64Data, imagen.mimeType)}
                alt={imagen.nombre}
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                fill
                loading="lazy"
                onLoad={() => {
                  setLoadingImages((prev) => {
                    const next = new Set(prev);
                    next.delete(imagen._id!);
                    return next;
                  });
                }}
              />
              {/* Gallery badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
                {imagen.enGaleriaDashboard && (
                  <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-lg backdrop-blur-sm">
                    💼 Dashboard
                  </span>
                )}
                {imagen.enGaleriaInspiracion && (
                  <span className="px-2.5 py-1 bg-violet-600 text-white text-xs font-semibold rounded-lg shadow-lg backdrop-blur-sm">
                    ✨ Inspiración
                  </span>
                )}
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Info */}
            <div className="p-3 sm:p-4">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate mb-1.5">
                {imagen.nombre}
              </h3>
              {imagen.titulo && (
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-3">
                  {imagen.titulo}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(imagen)}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(imagen._id!)}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-semibold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {saving ?
                    <div className="w-4 h-4 border-2 border-red-700 dark:border-red-300 border-t-transparent rounded-full animate-spin"></div>
                  : <>
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span className="hidden sm:inline">Eliminar</span>
                    </>
                  }
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredImages.length === 0 && !loading && (
        <div className="text-center py-20 px-4">
          <div className="inline-block p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-600"
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
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No hay imágenes
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filterCategoria || filterServicio || filterGaleria ?
              "No se encontraron imágenes con los filtros seleccionados"
            : "Comienza subiendo tu primera imagen"}
          </p>
          {!filterCategoria && !filterServicio && !filterGaleria && (
            <button
              onClick={() => {
                resetForm();
                setShowUploadModal(true);
              }}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <span>➕</span>
              <span>Subir Primera Imagen</span>
            </button>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-2xl">🖼️</span>
                {uploadedFiles.length > 0 ?
                  `Nueva${uploadedFiles.length > 1 ? "s" : ""} Imagen${uploadedFiles.length > 1 ? "es" : ""} (${uploadedFiles.length})`
                : "Nueva Imagen"}
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
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
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-6">
              <form
                onSubmit={handleUploadSubmit}
                className="space-y-6"
                id="upload-form"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {uploadedFiles.length > 0 ?
                      `Archivos (${uploadedFiles.length}) *`
                    : "Archivo(s) *"}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Máximo 5MB por imagen. Formatos: JPEG, PNG, GIF, WebP.
                    Puedes seleccionar múltiples archivos.
                  </p>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                        📋 {uploadedFiles.length}{" "}
                        {uploadedFiles.length === 1 ?
                          "archivo seleccionado"
                        : "archivos seleccionados"}
                        :
                      </p>
                      <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1 max-h-32 overflow-y-auto">
                        {uploadedFiles.map((file, index) => (
                          <li key={index} className="truncate">
                            • {file.name}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-2 italic">
                        Los nombres se generarán automáticamente desde los
                        nombres de archivo
                      </p>
                    </div>
                  )}
                </div>

                {uploadedFiles.length === 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre del archivo *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required={uploadedFiles.length === 0}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título{" "}
                    {uploadedFiles.length > 0 &&
                      "(aplicará a todas las imágenes)"}
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    Mostrar en galerías
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.enGaleriaDashboard}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enGaleriaDashboard: e.target.checked,
                          })
                        }
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
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enGaleriaInspiracion: e.target.checked,
                          })
                        }
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
                      {categorias.map((cat) => (
                        <label
                          key={cat._id}
                          className="flex items-center space-x-1 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={formData.categoriaIds.includes(cat._id!)}
                            onChange={() => toggleCategoria(cat._id!)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300">
                            {cat.nombre}
                          </span>
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
                      {servicios.map((srv) => (
                        <label
                          key={srv._id}
                          className="flex items-center space-x-1 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={formData.servicioIds.includes(srv._id!)}
                            onChange={() => toggleServicio(srv._id!)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300">
                            {srv.nombre}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {message && (
                  <div
                    className={`p-3 rounded-lg text-sm font-medium ${
                      message.includes("✅") ?
                        "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                    }`}
                  >
                    {message}
                  </div>
                )}

                {/* Actions - Moved inside form */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      resetForm();
                    }}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-white rounded-xl transition-all font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {saving ?
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>
                          Subiendo
                          {uploadedFiles.length > 1 ?
                            ` (${uploadedFiles.length})`
                          : ""}
                          ...
                        </span>
                      </>
                    : <>
                        <span>📤</span>
                        <span>
                          Subir Imagen{uploadedFiles.length > 1 ? "es" : ""}
                        </span>
                      </>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedImage && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-2xl">✏️</span>
                Editar Imagen
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
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
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-6">
              <form onSubmit={handleEditSubmit} className="space-y-6">
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
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    Mostrar en galerías
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.enGaleriaDashboard}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enGaleriaDashboard: e.target.checked,
                          })
                        }
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
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enGaleriaInspiracion: e.target.checked,
                          })
                        }
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
                      {categorias.map((cat) => (
                        <label
                          key={cat._id}
                          className="flex items-center space-x-1 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={formData.categoriaIds.includes(cat._id!)}
                            onChange={() => toggleCategoria(cat._id!)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300">
                            {cat.nombre}
                          </span>
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
                      {servicios.map((srv) => (
                        <label
                          key={srv._id}
                          className="flex items-center space-x-1 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={formData.servicioIds.includes(srv._id!)}
                            onChange={() => toggleServicio(srv._id!)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300">
                            {srv.nombre}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {message && (
                  <div
                    className={`p-3 rounded-lg text-sm font-medium ${
                      message.includes("✅") ?
                        "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                    }`}
                  >
                    {message}
                  </div>
                )}

                {/* Actions - Moved inside form */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-white rounded-xl transition-all font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {saving ?
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Actualizando...</span>
                      </>
                    : <>
                        <span>💾</span>
                        <span>Actualizar</span>
                      </>
                    }
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
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowViewModal(false)}
        >
          <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Close button */}
            <button
              onClick={() => setShowViewModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md"
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
              <span className="text-sm font-semibold">Cerrar</span>
            </button>

            {/* Image container */}
            <div
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-w-full max-h-[80vh]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={base64ToDataURL(
                    selectedImage.base64Data,
                    selectedImage.mimeType
                  )}
                  alt={selectedImage.nombre}
                  className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-2xl shadow-2xl"
                />
              </div>
            </div>

            {/* Image info */}
            {(selectedImage.titulo || selectedImage.descripcion) && (
              <div className="mt-6 bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl p-6 rounded-2xl border border-white/20">
                {selectedImage.titulo && (
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {selectedImage.titulo}
                  </h3>
                )}
                {selectedImage.descripcion && (
                  <p className="text-gray-200 dark:text-gray-300 leading-relaxed">
                    {selectedImage.descripcion}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  {selectedImage.enGaleriaDashboard && (
                    <span className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg">
                      💼 Dashboard
                    </span>
                  )}
                  {selectedImage.enGaleriaInspiracion && (
                    <span className="px-3 py-1.5 bg-violet-600 text-white text-sm font-semibold rounded-lg">
                      ✨ Inspiración
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categoria Modal */}
      {showCategoriaModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowCategoriaModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-2xl">🏷️</span>
                Nueva Categoría
              </h3>
              <button
                onClick={() => setShowCategoriaModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-6">
              <form onSubmit={handleCreateCategoria} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={categoriaForm.nombre}
                    onChange={(e) =>
                      setCategoriaForm({
                        ...categoriaForm,
                        nombre: e.target.value,
                      })
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
                    value={categoriaForm.descripcion}
                    onChange={(e) =>
                      setCategoriaForm({
                        ...categoriaForm,
                        descripcion: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                  />
                </div>

                {/* Actions - Moved inside form */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoriaModal(false);
                      setCategoriaForm({ nombre: "", descripcion: "" });
                    }}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-white rounded-xl transition-all font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-all font-semibold shadow-lg flex items-center justify-center gap-2"
                  >
                    {saving ?
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creando...</span>
                      </>
                    : <>
                        <span>➕</span>
                        <span>Crear</span>
                      </>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Servicio Modal */}
      {showServicioModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowServicioModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-2xl">💅</span>
                Nuevo Servicio
              </h3>
              <button
                onClick={() => setShowServicioModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-6">
              <form onSubmit={handleCreateServicio} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={servicioForm.nombre}
                    onChange={(e) =>
                      setServicioForm({
                        ...servicioForm,
                        nombre: e.target.value,
                      })
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
                    value={servicioForm.descripcion}
                    onChange={(e) =>
                      setServicioForm({
                        ...servicioForm,
                        descripcion: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                  />
                </div>

                {/* Actions - Moved inside form */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowServicioModal(false);
                      setServicioForm({ nombre: "", descripcion: "" });
                    }}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-white rounded-xl transition-all font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl transition-all font-semibold shadow-lg flex items-center justify-center gap-2"
                  >
                    {saving ?
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creando...</span>
                      </>
                    : <>
                        <span>➕</span>
                        <span>Crear</span>
                      </>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
