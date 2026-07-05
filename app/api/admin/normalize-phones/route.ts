import { adminHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { normalizePhones } from "@/scripts/normalize-phones";

/** Endpoint de mantenimiento — solo accesible por admin autenticado */
export const POST = adminHandler(async () => {
  const result = await normalizePhones();
  return ok(result, { message: "Teléfonos normalizados exitosamente" });
});
