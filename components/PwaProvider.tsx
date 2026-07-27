"use client";

import { SerwistProvider } from "@serwist/turbopack/react";

export default function PwaProvider({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      reloadOnOnline
      cacheOnNavigation
    >
      {children}
    </SerwistProvider>
  );
}
