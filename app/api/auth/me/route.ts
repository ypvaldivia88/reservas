import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { handleError, ok } from "@/lib/api/responses";
import { ApiResponse } from "@/lib/types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const token = request.cookies.get("session-token")?.value;
    const session = await authService.getSessionInfo(token);

    if (!session) {
      return ok(null);
    }

    return ok(session);
  } catch (error) {
    return handleError(error);
  }
}
