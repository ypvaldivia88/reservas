"use client";

import { ReactNode } from "react";
import { SalonBranding } from "@/lib/types";
import { resolveHeroBranding } from "@/lib/hero-utils";

interface TenantHeroProps {
  heroImage: string;
  branding: SalonBranding;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

export default function TenantHero({
  heroImage,
  branding,
  children,
  className = "",
  compact = false,
}: TenantHeroProps) {
  const hero = resolveHeroBranding(branding);

  return (
    <section
      className={`relative flex items-center overflow-hidden px-4 ${
        compact
          ? "min-h-[220px] sm:min-h-[260px]"
          : "min-h-[28rem] py-12 sm:min-h-[32rem] sm:py-16 md:min-h-[36rem] md:py-20 lg:py-24"
      } ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: hero.objectPosition }}
        fetchPriority={compact ? "low" : "high"}
        decoding="async"
      />

      <div
        className="absolute inset-0"
        style={{ background: hero.overlayGradient }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl">{children}</div>
    </section>
  );
}
