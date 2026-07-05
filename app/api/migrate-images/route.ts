import { platformHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { getDatabase } from "@/lib/mongodb";
import { uploadBase64ToBlob, deleteImageFromBlob } from "@/lib/blobStorage";

/** Migración de imágenes — solo administradores de plataforma */
export const GET = platformHandler(async () => {
  const results: unknown[] = [];
  let migrated = 0;
  let errors = 0;
  let skipped = 0;

  const db = await getDatabase();
  const images = await db
    .collection("imagenes")
    .find({ base64Data: { $exists: true }, blobUrl: { $exists: false } })
    .toArray();

  for (const image of images) {
    try {
      if (!image.base64Data) {
        skipped++;
        continue;
      }

      const blobUrl = await uploadBase64ToBlob(
        image.base64Data,
        image.nombre || `image-${image._id}`,
        image.mimeType || "image/jpeg"
      );

      await db.collection("imagenes").updateOne(
        { _id: image._id },
        {
          $set: { blobUrl, mimeType: image.mimeType || "image/jpeg" },
          $unset: { base64Data: "" },
        }
      );

      migrated++;
      results.push({ id: image._id.toString(), status: "migrated", blobUrl });
    } catch (error) {
      errors++;
      results.push({
        id: image._id.toString(),
        status: "error",
        error: error instanceof Error ? error.message : "Unknown",
      });
    }
  }

  return ok({ migrated, errors, skipped, results });
});
