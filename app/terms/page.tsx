import Link from "next/link";

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Nightlife Flyers.',
};

export default function TermsPage() {
  return (
    <main className="min-h-[100dvh] bg-neutral-950 text-white">
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-neutral-950/90 backdrop-blur-md border-b border-white/10">
        <Link
          href="/"
          className="text-fuchsia-400 font-semibold text-sm tracking-wide hover:text-fuchsia-300 transition"
        >
          ← Back to Studio
        </Link>
        <h1 className="text-lg font-semibold text-white/90">Terms of Service</h1>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6 text-sm text-neutral-200">
        <p className="text-neutral-400">Effective date: [Insert date]</p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">1. Overview</h2>
          <p>
            Nightlife Flyers provides tools to create and export promotional flyer designs.
            By using the Studio, you agree to these Terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">2. Accounts & Access</h2>
          <p>
            You are responsible for your account activity and any content you create, upload,
            or export. Do not share access with unauthorized users.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">3. Content & Usage</h2>
          <p>
            You retain ownership of your uploaded content. You grant Nightlife Flyers the
            rights needed to process and render your assets.
          </p>
          <p>
            Do not upload content that is illegal, infringing, or violates third-party rights.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">4. AI Features</h2>
          <p>
            AI outputs are generated based on your inputs. Results may vary. You are
            responsible for reviewing outputs before publishing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">5. Payments & Plans</h2>
          <p>
            Paid plans renew on the billing cadence shown at checkout. You can cancel
            at any time to avoid future charges.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">6. Availability</h2>
          <p>
            We may update or discontinue features without notice. We are not liable for
            service interruptions or data loss.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">7. Contact</h2>
          <p>
            For questions, contact: <span className="text-white">[support@yourdomain.com]</span>
          </p>
        </section>
      </div>
    </main>
  );
}
