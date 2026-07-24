import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { hashPassword, verifyPassword, generateSessionToken } from "@/lib/auth";
import { DEFAULT_SALON_ID } from "@/lib/tenant";
import { AppError } from "@/lib/api/errors";
import {
  ChangePasswordRequest,
  LoginCredentials,
  UpdateProfileRequest,
  User,
  UserProfile,
} from "@/lib/types";
import { userRepository } from "@/lib/repositories/user.repository";

export class AuthService {
  async login(credentials: LoginCredentials) {
    if (!credentials.username || !credentials.password) {
      throw new AppError("Usuario y contraseña son requeridos", 400);
    }

    const user = await userRepository.findAdminByUsername(credentials.username);
    if (!user?.password) {
      throw AppError.unauthorized("Credenciales inválidas");
    }

    const isValid = await verifyPassword(credentials.password, user.password);
    if (!isValid) {
      throw AppError.unauthorized("Credenciales inválidas");
    }

    const token = generateSessionToken();
    const db = await getDb();

    let sessionSalonId: string | undefined;
    if (user.role === "platform_admin") {
      sessionSalonId = user.salonId;
    } else if (user.role === "admin" && !user.salonId) {
      sessionSalonId = DEFAULT_SALON_ID;
    } else if (!user.salonId) {
      throw new AppError(
        "Usuario sin salón asignado. Contacta al administrador de la plataforma.",
        403
      );
    } else {
      sessionSalonId = user.salonId;
    }

    await db.collection(Collections.SESSIONS).insertOne({
      token,
      userId: user._id,
      username: user.username,
      role: user.role,
      salonId: sessionSalonId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return {
      token,
      user: {
        username: user.username!,
        role: user.role,
        salonId: user.salonId,
      },
    };
  }

  async logout(token?: string) {
    if (token) {
      const db = await getDb();
      await db.collection(Collections.SESSIONS).deleteOne({ token });
    }
  }

  async changePassword(userId: unknown, data: ChangePasswordRequest) {
    if (!data.currentPassword || !data.newPassword) {
      throw new AppError("Contraseña actual y nueva son requeridas", 400);
    }
    if (data.newPassword.length < 8) {
      throw new AppError("La nueva contraseña debe tener al menos 8 caracteres", 400);
    }

    const db = await getDb();
    const user = (await db
      .collection<User>(Collections.USERS)
      .findOne({ _id: userId } as never)) as User | null;

    if (!user?.password) {
      throw AppError.notFound("Usuario no encontrado");
    }

    const isValid = await verifyPassword(data.currentPassword, user.password);
    if (!isValid) {
      throw AppError.unauthorized("Contraseña actual incorrecta");
    }

    const hashedPassword = await hashPassword(data.newPassword);
    await db
      .collection(Collections.USERS)
      .updateOne({ _id: userId } as never, { $set: { password: hashedPassword } });
  }

  async adminResetPassword(userId: unknown, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new AppError("La nueva contraseña debe tener al menos 8 caracteres", 400);
    }

    const db = await getDb();
    const user = (await db
      .collection<User>(Collections.USERS)
      .findOne({ _id: userId } as never)) as User | null;

    if (!user?.password) {
      throw AppError.notFound("Usuario no encontrado");
    }

    const hashedPassword = await hashPassword(newPassword);
    await db
      .collection(Collections.USERS)
      .updateOne({ _id: userId } as never, { $set: { password: hashedPassword } });
  }

  async getProfile(userId: unknown): Promise<UserProfile> {
    const db = await getDb();
    const user = (await db
      .collection<User>(Collections.USERS)
      .findOne({ _id: userId } as never)) as User | null;

    if (!user) throw AppError.notFound("Usuario no encontrado");

    return {
      _id: String(user._id),
      nombre: user.nombre,
      username: user.username,
      role: user.role,
      salonId: user.salonId,
    };
  }

  async updateProfile(userId: unknown, data: UpdateProfileRequest) {
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
      const currentUser = await userRepository.findById(String(userId));
      if (existing && String(existing._id) !== String(currentUser?._id)) {
        throw new AppError("El nombre de usuario ya está en uso", 400);
      }
      updateData.username = username;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError("No se proporcionaron campos para actualizar", 400);
    }

    const db = await getDb();
    const result = await db
      .collection(Collections.USERS)
      .updateOne({ _id: userId } as never, { $set: updateData });

    if (result.matchedCount === 0) {
      throw AppError.notFound("Usuario no encontrado");
    }

    if (updateData.username) {
      await db
        .collection(Collections.SESSIONS)
        .updateMany({ userId }, { $set: { username: updateData.username } });
    }
  }

  async initDefaultAdmin() {
    const existing = await userRepository.findAdminByUsername("admin");
    if (existing) return { created: false };

    const hashedPassword = await hashPassword("admin");
    const db = await getDb();
    await db.collection(Collections.USERS).insertOne({
      username: "admin",
      password: hashedPassword,
      role: "salon_admin",
      salonId: DEFAULT_SALON_ID,
      nombre: "Administrador",
      fechaCreacion: new Date(),
    });

    return { created: true };
  }

  async initPlatformAdmin() {
    const username =
      process.env.PLATFORM_ADMIN_USERNAME || "platform";
    const existing = await userRepository.findAdminByUsername(username);
    if (existing) return { created: false, username };

    const password =
      process.env.PLATFORM_ADMIN_PASSWORD || "platform123";
    const hashedPassword = await hashPassword(password);
    const db = await getDb();

    await db.collection(Collections.USERS).insertOne({
      username,
      password: hashedPassword,
      role: "platform_admin",
      nombre: "Administrador de Plataforma",
      fechaCreacion: new Date(),
    });

    return { created: true, username };
  }

  async getSessionInfo(token?: string) {
    if (!token) return null;

    const db = await getDb();
    const session = await db.collection(Collections.SESSIONS).findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!session) return null;

    return {
      username: session.username as string,
      role: session.role as string,
      salonId: session.salonId as string | undefined,
    };
  }
}

export const authService = new AuthService();
