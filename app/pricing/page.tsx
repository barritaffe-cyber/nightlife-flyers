import Link from "next/link";
import PricingPlans from '../../components/ui/PricingPlans';

export default function Page() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
        {/* Header link back to Studio (Home) */}
        <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-neutral-950/90 backdrop-blur-md border-b border-white/10">
        <Link
          href="/"
          className="text-fuchsia-400 font-semibold text-sm tracking-wide hover:text-fuchsia-300 transition"
        >
          ← Back to Studio
        </Link>
        <h1 className="text-lg font-semibold text-white/90">Pricing</h1>
        </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <PricingPlans />
      </div>
    </main>
  );
}
