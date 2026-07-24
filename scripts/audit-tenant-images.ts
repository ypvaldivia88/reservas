/**
 * Auditoría read-only de imágenes por tenant.
 * Usage: npx tsx scripts/audit-tenant-images.ts [--salon-id <id>]
 */
import "./load-env";
import { ObjectId } from "mongodb";
import { getDb } from "../lib/mongodb";
import { Collections } from "../lib/db/collections";
import { DEFAULT_SALON_ID, tenantQuery } from "../lib/tenant";

interface SalonImageStats {
  salonId: string;
  slug?: string;
  nombre?: string;
  total: number;
  placeholders: number;
  realImages: number;
  fechaCreacion?: Date;
}

interface AuditReport {
  generatedAt: string;
  defaultTenantImageCount: number;
  legacyWithoutSalonId: number;
  salons: SalonImageStats[];
  suspiciousDuplicates: {
    blobUrl: string;
    defaultCount: number;
    otherSalonIds: string[];
  }[];
  orphanServicioRefs: {
    servicioId: string;
    servicioSalonId: string;
    imagenId: string;
    imagenSalonId: string | null;
  }[];
  inconsistentSessions: {
    sessionTokenPrefix: string;
    username?: string;
    sessionSalonId?: string;
    userSalonId?: string;
  }[];
  anomalousTenants: {
    salonId: string;
    slug?: string;
    realImages: number;
    placeholders: number;
  }[];
}

function parseArgs() {
  const args = process.argv.slice(2);
  let salonId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--salon-id" && args[i + 1]) {
      salonId = args[i + 1];
      i++;
    }
  }

  return { salonId };
}

async function main() {
  const { salonId: filterSalonId } = parseArgs();
  const db = await getDb();

  const salons = await db
    .collection(Collections.SALONS)
    .find(filterSalonId ? { salonId: filterSalonId } : {})
    .sort({ fechaCreacion: -1 })
    .toArray();

  const defaultScope = tenantQuery(DEFAULT_SALON_ID);
  const defaultImages = await db
    .collection(Collections.IMAGENES)
    .find(defaultScope)
    .project({ blobUrl: 1, salonId: 1, isPlaceholder: 1 })
    .toArray();

  const legacyWithoutSalonId = await db
    .collection(Collections.IMAGENES)
    .countDocuments({
      $or: [{ salonId: { $exists: false } }, { salonId: null }],
    });

  const defaultBlobUrls = new Set(
    defaultImages
      .filter((img) => !img.isPlaceholder)
      .map((img) => img.blobUrl as string)
      .filter(Boolean)
  );

  const salonStats: SalonImageStats[] = [];
  const anomalousTenants: AuditReport["anomalousTenants"] = [];
  const suspiciousDuplicates: AuditReport["suspiciousDuplicates"] = [];
  const duplicateTracker = new Map<string, Set<string>>();

  for (const salon of salons) {
    const sid = salon.salonId as string;
    const scope = tenantQuery(sid);
    const images = await db.collection(Collections.IMAGENES).find(scope).toArray();

    const placeholders = images.filter((img) => img.isPlaceholder === true).length;
    const realImages = images.length - placeholders;

    salonStats.push({
      salonId: sid,
      slug: salon.slug as string | undefined,
      nombre: salon.nombre as string | undefined,
      total: images.length,
      placeholders,
      realImages,
      fechaCreacion: salon.fechaCreacion as Date | undefined,
    });

    if (sid !== DEFAULT_SALON_ID && realImages > 0) {
      for (const img of images) {
        if (img.isPlaceholder) continue;
        const blobUrl = img.blobUrl as string;
        if (blobUrl && defaultBlobUrls.has(blobUrl)) {
          if (!duplicateTracker.has(blobUrl)) {
            duplicateTracker.set(blobUrl, new Set());
          }
          duplicateTracker.get(blobUrl)!.add(sid);
        }
      }

      anomalousTenants.push({
        salonId: sid,
        slug: salon.slug as string | undefined,
        realImages,
        placeholders,
      });
    }
  }

  for (const [blobUrl, salonIds] of duplicateTracker.entries()) {
    suspiciousDuplicates.push({
      blobUrl,
      defaultCount: defaultImages.filter((img) => img.blobUrl === blobUrl).length,
      otherSalonIds: [...salonIds],
    });
  }

  const servicios = await db
    .collection(Collections.SERVICIOS)
    .find(filterSalonId ? { salonId: filterSalonId } : { imagenId: { $exists: true, $ne: null } })
    .project({ _id: 1, salonId: 1, imagenId: 1 })
    .toArray();

  const orphanServicioRefs: AuditReport["orphanServicioRefs"] = [];

  for (const servicio of servicios) {
    const imagenId = servicio.imagenId as string;
    if (!imagenId || !ObjectId.isValid(imagenId)) continue;

    const imagen = await db.collection(Collections.IMAGENES).findOne({
      _id: new ObjectId(imagenId),
    });

    const servicioSalonId = servicio.salonId as string;
    const imagenSalonId = (imagen?.salonId as string | null | undefined) ?? null;

    const belongsToSameTenant =
      imagen &&
      (imagenSalonId === servicioSalonId ||
        (servicioSalonId === DEFAULT_SALON_ID &&
          (imagenSalonId === DEFAULT_SALON_ID ||
            imagenSalonId === null ||
            imagenSalonId === undefined)));

    if (!belongsToSameTenant) {
      orphanServicioRefs.push({
        servicioId: String(servicio._id),
        servicioSalonId,
        imagenId,
        imagenSalonId,
      });
    }
  }

  const adminSessions = await db
    .collection(Collections.SESSIONS)
    .find({
      role: { $in: ["admin", "salon_admin"] },
      expiresAt: { $gt: new Date() },
      ...(filterSalonId ? { salonId: filterSalonId } : {}),
    })
    .toArray();

  const inconsistentSessions: AuditReport["inconsistentSessions"] = [];

  for (const session of adminSessions) {
    const user = await db.collection(Collections.USERS).findOne({
      _id: session.userId,
    });

    const sessionSalonId = session.salonId as string | undefined;
    const userSalonId = user?.salonId as string | undefined;

    const expectedSalonId =
      user?.role === "admin" && !userSalonId ? DEFAULT_SALON_ID : userSalonId;

    if (expectedSalonId && sessionSalonId && sessionSalonId !== expectedSalonId) {
      inconsistentSessions.push({
        sessionTokenPrefix: String(session.token).slice(0, 8),
        username: session.username as string | undefined,
        sessionSalonId,
        userSalonId: expectedSalonId,
      });
    }
  }

  const report: AuditReport = {
    generatedAt: new Date().toISOString(),
    defaultTenantImageCount: defaultImages.length,
    legacyWithoutSalonId,
    salons: salonStats,
    suspiciousDuplicates,
    orphanServicioRefs,
    inconsistentSessions,
    anomalousTenants,
  };

  console.log("\n=== Auditoría de imágenes por tenant ===\n");
  console.log(`oh-diosa/default: ${report.defaultTenantImageCount} imágenes`);
  console.log(`Legacy sin salonId: ${report.legacyWithoutSalonId}`);
  console.log(`Duplicados sospechosos (blob compartido con default): ${report.suspiciousDuplicates.length}`);
  console.log(`Servicios con imagen de otro tenant: ${report.orphanServicioRefs.length}`);
  console.log(`Sesiones inconsistentes: ${report.inconsistentSessions.length}`);
  console.log(`Tenants con imágenes reales (no solo placeholders): ${report.anomalousTenants.length}`);
  console.log("\nPor salón:");
  for (const s of salonStats) {
    console.log(
      `  ${s.slug || s.salonId}: total=${s.total}, placeholders=${s.placeholders}, reales=${s.realImages}`
    );
  }

  if (suspiciousDuplicates.length > 0) {
    console.log("\nDuplicados sospechosos:");
    for (const d of suspiciousDuplicates.slice(0, 20)) {
      console.log(`  ${d.blobUrl.slice(0, 80)}... → ${d.otherSalonIds.join(", ")}`);
    }
  }

  console.log("\nJSON completo:\n");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
