import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { applyBillingSelectionToProfile, applyDirectBillingUpdate } from "../../../../lib/billing/entitlements";
import {
  completePowerTranzPayment,
  getBillingProviderState,
  getPendingPowerTranzCheckout,
  markPowerTranzCheckoutStatus,
} from "../../../../lib/billing/provider";
import { resolveBillingSelection } from "../../../../lib/billing/catalog";

export const runtime = "nodejs";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function renderBillingCallbackPage(args: {
  title: string;
  message: string;
  redirectTo?: string;
  actionLabel?: string;
  autoBack?: boolean;
}) {
  const { title, message, redirectTo, actionLabel = "Return to billing", autoBack = false } = args;
  const safeTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeRedirect = redirectTo ? redirectTo.replace(/"/g, "&quot;") : "";
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0a0a0a; color: #fff; font-family: ui-sans-serif, system-ui, sans-serif; }
      .card { width: min(92vw, 420px); border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04); padding: 24px; }
      h1 { margin: 0 0 12px; font-size: 22px; }
      p { margin: 0; color: rgba(255,255,255,.72); line-height: 1.5; }
      a { display: inline-block; margin-top: 18px; padding: 10px 14px; color: #fff; background: rgba(255,255,255,.1); text-decoration: none; border: 1px solid rgba(255,255,255,.12); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${safeTitle}</h1>
      <p>${safeMessage}</p>
      ${redirectTo ? `<a href="${safeRedirect}">${actionLabel}</a>` : ""}
    </div>
    ${
      autoBack
        ? `<script>
      (function () {
        try {
          if (window.history && window.history.length > 1) {
            window.history.back();
            return;
          }
        } catch (_) {}
      })();
    </script>`
        : redirectTo
        ? `<script>
      (function () {
        var target = ${JSON.stringify(redirectTo)};
        try {
          if (window.top && window.top !== window) {
            window.top.location.href = target;
            return;
          }
        } catch (_) {}
        window.location.href = target;
      })();
    </script>`
        : ""
    }
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function parseBody(req: Request) {
  const contentType = String(req.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    return (await req.json().catch(() => ({}))) as Record<string, unknown>;
  }
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (!form) {
      return {};
    }
    return Object.fromEntries(form.entries());
  }

  const text = await req.text().catch(() => "");
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function resolveCallbackCode(payload: Record<string, unknown>) {
  return (
    getString(payload.IsoResponseCode) ||
    getString(payload.isoResponseCode) ||
    getString(payload.ResponseCode) ||
    getString(payload.responseCode)
  );
}

function resolveCallbackToken(payload: Record<string, unknown>) {
  return getString(payload.SpiToken) || getString(payload.spiToken);
}

function resolvePaymentApproved(payload: Record<string, unknown>) {
  if (typeof payload.Approved === "boolean") return payload.Approved;
  if (typeof payload.approved === "boolean") return payload.approved;
  return null;
}

function resolvePaymentString(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = getString(payload[key]);
    if (value) {
      return value;
    }
  }
  return null;
}

function hasCompletionSignal(payload: Record<string, unknown>) {
  return Boolean(
    resolveCallbackCode(payload) ||
      resolveCallbackToken(payload) ||
      resolvePaymentString(payload, "TransactionIdentifier", "transactionIdentifier", "OrderIdentifier", "orderIdentifier") ||
      resolvePaymentApproved(payload) !== null
  );
}

export async function GET(req: Request) {
  return POST(req);
}

export async function POST(req: Request) {
  try {
    const adminSecret = req.headers.get("x-admin-secret") || "";
    const body = await parseBody(req);
    const url = new URL(req.url);
    const admin = supabaseAdmin();

    if (process.env.ADMIN_SECRET && adminSecret === process.env.ADMIN_SECRET) {
      if (isPlainObject(body) && getString(body.email) && (getString(body.offer) || getString(body.plan))) {
        const selection = resolveBillingSelection({
          plan: getString(body.plan),
          billing: getString(body.billing),
          offer: getString(body.offer),
        });
        if (!selection) {
          return NextResponse.json({ error: "Invalid billing selection." }, { status: 400 });
        }
        const result = await applyBillingSelectionToProfile(admin, getString(body.email) as string, selection);
        return NextResponse.json({ ok: true, mode: "admin-selection", ...result });
      }

      if (isPlainObject(body) && getString(body.email) && getString(body.status) && getString(body.current_period_end)) {
        await applyDirectBillingUpdate(admin, {
          email: getString(body.email) as string,
          status: getString(body.status) as string,
          plan: getString(body.plan),
          current_period_end: getString(body.current_period_end) as string,
          billing_provider: getString(body.billing_provider) || "manual",
        });
        return NextResponse.json({ ok: true, mode: "admin-direct" });
      }

      return NextResponse.json(
        { error: "Expected either { email, offer|plan } or { email, status, current_period_end }." },
        { status: 400 }
      );
    }

    const providerState = getBillingProviderState();
    if (!providerState.configured) {
      return renderBillingCallbackPage({
        title: "Payment setup incomplete",
        message: `Missing PowerTranz configuration: ${providerState.missing.join(", ")}`,
      });
    }

    const checkoutId = url.searchParams.get("checkout");
    if (!checkoutId) {
      return renderBillingCallbackPage({
        title: "Checkout session not found",
        message: "The PowerTranz callback did not include a checkout session identifier.",
      });
    }

    const checkout = await getPendingPowerTranzCheckout(checkoutId);
    if (!checkout) {
      return renderBillingCallbackPage({
        title: "Checkout session missing",
        message: "The saved PowerTranz checkout session could not be found.",
      });
    }

    if (checkout.status === "completed") {
      return renderBillingCallbackPage({
        title: "Payment received",
        message: "This PowerTranz checkout was already completed.",
        redirectTo: "/billing/success",
        actionLabel: "Open success page",
      });
    }

    const expiresAt = new Date(checkout.expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      await markPowerTranzCheckoutStatus(checkout.id, "expired");
      return renderBillingCallbackPage({
        title: "Checkout expired",
        message: "The PowerTranz checkout session expired before payment completion.",
        redirectTo: "/pricing",
        actionLabel: "Return to pricing",
      });
    }

    const callbackSpiToken = isPlainObject(body) ? resolveCallbackToken(body) : null;
    const effectiveSpiToken = callbackSpiToken || checkout.spi_token;

    if (!effectiveSpiToken) {
      await markPowerTranzCheckoutStatus(checkout.id, "invalid");
      return renderBillingCallbackPage({
        title: "Checkout not ready",
        message: "The PowerTranz checkout session is missing its payment token.",
        redirectTo: "/pricing",
        actionLabel: "Return to pricing",
      });
    }

    const callbackCode = resolveCallbackCode(body);
    if (isPlainObject(body) && !hasCompletionSignal(body)) {
      return renderBillingCallbackPage({
        title: "Secure checkout loading",
        message: "PowerTranz has started the hosted checkout session. Continue in the payment panel.",
        actionLabel: "Return to secure checkout",
        autoBack: true,
      });
    }

    if (callbackCode && !["HP0", "3D0", "3D1"].includes(callbackCode)) {
      await markPowerTranzCheckoutStatus(checkout.id, "failed");
      return renderBillingCallbackPage({
        title: "Payment was not completed",
        message: `PowerTranz returned ${callbackCode} before payment completion.`,
        redirectTo: "/pricing",
        actionLabel: "Return to pricing",
      });
    }

    const payment = await completePowerTranzPayment(effectiveSpiToken);
    const paymentPayload = payment as unknown as Record<string, unknown>;
    const paymentApproved = resolvePaymentApproved(paymentPayload) ?? false;
    const paymentTransactionId = resolvePaymentString(
      paymentPayload,
      "TransactionIdentifier",
      "transactionIdentifier"
    );
    const paymentPanToken = resolvePaymentString(paymentPayload, "PanToken", "panToken");
    const paymentOrderIdentifier = resolvePaymentString(
      paymentPayload,
      "OrderIdentifier",
      "orderIdentifier"
    );
    const paymentMessage =
      resolvePaymentString(paymentPayload, "ResponseMessage", "responseMessage", "IsoResponseCode", "isoResponseCode") ||
      ((payment as { Errors?: Array<{ Message?: string | null }>; errors?: Array<{ message?: string | null }> })
        .Errors?.[0]?.Message ??
        (payment as { errors?: Array<{ message?: string | null }> }).errors?.[0]?.message) ||
      "PowerTranz did not approve the payment.";

    if (!paymentApproved) {
      await markPowerTranzCheckoutStatus(checkout.id, "failed", {
        powertranz_transaction_id: paymentTransactionId || null,
        powertranz_pan_token: paymentPanToken || null,
      });
      return renderBillingCallbackPage({
        title: "Payment declined",
        message: paymentMessage,
        redirectTo: "/pricing",
        actionLabel: "Return to pricing",
      });
    }

    const selection = resolveBillingSelection(isPlainObject(checkout.selection) ? checkout.selection : {});
    if (!selection) {
      await markPowerTranzCheckoutStatus(checkout.id, "failed", {
        powertranz_transaction_id: payment.TransactionIdentifier || null,
        powertranz_pan_token: payment.PanToken || null,
      });
      return renderBillingCallbackPage({
        title: "Billing selection missing",
        message: "The checkout session no longer contains a valid billing selection.",
        redirectTo: "/pricing",
        actionLabel: "Return to pricing",
      });
    }

    await applyBillingSelectionToProfile(admin, checkout.email, selection, {
      from: new Date(),
      providerTransactionId: paymentTransactionId || checkout.transaction_identifier,
      panToken: paymentPanToken || null,
      orderIdentifier: paymentOrderIdentifier || checkout.order_identifier,
    });

    await markPowerTranzCheckoutStatus(checkout.id, "completed", {
      powertranz_transaction_id: paymentTransactionId || null,
      powertranz_pan_token: paymentPanToken || null,
    });

    return renderBillingCallbackPage({
      title: "Payment received",
      message: "Your PowerTranz payment was approved and your Nightlife Flyers access has been updated.",
      redirectTo: "/billing/success",
      actionLabel: "Open success page",
    });
  } catch {
    return renderBillingCallbackPage({
      title: "Payment processing failed",
      message: "Nightlife Flyers could not complete the PowerTranz billing callback.",
      redirectTo: "/pricing",
      actionLabel: "Return to pricing",
    });
  }
}
