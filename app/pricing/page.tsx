import Link from "next/link";
import type { Metadata } from "next";
import PricingPlans from '../../components/ui/PricingPlans';
import PublicSiteFooter from "../../components/ui/PublicSiteFooter";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare pricing for Nightlife Flyers, the AI flyer maker for nightlife flyers, club flyers, event flyers, DJ flyers, and artist promo flyers.",
  keywords: [
    "nightlife flyers",
    "club flyers",
    "event flyers",
    "dj flyers",
    "artist promo flyer",
    "AI flyers",
  ],
};

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050608] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="h-[390px] bg-[url('/landing/pricing-skyline-reference.png')] bg-cover bg-top bg-no-repeat opacity-90 sm:h-[430px]" />
        <div className="absolute inset-x-0 top-0 h-[620px] bg-[linear-gradient(180deg,rgba(5,6,8,0.08)_0%,rgba(5,6,8,0.48)_50%,#050608_92%)]" />
        <div className="absolute inset-x-0 top-[280px] h-96 bg-gradient-to-b from-transparent via-[#050608]/92 to-[#050608]" />
      </div>

      <div className="relative z-10">
        <div className="absolute left-4 top-4 z-50 flex items-center justify-between">
          <Link
            href="/landing"
            className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold tracking-wide text-white/55 backdrop-blur-md transition hover:border-cyan-200/30 hover:text-cyan-100"
          >
            ← Back
          </Link>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-10 pt-[250px] sm:pt-[270px]">
          <PricingPlans />
        </div>

        <PublicSiteFooter />
      </div>
    </main>
  );
}
