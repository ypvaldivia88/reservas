import clientPromise from "@/lib/mongodb";
import { Schedule } from "@/lib/types";
import { scheduleUtils } from "@/lib/utils";
import { withTenantScope } from "@/lib/tenant";
import { adminHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";

import { ensureMultiTenantIndexes } from "@/lib/db/tenant-indexes";

export const GET = adminHandler(async ({ salonId, request }) => {
  const name = request.nextUrl.searchParams.get("name") || "default";

  const client = await clientPromise;
  const db = client.db("nailsalon");
  await ensureMultiTenantIndexes(db);

  let schedule: Schedule | null = await db
    .collection<Schedule>("schedules")
    .findOne(withTenantScope({ name }, salonId));

  if (!schedule && name === "default") {
    const defaultSchedule = {
      ...scheduleUtils.createDefaultSchedule(),
      salonId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection("schedules").insertOne(defaultSchedule);
    schedule = {
      ...defaultSchedule,
      _id: result.insertedId.toString(),
    } as unknown as Schedule;
  }

  if (!schedule) {
    throw AppError.notFound("Horario no encontrado");
  }

  return ok(schedule);
});

export const POST = adminHandler(async ({ salonId, request }) => {
  const data = await request.json();

  if (!data.schedule || !Array.isArray(data.schedule)) {
    throw new AppError("Datos de horario inválidos", 400);
  }

  const client = await clientPromise;
  const db = client.db("nailsalon");

  const name = data.name || "default";
  const scheduleData = {
    salonId,
    name,
    description: data.description || "",
    schedule: data.schedule,
    updatedAt: new Date(),
  };

  const result = await db.collection<Schedule>("schedules").findOneAndUpdate(
    withTenantScope({ name }, salonId),
    {
      $set: scheduleData,
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true, returnDocument: "after" }
  );

  if (!result) {
    throw AppError.internal("Error al actualizar el horario");
  }

  return ok(result as Schedule, { message: "Horario actualizado exitosamente" });
});
