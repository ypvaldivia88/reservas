import { ObjectId, Document } from "mongodb";
import { BaseRepository } from "./base.repository";
import { Collections } from "@/lib/db/collections";
import { User, Reserva } from "@/lib/types";

class UserRepository extends BaseRepository {
  constructor() {
    super(Collections.USERS);
  }

  async findClienteByPhone(
    salonId: string,
    telefono: string
  ): Promise<User | null> {
    return (await this.findOneByTenant(salonId, {
      telefono,
      role: "cliente",
    })) as unknown as User | null;
  }

  async findAdminByUsername(username: string): Promise<User | null> {
    const col = await this.collection();
    return col.findOne({
      username,
      role: { $in: ["admin", "salon_admin", "platform_admin"] },
    }) as Promise<User | null>;
  }

  async findById(id: string): Promise<User | null> {
    const col = await this.collection();
    if (!ObjectId.isValid(id)) return null;
    return col.findOne({ _id: new ObjectId(id) }) as Promise<User | null>;
  }

  async findSalonAdmins(salonId?: string): Promise<User[]> {
    const col = await this.collection();
    const filter: Record<string, unknown> = {
      role: { $in: ["admin", "salon_admin"] },
    };
    if (salonId) filter.salonId = salonId;
    const users = await col
      .find(filter)
      .sort({ fechaCreacion: -1 })
      .toArray();
    return users.map((u) => ({
      ...u,
      _id: u._id.toString(),
      password: undefined,
    })) as User[];
  }

  async findAllClientes(salonId?: string): Promise<User[]> {
    const col = await this.collection();
    const filter: Record<string, unknown> = { role: "cliente" };
    if (salonId) filter.salonId = salonId;
    const users = await col
      .find(filter)
      .sort({ fechaCreacion: -1 })
      .toArray();
    return users.map((u) => ({
      ...u,
      _id: u._id.toString(),
    })) as User[];
  }

  async findClientes(salonId: string): Promise<User[]> {
    return (await this.findByTenant(
      salonId,
      { role: "cliente" },
      { fechaCreacion: -1 }
    )) as unknown as User[];
  }

  async createCliente(
    salonId: string,
    data: { nombre: string; telefono: string }
  ): Promise<User> {
    const id = await this.insertOne(salonId, {
      ...data,
      role: "cliente",
      fechaCreacion: new Date(),
    });
    return { _id: id, salonId, ...data, role: "cliente", fechaCreacion: new Date() };
  }
}

class ReservaRepository extends BaseRepository {
  constructor() {
    super(Collections.RESERVAS);
  }

  async findAll(salonId: string): Promise<Reserva[]> {
    return (await this.findByTenant(salonId, {}, { fechaCreacion: -1 })) as unknown as Reserva[];
  }

  async findById(salonId: string, id: string): Promise<Reserva | null> {
    if (!ObjectId.isValid(id)) return null;
    return (await this.findOneByTenant(salonId, {
      _id: new ObjectId(id),
    })) as unknown as Reserva | null;
  }

  async create(
    salonId: string,
    data: Omit<Reserva, "_id">
  ): Promise<string> {
    return this.insertOne(salonId, data as Record<string, unknown>);
  }

  async update(
    salonId: string,
    id: string,
    data: Partial<Reserva>
  ): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    return this.updateOneByTenant(
      salonId,
      { _id: new ObjectId(id) },
      data as Record<string, unknown>
    );
  }

  async remove(salonId: string, id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    return this.deleteOneByTenant(salonId, {
      _id: new ObjectId(id),
    });
  }
}

export const userRepository = new UserRepository();
export const reservaRepository = new ReservaRepository();
