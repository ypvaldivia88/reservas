import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, LoginCredentials } from "@/lib/types";
import { authService } from "@/lib/services/auth.service";
import { handleError, ok } from "@/lib/api/responses";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const data: LoginCredentials = await request.json();
    const result = await authService.login(data);

    const response = ok(
      result,
      { message: "Inicio de sesión exitoso" }
    );

    response.cookies.set("session-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return handleError(error);
  }
}
