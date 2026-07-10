import { platformHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { userAdminService } from "@/lib/services/user-admin.service";

export const PATCH = platformHandler(async ({ params, request }) => {
  const data = await request.json();
  await userAdminService.updateCliente(params.id, data);
  return ok(undefined, { message: "Cliente actualizado exitosamente" });
});

export const DELETE = platformHandler(async ({ params, request }) => {
  const force = request.nextUrl.searchParams.get("force") === "1";
  await userAdminService.deleteCliente(params.id, { force });
  return ok(undefined, { message: "Cliente eliminado exitosamente" });
});
