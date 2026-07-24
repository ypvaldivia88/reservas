"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Categoria, ImageData, Servicio } from "@/lib/types";
import { isValidFileSize, isValidImageFile } from "@/lib/imageUtils";
import { shouldUnoptimizeImage } from "@/lib/image-url";
import Image from "next/image";

interface PendingPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

type PreviewItem =
  | { kind: "pending"; id: string; url: string; label: string }
  | { kind: "saved"; id: string; url: string; label: string };

interface ReservaWorkPhotosUploadProps {
  reservaId?: string;
  servicioIds: string[];
  servicios: Servicio[];
  categorias: Categoria[];
  disabled?: boolean;
  onPendingChange?: (files: File[]) => void;
  onCategoriaIdsChange?: (ids: string[]) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null);
  const [fileError, setFileError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
      pendingPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!previewItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewItem(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewItem]);

  const processFiles = useCallback((files: FileList | File[]) => {
    setFileError("");
    const accepted: PendingPhoto[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      if (!isValidImageFile(file)) {
        errors.push(`${file.name}: formato no válido`);
        continue;
      }
      if (!isValidFileSize(file, 5)) {
        errors.push(`${file.name}: supera 5 MB`);
        continue;
      }
      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (errors.length > 0) {
      setFileError(errors[0]);
    }

    if (accepted.length > 0) {
      setPendingPhotos((prev) => [...prev, ...accepted]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processFiles(files);
    e.target.value = "";
  };

  const removePending = (id: string) => {
    setPendingPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
    if (previewItem?.kind === "pending" && previewItem.id === id) {
      setPreviewItem(null);
    }
  };

  const toggleCategoria = (categoriaId: string) => {
    setSelectedCategoriaIds((prev) =>
      prev.includes(categoriaId)
        ? prev.filter((id) => id !== categoriaId)
        : [...prev, categoriaId]
    );
  };

  const totalPhotos = existingPhotos.length + pendingPhotos.length;

  return (
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
        {totalPhotos > 0 && (
          <span className="shrink-0 inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold">
            {totalPhotos}
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

      {/* Galería unificada: guardadas + pendientes */}
      {(loadingExisting || totalPhotos > 0) && (
        <div className="mb-4">
          {loadingExisting && totalPhotos === 0 && (
            <div className="flex items-center gap-2 py-6 justify-center text-sm text-gray-500">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Cargando fotos...
            </div>
          )}

          {totalPhotos > 0 && (
            <>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Vista previa
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
                {existingPhotos.map((img) => (
                  <button
                    key={img._id}
                    type="button"
                    onClick={() =>
                      setPreviewItem({
                        kind: "saved",
                        id: img._id!,
                        url: img.blobUrl,
                        label: img.titulo || img.nombre,
                      })
                    }
                    className="relative shrink-0 snap-start w-[calc(50%-6px)] sm:w-36 aspect-[4/5] rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 active:scale-[0.98] transition-transform"
                  >
                    <Image
                      src={img.blobUrl}
                      alt={img.titulo || img.nombre}
                      fill
                      className="object-cover"
                      unoptimized={shouldUnoptimizeImage(img.blobUrl)}
                      sizes="(max-width: 640px) 50vw, 144px"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 text-left">
                      <span className="block text-[10px] font-semibold text-emerald-300 uppercase tracking-wide">
                        Guardada
                      </span>
                    </span>
                  </button>
                ))}

                {pendingPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative shrink-0 snap-start w-[calc(50%-6px)] sm:w-36 aspect-[4/5] rounded-xl overflow-hidden border-2 border-blue-400 dark:border-blue-500 bg-gray-100 dark:bg-gray-700"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewItem({
                          kind: "pending",
                          id: photo.id,
                          url: photo.previewUrl,
                          label: photo.file.name,
                        })
                      }
                      className="absolute inset-0 w-full h-full active:scale-[0.98] transition-transform"
                      aria-label={`Ver ${photo.file.name}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.previewUrl}
                        alt={photo.file.name}
                        className="w-full h-full object-cover"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => removePending(photo.id)}
                      disabled={disabled}
                      className="absolute top-1.5 right-1.5 z-10 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full shadow-lg text-lg font-bold leading-none active:bg-red-600 disabled:opacity-50"
                      aria-label="Quitar foto"
                    >
                      ×
                    </button>

                    <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 pointer-events-none">
                      <span className="block text-[10px] font-semibold text-blue-300 uppercase tracking-wide">
                        Nueva
                      </span>
                      <span className="block text-[10px] text-white/80 truncate mt-0.5">
                        {photo.file.name}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              {pendingPhotos.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {pendingPhotos.length} foto{pendingPhotos.length !== 1 ? "s" : ""} se
                  subirán al guardar
                </p>
              )}
            </>
          )}
        </div>
      )}

      {fileError && (
        <p className="mb-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
          {fileError}
        </p>
      )}

      {!disabled && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
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
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 active:bg-blue-100 dark:active:bg-blue-900/40 transition-colors min-h-[88px]"
          >
            <span className="text-2xl" aria-hidden>
              📸
            </span>
            <span className="text-sm font-semibold">Tomar foto</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-700 transition-colors min-h-[88px]"
          >
            <span className="text-2xl" aria-hidden>
              🖼️
            </span>
            <span className="text-sm font-semibold">Elegir fotos</span>
            <span className="text-[10px] text-gray-400">Varias a la vez</span>
          </button>
        </div>
      )}

      {/* Lightbox de vista previa */}
      {previewItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa de foto"
          className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm"
          onClick={() => setPreviewItem(null)}
        >
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <div className="min-w-0 flex-1 pr-3">
              <p className="text-white text-sm font-medium truncate">
                {previewItem.label}
              </p>
              {previewItem.kind === "pending" && (() => {
                const photo = pendingPhotos.find((p) => p.id === previewItem.id);
                return (
                  <p className="text-white/60 text-xs">
                    Se subirá al guardar
                    {photo ? ` · ${formatFileSize(photo.file.size)}` : ""}
                  </p>
                );
              })()}
            </div>
            <button
              type="button"
              onClick={() => setPreviewItem(null)}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white text-xl font-bold active:bg-white/30"
              aria-label="Cerrar vista previa"
            >
              ×
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center p-4 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {previewItem.kind === "saved" ? (
              <div className="relative w-full h-full max-h-[70vh]">
                <Image
                  src={previewItem.url}
                  alt={previewItem.label}
                  fill
                  className="object-contain"
                  unoptimized={shouldUnoptimizeImage(previewItem.url)}
                  sizes="100vw"
                />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewItem.url}
                alt={previewItem.label}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>

          {previewItem.kind === "pending" && !disabled && (
            <div className="px-4 pb-6 pt-2 shrink-0 safe-area-bottom">
              <button
                type="button"
                onClick={() => removePending(previewItem.id)}
                className="w-full py-3.5 rounded-xl bg-red-500 text-white font-semibold text-sm active:bg-red-600 transition-colors"
              >
                Quitar esta foto
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
