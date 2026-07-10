import { SalonDirectoryItem } from "@/lib/types";
import TenantDirectory from "@/components/TenantDirectory";
import FeaturesBento from "@/components/platform/FeaturesBento";
import PlatformCta from "@/components/platform/PlatformCta";
import PlatformFooter from "@/components/platform/PlatformFooter";
import PlatformHero from "@/components/platform/PlatformHero";
import PricingSection from "@/components/platform/PricingSection";
import ProcessSteps from "@/components/platform/ProcessSteps";
import UrlShowcase from "@/components/platform/UrlShowcase";

export default function PlatformLandingPage({
  salons = [],
}: {
  salons?: SalonDirectoryItem[];
}) {
  return (
    <div id="main-content" className="min-h-screen bg-background">
      <PlatformHero />
      <TenantDirectory salons={salons} />
      <FeaturesBento />
      <ProcessSteps />
      <UrlShowcase />
      <PricingSection />
      <PlatformCta />
      <PlatformFooter />
    </div>
  );
}
