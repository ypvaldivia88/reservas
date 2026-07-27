"use client";

import { Suspense } from "react";
import PlatformTenantsPage from "./tenants-page";

export default function PlatformTenantsRoute() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Cargando...</p>}>
      <PlatformTenantsPage />
    </Suspense>
  );
}
