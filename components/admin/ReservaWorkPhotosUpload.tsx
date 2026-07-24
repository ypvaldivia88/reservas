"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Categoria, ImageData, Servicio } from "@/lib/types";
import { isValidFileSize, isValidImageFile } from "@/lib/imageUtils";
import { shouldUnoptimizeImage } from "@/lib/image-url";

interface PendingPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

interface ReservaWorkPhotosUploadProps {
  reservaId?: string;
  servicioIds: string[];
  servicios: Servicio[];
  categorias: Categoria[];
  disabled?: boolean;
  onPendingChange?: (files: File[]) => void;
  onCategoriaIdsChange?: (ids: string[]) => void;
}

export default function ReservaWorkPhotosUpload({
  reservaId,
  servicioIds,
  servicios,
  categorias,
  disabled = false,
  onPendingChange,
  onCategoriaIdsChange,
}: ReservaWorkPhotosUploadProps) {
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ImageData[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [selectedCategoriaIds, setSelectedCategoriaIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appliedServicios = servicios.filter((s) =>
    servicioIds.includes(s._id!)
  );

  useEffect(() => {
    onPendingChange?.(pendingPhotos.map((p) => p.file));
  }, [pendingPhotos, onPendingChange]);

  useEffect(() => {
    onCategoriaIdsChange?.(selectedCategoriaIds);
  }, [selectedCategoriaIds, onCategoriaIdsChange]);

  useEffect(() => {
    if (!reservaId) {
      setExistingPhotos([]);
      return;
    }

    let cancelled = false;
    setLoadingExisting(true);

    fetch(`/api/imagenes?reservaId=${encodeURIComponent(reservaId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) {
          setExistingPhotos(data.data);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoadingExisting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reservaId]);

  useEffect(() => {
    return () => {
      pendingPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPending: PendingPhoto[] = [];

    for (const file of Array.from(files)) {
      if (!isValidImageFile(file) || !isValidFileSize(file, 5)) continue;

      newPending.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setPendingPhotos((prev) => [...prev, ...newPending]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePending = (id: string) => {
    setPendingPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const toggleCategoria = (categoriaId: string) => {
    setSelectedCategoriaIds((prev) =>
      prev.includes(categoriaId)
        ? prev.filter((id) => id !== categoriaId)
        : [...prev, categoriaId]
    );
  };

  return (
    <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-6 mt-2">
      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
        Fotos del trabajo
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Las fotos se guardan automáticamente en &quot;Nuestros Trabajos&quot; de
        tu sitio web. Las más recientes aparecen primero en la portada.
      </p>

      {appliedServicios.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Servicios aplicados (se etiquetan automáticamente)
          </p>
          <div className="flex flex-wrap gap-2">
            {appliedServicios.map((s) => (
              <span
                key={s._id}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
              >
                {s.nombre}
              </span>
            ))}
          </div>
        </div>
      )}

      {categorias.filter((c) => c.activo).length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Categorías (opcional)
          </p>
          <div className="flex flex-wrap gap-2">
            {categorias
              .filter((c) => c.activo)
              .map((c) => (
                <button
                  key={c._id}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleCategoria(c._id!)}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategoriaIds.includes(c._id!)
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 ring-2 ring-purple-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  } disabled:opacity-50`}
                >
                  {c.nombre}
                </button>
              ))}
          </div>
        </div>
      )}

      {loadingExisting && (
        <p className="text-xs text-gray-500 mb-3">Cargando fotos existentes...</p>
      )}

      {existingPhotos.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Fotos ya guardadas ({existingPhotos.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {existingPhotos.map((img) => (
              <div
                key={img._id}
                className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
              >
                <Image
                  src={img.blobUrl}
                  alt={img.titulo || img.nombre}
                  fill
                  className="object-cover"
                  unoptimized={shouldUnoptimizeImage(img.blobUrl)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {!disabled && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors flex flex-col items-center gap-2"
          >
            <span className="text-2xl">📷</span>
            <span>Agregar fotos del trabajo</span>
            <span className="text-xs text-gray-400">
              JPEG, PNG, GIF o WebP · Máx. 5 MB
            </span>
          </button>

          {pendingPhotos.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Por subir al guardar ({pendingPhotos.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {pendingPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-blue-300 dark:border-blue-600 group"
                  >
                    <Image
                      src={photo.previewUrl}
                      alt="Vista previa"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => removePending(photo.id)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Quitar foto"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
