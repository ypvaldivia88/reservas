/**
 * Reparación segura de imágenes para un tenant afectado (nunca toca oh-diosa/default).
 * Usage: npx tsx scripts/repair-tenant-images.ts --salon-id <id> [--dry-run|--apply]
 *
 * Por defecto corre en --dry-run.
 */
import "./load-env";
import { ObjectId } from "mongodb";
import { getDb } from "../lib/mongodb";
import { Collections } from "../lib/db/collections";
import { DEFAULT_SALON_ID, tenantQuery } from "../lib/tenant";
import { reseedTenantMedia } from "../lib/services/tenant-seed.service";
import { salonRepository } from "../lib/repositories/salon.repository";
import { BusinessTemplate } from "../lib/types";

function parseArgs() {
  const args = process.argv.slice(2);
  let salonId: string | undefined;
  let apply = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--salon-id" && args[i + 1]) {
      salonId = args[i + 1];
      i++;
    } else if (args[i] === "--apply") {
      apply = true;
    } else if (args[i] === "--dry-run") {
      apply = false;
    }
  }

  return { salonId, apply };
}

async function main() {
  const { salonId, apply } = parseArgs();

  if (!salonId) {
    console.error("Uso: npx tsx scripts/repair-tenant-images.ts --salon-id <id> [--dry-run|--apply]");
    process.exit(1);
  }

  if (salonId === DEFAULT_SALON_ID) {
    console.error("Refusing to repair default/oh-diosa tenant.");
    process.exit(1);
  }

  const db = await getDb();
  const mode = apply ? "APPLY" : "DRY-RUN";
  console.log(`\n=== Repair tenant images [${mode}] salonId=${salonId} ===\n`);

  const salon = await salonRepository.findBySalonId(salonId);
  if (!salon) {
    console.error(`Salón no encontrado: ${salonId}`);
    process.exit(1);
  }

  const defaultScope = tenantQuery(DEFAULT_SALON_ID);
  const defaultBlobUrls = new Set(
    (
      await db
        .collection(Collections.IMAGENES)
        .find(defaultScope)
        .project({ blobUrl: 1, isPlaceholder: 1 })
        .toArray()
    )
      .filter((img) => !img.isPlaceholder)
      .map((img) => img.blobUrl as string)
      .filter(Boolean)
  );

  const beforeCount = await db
    .collection(Collections.IMAGENES)
    .countDocuments({ salonId });

  const ohDiosaBeforeCount = await db
    .collection(Collections.IMAGENES)
    .countDocuments(defaultScope);

  console.log(`Imágenes del tenant antes: ${beforeCount}`);
  console.log(`Imágenes oh-diosa/default antes: ${ohDiosaBeforeCount} (no se modificarán)`);

  const duplicateCandidates = await db
    .collection(Collections.IMAGENES)
    .find({
      salonId,
      isPlaceholder: { $ne: true },
      reservaId: { $exists: false },
      blobUrl: { $in: [...defaultBlobUrls] },
    })
    .toArray();

  console.log(`Imágenes duplicadas de oh-diosa a eliminar: ${duplicateCandidates.length}`);

  const adminUsers = await db
    .collection(Collections.USERS)
    .find({
      salonId,
      role: { $in: ["admin", "salon_admin"] },
    })
    .toArray();

  let sessionsToFix = 0;
  for (const user of adminUsers) {
    const count = await db.collection(Collections.SESSIONS).countDocuments({
      userId: user._id,
      salonId: { $ne: salonId },
    });
    sessionsToFix += count;
  }
  console.log(`Sesiones admin a sincronizar: ${sessionsToFix}`);

  const realOwnUploads = await db.collection(Collections.IMAGENES).countDocuments({
    salonId,
    isPlaceholder: { $ne: true },
    blobUrl: { $nin: [...defaultBlobUrls] },
  });

  const shouldReseed =
    duplicateCandidates.length > 0 &&
    realOwnUploads === 0 &&
    beforeCount > 0;

  console.log(`Reseed placeholders: ${shouldReseed ? "sí" : "no"}`);
  console.log(`Subidas propias del tenant (conservar): ${realOwnUploads}`);

  if (!apply) {
    console.log("\nDry-run completado. Usa --apply para ejecutar cambios.");
    return;
  }

  if (sessionsToFix > 0) {
    for (const user of adminUsers) {
      const result = await db.collection(Collections.SESSIONS).updateMany(
        { userId: user._id },
        { $set: { salonId } }
      );
      console.log(`Sesiones actualizadas para ${user.username}: ${result.modifiedCount}`);
    }
  }

  if (duplicateCandidates.length > 0) {
    const ids = duplicateCandidates.map((img) => img._id);
    const deleteResult = await db.collection(Collections.IMAGENES).deleteMany({
      _id: { $in: ids },
      salonId,
    });
    console.log(`Imágenes duplicadas eliminadas: ${deleteResult.deletedCount}`);
  }

  if (shouldReseed) {
    const template = (salon.businessTemplate || "generic") as BusinessTemplate;
    const result = await reseedTenantMedia(db, salonId, template);
    await salonRepository.updateBySalonId(salonId, {
      branding: {
        ...salon.branding,
        heroImageUrl: result.heroImageUrl,
      },
      fechaActualizacion: new Date(),
    });
    console.log(
      `Reseed: ${result.serviceCount} servicios, ${result.imageCount} placeholders [${result.source}]`
    );
  }

  const afterCount = await db
    .collection(Collections.IMAGENES)
    .countDocuments({ salonId });

  const ohDiosaAfterCount = await db
    .collection(Collections.IMAGENES)
    .countDocuments(defaultScope);

  console.log(`\nImágenes del tenant después: ${afterCount}`);
  console.log(`Imágenes oh-diosa/default después: ${ohDiosaAfterCount}`);

  if (ohDiosaAfterCount !== ohDiosaBeforeCount) {
    console.error("ERROR: el conteo de oh-diosa cambió. Revisar manualmente.");
    process.exit(1);
  }

  console.log("\nRepair completado con éxito.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
