import PlatformLandingPage from "@/components/PlatformLandingPage";
import { salonCmsService } from "@/lib/services/salon-cms.service";

export default async function Home() {
  const salons = await salonCmsService.listActiveDirectory();

  return <PlatformLandingPage salons={salons} />;
}
