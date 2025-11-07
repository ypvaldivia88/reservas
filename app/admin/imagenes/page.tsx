"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageData } from "@/lib/types";
import { preprocessImage, base64ToDataURL, isValidImageFile, isValidFileSize } from "@/lib/imageUtils";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  SaveIcon,
  CloseIcon,
} from "@/components/ui/Icons";

export default function ImagenesAdmin() {
  const [imagenes, setImagenes] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageData | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadImagenes();
  }, []);

  const loadImagenes = async () => {
    try {
      const res = await fetch("/api/imagenes");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setImagenes(data.data);
        }
      }
    } catch (error) {
      console.error("Error cargando imágenes:", error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      let imageData: {
        base64Data: string;
        mimeType: string;
        size: number;
      } | null = null;

      if (uploadedFile) {
        imageData = await preprocessImage(uploadedFile);
      } else if (!editingImage) {
        setMessage("❌ Debe seleccionar una imagen");
        return;
      }

      const payload =
        editingImage ?
          {
            _id: editingImage._id,
            nombre: formData.nombre || editingImage.nombre,
            descripcion: formData.descripcion || editingImage.descripcion,
            ...(imageData && imageData),
          }
        : {
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            ...imageData,
          };

      const url = "/api/imagenes";
      const method = editingImage ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        resetForm();
        loadImagenes();
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
    if (!confirm("¿Está seguro de eliminar esta imagen?")) return;

    try {
      const res = await fetch(`/api/imagenes?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        loadImagenes();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Error de conexión");
    }
  };

  const handleEdit = (imagen: ImageData) => {
    setEditingImage(imagen);
    setFormData({
      nombre: imagen.nombre,
      descripcion: imagen.descripcion || "",
    });
    setUploadedFile(null);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ nombre: "", descripcion: "" });
    setUploadedFile(null);
    setEditingImage(null);
    setMessage("");
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🖼️ Gestión de Imágenes
              </h1>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              icon={<PlusIcon />}
            >
              Nueva Imagen
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
          {imagenes.map((imagen) => (
            <div
              key={imagen._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative">
                <Image
                  src={imagen.blobUrl}
                  alt={`Image: ${imagen.nombre}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {imagen.nombre}
                </h3>
                {imagen.descripcion && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {imagen.descripcion}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                  {Math.round((imagen.size || 0) / 1024)} KB
                </p>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleEdit(imagen)}
                    variant="outlined-warning"
                    icon={<EditIcon />}
                    size="sm"
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() => handleDelete(imagen._id!)}
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
          ))}
        </div>

        {imagenes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No hay imágenes. Crea una nueva para comenzar.
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
                {editingImage ? "Editar Imagen" : "Nueva Imagen"}
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
                    required={!editingImage}
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
                    Imagen {editingImage ? "(opcional para actualizar)" : "*"}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required={!editingImage}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Máximo 5MB. Formatos: JPEG, PNG, GIF, WebP
                  </p>
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
                    {editingImage ? "Actualizar" : "Crear"}
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
