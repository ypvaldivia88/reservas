import { AppError } from "@/lib/api/errors";
import { Servicio, Categoria } from "@/lib/types";
import { servicioRepository } from "@/lib/repositories/servicio.repository";
import { categoriaRepository } from "@/lib/repositories/categoria.repository";
import { getDb } from "@/lib/mongodb";
import { syncIncomeCategoriesFromServicios } from "@/lib/finances";

async function syncIncomeCategories(salonId: string) {
  const db = await getDb();
  await syncIncomeCategoriesFromServicios(db, salonId);
}

export class ServicioService {
  async list(salonId: string): Promise<Servicio[]> {
    return servicioRepository.findAll(salonId);
  }

  async create(
    salonId: string,
    body: Record<string, unknown>
  ): Promise<Servicio> {
    const { nombre, descripcion, precio, duracion, imagenId, activo, orden } =
      body;

    if (!nombre || !descripcion) {
      throw new AppError("Faltan campos requeridos: nombre, descripcion", 400);
    }

    const servicio = await servicioRepository.create(salonId, {
      nombre: nombre as string,
      descripcion: descripcion as string,
      precio: (precio as number) || 0,
      duracion: (duracion as number) || 0,
      imagenId: (imagenId as string) || undefined,
      activo: activo !== undefined ? (activo as boolean) : true,
      orden: (orden as number) || 0,
    });
    await syncIncomeCategories(salonId);
    return servicio;
  }

  async update(salonId: string, body: Record<string, unknown>) {
    const { _id, nombre, descripcion, precio, duracion, imagenId, activo, orden } =
      body;

    if (!_id) throw new AppError("ID es requerido", 400);

    const updateData: Partial<Servicio> = {};
    if (nombre) updateData.nombre = nombre as string;
    if (descripcion !== undefined) updateData.descripcion = descripcion as string;
    if (precio !== undefined) updateData.precio = precio as number;
    if (duracion !== undefined) updateData.duracion = duracion as number;
    if (imagenId !== undefined) updateData.imagenId = imagenId as string;
    if (activo !== undefined) updateData.activo = activo as boolean;
    if (orden !== undefined) updateData.orden = orden as number;

    const updated = await servicioRepository.update(
      salonId,
      _id as string,
      updateData
    );
    if (!updated) throw AppError.notFound("Servicio no encontrado");
    await syncIncomeCategories(salonId);
  }

  async delete(salonId: string, id: string) {
    if (!id) throw new AppError("ID es requerido", 400);
    const deleted = await servicioRepository.remove(salonId, id);
    if (!deleted) throw AppError.notFound("Servicio no encontrado");
    await syncIncomeCategories(salonId);
  }
}

export class CategoriaService {
  async list(salonId: string): Promise<Categoria[]> {
    return categoriaRepository.findAll(salonId);
  }

  async create(
    salonId: string,
    body: Record<string, unknown>
  ): Promise<Categoria> {
    const { nombre, descripcion, imagenId, activo, orden } = body;
    if (!nombre) throw new AppError("Campo requerido: nombre", 400);

    return categoriaRepository.create(salonId, {
      nombre: nombre as string,
      descripcion: (descripcion as string) || "",
      imagenId: (imagenId as string) || undefined,
      activo: activo !== undefined ? (activo as boolean) : true,
      orden: (orden as number) || 0,
    });
  }

  async update(salonId: string, body: Record<string, unknown>) {
    const { _id, nombre, descripcion, imagenId, activo, orden } = body;
    if (!_id) throw new AppError("ID es requerido", 400);

    const updateData: Partial<Categoria> = {};
    if (nombre) updateData.nombre = nombre as string;
    if (descripcion !== undefined) updateData.descripcion = descripcion as string;
    if (imagenId !== undefined) updateData.imagenId = imagenId as string;
    if (activo !== undefined) updateData.activo = activo as boolean;
    if (orden !== undefined) updateData.orden = orden as number;

    const updated = await categoriaRepository.update(
      salonId,
      _id as string,
      updateData
    );
    if (!updated) throw AppError.notFound("Categoría no encontrada");
  }

  async delete(salonId: string, id: string) {
    if (!id) throw new AppError("ID es requerido", 400);
    try {
      const deleted = await categoriaRepository.remove(salonId, id);
      if (!deleted) throw AppError.notFound("Categoría no encontrada");
    } catch (error) {
      if (error instanceof Error && error.message.includes("No se puede eliminar")) {
        throw new AppError(error.message, 400);
      }
      throw error;
    }
  }
}

export const servicioService = new ServicioService();
export const categoriaService = new CategoriaService();
