import { NextRequest, NextResponse } from "next/server";
import { publicHandler } from "@/lib/api/handlers";
import { created } from "@/lib/api/responses";
import { salonService } from "@/lib/services/salon.service";
import { authService } from "@/lib/services/auth.service";
import { SalonRegistrationRequest } from "@/lib/types";

export const POST = publicHandler(async ({ request }) => {
  const body: SalonRegistrationRequest = await request.json();
  const result = await salonService.register(body);

  const login = await authService.login({
    username: body.adminUsername,
    password: body.adminPassword,
  });

  const response = created(
    { ...result, autoLogin: true },
    `¡Salón "${result.nombre}" creado! Tienes ${14} días de prueba.`
  );

  response.cookies.set("session-token", login.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60,
  });

  return response;
});
