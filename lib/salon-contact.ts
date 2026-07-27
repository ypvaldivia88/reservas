import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { resolveSalonWhatsapp } from "@/lib/whatsapp";

type SalonContactSource = {
  whatsappNumber?: string;
  contact?: { phone?: string };
  social?: { whatsapp?: string };
};

/**
 * Teléfono/WhatsApp del administrador del salón (quien paga y canjea códigos).
 * Prioriza el teléfono del usuario admin; si no hay, el del CMS del salón.
 */
export async function resolveSalonAdminPhone(
  salonId: string,
  salon?: SalonContactSource | null
): Promise<string | undefined> {
  const db = await getDb();

  const adminUser = await db.collection(Collections.USERS).findOne(
    {
      salonId,
      role: { $in: ["salon_admin", "admin"] },
      telefono: { $exists: true, $nin: [null, ""] },
    },
    { sort: { fechaCreacion: 1 } }
  );

  const fromUser = String(adminUser?.telefono ?? "").trim();
  if (fromUser) return fromUser;

  let salonDoc = salon;
  if (!salonDoc) {
    salonDoc = (await db
      .collection(Collections.SALONS)
      .findOne({ salonId })) as SalonContactSource | null;
  }

  return salonDoc ? resolveSalonWhatsapp(salonDoc) : undefined;
}
