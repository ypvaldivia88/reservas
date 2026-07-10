"use client";
import { useState, useEffect } from "react";
import { ImageData, Categoria, Servicio } from "@/lib/types";
import { preprocessImage, isValidImageFile, isValidFileSize } from "@/lib/imageUtils";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/design/PageHeader";
import SurfaceCard from "@/components/design/SurfaceCard";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  SaveIcon,
  CloseIcon,
  CheckIcon,
  XIcon,
} from "@/components/ui/Icons";

export default function ContenidoAdmin() {
  const [imagenes, setImagenes] = useState<ImageData[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false); // New state for reloading after upload
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  // Bulk operations states
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditType, setBulkEditType] = useState<
    "categorias" | "servicios" | "galerias" | null
  >(null);

  // Filter states
  const [filterCategoria, setFilterCategoria] = useState<string>("");
  const [filterServicio, setFilterServicio] = useState<string>("");
  const [filterGaleria, setFilterGaleria] = useState<string>("");

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);

  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Upload progress states
  type UploadStatus = "pending" | "processing" | "completed" | "error";
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    files: { name: string; status: UploadStatus; error?: string }[];
  }>({ current: 0, total: 0, files: [] });

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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Initialize loading state for all images
    if (imagenes.length > 0) {
      setLoadingImages(new Set(imagenes.map((img) => img._id!)));
    }
  }, [imagenes]);

  const loadData = async (isReload = false) => {
    if (isReload) {
      setReloading(true);
    }

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
      setReloading(false);
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

      // Initialize progress tracking
      const fileProgress = uploadedFiles.map((file) => ({
        name: file.name,
        status: "pending" as UploadStatus,
      }));

      setUploadProgress({
        current: 0,
        total: uploadedFiles.length,
        files: fileProgress,
      });

      try {
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];

          // Update status to processing
          setUploadProgress((prev) => ({
            ...prev,
            current: i + 1,
            files: prev.files.map((f, idx) =>
              idx === i ? { ...f, status: "processing" } : f
            ),
          }));

          try {
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
              // Update status to completed
              setUploadProgress((prev) => ({
                ...prev,
                files: prev.files.map((f, idx) =>
                  idx === i ? { ...f, status: "completed" } : f
                ),
              }));
            } else {
              errorCount++;
              // Update status to error
              setUploadProgress((prev) => ({
                ...prev,
                files: prev.files.map((f, idx) =>
                  idx === i ?
                    {
                      ...f,
                      status: "error",
                      error: data.error || "Error desconocido",
                    }
                  : f
                ),
              }));
            }
          } catch (fileError) {
            errorCount++;
            console.error(`Error uploading ${file.name}:`, fileError);
            // Update status to error
            setUploadProgress((prev) => ({
              ...prev,
              files: prev.files.map((f, idx) =>
                idx === i ?
                  { ...f, status: "error", error: "Error al procesar" }
                : f
              ),
            }));
          }
        }

        if (errorCount === 0) {
          setMessage(
            `✅ ${successCount} ${successCount === 1 ? "imagen subida" : "imágenes subidas"} exitosamente`
          );
        } else {
          setMessage(`⚠️ ${successCount} subidas, ${errorCount} errores`);
        }

        // Wait a bit to show the completion state, then start reloading
        setTimeout(async () => {
          setShowUploadModal(false);
          await loadData(true); // Reload with indicator
          resetForm();
          setUploadProgress({ current: 0, total: 0, files: [] });
        }, 2000);
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

    // Initialize progress for single file
    setUploadProgress({
      current: 1,
      total: 1,
      files: [{ name: uploadedFile.name, status: "processing" }],
    });

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
        setUploadProgress((prev) => ({
          ...prev,
          files: [{ name: uploadedFile.name, status: "completed" }],
        }));

        setTimeout(async () => {
          setShowUploadModal(false);
          await loadData(true); // Reload with indicator
          resetForm();
          setUploadProgress({ current: 0, total: 0, files: [] });
        }, 1500);
      } else {
        setMessage(`❌ ${data.error}`);
        setUploadProgress((prev) => ({
          ...prev,
          files: [
            { name: uploadedFile.name, status: "error", error: data.error },
          ],
        }));
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Error de conexión");
      setUploadProgress((prev) => ({
        ...prev,
        files: [
          {
            name: uploadedFile.name,
            status: "error",
            error: "Error de conexión",
          },
        ],
      }));
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
        await loadData(true);
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
        await loadData(true);
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
    setUploadProgress({ current: 0, total: 0, files: [] });
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
        await loadData(true);
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

  // Bulk operations handlers
  const toggleImageSelection = (id: string) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const displayedImageIds = filteredImages
      .filter((img) => img.blobUrl)
      .map((img) => img._id!);

    if (selectedImages.size === displayedImageIds.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(displayedImageIds));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;

    if (
      !confirm(
        `¿Está seguro de eliminar ${selectedImages.size} imagen(es) seleccionada(s)?`
      )
    )
      return;

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedImages) {
      try {
        const res = await fetch(`/api/imagenes?id=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Error deleting image ${id}:`, error);
        errorCount++;
      }
    }

    if (errorCount === 0) {
      setMessage(`✅ ${successCount} imagen(es) eliminada(s) exitosamente`);
    } else {
      setMessage(`⚠️ ${successCount} eliminadas, ${errorCount} errores`);
    }

    setSelectedImages(new Set());
    await loadData(true);
    setTimeout(() => setMessage(""), 3000);
    setSaving(false);
  };

  const openBulkEditModal = (type: "categorias" | "servicios" | "galerias") => {
    if (selectedImages.size === 0) {
      setMessage("❌ Debe seleccionar al menos una imagen");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setBulkEditType(type);
    setShowBulkEditModal(true);
  };

  const handleBulkEdit = async (action: "add" | "remove", values: any) => {
    if (selectedImages.size === 0) return;

    setSaving(true);
    try {
      const updates: any[] = [];

      for (const id of selectedImages) {
        const imagen = imagenes.find((img) => img._id === id);
        if (!imagen) continue;

        let updateData: Partial<ImageData> = { _id: id };

        if (bulkEditType === "categorias") {
          const currentCategorias = imagen.categoriaIds || [];
          updateData.categoriaIds =
            action === "add" ?
              [...new Set([...currentCategorias, ...values])]
            : currentCategorias.filter((c) => !values.includes(c));
        } else if (bulkEditType === "servicios") {
          const currentServicios = imagen.servicioIds || [];
          updateData.servicioIds =
            action === "add" ?
              [...new Set([...currentServicios, ...values])]
            : currentServicios.filter((s) => !values.includes(s));
        } else if (bulkEditType === "galerias") {
          updateData.enGaleriaDashboard = values.dashboard;
          updateData.enGaleriaInspiracion = values.inspiracion;
        }

        updates.push(updateData);
      }

      // Execute all updates
      let successCount = 0;
      let errorCount = 0;

      for (const update of updates) {
        try {
          const res = await fetch("/api/imagenes", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(update),
          });
          const data = await res.json();
          if (data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error("Error updating image:", error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        setMessage(`✅ ${successCount} imagen(es) actualizada(s) exitosamente`);
      } else {
        setMessage(`⚠️ ${successCount} actualizadas, ${errorCount} errores`);
      }

      setSelectedImages(new Set());
      setShowBulkEditModal(false);
      setBulkEditType(null);
      await loadData(true);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error in bulk edit:", error);
      setMessage("❌ Error al actualizar imágenes");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="font-medium text-muted-foreground">Cargando contenido...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Contenido y galería"
        description="Sube imágenes, asígnalas a servicios y marca cuáles aparecen en tu landing."
      />

      {message && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center text-sm font-medium">
          {message}
        </div>
      )}

      <SurfaceCard className="mb-6" padding="default">
        <div className="flex flex-col justify-between gap-4">
          {/* Filters */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <select
              value={filterGaleria}
              onChange={(e) => setFilterGaleria(e.target.value)}
              className="input-field text-sm"
            >
              <option value="">Todas las galerías</option>
              <option value="dashboard">Nuestros Trabajos (landing)</option>
              <option value="inspiracion">Galería Inspiración (reserva)</option>
            </select>

            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="input-field text-sm"
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
              className="input-field text-sm"
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
            <Button
              onClick={() => setShowCategoriaModal(true)}
              disabled={saving}
              variant="outlined-primary"
              size="sm"
              icon={<PlusIcon />}
              className="flex-1 sm:flex-none"
            >
              Categoría
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setShowUploadModal(true);
              }}
              disabled={saving}
              size="sm"
              icon={<PlusIcon />}
              className="flex-1 sm:flex-none"
            >
              Nueva Imagen
            </Button>
          </div>
        </div>

        {/* Selection and Bulk Actions Bar */}
        {filteredImages.filter((img) => img.blobUrl).length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    selectedImages.size > 0 &&
                    selectedImages.size ===
                      filteredImages.filter((img) => img.blobUrl).length
                  }
                  onChange={toggleSelectAll}
                  className="size-4 rounded border-border text-primary focus:ring-ring"
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {selectedImages.size === 0 ?
                    "Seleccionar todo"
                  : `${selectedImages.size} seleccionada(s)`}
                </span>
              </div>

              {selectedImages.size > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => openBulkEditModal("categorias")}
                    disabled={saving}
                    variant="primary"
                    size="sm"
                  >
                    Categorías
                  </Button>
                  <Button
                    onClick={() => openBulkEditModal("servicios")}
                    disabled={saving}
                    variant="primary"
                    size="sm"
                  >
                    Servicios
                  </Button>
                  <Button
                    onClick={() => openBulkEditModal("galerias")}
                    disabled={saving}
                    variant="primary"
                    size="sm"
                  >
                    Galerías
                  </Button>
                  <Button
                    onClick={handleBulkDelete}
                    disabled={saving}
                    variant="danger"
                    size="sm"
                    icon={<TrashIcon />}
                  >
                    Eliminar
                  </Button>
                  <Button
                    onClick={() => setSelectedImages(new Set())}
                    disabled={saving}
                    variant="ghost"
                    size="sm"
                    icon={<XIcon />}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter summary */}
        <div className="mt-3 text-sm text-muted-foreground">
          Mostrando {filteredImages.filter((img) => img.blobUrl).length} de{" "}
          {imagenes.length} imágenes
          {imagenes.some((img) => !img.blobUrl) && (
            <span className="ml-2 font-semibold text-orange-600 dark:text-orange-400">
              {imagenes.filter((img) => !img.blobUrl).length} imágenes sin migrar
            </span>
          )}
        </div>
      </SurfaceCard>

      {/* Migration Warning Banner */}
      {imagenes.some((img) => !img.blobUrl) && (
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-xl">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-bold text-orange-900 dark:text-orange-200 mb-2">
                Imágenes antiguas detectadas
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-300 mb-3">
                Tienes {imagenes.filter((img) => !img.blobUrl).length} imágenes
                que usan el sistema antiguo (base64 en MongoDB). Estas imágenes
                NO se mostrarán hasta que sean migradas a Vercel Blob.
              </p>
              <a
                href="/api/migrate-images"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                🚀 Migrar imágenes ahora
              </a>
              <p className="text-xs text-orange-700 dark:text-orange-400 mt-2">
                La migración puede tardar unos minutos. Abre el enlace en una
                nueva pestaña para ver el progreso.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Images Grid */}
      <div className="relative">
        {/* Reloading Overlay */}
        {reloading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-30 rounded-2xl flex items-center justify-center">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">
                🔄 Actualizando galería...
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Cargando nuevas imágenes
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredImages
            .filter((img) => img.blobUrl)
            .map((imagen) => (
              <div
                key={imagen._id}
                className={`group bg-white dark:bg-gray-800/50 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 ${
                  selectedImages.has(imagen._id!) ?
                    "border-blue-500 dark:border-blue-400"
                  : "border-gray-200 dark:border-white/10"
                } hover:scale-105`}
              >
                {/* Image */}
                <div
                  className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 cursor-pointer relative overflow-hidden"
                  onClick={() => openViewModal(imagen)}
                >
                  {/* Selection Checkbox */}
                  <div
                    className="absolute top-2 right-2 z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedImages.has(imagen._id!)}
                      onChange={() => toggleImageSelection(imagen._id!)}
                      className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-lg"
                    />
                  </div>

                  {loadingImages.has(imagen._id!) && (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"></div>
                  )}
                  <Image
                    src={imagen.blobUrl}
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
                      <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-lg backdrop-blur-sm flex items-center gap-1">
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
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span>Dashboard</span>
                      </span>
                    )}
                    {imagen.enGaleriaInspiracion && (
                      <span className="px-2.5 py-1 bg-violet-600 text-white text-xs font-semibold rounded-lg shadow-lg backdrop-blur-sm flex items-center gap-1">
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
                        <span>Inspiración</span>
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
                    <Button
                      onClick={() => openEditModal(imagen)}
                      disabled={saving}
                      variant="outlined-warning"
                      icon={<EditIcon />}
                      size="sm"
                      className="flex-1"
                    >
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button
                      onClick={() => handleDelete(imagen._id!)}
                      disabled={saving}
                      loading={saving}
                      variant="outlined-danger"
                      icon={<TrashIcon />}
                      size="sm"
                      className="flex-1"
                    >
                      <span className="hidden sm:inline">Eliminar</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
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
              <Button
                onClick={() => setShowUploadModal(false)}
                variant="ghost"
                size="sm"
                icon={<CloseIcon />}
                aria-label="Cerrar"
              />
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
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
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
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                          />
                        </svg>
                        {uploadedFiles.length}{" "}
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

                {/* Upload Progress */}
                {saving && uploadProgress.total > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                        📤 Subiendo imágenes...
                      </span>
                      <span className="text-sm font-bold text-blue-900 dark:text-blue-300">
                        {uploadProgress.current} / {uploadProgress.total}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-3 mb-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-violet-500 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end"
                        style={{
                          width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                        }}
                      >
                        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                      </div>
                    </div>

                    {/* Files List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {uploadProgress.files.map((file, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
                            file.status === "completed" ?
                              "bg-green-50 dark:bg-green-900/20"
                            : file.status === "error" ?
                              "bg-red-50 dark:bg-red-900/20"
                            : file.status === "processing" ?
                              "bg-blue-100 dark:bg-blue-900/30"
                            : "bg-gray-50 dark:bg-gray-800/50"
                          }`}
                        >
                          {/* Status Icon */}
                          <div className="flex-shrink-0">
                            {file.status === "completed" && (
                              <svg
                                className="w-5 h-5 text-green-600 dark:text-green-400"
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
                            )}
                            {file.status === "error" && (
                              <svg
                                className="w-5 h-5 text-red-600 dark:text-red-400"
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
                            )}
                            {file.status === "processing" && (
                              <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            )}
                            {file.status === "pending" && (
                              <svg
                                className="w-5 h-5 text-gray-400 dark:text-gray-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            )}
                          </div>

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium truncate ${
                                file.status === "completed" ?
                                  "text-green-800 dark:text-green-300"
                                : file.status === "error" ?
                                  "text-red-800 dark:text-red-300"
                                : file.status === "processing" ?
                                  "text-blue-800 dark:text-blue-300"
                                : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {file.name}
                            </p>
                            {file.error && (
                              <p className="text-red-700 dark:text-red-400 text-xs mt-1">
                                {file.error}
                              </p>
                            )}
                          </div>

                          {/* Status Label */}
                          <div className="flex-shrink-0">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                file.status === "completed" ?
                                  "bg-green-200 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                                : file.status === "error" ?
                                  "bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-300"
                                : file.status === "processing" ?
                                  "bg-blue-200 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {file.status === "completed" && (
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                              {file.status === "error" && (
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              )}
                              {file.status === "processing" && "..."}
                              {file.status === "pending" && (
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
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions - Moved inside form */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      resetForm();
                    }}
                    disabled={saving}
                    variant="outlined-secondary"
                    icon={<CloseIcon />}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    loading={saving}
                    variant="primary"
                    icon={<SaveIcon />}
                    className="flex-1"
                  >
                    Subir Imagen{uploadedFiles.length > 1 ? "es" : ""}
                  </Button>
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Editar Imagen
              </h3>
              <Button
                onClick={() => setShowEditModal(false)}
                variant="ghost"
                size="sm"
                icon={<CloseIcon />}
                aria-label="Cerrar"
              />
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
                  <Button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    disabled={saving}
                    variant="outlined-secondary"
                    icon={<CloseIcon />}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    loading={saving}
                    variant="primary"
                    icon={<SaveIcon />}
                    className="flex-1"
                  >
                    Actualizar
                  </Button>
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
                  src={selectedImage.blobUrl}
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
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCategoriaModal(false);
                      setCategoriaForm({ nombre: "", descripcion: "" });
                    }}
                    disabled={saving}
                    variant="outlined-secondary"
                    icon={<CloseIcon />}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    loading={saving}
                    variant="primary"
                    icon={<SaveIcon />}
                    className="flex-1"
                  >
                    Crear
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && bulkEditType && (
        <BulkEditModal
          type={bulkEditType}
          categorias={categorias}
          servicios={servicios}
          selectedCount={selectedImages.size}
          onClose={() => {
            setShowBulkEditModal(false);
            setBulkEditType(null);
          }}
          onApply={handleBulkEdit}
          saving={saving}
        />
      )}
    </>
  );
}

// Bulk Edit Modal Component
function BulkEditModal({
  type,
  categorias,
  servicios,
  selectedCount,
  onClose,
  onApply,
  saving,
}: {
  type: "categorias" | "servicios" | "galerias";
  categorias: Categoria[];
  servicios: Servicio[];
  selectedCount: number;
  onClose: () => void;
  onApply: (action: "add" | "remove", values: any) => void;
  saving: boolean;
}) {
  const [action, setAction] = useState<"add" | "remove">("add");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [gallerySettings, setGallerySettings] = useState({
    dashboard: false,
    inspiracion: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === "galerias") {
      onApply(action, gallerySettings);
    } else {
      if (selectedItems.length === 0) {
        alert("Debe seleccionar al menos un elemento");
        return;
      }
      onApply(action, selectedItems);
    }
  };

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getTitle = () => {
    switch (type) {
      case "categorias":
        return "📂 Editar Categorías en Masa";
      case "servicios":
        return "💅 Editar Servicios en Masa";
      case "galerias":
        return "🖼️ Editar Galerías en Masa";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {getTitle()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {selectedCount} imagen(es) seleccionada(s)
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            icon={<CloseIcon />}
            aria-label="Cerrar"
          />
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {type !== "galerias" && (
              <>
                {/* Action Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Acción
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value="add"
                        checked={action === "add"}
                        onChange={(e) => setAction(e.target.value as "add")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        ➕ Agregar a las seleccionadas
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value="remove"
                        checked={action === "remove"}
                        onChange={(e) => setAction(e.target.value as "remove")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        ➖ Quitar de las seleccionadas
                      </span>
                    </label>
                  </div>
                </div>

                {/* Items Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Seleccionar{" "}
                    {type === "categorias" ? "categorías" : "servicios"}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    {type === "categorias" ?
                      categorias.map((cat) => (
                        <label
                          key={cat._id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedItems.includes(cat._id!) ?
                              "bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(cat._id!)}
                            onChange={() => toggleItem(cat._id!)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {cat.nombre}
                            </span>
                            {cat.descripcion && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {cat.descripcion}
                              </p>
                            )}
                          </div>
                        </label>
                      ))
                    : servicios.map((srv) => (
                        <label
                          key={srv._id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedItems.includes(srv._id!) ?
                              "bg-violet-100 dark:bg-violet-900/30 border-violet-500 dark:border-violet-400"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(srv._id!)}
                            onChange={() => toggleItem(srv._id!)}
                            className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {srv.nombre}
                            </span>
                            {srv.descripcion && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {srv.descripcion}
                              </p>
                            )}
                          </div>
                        </label>
                      ))
                    }
                  </div>
                  {selectedItems.length > 0 && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                      ✓ {selectedItems.length}{" "}
                      {type === "categorias" ? "categoría(s)" : "servicio(s)"}{" "}
                      seleccionada(s)
                    </p>
                  )}
                </div>
              </>
            )}

            {type === "galerias" && (
              <>
                {/* Gallery Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Configuración de Galerías
                  </label>
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={gallerySettings.dashboard}
                        onChange={(e) =>
                          setGallerySettings({
                            ...gallerySettings,
                            dashboard: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          💼 Nuestros Trabajos (Dashboard)
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Mostrar en la galería principal del dashboard
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={gallerySettings.inspiracion}
                        onChange={(e) =>
                          setGallerySettings({
                            ...gallerySettings,
                            inspiracion: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500 mt-0.5"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ✨ Galería de Inspiración (Reserva)
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Mostrar en la galería de inspiración para clientes
                        </p>
                      </div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                    ⚠️ Nota: Esta configuración se aplicará a todas las imágenes
                    seleccionadas, reemplazando su configuración actual de
                    galerías.
                  </p>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                onClick={onClose}
                disabled={saving}
                variant="outlined-secondary"
                icon={<CloseIcon />}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  saving || (type !== "galerias" && selectedItems.length === 0)
                }
                loading={saving}
                variant="primary"
                icon={<CheckIcon />}
                className="flex-1"
              >
                Aplicar a {selectedCount} imagen(es)
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
