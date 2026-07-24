"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageData } from "@/lib/types";
import { isValidFileSize, isValidImageFile } from "@/lib/imageUtils";
import { shouldUnoptimizeImage } from "@/lib/image-url";

export interface SessionPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

type SessionTab = "capture" | "gallery" | "review";

interface ReservaPhotoSessionProps {
  open: boolean;
  onClose: () => void;
  photos: SessionPhoto[];
  onPhotosChange: (photos: SessionPhoto[]) => void;
  existingPhotos?: ImageData[];
  disabled?: boolean;
}

function createSessionPhoto(file: File): SessionPhoto {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

function revokePhoto(photo: SessionPhoto) {
  URL.revokeObjectURL(photo.previewUrl);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SessionFilmstrip({
  photos,
  activeId,
  onSelect,
  onRemove,
  disabled,
}: {
  photos: SessionPhoto[];
  activeId?: string;
  onSelect: (id: string) => void;
  onRemove?: (id: string) => void;
  disabled?: boolean;
}) {
  if (photos.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-white/10 bg-black/80 backdrop-blur-md">
      <div className="px-3 pt-2 pb-1 flex items-center justify-between">
        <p className="text-xs font-medium text-white/70">
          {photos.length} en esta sesión
        </p>
        <p className="text-[10px] text-white/50">Toca para ver en grande</p>
      </div>
      <div className="flex gap-2 overflow-x-auto px-3 pb-3 snap-x snap-mandatory">
        {photos.map((photo, index) => {
          const isActive = photo.id === activeId;
          return (
            <div
              key={photo.id}
              className={`relative shrink-0 snap-start w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                isActive
                  ? "border-blue-400 ring-2 ring-blue-400/50 scale-105"
                  : "border-white/20 opacity-80"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(photo.id)}
                className="absolute inset-0 w-full h-full"
                aria-label={`Foto ${index + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
              {onRemove && !disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(photo.id);
                  }}
                  className="absolute -top-1 -right-1 z-10 w-6 h-6 bg-red-500 text-white rounded-full text-sm font-bold flex items-center justify-center shadow-lg"
                  aria-label="Quitar"
                >
                  ×
                </button>
              )}
              <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[9px] font-bold px-1 rounded">
                {index + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ReservaPhotoSession({
  open,
  onClose,
  photos,
  onPhotosChange,
  existingPhotos = [],
  disabled = false,
}: ReservaPhotoSessionProps) {
  const [tab, setTab] = useState<SessionTab>("capture");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [fileError, setFileError] = useState("");
  const [captureFlash, setCaptureFlash] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [useNativeCamera, setUseNativeCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef(0);

  const addFiles = useCallback(
    (files: FileList | File[], switchToReview = false) => {
      setFileError("");
      const accepted: SessionPhoto[] = [];
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
        accepted.push(createSessionPhoto(file));
      }

      if (errors.length > 0) setFileError(errors[0]);

      if (accepted.length > 0) {
        const next = [...photos, ...accepted];
        onPhotosChange(next);
        setReviewIndex(next.length - accepted.length);
        if (switchToReview) setTab("review");
      }
    },
    [photos, onPhotosChange]
  );

  const removePhoto = useCallback(
    (id: string) => {
      const photo = photos.find((p) => p.id === id);
      if (photo) revokePhoto(photo);
      const next = photos.filter((p) => p.id !== id);
      onPhotosChange(next);
      setReviewIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
    },
    [photos, onPhotosChange]
  );

  const startCamera = useCallback(async () => {
    if (useNativeCamera || typeof navigator === "undefined") return;

    setCameraError("");
    setCameraReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      setUseNativeCamera(true);
      setCameraError("");
    }
  }, [useNativeCamera]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    setTab(photos.length > 0 ? "review" : "capture");
    setReviewIndex(Math.max(0, photos.length - 1));
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      stopCamera();
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || tab !== "capture" || useNativeCamera) {
      stopCamera();
      return;
    }
    startCamera();
    return () => stopCamera();
  }, [open, tab, useNativeCamera, startCamera, stopCamera]);

  const captureFromCamera = useCallback(() => {
    const video = videoRef.current;
    if (!video || !cameraReady) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `foto-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        addFiles([file]);
        setCaptureFlash(true);
        setTimeout(() => setCaptureFlash(false), 200);
      },
      "image/jpeg",
      0.9
    );
  }, [cameraReady, addFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(files, tab === "gallery");
    }
    e.target.value = "";
  };

  const currentPhoto = photos[reviewIndex];

  const goPrev = () => setReviewIndex((i) => Math.max(0, i - 1));
  const goNext = () =>
    setReviewIndex((i) => Math.min(photos.length - 1, i + 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) < 50) return;
    if (diff < 0) goNext();
    else goPrev();
  };

  if (!open) return null;

  const tabs: { id: SessionTab; label: string; badge?: number }[] = [
    { id: "capture", label: "Capturar" },
    { id: "gallery", label: "Galería" },
    { id: "review", label: "Revisar", badge: photos.length },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-gray-950 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Sesión de fotos del trabajo"
    >
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 safe-area-top">
        <div className="min-w-0">
          <h2 className="text-base font-bold truncate">Fotos del trabajo</h2>
          <p className="text-xs text-white/60">
            {photos.length === 0
              ? "Toma o elige varias fotos de una vez"
              : `${photos.length} seleccionada${photos.length !== 1 ? "s" : ""}`}
            {existingPhotos.length > 0 &&
              ` · ${existingPhotos.length} ya guardada${existingPhotos.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 ml-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold active:bg-blue-700 min-h-[44px]"
        >
          Listo
        </button>
      </header>

      {/* Tab content */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {tab === "capture" && (
          <div className="flex-1 flex flex-col min-h-0">
            {useNativeCamera ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-5xl mb-4" aria-hidden>
                  📸
                </span>
                <p className="text-sm text-white/80 mb-6 max-w-xs">
                  Toma varias fotos seguidas. Cada una se agrega a tu sesión sin
                  perder las anteriores.
                </p>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full max-w-xs py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg active:bg-blue-700 disabled:opacity-50 min-h-[56px]"
                >
                  Tomar foto
                </button>
                {photos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTab("review")}
                    className="mt-4 text-sm text-blue-400 font-medium"
                  >
                    Ir a revisar ({photos.length}) →
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1 relative bg-black min-h-0">
                {cameraError && (
                  <p className="absolute top-4 inset-x-4 text-center text-sm text-red-400 z-10">
                    {cameraError}
                  </p>
                )}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {captureFlash && (
                  <div className="absolute inset-0 bg-white/40 pointer-events-none animate-pulse" />
                )}
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col items-center gap-3 bg-gradient-to-t from-black/80 to-transparent">
                  <button
                    type="button"
                    disabled={disabled || !cameraReady}
                    onClick={captureFromCamera}
                    className="w-16 h-16 rounded-full bg-white border-4 border-white/50 shadow-xl active:scale-95 transition-transform disabled:opacity-50"
                    aria-label="Capturar foto"
                  />
                  <p className="text-xs text-white/70">
                    Toca para capturar · {photos.length} en sesión
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "gallery" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <span className="text-5xl mb-4" aria-hidden>
              🖼️
            </span>
            <h3 className="text-lg font-bold mb-2">Elige varias de una vez</h3>
            <p className="text-sm text-white/70 mb-2 max-w-sm leading-relaxed">
              Abre tu galería y <strong className="text-white">selecciona todas</strong>{" "}
              las fotos del trabajo en un solo paso. No hace falta volver a
              navegar por carpetas.
            </p>
            <p className="text-xs text-white/50 mb-8 max-w-xs">
              En iPhone: toca &quot;Seleccionar&quot; arriba. En Android: mantén
              pulsado o usa el modo selección múltiple.
            </p>

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
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-sm py-4 rounded-2xl bg-white text-gray-900 font-bold text-lg active:bg-gray-100 disabled:opacity-50 min-h-[56px]"
            >
              Abrir galería
            </button>

            {photos.length > 0 && (
              <p className="mt-6 text-sm text-blue-400">
                Ya tienes {photos.length} foto{photos.length !== 1 ? "s" : ""} en
                esta sesión. Las nuevas se sumarán.
              </p>
            )}
          </div>
        )}

        {tab === "review" && (
          <div className="flex-1 flex flex-col min-h-0">
            {photos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-4xl mb-3" aria-hidden>
                  👆
                </span>
                <p className="text-sm text-white/70 mb-6">
                  Aún no hay fotos en esta sesión. Captura o elige desde la
                  galería.
                </p>
                <div className="flex gap-3 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={() => setTab("capture")}
                    className="flex-1 py-3 rounded-xl bg-blue-600 font-semibold text-sm"
                  >
                    Capturar
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("gallery")}
                    className="flex-1 py-3 rounded-xl bg-white/10 font-semibold text-sm"
                  >
                    Galería
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Large preview */}
                <div
                  className="flex-1 relative min-h-0 flex items-center justify-center bg-black"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {currentPhoto && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentPhoto.previewUrl}
                        alt={`Foto ${reviewIndex + 1}`}
                        className="max-w-full max-h-full object-contain"
                      />
                      <div className="absolute top-3 inset-x-0 flex justify-center">
                        <span className="bg-black/60 text-white text-xs font-medium px-3 py-1 rounded-full">
                          {reviewIndex + 1} / {photos.length} ·{" "}
                          {formatFileSize(currentPhoto.file.size)}
                        </span>
                      </div>
                    </>
                  )}

                  {reviewIndex > 0 && (
                    <button
                      type="button"
                      onClick={goPrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white text-xl flex items-center justify-center"
                      aria-label="Anterior"
                    >
                      ‹
                    </button>
                  )}
                  {reviewIndex < photos.length - 1 && (
                    <button
                      type="button"
                      onClick={goNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white text-xl flex items-center justify-center"
                      aria-label="Siguiente"
                    >
                      ›
                    </button>
                  )}
                </div>

                {/* Curation actions */}
                <div className="shrink-0 px-4 py-3 flex gap-2 border-t border-white/10">
                  <button
                    type="button"
                    disabled={disabled || !currentPhoto}
                    onClick={() => currentPhoto && removePhoto(currentPhoto.id)}
                    className="flex-1 py-3 rounded-xl bg-red-500/90 text-white font-semibold text-sm active:bg-red-600 disabled:opacity-50 min-h-[48px]"
                  >
                    Descartar esta
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("gallery")}
                    className="flex-1 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm active:bg-white/20 min-h-[48px]"
                  >
                    + Galería
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("capture")}
                    className="flex-1 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm active:bg-white/20 min-h-[48px]"
                  >
                    + Cámara
                  </button>
                </div>
              </>
            )}

            {/* Saved photos reference */}
            {existingPhotos.length > 0 && (
              <div className="shrink-0 px-4 py-2 border-t border-white/10 bg-white/5">
                <p className="text-[10px] text-white/50 mb-1.5 uppercase tracking-wide">
                  Ya guardadas en el sitio
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {existingPhotos.map((img) => (
                    <div
                      key={img._id}
                      className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden opacity-60"
                    >
                      <Image
                        src={img.blobUrl}
                        alt={img.nombre}
                        fill
                        className="object-cover"
                        unoptimized={shouldUnoptimizeImage(img.blobUrl)}
                        sizes="48px"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {fileError && (
          <p className="shrink-0 mx-4 mb-2 text-xs text-red-400 bg-red-900/30 px-3 py-2 rounded-lg">
            {fileError}
          </p>
        )}

        {/* Persistent filmstrip (proposal 4) */}
        {photos.length > 0 && tab !== "review" && (
          <SessionFilmstrip
            photos={photos}
            activeId={currentPhoto?.id}
            onSelect={(id) => {
              const idx = photos.findIndex((p) => p.id === id);
              if (idx >= 0) {
                setReviewIndex(idx);
                setTab("review");
              }
            }}
            onRemove={disabled ? undefined : removePhoto}
            disabled={disabled}
          />
        )}

        {photos.length > 0 && tab === "review" && (
          <SessionFilmstrip
            photos={photos}
            activeId={currentPhoto?.id}
            onSelect={(id) => {
              const idx = photos.findIndex((p) => p.id === id);
              if (idx >= 0) setReviewIndex(idx);
            }}
            onRemove={disabled ? undefined : removePhoto}
            disabled={disabled}
          />
        )}
      </div>

      {/* Bottom tabs */}
      <nav className="shrink-0 flex border-t border-white/10 bg-gray-900 safe-area-bottom">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors min-h-[56px] ${
              tab === t.id
                ? "text-blue-400 border-t-2 border-blue-400 -mt-px"
                : "text-white/50"
            }`}
          >
            <span>{t.label}</span>
            {t.badge != null && t.badge > 0 && (
              <span className="text-[10px] bg-blue-600 text-white px-1.5 rounded-full font-bold">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

export { createSessionPhoto, revokePhoto };
