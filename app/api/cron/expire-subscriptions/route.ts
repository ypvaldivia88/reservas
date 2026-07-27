import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { GRACE_PERIOD_DAYS } from "@/lib/subscription";
import { TenantSubscription } from "@/lib/types";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const now = new Date();
  const graceCutoff = new Date(now);
  graceCutoff.setDate(graceCutoff.getDate() - GRACE_PERIOD_DAYS);

  const expiredSubs = await db
    .collection<TenantSubscription>(Collections.TENANT_SUBSCRIPTIONS)
    .find({
      status: { $in: ["trial", "active"] },
      periodoFin: { $lt: graceCutoff },
    })
    .toArray();

  let transitioned = 0;
  for (const sub of expiredSubs) {
    await db.collection(Collections.TENANT_SUBSCRIPTIONS).updateOne(
      { _id: new ObjectId(String(sub._id)) },
      { $set: { status: "past_due", fechaActualizacion: now } }
    );
    transitioned++;
  }

  const expiredCerts = await db
    .collection(Collections.ACTIVATION_CERTIFICATES)
    .updateMany(
      { status: "pending", expiresAt: { $lt: now } },
      { $set: { status: "expired" } }
    );

  return NextResponse.json({
    success: true,
    subscriptionsTransitioned: transitioned,
    certificatesExpired: expiredCerts.modifiedCount,
  });
}
