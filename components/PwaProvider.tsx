"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const SerwistPwaProvider =
  process.env.NODE_ENV === "development"
    ? null
    : dynamic(() => import("./PwaProviderSerwist"), { ssr: false });

export default function PwaProvider({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "development" || !SerwistPwaProvider) {
    return <>{children}</>;
  }

  return <SerwistPwaProvider>{children}</SerwistPwaProvider>;
}
