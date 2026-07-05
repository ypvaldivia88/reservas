import { randomBytes } from "crypto";
import { BaseRepository } from "./base.repository";
import { Collections } from "@/lib/db/collections";
import { Salon } from "@/lib/types";

class SalonRepository extends BaseRepository {
  constructor() {
    super(Collections.SALONS);
  }

  async findBySlug(slug: string): Promise<Salon | null> {
    const col = await this.collection();
    return col.findOne({ slug }) as Promise<Salon | null>;
  }

  async findBySalonId(salonId: string): Promise<Salon | null> {
    const col = await this.collection();
    return col.findOne({ salonId }) as Promise<Salon | null>;
  }

  async slugExists(slug: string): Promise<boolean> {
    const col = await this.collection();
    const count = await col.countDocuments({ slug });
    return count > 0;
  }

  async listAll(): Promise<Salon[]> {
    const col = await this.collection();
    return col.find({}).sort({ fechaCreacion: -1 }).toArray() as unknown as Promise<Salon[]>;
  }

  async create(salon: Omit<Salon, "_id">): Promise<Salon> {
    const col = await this.collection();
    const result = await col.insertOne(salon as Record<string, unknown>);
    return { ...salon, _id: result.insertedId.toString() };
  }
}

export const salonRepository = new SalonRepository();

export function generateSalonId(): string {
  return `salon_${randomBytes(6).toString("hex")}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
