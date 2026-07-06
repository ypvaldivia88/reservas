import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { tenantQuery } from "@/lib/tenant";
import { adminHandler } from "@/lib/api/handlers";
import { AppError } from "@/lib/api/errors";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types";

export class ClienteDetailService {
  async getById(salonId: string, id: string): Promise<User> {
    if (!ObjectId.isValid(id)) throw new AppError("ID de cliente inválido", 400);

    const db = await getDb();
    const cliente = await db.collection(Collections.USERS).findOne({
      _id: new ObjectId(id),
      role: "cliente",
      ...tenantQuery(salonId),
    });

    if (!cliente) throw AppError.notFound("Cliente no encontrado");
    return { ...cliente, _id: cliente._id.toString() } as User;
  }

  async update(salonId: string, id: string, data: Partial<User>) {
    if (!ObjectId.isValid(id)) throw new AppError("ID de cliente inválido", 400);

    const updateData: Partial<User> = {};

    if (data.nombre) {
      if (data.nombre.trim().length < 2) {
        throw new AppError("El nombre debe tener al menos 2 caracteres", 400);
      }
      updateData.nombre = data.nombre.trim();
    }

    if (data.telefono) {
      if (!/^\+?[\d\s\-()]{8,15}$/.test(data.telefono)) {
        throw new AppError("El teléfono debe tener un formato válido", 400);
      }

      const db = await getDb();
      const existing = await db.collection(Collections.USERS).findOne({
        telefono: data.telefono.trim(),
        role: "cliente",
        _id: { $ne: new ObjectId(id) },
        ...tenantQuery(salonId),
      });

      if (existing) {
        throw new AppError("El teléfono ya está registrado por otro cliente", 400);
      }
      updateData.telefono = data.telefono.trim();
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError("No se proporcionaron campos para actualizar", 400);
    }

    const db = await getDb();
    const result = await db.collection(Collections.USERS).updateOne(
      { _id: new ObjectId(id), role: "cliente", ...tenantQuery(salonId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw AppError.notFound("Cliente no encontrado");
    }
  }

  async delete(salonId: string, id: string) {
    if (!ObjectId.isValid(id)) throw new AppError("ID de cliente inválido", 400);

    const db = await getDb();
    const reservasActivas = await db
      .collection(Collections.RESERVAS)
      .countDocuments({
        clienteId: id,
        estado: { $in: ["pendiente", "confirmada"] },
        ...tenantQuery(salonId),
      });

    if (reservasActivas > 0) {
      throw new AppError(
        `El cliente tiene ${reservasActivas} reserva(s) activa(s). Cancela o completa las reservas primero.`,
        400
      );
    }

    const result = await db.collection(Collections.USERS).deleteOne({
      _id: new ObjectId(id),
      role: "cliente",
      ...tenantQuery(salonId),
    });

    if (result.deletedCount === 0) {
      throw AppError.notFound("Cliente no encontrado");
    }
  }
}

export const clienteDetailService = new ClienteDetailService();
