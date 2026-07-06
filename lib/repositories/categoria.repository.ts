import { ObjectId, Document } from "mongodb";
import { BaseRepository } from "./base.repository";
import { Collections } from "@/lib/db/collections";
import { Categoria } from "@/lib/types";
import { getDb } from "@/lib/mongodb";

class CategoriaRepository extends BaseRepository {
  constructor() {
    super(Collections.CATEGORIAS);
  }

  async findAll(salonId: string): Promise<Categoria[]> {
    const items = await this.findByTenant(salonId, {}, { orden: 1, fechaCreacion: -1 });
    return items.map((c) => ({ ...c, _id: c._id?.toString() } as Categoria));
  }

  async create(
    salonId: string,
    data: Omit<Categoria, "_id" | "salonId">
  ): Promise<Categoria> {
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
    data: Partial<Categoria>
  ): Promise<boolean> {
    return this.updateOneByTenant(
      salonId,
      { _id: new ObjectId(id) } as never,
      { ...data, fechaActualizacion: new Date() }
    );
  }

  async remove(salonId: string, id: string): Promise<boolean> {
    const db = await getDb();
    const galeriaCount = await db
      .collection(Collections.GALERIA)
      .countDocuments({ categoriaId: id });

    if (galeriaCount > 0) {
      throw new Error(
        `No se puede eliminar. La categoría tiene ${galeriaCount} item(s) de galería vinculados`
      );
    }

    return this.deleteOneByTenant(salonId, {
      _id: new ObjectId(id),
    } as never);
  }
}

export const categoriaRepository = new CategoriaRepository();
