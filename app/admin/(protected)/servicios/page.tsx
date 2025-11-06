"use client";
import { useState, useEffect } from "react";
import { Servicio, ImageData } from "@/lib/types";
import Image from "next/image";

export default function ServiciosAdmin() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [imagenes, setImagenes] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: 0,
    duracion: 0,
    imagenId: "",
    activo: true,
    orden: 0,
  });
  const [message, setMessage] = useState("");
  const [showInitBanner, setShowInitBanner] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resServicios, resImagenes] = await Promise.all([
        fetch("/api/servicios"),
        fetch("/api/imagenes"),
      ]);

      if (resServicios.ok) {
        const data = await resServicios.json();
        if (data.success) {
          setServicios(data.data);
          // Show init banner if no services exist
          setShowInitBanner(data.data.length === 0);
        }
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

  const handleInitServicios = async () => {
    if (!confirm("¿Deseas crear los 4 servicios por defecto (Gel/Softgel, Base Rubber, Gel Dipping, Pedicure)?")) return;
    
    setSaving(true);
    setMessage("⏳ Inicializando servicios...");
    
    try {
      const res = await fetch("/api/servicios/init", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setShowInitBanner(false);
        await loadData();
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Error al inicializar servicios");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      const payload =
        editingServicio ? { _id: editingServicio._id, ...formData } : formData;

      const url = "/api/servicios";
      const method = editingServicio ? "PATCH" : "POST";

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
    if (!confirm("¿Está seguro de eliminar este servicio?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/servicios?id=${id}`, { method: "DELETE" });
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

  const handleEdit = (servicio: Servicio) => {
    setEditingServicio(servicio);
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precio: servicio.precio || 0,
      duracion: servicio.duracion || 0,
      imagenId: servicio.imagenId || "",
      activo: servicio.activo,
      orden: servicio.orden || 0,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      precio: 0,
      duracion: 0,
      imagenId: "",
      activo: true,
      orden: 0,
    });
    setEditingServicio(null);
    setMessage("");
  };

  const getImageById = (id: string | undefined) => {
    if (!id) return null;
    return imagenes.find((img) => img._id === id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            Cargando servicios...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
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
              <span>Servicios</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Administra los servicios que se muestran en la página principal
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
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
            <span>Nuevo Servicio</span>
          </button>
        </div>
      </div>
      {/* Init Banner */}
      {showInitBanner && (
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl shadow-lg">
          <div className="flex items-start space-x-4">
            <svg
              className="w-10 h-10 text-blue-600 dark:text-blue-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                ¡Bienvenido a la Gestión de Servicios!
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                No tienes servicios creados aún. Puedes inicializar los 4
                servicios por defecto (Gel/Softgel, Base Rubber, Gel Dipping,
                Pedicure) o crear los tuyos propios desde cero.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleInitServicios}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
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
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  <span>Inicializar Servicios por Defecto</span>
                </button>
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                    setShowInitBanner(false);
                  }}
                  disabled={saving}
                  className="px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
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
                  <span>Crear Servicio Personalizado</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p>{message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicios.map((servicio) => {
          const imagen = getImageById(servicio.imagenId);
          return (
            <div
              key={servicio._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                {imagen ?
                  <Image
                    src={imagen.blobUrl}
                    alt={`Service image for ${servicio.nombre}`}
                    fill
                    className="object-cover"
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
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  </div>
                }
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {servicio.nombre}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      servicio.activo ?
                        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {servicio.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {servicio.descripcion}
                </p>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    ${servicio.precio || 0}
                  </span>
                  <span className="flex items-center gap-1">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {servicio.duracion || 0} min
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(servicio)}
                    disabled={saving}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(servicio._id!)}
                    disabled={saving}
                    className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ?
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Eliminando...
                      </span>
                    : "Eliminar"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {servicios.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No hay servicios. Crea uno nuevo para comenzar.
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
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
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                <span>
                  {editingServicio ? "Editar Servicio" : "Nuevo Servicio"}
                </span>
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
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
                onSubmit={handleSubmit}
                className="space-y-6"
                id="servicio-form"
              >
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
                    Descripción *
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Precio ($)
                    </label>
                    <input
                      type="number"
                      value={formData.precio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          precio: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duración (min)
                    </label>
                    <input
                      type="number"
                      value={formData.duracion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duracion: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Imagen de Fondo
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Selecciona una imagen del pool de imágenes subidas. Esta
                    será la imagen de fondo de la tarjeta del servicio.
                  </p>

                  {/* Visual Image Selector */}
                  <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                    {/* Sin imagen option */}
                    <div
                      onClick={() => setFormData({ ...formData, imagenId: "" })}
                      className={`relative aspect-square rounded-lg cursor-pointer border-2 transition-all ${
                        formData.imagenId === "" ?
                          "border-blue-500 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                      }`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg">
                        <span className="text-3xl">🚫</span>
                      </div>
                      <p className="absolute bottom-1 left-0 right-0 text-center text-xs font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 py-1 rounded-b-lg">
                        Sin imagen
                      </p>
                    </div>

                    {/* Image options */}
                    {imagenes
                      .filter((img) => img.blobUrl)
                      .map((img) => (
                        <div
                          key={img._id}
                          onClick={() =>
                            setFormData({ ...formData, imagenId: img._id! })
                          }
                          className={`relative aspect-square rounded-lg cursor-pointer border-2 transition-all overflow-hidden ${
                            formData.imagenId === img._id ?
                              "border-blue-500 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800"
                            : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                          }`}
                        >
                          <div className="relative w-full h-full">
                            <Image
                              src={img.blobUrl}
                              alt={img.nombre}
                              fill
                              className="object-cover"
                            />
                          </div>
                          {formData.imagenId === img._id && (
                            <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                            {img.nombre}
                          </div>
                        </div>
                      ))}
                  </div>

                  {imagenes.filter((img) => img.blobUrl).length === 0 && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg mt-2">
                      <p className="text-sm text-orange-800 dark:text-orange-300 flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        <span>
                          No hay imágenes disponibles. Ve a{" "}
                          <a
                            href="/admin/contenido"
                            className="underline font-semibold hover:text-orange-900 dark:hover:text-orange-200"
                          >
                            Contenido
                          </a>{" "}
                          para subir imágenes.
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.activo}
                        onChange={(e) =>
                          setFormData({ ...formData, activo: e.target.checked })
                        }
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Servicio Activo
                      </span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Orden de visualización
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

                {message && (
                  <div
                    className={`p-4 rounded-lg ${
                      message.includes("✅") ?
                        "bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800"
                      : message.includes("❌") ?
                        "bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800"
                      : "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        message.includes("✅") ?
                          "text-green-800 dark:text-green-300"
                        : message.includes("❌") ?
                          "text-red-800 dark:text-red-300"
                        : "text-blue-800 dark:text-blue-300"
                      }`}
                    >
                      {message}
                    </p>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                disabled={saving}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="servicio-form"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {saving ?
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    {editingServicio ? "Actualizando..." : "Creando..."}
                  </span>
                : editingServicio ?
                  "💾 Actualizar Servicio"
                : "✨ Crear Servicio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
