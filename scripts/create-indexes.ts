/**
 * Script para crear índices en MongoDB que optimizan las consultas
 * de disponibilidad y reservas
 *
 * Ejecutar con: npx tsx scripts/create-indexes.ts
 */

import "./load-env";
import clientPromise from "@/lib/mongodb";
import { DB_NAME } from "@/lib/db/collections";
import { dedupeAllReservaIncomeTransactions, ensureFinancialQueryIndexes } from "@/lib/finances";
import { ensureMultiTenantIndexes } from "@/lib/db/tenant-indexes";

async function createIndexes() {
  try {
    console.log("🔧 Conectando a MongoDB...");
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    console.log("📊 Creando índices...\n");

    await db.collection("availability_overrides").createIndex(
      { date: 1 },
      { name: "idx_date" }
    );
    console.log("✅ Índice creado: availability_overrides.date");

    await db.collection("reservas").createIndex(
      { fechaCita: 1, estado: 1 },
      { name: "idx_fecha_estado" }
    );
    console.log("✅ Índice creado: reservas.fechaCita + estado");

    await db.collection("categorias").createIndex(
      { activo: 1, orden: 1 },
      { name: "idx_activo_orden" }
    );
    console.log("✅ Índice creado: categorias.activo + orden");

    await db.collection("imagenes").createIndex(
      { categoriaId: 1, activo: 1 },
      { name: "idx_categoria_activo" }
    );
    console.log("✅ Índice creado: imagenes.categoriaId + activo");

    console.log("\n🧹 Eliminando ingresos duplicados por reserva...");
    const removed = await dedupeAllReservaIncomeTransactions(db);
    if (removed > 0) {
      console.log(`✅ ${removed} transacción(es) duplicada(s) eliminada(s)`);
    } else {
      console.log("ℹ️  No se encontraron duplicados");
    }

    await ensureFinancialQueryIndexes(db);
    console.log(
      "✅ Índices de finanzas creados: uniq_reserva_income_by_method, idx_salon_fecha, idx_salon_categories"
    );

    await ensureMultiTenantIndexes(db);
    console.log(
      "✅ Índices multi-tenant creados: uniq_cliente_phone_by_salon, uniq_active_slot_by_salon, uniq_active_client_day_by_salon"
    );

    console.log("\n✨ Todos los índices creados exitosamente!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creando índices:", error);
    process.exit(1);
  }
}

createIndexes();
