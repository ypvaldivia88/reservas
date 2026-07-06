import { NextResponse } from "next/server";
import { BUSINESS_TEMPLATE_LIST } from "@/lib/business-templates";
import { ApiResponse } from "@/lib/types";

export async function GET() {
  const templates = BUSINESS_TEMPLATE_LIST.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    descripcion: t.descripcion,
    icon: t.icon,
    branding: t.branding,
  }));

  return NextResponse.json<ApiResponse>({
    success: true,
    data: templates,
  });
}
