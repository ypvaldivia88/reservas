import { adminHandler, publicHandler } from "@/lib/api/handlers";
import { ok } from "@/lib/api/responses";
import { reservaService } from "@/lib/services/reserva.service";
import { Reserva, PaymentMethod } from "@/lib/types";
import { phoneUtils } from "@/lib/utils";
import { AppError } from "@/lib/api/errors";
import { isMongoDuplicateKeyError } from "@/lib/reservaValidation";
import { clientDayConflictMessage } from "@/lib/reservaValidation";
import { isPaymentMethod } from "@/lib/paymentMethods";
import { salonRepository } from "@/lib/repositories/salon.repository";
import { applyReservaPatchFields } from "@/lib/reserva-payload";

export const GET = publicHandler(async ({ salonId, params }) => {
  const data = await reservaService.getById(salonId, params.id);
  return ok(data, { message: "Reserva obtenida exitosamente" });
});

export const PATCH = adminHandler(async ({ salonId, params, request }) => {
  const data = await request.json();
  const updateData: Partial<Reserva> = {};
  const salon = await salonRepository.findBySalonId(salonId);

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
  const templateFields = applyReservaPatchFields(
    {
      forma: data.forma,
      largo: data.largo,
      decoracion: data.decoracion,
      colores: data.colores,
    },
    salon?.businessTemplate
  );
  if (templateFields.forma !== undefined) {
    updateData.forma = templateFields.forma;
  }
  if (templateFields.largo !== undefined) {
    updateData.largo = templateFields.largo;
  }
  if (templateFields.decoracion !== undefined) {
    updateData.decoracion = templateFields.decoracion;
  }
  if (data.costo !== undefined) {
    const costo = Number(data.costo);
    if (!isNaN(costo) && costo >= 0) updateData.costo = costo;
  }
  if (data.servicioIds !== undefined) {
    const servicioIds = Array.isArray(data.servicioIds) ?
      data.servicioIds.filter((id: unknown) => typeof id === "string" && id)
    : [];
    updateData.servicioIds = servicioIds;
    updateData.servicioId = servicioIds[0] || undefined;
  } else if (data.servicioId !== undefined) {
    updateData.servicioId = data.servicioId || undefined;
    updateData.servicioIds = data.servicioId ? [data.servicioId] : [];
  }
  if (data.cobroEfectivo !== undefined || data.cobroTransferencia !== undefined) {
    const cobroEfectivo = Number(data.cobroEfectivo ?? 0);
    const cobroTransferencia = Number(data.cobroTransferencia ?? 0);
    updateData.cobroEfectivo =
      isNaN(cobroEfectivo) || cobroEfectivo < 0 ? 0 : cobroEfectivo;
    updateData.cobroTransferencia =
      isNaN(cobroTransferencia) || cobroTransferencia < 0 ? 0 : cobroTransferencia;
    const cobroTotal = updateData.cobroEfectivo + updateData.cobroTransferencia;
    if (cobroTotal > 0) {
      updateData.costo = cobroTotal;
    }
  }
  if (data.metodoPago !== undefined) {
    if (data.metodoPago && !isPaymentMethod(data.metodoPago)) {
      throw new AppError("Forma de cobro inválida", 400);
    }
    updateData.metodoPago = data.metodoPago || undefined;
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
