"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Categoria, ImageData, Servicio } from "@/lib/types";
import { shouldUnoptimizeImage } from "@/lib/image-url";
import ReservaPhotoSession, {
  revokePhoto,
  type SessionPhoto,
} from "@/components/admin/ReservaPhotoSession";

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
  const [pendingPhotos, setPendingPhotos] = useState<SessionPhoto[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ImageData[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [selectedCategoriaIds, setSelectedCategoriaIds] = useState<string[]>([]);
  const [sessionOpen, setSessionOpen] = useState(false);

  const appliedServicios = servicios.filter((s) =>
    servicioIds.includes(s._id!)
  );
  const activeCategorias = categorias.filter((c) => c.activo);

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
      pendingPhotos.forEach((p) => revokePhoto(p));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotosChange = useCallback((photos: SessionPhoto[]) => {
    setPendingPhotos((prev) => {
      const removed = prev.filter((p) => !photos.find((n) => n.id === p.id));
      removed.forEach((p) => revokePhoto(p));
      return photos;
    });
  }, []);

  const toggleCategoria = (categoriaId: string) => {
    setSelectedCategoriaIds((prev) =>
      prev.includes(categoriaId)
        ? prev.filter((id) => id !== categoriaId)
        : [...prev, categoriaId]
    );
  };

  const totalNew = pendingPhotos.length;
  const totalSaved = existingPhotos.length;

  return (
    <>
      <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-5 mt-2">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Fotos del trabajo
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              Se publican en &quot;Nuestros Trabajos&quot; al guardar la reserva.
            </p>
          </div>
          {(totalNew > 0 || totalSaved > 0) && (
            <span className="shrink-0 inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold">
              {totalNew + totalSaved}
            </span>
          )}
        </div>

        {appliedServicios.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Servicios etiquetados
            </p>
            <div className="flex flex-wrap gap-1.5">
              {appliedServicios.map((s) => (
                <span
                  key={s._id}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800"
                >
                  {s.nombre}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeCategorias.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Categorías (opcional)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeCategorias.map((c) => {
                const selected = selectedCategoriaIds.includes(c._id!);
                return (
                  <button
                    key={c._id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleCategoria(c._id!)}
                    className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
                      selected
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-600"
                    } disabled:opacity-50`}
                  >
                    {c.nombre}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loadingExisting && totalNew === 0 && totalSaved === 0 && (
          <div className="flex items-center gap-2 py-4 justify-center text-sm text-gray-500">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Cargando fotos...
          </div>
        )}

        {/* Resumen compacto */}
        {(totalNew > 0 || totalSaved > 0) && (
          <div className="mb-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {existingPhotos.map((img) => (
                <div
                  key={img._id}
                  className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-700"
                >
                  <Image
                    src={img.blobUrl}
                    alt={img.nombre}
                    fill
                    className="object-cover"
                    unoptimized={shouldUnoptimizeImage(img.blobUrl)}
                    sizes="56px"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-[8px] text-white text-center font-bold py-0.5">
                    OK
                  </span>
                </div>
              ))}
              {pendingPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 border-blue-400"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.previewUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-[8px] text-white text-center font-bold py-0.5">
                    NUEVA
                  </span>
                </div>
              ))}
            </div>
            {totalNew > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                {totalNew} foto{totalNew !== 1 ? "s" : ""} lista
                {totalNew !== 1 ? "s" : ""} para subir al guardar
              </p>
            )}
          </div>
        )}

        {!disabled && (
          <button
            type="button"
            onClick={() => setSessionOpen(true)}
            className="w-full py-4 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm flex items-center justify-center gap-2 min-h-[52px] transition-colors"
          >
            <span className="text-lg" aria-hidden>
              📷
            </span>
            {totalNew > 0 ? "Gestionar fotos" : "Agregar fotos del trabajo"}
            {totalNew > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {totalNew}
              </span>
            )}
          </button>
        )}

        {!disabled && totalNew === 0 && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-2 leading-relaxed">
            Modo sesión: captura varias fotos o elige muchas de la galería de
            una vez, luego revisa en grande antes de guardar.
          </p>
        )}
      </div>

      <ReservaPhotoSession
        open={sessionOpen}
        onClose={() => setSessionOpen(false)}
        photos={pendingPhotos}
        onPhotosChange={handlePhotosChange}
        existingPhotos={existingPhotos}
        disabled={disabled}
      />
    </>
  );
}
