import { preprocessImage } from "@/lib/imageUtils";

export interface UploadReservaWorkPhotoOptions {
  reservaId: string;
  servicioIds: string[];
  categoriaIds?: string[];
  clienteNombre?: string;
  fechaCita?: string;
}

export interface UploadReservaWorkPhotosResult {
  uploaded: number;
  failed: number;
  errors: string[];
}

/**
 * Sube fotos de un trabajo completado a la galería "Nuestros Trabajos",
 * etiquetándolas con los servicios y categorías del turno.
 */
export async function uploadReservaWorkPhotos(
  files: File[],
  options: UploadReservaWorkPhotoOptions
): Promise<UploadReservaWorkPhotosResult> {
  const { reservaId, servicioIds, categoriaIds = [], clienteNombre, fechaCita } =
    options;

  let uploaded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const file of files) {
    try {
      const imageData = await preprocessImage(file);
      const autoName = file.name.replace(/\.[^/.]+$/, "");
      const titulo =
        clienteNombre && fechaCita
          ? `${clienteNombre} - ${fechaCita}`
          : clienteNombre || autoName;

      const res = await fetch("/api/imagenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: autoName,
          titulo,
          enGaleriaDashboard: true,
          enGaleriaInspiracion: false,
          servicioIds,
          categoriaIds,
          reservaId,
          ...imageData,
        }),
      });

      const data = await res.json();

      if (data.success) {
        uploaded++;
      } else {
        failed++;
        errors.push(`${file.name}: ${data.error || "Error desconocido"}`);
      }
    } catch (error) {
      failed++;
      errors.push(
        `${file.name}: ${error instanceof Error ? error.message : "Error al procesar"}`
      );
    }
  }

  return { uploaded, failed, errors };
}
