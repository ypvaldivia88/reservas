import { notFound } from "next/navigation";
import { Metadata } from "next";
import TenantHomePage from "@/components/TenantHomePage";
import { salonCmsService } from "@/lib/services/salon-cms.service";

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
    const profile = await salonCmsService.getPublicBySlug(slug);
    return {
      title: profile.content.seoTitle || profile.nombre,
      description: profile.content.seoDescription || profile.content.heroSubtitle,
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
    const profile = await salonCmsService.getPublicBySlug(slug);
    return <TenantHomePage profile={profile} />;
  } catch {
    notFound();
  }
}
