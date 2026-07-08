import { Db } from "mongodb";
import { Collections } from "@/lib/db/collections";

let tenantIndexesReady = false;

export async function ensureMultiTenantIndexes(db: Db): Promise<void> {
  if (tenantIndexesReady) return;

  const users = db.collection(Collections.USERS);
  const userIndexes = await users.indexes();
  const legacyUserIndex = userIndexes.find(
    (idx) => idx.name === "idx_users_telefono_role"
  );
  if (
    legacyUserIndex &&
    !Object.prototype.hasOwnProperty.call(legacyUserIndex.key, "salonId")
  ) {
    await users.dropIndex("idx_users_telefono_role");
  }
  await users.createIndex(
    { salonId: 1, telefono: 1, role: 1 },
    {
      name: "uniq_cliente_phone_by_salon",
      unique: true,
      partialFilterExpression: {
        role: "cliente",
        telefono: { $exists: true },
      },
    }
  );

  const reservas = db.collection(Collections.RESERVAS);
  const reservaIndexes = await reservas.indexes();
  const legacySlotIndex = reservaIndexes.find(
    (idx) => idx.name === "uniq_active_slot"
  );
  if (
    legacySlotIndex &&
    !Object.prototype.hasOwnProperty.call(legacySlotIndex.key, "salonId")
  ) {
    await reservas.dropIndex("uniq_active_slot");
  }
  const legacyDayIndex = reservaIndexes.find(
    (idx) => idx.name === "uniq_active_client_day_by_phone"
  );
  if (
    legacyDayIndex &&
    !Object.prototype.hasOwnProperty.call(legacyDayIndex.key, "salonId")
  ) {
    await reservas.dropIndex("uniq_active_client_day_by_phone");
  }

  await reservas.createIndex(
    { salonId: 1, fechaCita: 1, horaCita: 1 },
    {
      name: "uniq_active_slot_by_salon",
      unique: true,
      partialFilterExpression: {
        estado: { $in: ["pendiente", "confirmada"] },
      },
    }
  );
  await reservas.createIndex(
    { salonId: 1, telefono: 1, fechaCita: 1 },
    {
      name: "uniq_active_client_day_by_salon",
      unique: true,
      partialFilterExpression: {
        estado: { $in: ["pendiente", "confirmada"] },
      },
    }
  );

  tenantIndexesReady = true;
}
