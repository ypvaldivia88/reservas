import { NextRequest, NextResponse } from "next/server";
import { User, Reserva, ApiResponse } from "@/lib/types";
import { phoneUtils } from "@/lib/utils";
import { withTenantScope } from "@/lib/tenant";
import { resolvePublicTenant } from "@/lib/services/tenant-context.service";
import { ensureMultiTenantIndexes } from "@/lib/db/tenant-indexes";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

interface ClientCheckResponse {
  exists: boolean;
  cliente?: User;
  reservasActivas?: Reserva[];
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ClientCheckResponse>>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const telefono = searchParams.get("telefono");

    if (!telefono) {
      return NextResponse.json(
        {
          success: false,
          error: "Teléfono es requerido",
        },
        { status: 400 }
      );
    }

    let telefonoNormalizado: string;
    try {
      telefonoNormalizado = phoneUtils.normalize(telefono);
    } catch (normalizeError) {
      console.error("Error normalizing phone:", normalizeError);
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
        },
        message: "Formato de teléfono inválido",
      });
    }

    const { salonId } = await resolvePublicTenant(request);
    const db = await getDb();
    await ensureMultiTenantIndexes(db);

    const cliente = await db.collection<User>(Collections.USERS).findOne(
      withTenantScope(
        { telefono: telefonoNormalizado, role: "cliente" },
        salonId
      )
    );

    if (!cliente) {
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
        },
        message: "Cliente no encontrado",
      });
    }

    const reservasActivas = await db
      .collection<Reserva>(Collections.RESERVAS)
      .find(
        withTenantScope(
          {
            clienteId: cliente._id?.toString(),
            estado: { $in: ["pendiente", "confirmada"] },
          },
          salonId
        )
      )
      .sort({ fechaCita: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        exists: true,
        cliente,
        reservasActivas,
      },
      message: "Cliente encontrado",
    });
  } catch (error) {
    console.error("Error checking client by phone:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
