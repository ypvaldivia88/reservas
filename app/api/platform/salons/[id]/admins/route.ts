import { platformHandler } from "@/lib/api/handlers";
import { created } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";
import { userAdminService } from "@/lib/services/user-admin.service";
import { platformAuditService } from "@/lib/services/platform-audit.service";

export const POST = platformHandler(async ({ session, params, request }) => {
  const salonId = params.id;
  if (!salonId) throw new AppError("ID de salón requerido", 400);

  const { nombre, username, password } = await request.json();
  const admin = await userAdminService.createSalonAdmin(salonId, {
    nombre,
    username,
    password,
  });

  await platformAuditService.log({
    action: "salon_admin_created",
    actorUserId: session!.userId,
    actorRole: session!.role,
    salonId,
    targetId: admin._id,
    metadata: { username: admin.username },
  });

  return created(admin, "Administrador creado");
});
