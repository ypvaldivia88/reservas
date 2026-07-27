import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { PlatformAuditLog, UserRole } from "@/lib/types";

export class PlatformAuditService {
  async log(params: {
    action: string;
    actorUserId: string;
    actorRole: UserRole;
    salonId?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const db = await getDb();
    const entry: Omit<PlatformAuditLog, "_id"> = {
      ...params,
      createdAt: new Date(),
    };
    await db.collection(Collections.PLATFORM_AUDIT_LOG).insertOne(entry);
  }

  async listRecent(limit = 50): Promise<PlatformAuditLog[]> {
    const db = await getDb();
    const logs = await db
      .collection<PlatformAuditLog>(Collections.PLATFORM_AUDIT_LOG)
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return logs.map((l) => ({
      ...l,
      _id: l._id?.toString(),
    }));
  }

  async listForSalon(salonId: string, limit = 30): Promise<PlatformAuditLog[]> {
    const db = await getDb();
    const logs = await db
      .collection<PlatformAuditLog>(Collections.PLATFORM_AUDIT_LOG)
      .find({ salonId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return logs.map((l) => ({
      ...l,
      _id: l._id?.toString(),
    }));
  }
}

export const platformAuditService = new PlatformAuditService();
