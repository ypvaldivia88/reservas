import { platformHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { userAdminService } from "@/lib/services/user-admin.service";

export const GET = platformHandler(async ({ request }) => {
  const salonId = request.nextUrl.searchParams.get("salonId") || undefined;
  const type = request.nextUrl.searchParams.get("type") || "admins";

  if (type === "clientes") {
    const data = await userAdminService.listClientes(salonId);
    return ok(data);
  }

  const data = await userAdminService.listSalonAdmins(salonId);
  return ok(data);
});
