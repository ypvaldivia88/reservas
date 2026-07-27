import { notFound } from "next/navigation";
import { Metadata } from "next";
import TenantHomePage from "@/components/TenantHomePage";
import TenantUnavailablePage from "@/components/TenantUnavailablePage";
import { resolvePublicSalonBySlug } from "@/lib/services/salon-cms.service";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "reserva",
  "registro",
  "_next",
  "favicon.ico",
]);

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug)) return {};

  try {
    const resolution = await resolvePublicSalonBySlug(slug);
    const profile = resolution.profile;
    return {
      title: profile.content.seoTitle || profile.nombre,
      description: profile.content.seoDescription || profile.content.heroSubtitle,
      robots:
        resolution.kind === "unavailable"
          ? { index: false, follow: false }
          : undefined,
    };
  } catch {
    return {};
  }
}

export default async function SalonPage({ params }: PageProps) {
  const { slug } = await params;

  if (RESERVED_SLUGS.has(slug)) {
    notFound();
  }

  try {
    const resolution = await resolvePublicSalonBySlug(slug);

    if (resolution.kind === "unavailable") {
      return (
        <TenantUnavailablePage
          profile={resolution.profile}
          accessState={resolution.accessState}
        />
      );
    }

    return <TenantHomePage profile={resolution.profile} />;
  } catch {
    notFound();
  }
}
