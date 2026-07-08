import clientPromise from "@/lib/mongodb";
import { AvailabilityOverride } from "@/lib/types";
import { withTenantScope } from "@/lib/tenant";
import { adminHandler } from "@/lib/api/handlers";
import { ok, created } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";

export const GET = adminHandler(async ({ salonId }) => {
  const client = await clientPromise;
  const db = client.db("nailsalon");

  const specialDays = await db
    .collection<AvailabilityOverride>("availability_overrides")
    .find(withTenantScope({}, salonId))
    .sort({ date: 1 })
    .toArray();

  return ok(specialDays as AvailabilityOverride[]);
});

export const POST = adminHandler(async ({ salonId, request }) => {
  const data = await request.json();

  if (!data.date) {
    throw new AppError("La fecha es requerida", 400);
  }

  const client = await clientPromise;
  const db = client.db("nailsalon");

  const override: Omit<AvailabilityOverride, "_id"> = {
    salonId,
    date: data.date,
    slots: data.slots || [],
    isWorkingDay: data.isWorkingDay !== undefined ? data.isWorkingDay : true,
    reason: data.reason || "",
    createdAt: new Date(),
  };

  const result = await db
    .collection<AvailabilityOverride>("availability_overrides")
    .findOneAndUpdate(
      withTenantScope({ date: data.date }, salonId),
      { $set: override },
      { upsert: true, returnDocument: "after" }
    );

  if (!result) {
    throw AppError.internal("Error al crear el día especial");
  }

  return created(result as AvailabilityOverride, "Día especial creado exitosamente");
});

export const DELETE = adminHandler(async ({ salonId, request }) => {
  const date = request.nextUrl.searchParams.get("date");

  if (!date) {
    throw new AppError("La fecha es requerida", 400);
  }

  const client = await clientPromise;
  const db = client.db("nailsalon");

  const result = await db
    .collection<AvailabilityOverride>("availability_overrides")
    .deleteOne(withTenantScope({ date }, salonId));

  if (result.deletedCount === 0) {
    throw AppError.notFound("No se encontró el día especial para eliminar");
  }

  return ok(undefined, { message: "Día especial eliminado exitosamente" });
});
