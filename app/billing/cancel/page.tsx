import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-neutral-900 p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-amber-300">Billing</div>
        <h1 className="mt-2 text-2xl font-semibold">Checkout canceled</h1>
        <p className="mt-3 text-sm text-white/70">
          No charge was completed. You can go back to pricing, keep working in the studio, or return later.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/" className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold">
            Back to studio
          </Link>
          <Link href="/pricing" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/5">
            View pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
