import { adminHandler } from "@/lib/api/handlers";
import { ok, created } from "@/lib/api/responses";
import { getDatabase } from "@/lib/mongodb";
import { tenantQuery } from "@/lib/tenant";
import { AppError } from "@/lib/api/errors";

export const GET = adminHandler(async ({ salonId }) => {
  const db = await getDatabase();
  const count = await db
    .collection("servicios")
    .countDocuments(tenantQuery(salonId));

  return ok({
    serviciosExistentes: count,
    inicializado: count > 0,
  });
});

export const POST = adminHandler(async ({ salonId }) => {
  const db = await getDatabase();

  const existingCount = await db
    .collection("servicios")
    .countDocuments(tenantQuery(salonId));

  if (existingCount > 0) {
    throw new AppError(
      `Ya existen ${existingCount} servicio(s) en este salón. No se puede inicializar.`,
      400
    );
  }

  const now = new Date();

  const serviciosPorDefecto = [
    {
      salonId,
      nombre: "Gel / Softgel",
      descripcion:
        "Gel ligero y flexible, ideal para acabado natural y cómodo.",
      precio: 0,
      duracion: 0,
      imagenId: null,
      activo: true,
      orden: 1,
      fechaCreacion: now,
      fechaActualizacion: now,
    },
    {
      salonId,
      nombre: "Base Rubber / Gel Builder",
      descripcion:
        "Gel reforzado para uñas débiles, perfecto para mayor resistencia y durabilidad.",
      precio: 0,
      duracion: 0,
      imagenId: null,
      activo: true,
      orden: 2,
      fechaCreacion: now,
      fechaActualizacion: now,
    },
    {
      salonId,
      nombre: "Gel Dipping",
      descripcion:
        "Sistema sin monómero con polvo aclírico, uñas fuertes y acabado elegante.",
      precio: 0,
      duracion: 0,
      imagenId: null,
      activo: true,
      orden: 3,
      fechaCreacion: now,
      fechaActualizacion: now,
    },
    {
      salonId,
      nombre: "Pedicure",
      descripcion:
        "Un servicio completo para pies suaves, saludables y bien cuidados.",
      precio: 0,
      duracion: 0,
      imagenId: null,
      activo: true,
      orden: 4,
      fechaCreacion: now,
      fechaActualizacion: now,
    },
  ];

  const result = await db
    .collection("servicios")
    .insertMany(serviciosPorDefecto);

  return created(
    {
      insertedCount: result.insertedCount,
      insertedIds: Object.values(result.insertedIds),
    },
    `✅ ${result.insertedCount} servicios creados exitosamente. Ahora puedes asignarles imágenes desde el panel de administración.`
  );
});
