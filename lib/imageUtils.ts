// Utilidades para manejo de imágenes

/**
 * Convierte un archivo de imagen a base64
 * @param file - El archivo de imagen
 * @returns Promise con la cadena base64
 */
export async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Extraer solo la parte base64 (sin el prefijo data:image/...)
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert image to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Redimensiona una imagen a una resolución más pequeña
 * @param file - El archivo de imagen
 * @param maxWidth - Ancho máximo
 * @param maxHeight - Alto máximo
 * @param quality - Calidad de compresión (0-1)
 * @returns Promise con el blob redimensionado
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calcular nuevas dimensiones manteniendo aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to resize image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Preprocesa una imagen antes de subirla (redimensiona y convierte a base64)
 * @param file - El archivo de imagen
 * @returns Promise con objeto que contiene base64, mimeType y tamaño
 */
export async function preprocessImage(file: File): Promise<{
  base64Data: string;
  mimeType: string;
  tamaño: number;
}> {
  // Redimensionar primero
  const resizedBlob = await resizeImage(file);
  
  // Convertir blob a file
  const resizedFile = new File([resizedBlob], file.name, {
    type: file.type,
  });

  // Convertir a base64
  const base64Data = await convertImageToBase64(resizedFile);

  return {
    base64Data,
    mimeType: file.type,
    tamaño: resizedBlob.size,
  };
}

/**
 * Convierte base64 a URL de datos para mostrar en img src
 * @param base64Data - Datos en base64
 * @param mimeType - Tipo MIME de la imagen
 * @returns URL de datos
 */
export function base64ToDataURL(base64Data: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64Data}`;
}

/**
 * Valida si un archivo es una imagen válida
 * @param file - El archivo a validar
 * @returns true si es una imagen válida
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Valida el tamaño máximo del archivo
 * @param file - El archivo a validar
 * @param maxSizeMB - Tamaño máximo en MB (por defecto 5MB)
 * @returns true si el tamaño es válido
 */
export function isValidFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
