import type { ApiResponse } from "@/lib/types";

export async function parseApiJson<T = unknown>(
  res: Response
): Promise<ApiResponse<T>> {
  try {
    return (await res.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error:
        res.status >= 500
          ? "Error del servidor. Verifica la conexión a la base de datos."
          : "Respuesta inválida del servidor",
    };
  }
}

export function getApiErrorMessage(
  res: Response,
  body: ApiResponse,
  fallback: string
): string {
  const msg = body.error || body.message;
  if (msg) return msg;
  if (res.status === 403) {
    return "No tienes permiso para esta acción. Revisa tu suscripción en Suscripción.";
  }
  if (res.status >= 500) {
    return "Error del servidor. Si persiste, revisa la conexión a MongoDB.";
  }
  return fallback;
}
