import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { tenantQuery } from "@/lib/tenant";
import { AppError } from "@/lib/api/errors";
import {
  AdminUserUpdateRequest,
  PlatformUserListItem,
  User,
} from "@/lib/types";
import { userRepository } from "@/lib/repositories/user.repository";
import { authService } from "@/lib/services/auth.service";
import { salonRepository } from "@/lib/repositories/salon.repository";
import { ACTIVE_RESERVATION_STATES } from "@/lib/reservaValidation";

export class UserAdminService {
  async listSalonAdmins(salonId?: string): Promise<PlatformUserListItem[]> {
    return userRepository.findSalonAdmins(salonId);
  }

  async listClientes(salonId?: string): Promise<PlatformUserListItem[]> {
    const users = await userRepository.findAllClientes(salonId);
    const db = await getDb();

    return Promise.all(
      users.map(async (user) => {
        if (!user._id) {
          return { ...user, reservasTotal: 0, reservasActivas: 0 };
        }

        const baseFilter: Record<string, unknown> = { clienteId: user._id };
        if (user.salonId) {
          Object.assign(baseFilter, tenantQuery(user.salonId));
        } else if (salonId) {
          Object.assign(baseFilter, tenantQuery(salonId));
        }

        const [reservasTotal, reservasActivas] = await Promise.all([
          db.collection(Collections.RESERVAS).countDocuments(baseFilter),
          db.collection(Collections.RESERVAS).countDocuments({
            ...baseFilter,
            estado: { $in: ACTIVE_RESERVATION_STATES },
          }),
        ]);

        return { ...user, reservasTotal, reservasActivas };
      })
    );
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

    if (data.salonId !== undefined) {
      const salon = await salonRepository.findBySalonId(data.salonId);
      if (!salon) {
        throw new AppError("El salón seleccionado no existe", 400);
      }
      updateData.salonId = data.salonId;
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

      if (updateData.salonId) {
        await db
          .collection(Collections.SESSIONS)
          .updateMany({ userId: new ObjectId(id) }, { $set: { salonId: updateData.salonId } });
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

  async deleteSalonAdmin(id: string, actorUserId: string) {
    if (!ObjectId.isValid(id)) throw new AppError("ID inválido", 400);

    const user = await this.getSalonAdmin(id);

    if (String(user._id) === actorUserId) {
      throw new AppError("No puedes eliminar tu propia cuenta", 400);
    }

    const db = await getDb();
    const salonId = user.salonId;

    if (salonId) {
      const otherAdmins = await db.collection(Collections.USERS).countDocuments({
        salonId,
        role: { $in: ["admin", "salon_admin"] },
        _id: { $ne: new ObjectId(id) },
      });

      if (otherAdmins === 0) {
        throw new AppError(
          "No puedes eliminar el único administrador de este salón",
          400
        );
      }
    }

    await db.collection(Collections.SESSIONS).deleteMany({
      userId: new ObjectId(id),
    });
    await db.collection(Collections.USERS).deleteOne({
      _id: new ObjectId(id),
      role: { $in: ["admin", "salon_admin"] },
    });
  }

  async deleteCliente(id: string, options?: { force?: boolean }) {
    if (!ObjectId.isValid(id)) throw new AppError("ID inválido", 400);

    const db = await getDb();
    const cliente = await db.collection(Collections.USERS).findOne({
      _id: new ObjectId(id),
      role: "cliente",
    });

    if (!cliente) throw AppError.notFound("Cliente no encontrado");

    const salonId = cliente.salonId as string | undefined;
    const baseFilter: Record<string, unknown> = { clienteId: id };
    if (salonId) {
      Object.assign(baseFilter, tenantQuery(salonId));
    }

    const activeReservas = await db.collection(Collections.RESERVAS).countDocuments({
      ...baseFilter,
      estado: { $in: ACTIVE_RESERVATION_STATES },
    });

    if (activeReservas > 0 && !options?.force) {
      throw new AppError(
        `El cliente tiene ${activeReservas} reserva(s) activa(s). Confirma la eliminación forzada.`,
        409
      );
    }

    await db.collection(Collections.SESSIONS).deleteMany({
      userId: new ObjectId(id),
    });
    await db.collection(Collections.USERS).deleteOne({
      _id: new ObjectId(id),
      role: "cliente",
    });
  }
}

export const userAdminService = new UserAdminService();
