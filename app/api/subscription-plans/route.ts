import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { SubscriptionPlan, ApiResponse } from "@/lib/types";

export async function GET(): Promise<
  NextResponse<ApiResponse<SubscriptionPlan[]>>
> {
  try {
    const client = await clientPromise;
    const db = client.db("nailsalon");

    const plans = await db
      .collection<SubscriptionPlan>("subscription_plans")
      .find({ activo: true })
      .sort({ orden: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: plans.map((p) => ({ ...p, _id: p._id?.toString() })),
    });
  } catch (error) {
    console.error("Error en GET /api/subscription-plans:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
