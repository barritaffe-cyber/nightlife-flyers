'use client';

import Link from "next/link";
import React from "react";
import { useSearchParams } from "next/navigation";
import PaymentMarks from "../../../components/ui/PaymentMarks";
import {
  getPublicMerchantAddress,
  getPublicSupportPhone,
  getPublicTransactionCurrency,
} from "../../../lib/publicIdentity";
import { supabaseBrowser } from "../../../lib/supabase/client";
import {
  buildBillingLoginHref,
  getBillingCatalogItem,
  resolveBillingSelection,
} from "../../../lib/billing/catalog";

function BillingCheckoutInner() {
  const searchParams = useSearchParams();
  const selection = React.useMemo(
    () =>
      resolveBillingSelection({
        plan: searchParams.get("plan"),
        billing: searchParams.get("billing"),
        offer: searchParams.get("offer"),
      }),
    [searchParams]
  );

  const item = selection ? getBillingCatalogItem(selection) : null;
  const loginHref = selection ? buildBillingLoginHref(selection) : "/login";

  const [email, setEmail] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [missing, setMissing] = React.useState<string[]>([]);
  const [checkoutHtml, setCheckoutHtml] = React.useState<string | null>(null);
  const supportPhone = getPublicSupportPhone();
  const merchantAddress = getPublicMerchantAddress();
  const currency = getPublicTransactionCurrency();
  const isRecurringPlan = selection?.kind === "plan";
  const recurringAmount = item ? `${currency} ${item.price}` : "";
  const recurringCadenceLabel =
    selection?.kind === "plan" ? (selection.billing === "yearly" ? "every year" : "every month") : "";

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

  const startCheckout = async () => {
    if (!selection) {
      setMsg("Invalid billing selection.");
      return;
    }
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      window.location.href = loginHref;
      return;
    }

    setLoading(true);
    setMsg(null);
    setMissing([]);
    setCheckoutHtml(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selection.kind === "offer" ? { offer: selection.offer } : selection),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json?.error || "Checkout is not ready yet.");
        setMissing(Array.isArray(json?.missing) ? json.missing : []);
        return;
      }
      if (json?.mode === "iframe" && typeof json?.redirectDataHtml === "string") {
        document.open();
        document.write(json.redirectDataHtml);
        document.close();
        return;
      }
      setMsg("Checkout is not ready yet.");
    } catch {
      setMsg("Checkout failed to initialize.");
    } finally {
      setLoading(false);
    }
  };

  if (!item || !selection) {
    return (
      <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-neutral-900 p-6">
          <h1 className="text-xl font-semibold">Billing selection not found</h1>
          <p className="mt-3 text-sm text-white/70">Choose a plan or pass from pricing to continue.</p>
          <div className="mt-5 flex gap-2">
            <Link href="/pricing" className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/15">
              View pricing
            </Link>
            <Link href="/" className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/75 hover:bg-white/5">
              Back to studio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-neutral-900 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/45">Billing</div>
            <h1 className="mt-1 text-2xl font-semibold">{item.name}</h1>
          </div>
          <Link href="/pricing" className="text-xs text-fuchsia-300 underline underline-offset-4">
            Back to pricing
          </Link>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-3xl font-bold">${item.price}</div>
              <div className="text-xs text-white/55">{item.cadence}</div>
            </div>
            <div className="text-right text-xs text-white/55">
              <div>Status on success: {item.status}</div>
              <div>Plan code: {item.plan}</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/70">{item.description}</p>
        </div>

        {isRecurringPlan ? (
          <div className="mt-5 space-y-3 border border-fuchsia-500/20 bg-fuchsia-500/8 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-fuchsia-200/70">
              Recurring Payment Agreement
            </div>
            <div className="grid gap-2 text-xs text-white/72 sm:grid-cols-2">
              <div>Amount: {recurringAmount}.</div>
              <div>Amount type: fixed unless we notify you of a change.</div>
              <div>Schedule: {recurringCadenceLabel} until canceled.</div>
              <div>Schedule date: same renewal date each billing cycle, based on the initial purchase date.</div>
              <div>Schedule date type: fixed relative to the original purchase date.</div>
              <div>
                Communication method: email to {email || "the email on your Nightlife Flyers account"}.
              </div>
              <div className="sm:col-span-2">
                By continuing, you authorize recurring charges on this schedule until you cancel.
                We will send agreement confirmation by email and will notify you by email at least
                7 working days before any qualifying recurring-agreement changes.
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 space-y-3 border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-white/45">Secure Checkout</div>
          <PaymentMarks showPowerTranz compact />
          <div className="grid gap-2 text-xs text-white/68 sm:grid-cols-2">
            <div>Service: digital flyer design tools, exports, plans, and passes.</div>
            <div>Transaction currency: {currency}.</div>
            <div>Delivery: paid access is activated digitally after successful payment.</div>
            <div>
              Support: <Link href="/contact" className="text-white underline underline-offset-4">Contact us</Link>
              {supportPhone ? <span>{` · ${supportPhone}`}</span> : null}
            </div>
            {merchantAddress ? <div className="sm:col-span-2">Merchant address: {merchantAddress}</div> : null}
            <div className="sm:col-span-2">
              Payment details are transmitted over encrypted HTTPS/TLS connections to the hosted
              payment flow. Nightlife Flyers does not store full payment card numbers on its own servers.
            </div>
            <div className="sm:col-span-2">
              By continuing, you agree to the{" "}
              <Link href="/terms" className="text-white underline underline-offset-4">
                Terms
              </Link>
              ,{" "}
              <Link href="/privacy" className="text-white underline underline-offset-4">
                Privacy Policy
              </Link>
              , and{" "}
              <Link href="/terms#billing-refunds" className="text-white underline underline-offset-4">
                Refunds & Cancellation
              </Link>
              .
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3 text-sm text-white/75">
          <div>
            Signed in as: <span className="text-white">{email || "guest"}</span>
          </div>
          {!email && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-amber-100">
              Sign in first so the purchase can be attached to your Nightlife Flyers account.
            </div>
          )}
          {msg && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div>{msg}</div>
              {missing.length > 0 && (
                <div className="mt-2 text-xs text-white/50">
                  Missing env: {missing.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {!email ? (
            <Link href={loginHref} className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold">
              Sign in to continue
            </Link>
          ) : (
            <button
              type="button"
              onClick={startCheckout}
              disabled={loading}
              className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Preparing checkout..." : checkoutHtml ? "Reload secure checkout" : "Load secure checkout"}
            </button>
          )}
          <Link href="/" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/5">
            Back to studio
          </Link>
        </div>

        {checkoutHtml ? (
          <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
            <div className="text-xs uppercase tracking-[0.22em] text-white/45">PowerTranz payment panel</div>
            <div className="border border-white/10 bg-black/20 p-2">
              <iframe
                title="PowerTranz Hosted Payment Page"
                srcDoc={checkoutHtml}
                className="h-[720px] w-full bg-white"
              />
            </div>
            <div className="text-xs text-white/45">
              Complete payment inside the secure panel. Nightlife Flyers will finish the transaction and update your
              account when PowerTranz returns to the callback.
            </div>
          </div>
        ) : (
          <div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/45">
            PowerTranz checkout opens in this tab once the secure session is prepared.
          </div>
        )}
      </div>
    </main>
  );
}

export default function BillingCheckoutPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-neutral-950" />}>
      <BillingCheckoutInner />
    </React.Suspense>
  );
}
