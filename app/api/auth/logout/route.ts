import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types";
import { authService } from "@/lib/services/auth.service";
import { handleError, ok } from "@/lib/api/responses";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const token = request.cookies.get("session-token")?.value;
    await authService.logout(token);

    const response = ok(undefined, { message: "Sesión cerrada exitosamente" });
    response.cookies.delete("session-token");
    return response;
  } catch (error) {
    return handleError(error);
  }
}
