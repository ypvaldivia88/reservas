import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, ChangePasswordRequest } from "@/lib/types";
import { authService } from "@/lib/services/auth.service";
import { getSession } from "@/lib/session";
import { handleError, ok } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession(request);
    if (!session) throw AppError.unauthorized("No autenticado");

    const data: ChangePasswordRequest = await request.json();
    await authService.changePassword(session.userId, data);

    return ok(undefined, { message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    return handleError(error);
  }
}
