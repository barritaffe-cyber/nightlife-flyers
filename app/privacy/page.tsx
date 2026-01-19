import Link from "next/link";

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Nightlife Flyers.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-[100dvh] bg-neutral-950 text-white">
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-neutral-950/90 backdrop-blur-md border-b border-white/10">
        <Link
          href="/"
          className="text-fuchsia-400 font-semibold text-sm tracking-wide hover:text-fuchsia-300 transition"
        >
          ← Back to Studio
        </Link>
        <h1 className="text-lg font-semibold text-white/90">Privacy Policy</h1>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6 text-sm text-neutral-200">
        <p className="text-neutral-400">Effective date: [Insert date]</p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">1. Information We Collect</h2>
          <p>
            We collect information you provide (uploads, text content, account details),
            and basic usage data needed to operate the Studio.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">2. How We Use Data</h2>
          <p>
            We use your data to render designs, provide AI features, and improve product
            reliability. We do not sell your personal data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">3. AI Processing</h2>
          <p>
            When you use AI features, your inputs may be processed by third-party AI
            providers strictly for generating results.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">4. Data Retention</h2>
          <p>
            Saved designs and assets remain accessible while your account is active.
            You can delete assets from within the Studio at any time.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">5. Contact</h2>
          <p>
            For privacy requests, contact: <span className="text-white">[privacy@yourdomain.com]</span>
          </p>
        </section>
      </div>
    </main>
  );
}
