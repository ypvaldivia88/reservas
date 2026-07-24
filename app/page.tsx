import PlatformLandingPage from "@/components/PlatformLandingPage";
import { salonCmsService } from "@/lib/services/salon-cms.service";

/** Refrescar directorio cuando se registra un salón nuevo */
export const revalidate = 60;

export default async function Home() {
  const salons = await salonCmsService.listActiveDirectory();

  return <PlatformLandingPage salons={salons} />;
}
