import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { applyBillingSelectionToProfile, applyDirectBillingUpdate } from "../../../../lib/billing/entitlements";
import {
  extractPaddlePriceIds,
  getPaddleWebhookState,
  mapPaddleSubscriptionStatus,
  readPaddleUserEmail,
  resolveSelectionFromPaddleCustomData,
  resolveSelectionFromPaddlePriceIds,
  verifyPaddleWebhookSignature,
} from "../../../../lib/billing/provider";

export const runtime = "nodejs";

type PaddleWebhookEvent = {
  event_type?: string;
  occurred_at?: string;
  data?: {
    id?: string;
    status?: string;
    customer_id?: string | null;
    subscription_id?: string | null;
    custom_data?: Record<string, unknown> | null;
    items?: unknown;
    billed_at?: string | null;
    next_billed_at?: string | null;
    canceled_at?: string | null;
    current_billing_period?: {
      starts_at?: string | null;
      ends_at?: string | null;
    } | null;
  } | null;
};

async function findProfileEmailFromCustomerId(customerId: string | null | undefined): Promise<string | null> {
  if (!customerId) {
    return null;
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select("email")
    .eq("paddle_customer_id", customerId)
    .limit(1)
    .maybeSingle();

  if (error || !data?.email) {
    return null;
  }

  return data.email;
}

function resolveWebhookSelection(event: PaddleWebhookEvent): ReturnType<typeof resolveSelectionFromPaddleCustomData> {
  const customSelection = resolveSelectionFromPaddleCustomData(event.data?.custom_data);
  if (customSelection) {
    return customSelection;
  }
  return resolveSelectionFromPaddlePriceIds(extractPaddlePriceIds(event.data?.items));
}

function resolveWebhookPeriodEnd(event: PaddleWebhookEvent): string {
  const direct =
    event.data?.current_billing_period?.ends_at ||
    event.data?.next_billed_at ||
    event.data?.canceled_at ||
    event.data?.billed_at ||
    event.occurred_at;

  const parsed = direct ? new Date(direct) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function resolveOfferActivationDate(event: PaddleWebhookEvent): Date {
  const raw = event.data?.billed_at || event.occurred_at;
  const parsed = raw ? new Date(raw) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function POST(req: Request) {
  try {
    const adminSecret = req.headers.get("x-admin-secret") || "";
    const rawBody = await req.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const admin = supabaseAdmin();

    if (process.env.ADMIN_SECRET && adminSecret === process.env.ADMIN_SECRET) {
      if (body?.email && (body?.offer || body?.plan)) {
        const selection = resolveSelectionFromPaddleCustomData(body);
        if (!selection) {
          return NextResponse.json({ error: "Invalid billing selection." }, { status: 400 });
        }
        const result = await applyBillingSelectionToProfile(admin, body.email, selection);
        return NextResponse.json({ ok: true, mode: "admin-selection", ...result });
      }

      if (body?.email && body?.status && body?.current_period_end) {
        await applyDirectBillingUpdate(admin, {
          email: body.email,
          status: body.status,
          plan: body.plan,
          current_period_end: body.current_period_end,
          billing_provider: body.billing_provider || "manual",
        });
        return NextResponse.json({ ok: true, mode: "admin-direct" });
      }

      return NextResponse.json(
        { error: "Expected either { email, offer|plan } or { email, status, current_period_end }." },
        { status: 400 }
      );
    }

    const providerState = getPaddleWebhookState();
    if (!providerState.configured) {
      return NextResponse.json(
        {
          error: "Paddle webhook is not configured yet.",
          missing: providerState.missing,
        },
        { status: 503 }
      );
    }

    const signatureHeader = req.headers.get("paddle-signature");
    if (!verifyPaddleWebhookSignature(rawBody, signatureHeader)) {
      return NextResponse.json({ error: "Invalid Paddle signature." }, { status: 401 });
    }

    const event = body as PaddleWebhookEvent;
    const eventType = String(event.event_type || "");
    const selection = resolveWebhookSelection(event);
    const email =
      readPaddleUserEmail(event.data?.custom_data) ||
      (await findProfileEmailFromCustomerId(event.data?.customer_id));

    if (!eventType || !email) {
      return NextResponse.json({ ok: true, ignored: "missing_context" });
    }

    if (eventType === "transaction.completed" && selection?.kind === "offer") {
      const result = await applyBillingSelectionToProfile(admin, email, selection, {
        from: resolveOfferActivationDate(event),
        paddleCustomerId: event.data?.customer_id || null,
        paddleSubscriptionId: event.data?.subscription_id || null,
      });
      return NextResponse.json({ ok: true, mode: "offer", ...result });
    }

    if (eventType.startsWith("subscription.") && selection?.kind === "plan") {
      await applyDirectBillingUpdate(admin, {
        email,
        status: mapPaddleSubscriptionStatus(event.data?.status),
        plan: selection.plan,
        current_period_end: resolveWebhookPeriodEnd(event),
        billing_provider: "paddle",
        paddle_customer_id: event.data?.customer_id || null,
        paddle_subscription_id: event.data?.id || null,
      });
      return NextResponse.json({ ok: true, mode: "subscription" });
    }

    return NextResponse.json({ ok: true, ignored: eventType || "unknown_event" });
  } catch {
    return NextResponse.json({ error: "Webhook handling failed." }, { status: 500 });
  }
}
