import { NextResponse } from "next/server";
import { insertAnalyticsEvent } from "../../../../lib/analytics/server";
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
}) {
  const { title, message, redirectTo, actionLabel = "Return to billing" } = args;
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

function renderPowerTranzResumePage(args: {
  title: string;
  message: string;
  spiToken: string;
  conductorUrl: string;
}) {
  const { title, message, spiToken, conductorUrl } = args;
  const safeTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeToken = spiToken.replace(/"/g, "&quot;");
  const safeConductorUrl = conductorUrl.replace(/"/g, "&quot;");
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
      .actions { margin-top: 18px; display: flex; gap: 10px; align-items: center; }
      button { padding: 10px 14px; color: #fff; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16); cursor: pointer; }
      .note { font-size: 12px; color: rgba(255,255,255,.5); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${safeTitle}</h1>
      <p>${safeMessage}</p>
      <div class="actions">
        <button type="button" id="continueButton">Continue Secure Checkout</button>
        <div class="note" id="countdownNote">Continue when you are ready.</div>
      </div>
    </div>
    <form id="powertranz_resume" action="${safeConductorUrl}" method="POST">
      <input type="hidden" name="SpiToken" value="${safeToken}" />
      <input type="hidden" name="browserLanguage" id="browserLanguage" value="" />
      <input type="hidden" name="browserWidth" id="browserWidth" value="" />
      <input type="hidden" name="browserHeight" id="browserHeight" value="" />
      <input type="hidden" name="browserTimeZone" id="browserTimeZone" value="" />
      <input type="hidden" name="browserJavaEnabled" id="browserJavaEnabled" value="" />
      <input type="hidden" name="browserJavascriptEnabled" id="browserJavascriptEnabled" value="" />
      <input type="hidden" name="browserColorDepth" id="browserColorDepth" value="" />
    </form>
    <script>
      (function () {
        var submitted = false;
        function submitResume() {
          if (submitted) return;
          submitted = true;
          document.getElementById("countdownNote").textContent = "Opening secure checkout...";
          document.getElementById("powertranz_resume").submit();
        }
        var lang = "";
        try {
          lang = window.navigator && (window.navigator.language || window.navigator.browserLanguage) || "";
        } catch (_) {}
        document.getElementById("browserLanguage").value = lang;
        document.getElementById("browserWidth").value = window && window.screen ? String(window.screen.width || "") : "";
        document.getElementById("browserHeight").value = window && window.screen ? String(window.screen.height || "") : "";
        document.getElementById("browserTimeZone").value = String(new Date().getTimezoneOffset());
        document.getElementById("browserJavaEnabled").value =
          window && window.navigator && typeof window.navigator.javaEnabled === "function"
            ? String(window.navigator.javaEnabled())
            : "";
        document.getElementById("browserJavascriptEnabled").value = "true";
        document.getElementById("browserColorDepth").value = window && window.screen ? String(window.screen.colorDepth || "") : "";
        document.getElementById("continueButton").addEventListener("click", submitResume);
      })();
    </script>
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

function resolveNestedPowerTranzResponse(payload: Record<string, unknown>): Record<string, unknown> | null {
  const raw =
    payload.Response ||
    payload.response ||
    payload.PaymentResponse ||
    payload.paymentResponse;

  if (isPlainObject(raw)) {
    return raw;
  }

  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isPlainObject(parsed)) {
        return parsed;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function isIntermediateThreeDSResponse(payload: Record<string, unknown>) {
  const code = resolveCallbackCode(payload);
  if (code && ["HP0", "3D0", "3D1"].includes(code)) {
    return true;
  }

  const message = resolvePaymentString(payload, "ResponseMessage", "responseMessage");
  return message === "3D-Secure complete";
}

function hasCompletionSignal(payload: Record<string, unknown>) {
  const callbackCode = resolveCallbackCode(payload);
  return Boolean(
    (callbackCode && !["HP0", "3D0", "3D1"].includes(callbackCode)) ||
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
    const callbackCode = isPlainObject(body) ? resolveCallbackCode(body) : null;

    console.info("PowerTranz callback received", {
      checkoutId,
      checkoutStatus: checkout.status,
      callbackCode,
      hasBody: isPlainObject(body),
      bodyKeys: isPlainObject(body) ? Object.keys(body).slice(0, 20) : [],
      hasCallbackSpiToken: Boolean(callbackSpiToken),
      hasStoredSpiToken: Boolean(checkout.spi_token),
    });

    if (!effectiveSpiToken) {
      await markPowerTranzCheckoutStatus(checkout.id, "invalid");
      return renderBillingCallbackPage({
        title: "Checkout not ready",
        message: "The PowerTranz checkout session is missing its payment token.",
        redirectTo: "/pricing",
        actionLabel: "Return to pricing",
      });
    }

    if (isPlainObject(body) && !hasCompletionSignal(body)) {
      return renderPowerTranzResumePage({
        title: "Secure checkout loading",
        message: "PowerTranz is preparing the hosted payment page.",
        spiToken: effectiveSpiToken,
        conductorUrl: `${providerState.apiBase.replace(/\/+$/, "")}/spi/conductor`,
      });
    }

    if (callbackCode && !["HP0", "3D0", "3D1"].includes(callbackCode)) {
      await markPowerTranzCheckoutStatus(checkout.id, "failed");
      console.error("PowerTranz callback pre-completion failure", {
        checkoutId,
        callbackCode,
        body,
      });
      return renderBillingCallbackPage({
        title: "Payment was not completed",
        message: `PowerTranz returned ${callbackCode} before payment completion.`,
        redirectTo: "/pricing",
        actionLabel: "Return to pricing",
      });
    }

    const nestedResponse = isPlainObject(body) ? resolveNestedPowerTranzResponse(body) : null;
    let paymentPayload: Record<string, unknown>;

    if (nestedResponse && !isIntermediateThreeDSResponse(nestedResponse)) {
      paymentPayload = nestedResponse;
    } else {
      let payment;
      try {
        payment = await completePowerTranzPayment(effectiveSpiToken);
      } catch (error) {
        throw error;
      }
      paymentPayload = payment as unknown as Record<string, unknown>;
    }

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
      ((paymentPayload as { Errors?: Array<{ Message?: string | null }>; errors?: Array<{ message?: string | null }> })
        .Errors?.[0]?.Message ??
        (paymentPayload as { errors?: Array<{ message?: string | null }> }).errors?.[0]?.message) ||
      "PowerTranz did not approve the payment.";

    console.info("PowerTranz payment response", {
      checkoutId,
      approved: paymentApproved,
      transactionIdentifier: paymentTransactionId,
      orderIdentifier: paymentOrderIdentifier,
      paymentMessage,
      payloadKeys: Object.keys(paymentPayload).slice(0, 20),
    });

    if (!paymentApproved) {
      await markPowerTranzCheckoutStatus(checkout.id, "failed", {
        powertranz_transaction_id: paymentTransactionId || null,
        powertranz_pan_token: paymentPanToken || null,
      });
      console.error("PowerTranz payment declined", {
        checkoutId,
        paymentMessage,
        paymentPayload,
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
        powertranz_transaction_id: paymentTransactionId || null,
        powertranz_pan_token: paymentPanToken || null,
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
      foundingDiscountPercent: checkout.founding_discount_applied
        ? checkout.founding_discount_percent || 0
        : 0,
    });

    await markPowerTranzCheckoutStatus(checkout.id, "completed", {
      powertranz_transaction_id: paymentTransactionId || null,
      powertranz_pan_token: paymentPanToken || null,
    });

    try {
      await insertAnalyticsEvent(admin, {
        eventName: "checkout_succeeded",
        path: "/billing/success",
        email: checkout.email,
        properties: {
          selection_kind: selection.kind,
          plan: selection.kind === "plan" ? selection.plan : null,
          billing: selection.kind === "plan" ? selection.billing : null,
          offer: selection.kind === "offer" ? selection.offer : null,
          checkout_id: checkout.id,
          billing_provider: "powertranz",
          transaction_id: paymentTransactionId || checkout.transaction_identifier,
          founding_discount_applied: checkout.founding_discount_applied || false,
          founding_discount_percent: checkout.founding_discount_percent || 0,
          original_price: checkout.original_price,
          effective_price: checkout.effective_price,
        },
      });

      if (selection.kind === "plan") {
        await insertAnalyticsEvent(admin, {
          eventName: "subscription_activated",
          path: "/billing/success",
          email: checkout.email,
          properties: {
            plan: selection.plan,
            billing: selection.billing,
            checkout_id: checkout.id,
            billing_provider: "powertranz",
            founding_discount_applied: checkout.founding_discount_applied || false,
            founding_discount_percent: checkout.founding_discount_percent || 0,
            original_price: checkout.original_price,
            effective_price: checkout.effective_price,
          },
        });
      }
    } catch (error) {
      console.error("Analytics checkout_succeeded failed", error);
    }

    return renderBillingCallbackPage({
      title: "Payment received",
      message: "Your PowerTranz payment was approved and your Nightlife Flyers access has been updated.",
      redirectTo: "/billing/success",
      actionLabel: "Open success page",
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : "Nightlife Flyers could not complete the PowerTranz billing callback.";
    console.error("PowerTranz callback failure", error);
    return renderBillingCallbackPage({
      title: "Payment processing failed",
      message,
      redirectTo: "/pricing",
      actionLabel: "Return to pricing",
    });
  }
}
