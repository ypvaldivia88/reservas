import { NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types";
import { authService } from "@/lib/services/auth.service";
import { handleError, ok } from "@/lib/api/responses";

export async function POST(): Promise<NextResponse<ApiResponse>> {
  try {
    const result = await authService.initDefaultAdmin();
    return ok(undefined, {
      message: result.created
        ? "Admin creado exitosamente con usuario: admin y contraseña: admin"
        : "Admin ya existe",
    });
  } catch (error) {
    return handleError(error);
  }
}
