import { ObjectId } from "mongodb";
import { ImageData } from "@/lib/types";
import { getDatabase } from "@/lib/mongodb";
import { withTenantScope } from "@/lib/tenant";
import { adminHandler, publicOrSalonAdminHandler } from "@/lib/api/handlers";
import { ok, created } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";
import { uploadBase64ToBlob, deleteImageFromBlob } from "@/lib/blobStorage";

export const revalidate = 60;

function mapImage(img: Record<string, unknown>): ImageData {
  return {
    _id: (img._id as ObjectId).toString(),
    nombre: img.nombre as string,
    titulo: img.titulo as string,
    descripcion: img.descripcion as string,
    blobUrl: img.blobUrl as string,
    mimeType: img.mimeType as string,
    size: img.size as number,
    enGaleriaDashboard: (img.enGaleriaDashboard as boolean) || false,
    enGaleriaInspiracion: (img.enGaleriaInspiracion as boolean) || false,
    categoriaIds: (img.categoriaIds as string[]) || [],
    servicioIds: (img.servicioIds as string[]) || [],
    fechaCreacion: img.fechaCreacion as Date,
    fechaActualizacion: img.fechaActualizacion as Date,
  };
}

export const GET = publicOrSalonAdminHandler(async ({ salonId, request }) => {
  const db = await getDatabase();
  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    const imagen = await db
      .collection("imagenes")
      .findOne(withTenantScope({ _id: new ObjectId(id) }, salonId));

    if (!imagen) {
      throw AppError.notFound("Imagen no encontrada");
    }

    return ok(mapImage(imagen), {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  }

  const imagenes = await db
    .collection("imagenes")
    .find(withTenantScope({}, salonId))
    .sort({ fechaCreacion: -1 })
    .toArray();

  return ok(imagenes.map(mapImage), {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
});

export const POST = adminHandler(async ({ salonId, request }) => {
  const body = await request.json();
  const {
    nombre,
    titulo,
    descripcion,
    base64Data,
    mimeType,
    size,
    enGaleriaDashboard,
    enGaleriaInspiracion,
    categoriaIds,
    servicioIds,
  } = body;

  if (!nombre || !base64Data || !mimeType) {
    throw new AppError(
      "Faltan campos requeridos: nombre, base64Data, mimeType",
      400
    );
  }

  const blob = await uploadBase64ToBlob(base64Data, nombre, mimeType);
  const db = await getDatabase();
  const now = new Date();

  const nuevaImagen = {
    salonId,
    nombre,
    titulo: titulo || "",
    descripcion: descripcion || "",
    blobUrl: blob.url,
    mimeType,
    size: size || 0,
    enGaleriaDashboard: enGaleriaDashboard || false,
    enGaleriaInspiracion: enGaleriaInspiracion || false,
    categoriaIds: categoriaIds || [],
    servicioIds: servicioIds || [],
    fechaCreacion: now,
    fechaActualizacion: now,
  };

  const result = await db.collection("imagenes").insertOne(nuevaImagen);

  return created(
    {
      _id: result.insertedId.toString(),
      ...nuevaImagen,
    } as ImageData,
    "Imagen creada exitosamente"
  );
});

export const PATCH = adminHandler(async ({ salonId, request }) => {
  const body = await request.json();
  const {
    _id,
    nombre,
    titulo,
    descripcion,
    base64Data,
    mimeType,
    size,
    enGaleriaDashboard,
    enGaleriaInspiracion,
    categoriaIds,
    servicioIds,
  } = body;

  if (!_id) {
    throw new AppError("ID es requerido", 400);
  }

  const db = await getDatabase();
  const existingImage = await db
    .collection("imagenes")
    .findOne(withTenantScope({ _id: new ObjectId(_id) }, salonId));

  if (!existingImage) {
    throw AppError.notFound("Imagen no encontrada");
  }

  const updateData: Record<string, unknown> = {
    fechaActualizacion: new Date(),
  };

  if (base64Data && mimeType) {
    if (existingImage.blobUrl) {
      try {
        await deleteImageFromBlob(existingImage.blobUrl);
      } catch (error) {
        console.error("Error deleting old blob:", error);
      }
    }

    const blob = await uploadBase64ToBlob(
      base64Data,
      nombre || existingImage.nombre || "image",
      mimeType
    );
    updateData.blobUrl = blob.url;
    updateData.mimeType = mimeType;
  }

  if (nombre !== undefined) updateData.nombre = nombre;
  if (titulo !== undefined) updateData.titulo = titulo;
  if (descripcion !== undefined) updateData.descripcion = descripcion;
  if (size !== undefined) updateData.size = size;
  if (enGaleriaDashboard !== undefined) {
    updateData.enGaleriaDashboard = enGaleriaDashboard;
  }
  if (enGaleriaInspiracion !== undefined) {
    updateData.enGaleriaInspiracion = enGaleriaInspiracion;
  }
  if (categoriaIds !== undefined) updateData.categoriaIds = categoriaIds;
  if (servicioIds !== undefined) updateData.servicioIds = servicioIds;

  const result = await db
    .collection("imagenes")
    .updateOne(
      withTenantScope({ _id: new ObjectId(_id) }, salonId),
      { $set: updateData }
    );

  if (result.matchedCount === 0) {
    throw AppError.notFound("Imagen no encontrada");
  }

  return ok(undefined, { message: "Imagen actualizada exitosamente" });
});

export const DELETE = adminHandler(async ({ salonId, request }) => {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    throw new AppError("ID es requerido", 400);
  }

  const db = await getDatabase();

  const [servicios, categorias, galeria] = await Promise.all([
    db
      .collection("servicios")
      .countDocuments(withTenantScope({ imagenId: id }, salonId)),
    db
      .collection("categorias")
      .countDocuments(withTenantScope({ imagenId: id }, salonId)),
    db
      .collection("galeria")
      .countDocuments(withTenantScope({ imagenId: id }, salonId)),
  ]);

  const enUso = servicios + categorias + galeria;
  if (enUso > 0) {
    throw new AppError(
      `No se puede eliminar. La imagen está siendo usada en ${enUso} elemento(s)`,
      400
    );
  }

  const imagen = await db
    .collection("imagenes")
    .findOne(withTenantScope({ _id: new ObjectId(id) }, salonId));

  if (!imagen) {
    throw AppError.notFound("Imagen no encontrada");
  }

  if (imagen.blobUrl) {
    try {
      await deleteImageFromBlob(imagen.blobUrl);
    } catch (error) {
      console.error("Error deleting blob:", error);
    }
  }

  const result = await db
    .collection("imagenes")
    .deleteOne(withTenantScope({ _id: new ObjectId(id) }, salonId));

  if (result.deletedCount === 0) {
    throw AppError.notFound("Imagen no encontrada");
  }

  return ok(undefined, { message: "Imagen eliminada exitosamente" });
});
