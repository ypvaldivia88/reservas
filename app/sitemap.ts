import type { MetadataRoute } from "next";
import { salonCmsService } from "@/lib/services/salon-cms.service";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://reservas-taupe.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const salons = await salonCmsService.listActiveDirectory();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/registro`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];

  const salonRoutes: MetadataRoute.Sitemap = salons.map((salon) => ({
    url: `${baseUrl}/${salon.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...salonRoutes];
}
