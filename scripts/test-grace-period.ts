import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const salonId = process.argv[2] || "salon_78dacd1c0cdf";
const action = process.argv[3] || "inspect";

function loadUri(): string {
  try {
    const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    const match = env.match(/^MONGODB_URI=(.+)$/m);
    if (match) return match[1].trim().replace(/^"|"$/g, "");
  } catch {
    // ignore
  }
  return "mongodb://127.0.0.1:27017/nailsalon";
}

async function main() {
  const client = new MongoClient(loadUri());
  await client.connect();
  const db = client.db("nailsalon");

  const salon = await db.collection("salons").findOne({ salonId });
  const sub = await db.collection("tenant_subscriptions").findOne(
    { salonId },
    { sort: { fechaCreacion: -1 } }
  );
  const admins = await db
    .collection("users")
    .find({ salonId, role: { $in: ["salon_admin", "admin"] } })
    .project({ username: 1, nombre: 1, telefono: 1 })
    .toArray();

  if (action === "inspect") {
    console.log(
      JSON.stringify(
        {
          salon: salon
            ? {
                nombre: salon.nombre,
                slug: salon.slug,
                status: salon.status,
              }
            : null,
          subscription: sub
            ? {
                _id: String(sub._id),
                status: sub.status,
                periodoFin: sub.periodoFin,
                periodoInicio: sub.periodoInicio,
              }
            : null,
          admins,
        },
        null,
        2
      )
    );
    await client.close();
    return;
  }

  if (action === "set-grace") {
    if (!sub) {
      throw new Error("No subscription found for salon");
    }

    const graceDaysAgo = Number(process.argv[4] || 2);
    const periodoFin = new Date();
    periodoFin.setDate(periodoFin.getDate() - graceDaysAgo);
    periodoFin.setHours(12, 0, 0, 0);

    await db.collection("salons").updateOne(
      { salonId },
      { $set: { status: "active", fechaActualizacion: new Date() } }
    );

    await db.collection("tenant_subscriptions").updateOne(
      { _id: sub._id },
      {
        $set: {
          status: "active",
          periodoFin,
          fechaActualizacion: new Date(),
        },
      }
    );

    const graceEnd = new Date(periodoFin);
    graceEnd.setDate(graceEnd.getDate() + 4);
    const daysLeft = Math.ceil(
      (graceEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          salonId,
          periodoFin: periodoFin.toISOString(),
          expectedAccessState: "grace_period",
          graceDaysRemaining: daysLeft,
          loginUrl: `/admin`,
          publicUrl: salon ? `/${salon.slug}` : null,
        },
        null,
        2
      )
    );
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
