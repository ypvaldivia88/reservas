"use client";

import { SerwistProvider } from "@serwist/turbopack/react";

export default function PwaProviderSerwist({
  children,
}: {
  children: React.ReactNode;
}) {
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
