'use client';

import Link from "next/link";
import React from "react";
import { supabaseBrowser } from "../../../lib/supabase/client";

export default function BillingPortalPage() {
  const [email, setEmail] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [missing, setMissing] = React.useState<string[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setEmail(data.session?.user?.email || null);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const openPortal = async () => {
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      window.location.href = "/login?next=%2Fbilling%2Fportal";
      return;
    }

    setLoading(true);
    setMsg(null);
    setMissing([]);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json?.error || "Billing portal is not ready yet.");
        setMissing(Array.isArray(json?.missing) ? json.missing : []);
        return;
      }
      if (json?.url) {
        window.location.href = json.url;
        return;
      }
      setMsg("Billing portal is not ready yet.");
    } catch {
      setMsg("Failed to open billing portal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-neutral-900 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/45">Billing</div>
            <h1 className="mt-1 text-2xl font-semibold">Manage plan</h1>
          </div>
          <Link href="/" className="text-xs text-fuchsia-300 underline underline-offset-4">
            Back to studio
          </Link>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
          Open the billing portal to manage renewal, payment method, or cancellation once the hosted payment provider is connected.
        </div>

        <div className="mt-5 text-sm text-white/75">
          Signed in as: <span className="text-white">{email || "guest"}</span>
        </div>

        {msg && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
            <div>{msg}</div>
            {missing.length > 0 && (
              <div className="mt-2 text-xs text-white/50">
                Missing env: {missing.join(", ")}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {!email ? (
            <Link href="/login?next=%2Fbilling%2Fportal" className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold">
              Sign in to continue
            </Link>
          ) : (
            <button
              type="button"
              onClick={openPortal}
              disabled={loading}
              className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Opening portal..." : "Open billing portal"}
            </button>
          )}
          <Link href="/pricing" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/5">
            View pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
