import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { StickyMobileCTA } from "@/components/layout/StickyMobileCTA";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FleetCarousel } from "@/components/home/FleetCarousel";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Testimonials } from "@/components/home/Testimonials";
import { FAQAccordion } from "@/components/home/FAQAccordion";
import { CTAZone } from "@/components/home/CTAZone";
import { HeroDeepLink } from "@/components/home/HeroDeepLink";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await getTranslations("common");

  return (
    <div className="flex min-h-dvh flex-col bg-deep pb-24 sm:pb-0">
      <Suspense fallback={null}>
        <HeroDeepLink />
      </Suspense>
      <SiteHeader />
      <main className="flex-1">
        <HeroBanner />
        <FleetCarousel />
        <FeaturesGrid />
        <HowItWorks />
        <Testimonials />
        <FAQAccordion />
        <CTAZone />
      </main>
      <Footer />
      <StickyMobileCTA />
    </div>
  );
}