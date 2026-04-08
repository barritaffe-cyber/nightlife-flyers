'use client';

import Link from "next/link";
import React from "react";
import { supabaseBrowser } from "../../../lib/supabase/client";

function getSupportEmail() {
  const explicit = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "";
  if (explicit.trim()) return explicit.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nightlife-flyers.com";
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "nightlife-flyers.com";
  return `support@${host}`;
}

function getAccessLabel(status: string | null) {
  if (status === "ondemand") return "on-demand pass";
  if (status === "active") return "subscription";
  return status || "-";
}

export default function BillingPortalPage() {
  const [email, setEmail] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = React.useState<string | null>(null);
  const supportEmail = React.useMemo(() => getSupportEmail(), []);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const token = data.session?.access_token;
      const fallbackEmail = data.session?.user?.email || null;
      setEmail(fallbackEmail);
      if (!token) return;

      const res = await fetch("/api/auth/status", {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
      const json = await res?.json().catch(() => null);
      if (cancelled || !json) return;
      setEmail(json.email || fallbackEmail);
      setStatus(json.status || null);
      setPlan(json.plan || null);
      setPeriodEnd(json.current_period_end || null);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-neutral-900 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/45">Billing</div>
            <h1 className="mt-1 text-2xl font-semibold">Billing help</h1>
          </div>
          <Link href="/" className="text-xs text-fuchsia-300 underline underline-offset-4">
            Back to studio
          </Link>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
          Need to update a card, stop a renewal, or ask about a charge? Use the support actions below and we will handle
          the billing change directly for your account.
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2 text-sm text-white/75">
          <div>
            Signed in as: <span className="text-white">{email || "guest"}</span>
          </div>
          <div>
            Access: <span className="text-white">{getAccessLabel(status)}</span>
          </div>
          <div>
            Plan: <span className="text-white">{plan || "-"}</span>
          </div>
          <div>
            Renewal / expiry: <span className="text-white">{periodEnd ? new Date(periodEnd).toDateString() : "-"}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <a
            href={`mailto:${supportEmail}?subject=${encodeURIComponent("Nightlife Flyers Billing Help")}&body=${encodeURIComponent(
              `Account email: ${email || ""}\nRequest: \n\nPlease describe the billing help you need.`
            )}`}
            className="rounded-lg bg-fuchsia-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Email billing support
          </a>
          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent("Cancel Nightlife Flyers Renewal")}&body=${encodeURIComponent(
                `Account email: ${email || ""}\nPlan: ${plan || ""}\n\nPlease cancel future renewals for this account.`
              )}`}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 hover:bg-white/10"
            >
              Cancel future renewal
            </a>
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent("Update Nightlife Flyers Payment Method")}&body=${encodeURIComponent(
                `Account email: ${email || ""}\nPlan: ${plan || ""}\n\nPlease help me update the payment method for this account.`
              )}`}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 hover:bg-white/10"
            >
              Update payment method
            </a>
          </div>
          <a
            href={`mailto:${supportEmail}?subject=${encodeURIComponent("Nightlife Flyers Billing Question")}&body=${encodeURIComponent(
              `Account email: ${email || ""}\nPlan: ${plan || ""}\n\nMy billing question is:`
            )}`}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 hover:bg-white/10"
          >
            Ask a billing question
          </a>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {!email ? (
            <Link href="/login?next=%2Fbilling%2Fportal" className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold">
              Sign in for billing help
            </Link>
          ) : (
            <Link href="/pricing" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/5">
              View pricing
            </Link>
          )}
          <div className="text-xs text-white/45 self-center">Support email: {supportEmail}</div>
        </div>
      </div>
    </main>
  );
}
