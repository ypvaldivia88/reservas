import {
  Collection,
  Document,
  Filter,
  OptionalUnlessRequiredId,
  WithId,
} from "mongodb";
import { getDb } from "@/lib/mongodb";
import { withTenantScope } from "@/lib/tenant";

/**
 * Repositorio base con aislamiento por tenant.
 * Responsabilidad única: acceso a datos (Repository pattern).
 */
export abstract class BaseRepository {
  constructor(protected readonly collectionName: string) {}

  protected async collection(): Promise<Collection<Document>> {
    const db = await getDb();
    return db.collection(this.collectionName);
  }

  protected withTenant(
    salonId: string,
    filter: Filter<Document> = {}
  ): Filter<Document> {
    return withTenantScope(filter as Record<string, unknown>, salonId) as Filter<Document>;
  }

  async findByTenant(
    salonId: string,
    filter: Filter<Document> = {},
    sort: Record<string, 1 | -1> = {}
  ): Promise<WithId<Document>[]> {
    const col = await this.collection();
    return col.find(this.withTenant(salonId, filter)).sort(sort).toArray();
  }

  async findOneByTenant(
    salonId: string,
    filter: Filter<Document>
  ): Promise<WithId<Document> | null> {
    const col = await this.collection();
    return col.findOne(this.withTenant(salonId, filter));
  }

  async insertOne(
    salonId: string,
    document: Record<string, unknown>
  ): Promise<string> {
    const col = await this.collection();
    const doc = { ...document, salonId };
    const result = await col.insertOne(
      doc as OptionalUnlessRequiredId<Document>
    );
    return result.insertedId.toString();
  }

  async updateOneByTenant(
    salonId: string,
    filter: Filter<Document>,
    update: Record<string, unknown>
  ): Promise<boolean> {
    const col = await this.collection();
    const result = await col.updateOne(this.withTenant(salonId, filter), {
      $set: update,
    });
    return result.matchedCount > 0;
  }

  async deleteOneByTenant(
    salonId: string,
    filter: Filter<Document>
  ): Promise<boolean> {
    const col = await this.collection();
    const result = await col.deleteOne(this.withTenant(salonId, filter));
    return result.deletedCount > 0;
  }

  async countByTenant(
    salonId: string,
    filter: Filter<Document> = {}
  ): Promise<number> {
    const col = await this.collection();
    return col.countDocuments(this.withTenant(salonId, filter));
  }
}
