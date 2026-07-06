import { notFound } from "next/navigation";
import TenantHeader from "@/components/TenantHeader";
import { salonCmsService } from "@/lib/services/salon-cms.service";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "reserva",
  "registro",
]);

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function SalonLayout({ children, params }: LayoutProps) {
  const { slug } = await params;

  if (RESERVED_SLUGS.has(slug)) {
    notFound();
  }

  try {
    const profile = await salonCmsService.getPublicBySlug(slug);
    return (
      <>
        <TenantHeader profile={profile} isHomePage />
        {children}
      </>
    );
  } catch {
    notFound();
  }
}
