import { anyAdminHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { authService } from "@/lib/services/auth.service";
import { UpdateProfileRequest } from "@/lib/types";

export const GET = anyAdminHandler(async ({ session }) => {
  const data = await authService.getProfile(session!.userId);
  return ok(data);
});

export const PATCH = anyAdminHandler(async ({ session, request }) => {
  const data: UpdateProfileRequest = await request.json();
  await authService.updateProfile(session!.userId, data);
  const profile = await authService.getProfile(session!.userId);
  return ok(profile, { message: "Perfil actualizado exitosamente" });
});
