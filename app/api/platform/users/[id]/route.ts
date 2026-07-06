import { platformHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { userAdminService } from "@/lib/services/user-admin.service";
import { AdminUserUpdateRequest } from "@/lib/types";

export const GET = platformHandler(async ({ params }) => {
  const data = await userAdminService.getSalonAdmin(params.id);
  return ok(data);
});

export const PATCH = platformHandler(async ({ params, request }) => {
  const data: AdminUserUpdateRequest = await request.json();
  const updated = await userAdminService.updateSalonAdmin(params.id, data);
  return ok(updated, { message: "Usuario actualizado exitosamente" });
});
