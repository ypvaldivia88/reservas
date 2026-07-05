import { ObjectId, Document } from "mongodb";
import { BaseRepository } from "./base.repository";
import { Collections } from "@/lib/db/collections";
import { Servicio } from "@/lib/types";

class ServicioRepository extends BaseRepository {
  constructor() {
    super(Collections.SERVICIOS);
  }

  async findAll(salonId: string): Promise<Servicio[]> {
    const items = await this.findByTenant(salonId, {}, { orden: 1, fechaCreacion: -1 });
    return items.map((s) => ({ ...s, _id: s._id?.toString() } as Servicio));
  }

  async create(
    salonId: string,
    data: Omit<Servicio, "_id" | "salonId">
  ): Promise<Servicio> {
    const now = new Date();
    const id = await this.insertOne(salonId, {
      ...data,
      fechaCreacion: now,
      fechaActualizacion: now,
    });
    return { _id: id, salonId, ...data, fechaCreacion: now, fechaActualizacion: now };
  }

  async update(
    salonId: string,
    id: string,
    data: Partial<Servicio>
  ): Promise<boolean> {
    return this.updateOneByTenant(
      salonId,
      { _id: new ObjectId(id) } as never,
      { ...data, fechaActualizacion: new Date() }
    );
  }

  async remove(salonId: string, id: string): Promise<boolean> {
    return this.deleteOneByTenant(salonId, {
      _id: new ObjectId(id),
    } as never);
  }
}

export const servicioRepository = new ServicioRepository();
