import { NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types";
import { AppError, isAppError } from "./errors";

export function ok<T>(
  data?: T,
  options?: { message?: string; status?: number; headers?: HeadersInit }
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data, message: options?.message },
    { status: options?.status ?? 200, headers: options?.headers }
  );
}

export function created<T>(
  data?: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return ok(data, { message, status: 201 });
}

export function fail(
  error: string,
  status = 400,
  message?: string
): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error, message },
    { status }
  );
}

export function handleError(error: unknown): NextResponse<ApiResponse> {
  if (isAppError(error)) {
    return fail(error.message, error.status);
  }

  if (error instanceof SyntaxError) {
    return fail("Formato JSON inválido", 400);
  }

  console.error("Unhandled error:", error);
  return fail("Error interno del servidor", 500);
}
