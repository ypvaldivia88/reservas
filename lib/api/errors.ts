/** Códigos de error de dominio */
export const ErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION: "VALIDATION",
  CONFLICT: "CONFLICT",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Error de aplicación con código HTTP.
 * Permite que los handlers traduzcan errores sin try/catch repetitivo.
 */
export class AppError extends Error {
  readonly code: ErrorCodeType;

  constructor(
    message: string,
    public readonly status: number = 400,
    code: ErrorCodeType = ErrorCode.VALIDATION
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }

  static unauthorized(message = "No autorizado"): AppError {
    return new AppError(message, 401, ErrorCode.UNAUTHORIZED);
  }

  static forbidden(message = "Acceso denegado"): AppError {
    return new AppError(message, 403, ErrorCode.FORBIDDEN);
  }

  static notFound(message = "Recurso no encontrado"): AppError {
    return new AppError(message, 404, ErrorCode.NOT_FOUND);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409, ErrorCode.CONFLICT);
  }

  static internal(message = "Error interno del servidor"): AppError {
    return new AppError(message, 500, ErrorCode.INTERNAL);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
