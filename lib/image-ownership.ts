import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { withTenantScope } from "@/lib/tenant";
import { AppError } from "@/lib/api/errors";

/** Verifica que imagenId exista en el tenant antes de asignarlo a servicio/galería/categoría. */
export async function assertImagenBelongsToTenant(
  salonId: string,
  imagenId: string | null | undefined
): Promise<void> {
  if (!imagenId) return;

  if (!ObjectId.isValid(imagenId)) {
    throw new AppError("ID de imagen inválido", 400);
  }

  const db = await getDb();
  const imagen = await db.collection(Collections.IMAGENES).findOne(
    withTenantScope({ _id: new ObjectId(imagenId) }, salonId)
  );

  if (!imagen) {
    throw new AppError("La imagen no pertenece a este salón", 400);
  }
}
