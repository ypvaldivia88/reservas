/**
 * Crea colecciones de suscripción/certificados si no existen y sus índices.
 * Ejecutar: npx tsx scripts/bootstrap-subscription-collections.ts
 */
import "./load-env";
import clientPromise from "@/lib/mongodb";
import { DB_NAME, Collections } from "@/lib/db/collections";
import { ensureSubscriptionIndexes } from "@/lib/db/tenant-indexes";

async function main() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const names = [
    Collections.ACTIVATION_CERTIFICATES,
    Collections.PLATFORM_AUDIT_LOG,
    Collections.REDEEM_ATTEMPTS,
  ];

  const existing = new Set(
    (await db.listCollections().toArray()).map((c) => c.name)
  );

  for (const name of names) {
    if (!existing.has(name)) {
      await db.createCollection(name);
      console.log(`✅ Colección creada: ${name}`);
    } else {
      console.log(`ℹ️  Ya existe: ${name}`);
    }
  }

  await ensureSubscriptionIndexes(db);
  console.log("✅ Índices de suscripción/certificados listos");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
