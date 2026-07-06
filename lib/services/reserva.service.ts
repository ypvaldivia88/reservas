import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { AppError } from "@/lib/api/errors";
import { Reserva, User, PaymentMethod } from "@/lib/types";
import { phoneUtils } from "@/lib/utils";
import {
  validateReservaInput,
  findActiveSlotConflict,
  findClientDayConflict,
  clientDayConflictMessage,
  isMongoDuplicateKeyError,
} from "@/lib/reservaValidation";
import { createIncomeFromReserva } from "@/lib/finances";
import { isPaymentMethod } from "@/lib/paymentMethods";
import { reservaRepository, userRepository } from "@/lib/repositories/user.repository";
import { DEFAULT_SALON_ID } from "@/lib/tenant";

export class ReservaService {
  async list(salonId: string): Promise<Reserva[]> {
    return reservaRepository.findAll(salonId);
  }

  async getById(salonId: string, id: string): Promise<Reserva> {
    const reserva = await reservaRepository.findById(salonId, id);
    if (!reserva) throw AppError.notFound("Reserva no encontrada");
    return reserva;
  }

  async create(salonId: string, data: Record<string, unknown>) {
    const validacion = validateReservaInput(data as never);
    if (!validacion.isValid) {
      throw new AppError(validacion.errors.join(", "), 400);
    }

    const db = await getDb();

    const slotConflict = await findActiveSlotConflict(
      db,
      data.fechaCita as string,
      data.horaCita as string,
      undefined,
      salonId
    );
    if (slotConflict) {
      throw new AppError(
        "Este horario ya está reservado. Por favor selecciona otro horario.",
        400
      );
    }

    let telefonoNormalizado: string;
    try {
      telefonoNormalizado = phoneUtils.normalize(data.telefono as string);
    } catch {
      throw new AppError("El número de teléfono ingresado no tiene un formato válido", 400);
    }

    const nombreNormalizado = (data.nombre as string).trim();
    let cliente = await userRepository.findClienteByPhone(salonId, telefonoNormalizado);

    if (cliente) {
      if (cliente.nombre !== nombreNormalizado) {
        throw new AppError(
          `Este teléfono está registrado con el nombre: ${cliente.nombre}. Por favor verifica tus datos.`,
          400
        );
      }
    } else {
      cliente = await userRepository.createCliente(salonId, {
        nombre: nombreNormalizado,
        telefono: telefonoNormalizado,
      });
    }

    const clienteId = cliente._id?.toString();

    const dayConflict = await findClientDayConflict(db, data.fechaCita as string, {
      clienteId,
      telefono: telefonoNormalizado,
      salonId,
    });
    if (dayConflict) {
      throw new AppError(clientDayConflictMessage(dayConflict.horaCita), 400);
    }

    const nuevaReserva: Omit<Reserva, "_id"> = {
      salonId: salonId || DEFAULT_SALON_ID,
      clienteId,
      nombre: nombreNormalizado,
      telefono: telefonoNormalizado,
      forma: data.forma as Reserva["forma"],
      largo: Number(data.largo),
      decoracion: (data.decoracion as string)?.trim() || "",
      fechaCreacion: new Date(),
      fechaCita: data.fechaCita as string,
      horaCita: data.horaCita as string,
      estado: "pendiente",
    };

    try {
      const insertedId = await reservaRepository.create(salonId, nuevaReserva);
      return { insertedId };
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        throw AppError.conflict(clientDayConflictMessage());
      }
      throw error;
    }
  }

  async update(salonId: string, id: string, data: Partial<Reserva>) {
    const existing = await this.getById(salonId, id);
    const effectiveSalonId = existing.salonId || salonId || DEFAULT_SALON_ID;
    const db = await getDb();

    const updateData: Partial<Reserva> = { ...data };
    const newEstado = updateData.estado ?? existing.estado;
    const newFechaCita = updateData.fechaCita ?? existing.fechaCita;
    const newHoraCita = updateData.horaCita ?? existing.horaCita;
    const newTelefono = updateData.telefono ?? existing.telefono;
    const isActiveState =
      newEstado === "pendiente" || newEstado === "confirmada";

    if (isActiveState && (updateData.fechaCita || updateData.horaCita)) {
      const slotConflict = await findActiveSlotConflict(
        db,
        newFechaCita,
        newHoraCita,
        id,
        effectiveSalonId
      );
      if (slotConflict) {
        throw new AppError(
          "Este horario ya está reservado. Por favor selecciona otro horario.",
          400
        );
      }
    }

    if (isActiveState && (updateData.fechaCita || updateData.telefono)) {
      const dayConflict = await findClientDayConflict(db, newFechaCita, {
        clienteId: existing.clienteId,
        telefono: newTelefono,
        excludeId: id,
        salonId: effectiveSalonId,
      });
      if (dayConflict) {
        throw new AppError(clientDayConflictMessage(dayConflict.horaCita), 400);
      }
    }

    if (data.servicioIds !== undefined) {
      const servicioIds = Array.isArray(data.servicioIds) ?
        data.servicioIds.filter((id: unknown) => typeof id === "string" && id)
      : [];
      updateData.servicioIds = servicioIds;
      updateData.servicioId = servicioIds[0] || undefined;
    } else if (data.servicioId !== undefined) {
      updateData.servicioId = data.servicioId || undefined;
      updateData.servicioIds =
        data.servicioId ? [data.servicioId as string] : [];
    }

    const updated = await reservaRepository.update(effectiveSalonId, id, updateData);
    if (!updated) throw AppError.notFound("Reserva no encontrada");

    const finalEstado = updateData.estado ?? existing.estado;
    const finalCosto =
      updateData.costo !== undefined ? updateData.costo : existing.costo;
    const finalFechaCita = updateData.fechaCita ?? existing.fechaCita;
    const finalServicioIds =
      updateData.servicioIds ??
      existing.servicioIds ??
      (existing.servicioId ? [existing.servicioId] : undefined);
    const finalServicioId =
      finalServicioIds && finalServicioIds.length > 0 ?
        finalServicioIds[0]
      : updateData.servicioId ?? existing.servicioId;
    const finalCobroEfectivo =
      updateData.cobroEfectivo !== undefined
        ? updateData.cobroEfectivo
        : existing.cobroEfectivo;
    const finalCobroTransferencia =
      updateData.cobroTransferencia !== undefined
        ? updateData.cobroTransferencia
        : existing.cobroTransferencia;
    const finalMetodoPago: PaymentMethod | undefined =
      updateData.metodoPago !== undefined
        ? updateData.metodoPago
        : isPaymentMethod(existing.metodoPago)
          ? existing.metodoPago
          : undefined;

    if (
      finalCosto !== undefined &&
      finalCosto >= 0 &&
      (finalEstado === "confirmada" || finalEstado === "completada")
    ) {
      const efectivo = Number(finalCobroEfectivo) || 0;
      const transferencia = Number(finalCobroTransferencia) || 0;
      if (efectivo + transferencia > finalCosto) {
        throw new AppError(
          "El desglose de cobro no puede superar el total del turno",
          400
        );
      }

      await createIncomeFromReserva(
        db,
        effectiveSalonId,
        id,
        finalCosto,
        `Reserva ${existing.nombre} - ${finalFechaCita}`,
        finalFechaCita,
        finalServicioId,
        finalCobroEfectivo,
        finalCobroTransferencia,
        finalMetodoPago
      );
    }
  }

  async delete(salonId: string, id: string) {
    const existing = await this.getById(salonId, id);
    const effectiveSalonId = existing.salonId || salonId || DEFAULT_SALON_ID;
    const deleted = await reservaRepository.remove(effectiveSalonId, id);
    if (!deleted) throw AppError.notFound("Reserva no encontrada");
  }
}

export class ClienteService {
  async list(salonId: string): Promise<User[]> {
    return userRepository.findClientes(salonId);
  }

  async create(salonId: string, data: { nombre: string; telefono: string }) {
    if (!data.nombre?.trim() || data.nombre.trim().length < 2) {
      throw new AppError("El nombre es requerido y debe tener al menos 2 caracteres", 400);
    }
    if (!data.telefono || !/^\+?[\d\s\-()]{8,15}$/.test(data.telefono)) {
      throw new AppError("El teléfono es requerido y debe tener un formato válido", 400);
    }

    const existing = await userRepository.findClienteByPhone(
      salonId,
      data.telefono.trim()
    );
    if (existing) {
      throw new AppError(
        `Este teléfono ya está registrado con el nombre: ${existing.nombre}`,
        400
      );
    }

    const cliente = await userRepository.createCliente(salonId, {
      nombre: data.nombre.trim(),
      telefono: data.telefono.trim(),
    });

    return { insertedId: cliente._id! };
  }
}

export const reservaService = new ReservaService();
export const clienteService = new ClienteService();
