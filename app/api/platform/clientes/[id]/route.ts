import { platformHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { userAdminService } from "@/lib/services/user-admin.service";

export const PATCH = platformHandler(async ({ params, request }) => {
  const data = await request.json();
  await userAdminService.updateCliente(params.id, data);
  return ok(undefined, { message: "Cliente actualizado exitosamente" });
});
