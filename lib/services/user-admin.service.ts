import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { tenantQuery } from "@/lib/tenant";
import { AppError } from "@/lib/api/errors";
import { AdminUserUpdateRequest, User } from "@/lib/types";
import { userRepository } from "@/lib/repositories/user.repository";
import { authService } from "@/lib/services/auth.service";

export class UserAdminService {
  async listSalonAdmins(salonId?: string): Promise<User[]> {
    return userRepository.findSalonAdmins(salonId);
  }

  async listClientes(salonId?: string): Promise<User[]> {
    return userRepository.findAllClientes(salonId);
  }

  async getSalonAdmin(id: string): Promise<User> {
    const user = await userRepository.findById(id);
    if (!user || !["admin", "salon_admin"].includes(user.role)) {
      throw AppError.notFound("Administrador no encontrado");
    }
    return { ...user, _id: String(user._id), password: undefined };
  }

  async updateSalonAdmin(id: string, data: AdminUserUpdateRequest) {
    if (!ObjectId.isValid(id)) throw new AppError("ID inválido", 400);

    await this.getSalonAdmin(id);
    const updateData: Partial<User> = {};

    if (data.nombre !== undefined) {
      const nombre = data.nombre.trim();
      if (nombre.length < 2) {
        throw new AppError("El nombre debe tener al menos 2 caracteres", 400);
      }
      updateData.nombre = nombre;
    }

    if (data.username !== undefined) {
      const username = data.username.trim();
      if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
        throw new AppError(
          "El usuario debe tener entre 3 y 30 caracteres (letras, números, . _ -)",
          400
        );
      }
      const existing = await userRepository.findAdminByUsername(username);
      if (existing && String(existing._id) !== id) {
        throw new AppError("El nombre de usuario ya está en uso", 400);
      }
      updateData.username = username;
    }

    if (Object.keys(updateData).length === 0 && !data.newPassword) {
      throw new AppError("No se proporcionaron campos para actualizar", 400);
    }

    if (Object.keys(updateData).length > 0) {
      const db = await getDb();
      await db
        .collection(Collections.USERS)
        .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

      if (updateData.username) {
        await db
          .collection(Collections.SESSIONS)
          .updateMany({ userId: new ObjectId(id) }, { $set: { username: updateData.username } });
      }
    }

    if (data.newPassword) {
      await authService.adminResetPassword(new ObjectId(id), data.newPassword);
    }

    return this.getSalonAdmin(id);
  }

  async updateCliente(id: string, data: Partial<User>) {
    if (!ObjectId.isValid(id)) throw new AppError("ID inválido", 400);

    const db = await getDb();
    const cliente = await db.collection(Collections.USERS).findOne({
      _id: new ObjectId(id),
      role: "cliente",
    });

    if (!cliente) throw AppError.notFound("Cliente no encontrado");

    const salonId = cliente.salonId as string;
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

    await db.collection(Collections.USERS).updateOne(
      { _id: new ObjectId(id), role: "cliente" },
      { $set: updateData }
    );
  }
}

export const userAdminService = new UserAdminService();
