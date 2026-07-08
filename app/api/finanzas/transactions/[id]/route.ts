import { adminHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { tenantQuery } from "@/lib/tenant";
import { ObjectId } from "mongodb";
import { AppError } from "@/lib/api/errors";

export const DELETE = adminHandler(async ({ salonId, params }) => {
  const { id } = params;
  if (!ObjectId.isValid(id)) throw new AppError("ID inválido", 400);

  const db = await getDb();
  const tx = await db.collection(Collections.FINANCIAL_TRANSACTIONS).findOne({
    _id: new ObjectId(id),
    ...tenantQuery(salonId),
  });

  if (!tx) throw AppError.notFound("Transacción no encontrada");

  if (tx.fuente === "reserva") {
    throw new AppError(
      "Los ingresos de reservas no se pueden eliminar. Edita el costo de la reserva.",
      400
    );
  }

  await db
    .collection(Collections.FINANCIAL_TRANSACTIONS)
    .deleteOne({
      _id: new ObjectId(id),
      ...tenantQuery(salonId),
    });

  return ok(undefined, { message: "Transacción eliminada" });
});
