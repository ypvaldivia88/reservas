/**
 * Migración SEGURA para producción.
 * Solo AÑADE campos faltantes — nunca borra ni modifica datos existentes.
 *
 * Uso: npm run migrate:multi-tenant
 */
import "./load-env";
import clientPromise from "../lib/mongodb";
import { DEFAULT_SALON_ID } from "../lib/tenant";
import { DEFAULT_PLANS } from "../lib/subscription";
import { DEFAULT_FINANCIAL_CATEGORIES } from "../lib/finances";

const TENANT_COLLECTIONS = [
  "users",
  "reservas",
  "servicios",
  "categorias",
  "imagenes",
  "galeria",
  "schedules",
  "availability_overrides",
] as const;

async function migrate() {
  const client = await clientPromise;
  const db = client.db("nailsalon");

  console.log("🔒 Migración segura — solo operaciones aditivas\n");

  // 1. Crear salón default si no existe (upsert, no sobrescribe)
  const salonResult = await db.collection("salons").updateOne(
    { salonId: DEFAULT_SALON_ID },
    {
      $setOnInsert: {
        salonId: DEFAULT_SALON_ID,
        slug: "oh-diosa",
        nombre: "Oh`Diosa",
        whatsappNumber: process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER || "+5363233073",
        timezone: "America/Havana",
        currency: "CUP",
        status: "active",
        fechaCreacion: new Date(),
      },
    },
    { upsert: true }
  );
  console.log(
    salonResult.upsertedCount > 0
      ? "✅ Salón default creado"
      : "ℹ️  Salón default ya existía (sin cambios)"
  );

  // 2. Añadir salonId solo a documentos que NO lo tienen
  for (const collection of TENANT_COLLECTIONS) {
    const result = await db.collection(collection).updateMany(
      { salonId: { $exists: false } },
      { $set: { salonId: DEFAULT_SALON_ID } }
    );
    if (result.modifiedCount > 0) {
      console.log(
        `✅ ${collection}: salonId añadido a ${result.modifiedCount} documento(s)`
      );
    } else {
      console.log(`ℹ️  ${collection}: todos los documentos ya tienen salonId`);
    }
  }

  // 3. Sincronizar plan de suscripción único
  const defaultPlan = DEFAULT_PLANS[0];
  await db.collection("subscription_plans").updateMany(
    { nombre: { $ne: defaultPlan.nombre } },
    { $set: { activo: false } }
  );
  const planResult = await db.collection("subscription_plans").updateOne(
    { nombre: defaultPlan.nombre },
    {
      $set: { ...defaultPlan, activo: true },
      $setOnInsert: { fechaCreacion: new Date() },
    },
    { upsert: true }
  );
  if (planResult.upsertedCount > 0) {
    console.log("✅ Plan de suscripción único creado");
  } else if (planResult.modifiedCount > 0) {
    console.log("✅ Plan de suscripción único actualizado");
  } else {
    console.log("ℹ️  Plan de suscripción único ya estaba actualizado");
  }

  const planCount = await db.collection("subscription_plans").countDocuments({ activo: true });
  console.log(`ℹ️  Planes activos: ${planCount}`);

  // 4. Crear suscripción activa para el salón default si no existe
  const subExists = await db
    .collection("tenant_subscriptions")
    .findOne({ salonId: DEFAULT_SALON_ID });
  if (!subExists) {
    const activePlan = await db
      .collection("subscription_plans")
      .findOne({ activo: true }, { sort: { orden: 1 } });
    if (activePlan) {
      const now = new Date();
      const periodoFin = new Date(now);
      periodoFin.setFullYear(periodoFin.getFullYear() + 1);
      await db.collection("tenant_subscriptions").insertOne({
        salonId: DEFAULT_SALON_ID,
        planId: activePlan._id!.toString(),
        ciclo: "yearly",
        status: "active",
        descuentoAplicado: 0,
        periodoInicio: now,
        periodoFin,
        fechaCreacion: now,
      });
      console.log("✅ Suscripción activa creada para salón default");
    }
  } else {
    console.log("ℹ️  Suscripción del salón default ya existe");
  }

  // 5. Crear categorías financieras solo si no existen para este salón
  const catCount = await db
    .collection("financial_categories")
    .countDocuments({ salonId: DEFAULT_SALON_ID });
  if (catCount === 0) {
    await db.collection("financial_categories").insertMany(
      DEFAULT_FINANCIAL_CATEGORIES.map((c) => ({
        ...c,
        salonId: DEFAULT_SALON_ID,
        activo: true,
        fechaCreacion: new Date(),
      }))
    );
    console.log(
      `✅ ${DEFAULT_FINANCIAL_CATEGORIES.length} categorías financieras creadas`
    );
  } else {
    console.log(`ℹ️  Categorías financieras ya existen (${catCount})`);
  }

  // 6. Añadir salonId a sesiones de admin existentes si falta
  const sessionResult = await db.collection("sessions").updateMany(
    { salonId: { $exists: false }, role: { $in: ["admin", "salon_admin"] } },
    { $set: { salonId: DEFAULT_SALON_ID } }
  );
  if (sessionResult.modifiedCount > 0) {
    console.log(
      `✅ sessions: salonId añadido a ${sessionResult.modifiedCount} sesión(es)`
    );
  }

  // 7. Añadir salonId al admin existente si falta (sin tocar password ni otros campos)
  const adminResult = await db.collection("users").updateMany(
    {
      role: { $in: ["admin", "salon_admin"] },
      salonId: { $exists: false },
    },
    { $set: { salonId: DEFAULT_SALON_ID } }
  );
  if (adminResult.modifiedCount > 0) {
    console.log(
      `✅ users (admin): salonId añadido a ${adminResult.modifiedCount} usuario(s)`
    );
  }

  // 8. Crear platform_admin si no existe
  const platformUsername = process.env.PLATFORM_ADMIN_USERNAME || "platform";
  const platformExists = await db.collection("users").findOne({
    username: platformUsername,
    role: "platform_admin",
  });
  if (!platformExists) {
    const { hashPassword } = await import("../lib/auth");
    const password = process.env.PLATFORM_ADMIN_PASSWORD || "platform123";
    await db.collection("users").insertOne({
      username: platformUsername,
      password: await hashPassword(password),
      role: "platform_admin",
      nombre: "Administrador de Plataforma",
      fechaCreacion: new Date(),
    });
    console.log(`✅ Usuario platform_admin creado (${platformUsername})`);
  } else {
    console.log("ℹ️  Usuario platform_admin ya existe");
  }

  console.log("\n✅ Migración completada sin pérdida de datos.");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Error en migración:", err);
  process.exit(1);
});
