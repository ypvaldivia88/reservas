import { adminHandler, publicHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { reservaService } from "@/lib/services/reserva.service";
import { FORMAS_UNAS, Reserva } from "@/lib/types";
import { phoneUtils } from "@/lib/utils";
import { AppError } from "@/lib/api/errors";
import { isMongoDuplicateKeyError } from "@/lib/reservaValidation";
import { clientDayConflictMessage } from "@/lib/reservaValidation";

export const GET = publicHandler(async ({ salonId, params }) => {
  const data = await reservaService.getById(salonId, params.id);
  return ok(data, { message: "Reserva obtenida exitosamente" });
});

export const PATCH = adminHandler(async ({ salonId, params, request }) => {
  const data = await request.json();
  const updateData: Partial<Reserva> = {};

  if (data.estado) {
    if (!["pendiente", "confirmada", "cancelada", "completada"].includes(data.estado)) {
      throw new AppError("Estado inválido", 400);
    }
    updateData.estado = data.estado;
  }
  if (data.fechaCita) {
    const fecha = new Date(data.fechaCita);
    if (isNaN(fecha.getTime())) throw new AppError("Fecha de cita inválida", 400);
    updateData.fechaCita = data.fechaCita;
  }
  if (data.horaCita) updateData.horaCita = data.horaCita;
  if (data.nombre) updateData.nombre = data.nombre.trim();
  if (data.telefono) {
    try {
      updateData.telefono = phoneUtils.normalize(data.telefono);
    } catch {
      throw new AppError("Formato de teléfono inválido", 400);
    }
  }
  if (data.forma && FORMAS_UNAS.includes(data.forma)) {
    updateData.forma = data.forma;
  }
  if (data.largo !== undefined) {
    const largo = Number(data.largo);
    if (largo >= 1 && largo <= 8) updateData.largo = largo;
  }
  if (data.decoracion !== undefined) {
    updateData.decoracion = data.decoracion.trim();
  }
  if (data.costo !== undefined) {
    const costo = Number(data.costo);
    if (!isNaN(costo) && costo >= 0) updateData.costo = costo;
  }
  if (data.servicioId !== undefined) {
    updateData.servicioId = data.servicioId || undefined;
  }

  try {
    await reservaService.update(salonId, params.id, updateData);
    return ok(undefined, { message: "Reserva actualizada exitosamente" });
  } catch (error) {
    if (isMongoDuplicateKeyError(error)) {
      throw new AppError(clientDayConflictMessage(), 400);
    }
    throw error;
  }
});

export const DELETE = adminHandler(async ({ salonId, params }) => {
  await reservaService.delete(salonId, params.id);
  return ok(undefined, { message: "Reserva eliminada exitosamente" });
});
