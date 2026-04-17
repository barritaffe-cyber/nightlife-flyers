import { NextResponse } from "next/server";
import { supabaseAuth } from "../../../../lib/supabase/auth";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { createProviderCheckout } from "../../../../lib/billing/provider";
import { resolveBillingSelection } from "../../../../lib/billing/catalog";
import { extractClientTrackingPayload, insertAnalyticsEventForUser } from "../../../../lib/analytics/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const authClient = supabaseAuth();
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user?.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const trackingBody =
      body?.tracking && typeof body.tracking === "object" ? body.tracking : body;
    const tracking = extractClientTrackingPayload(req, trackingBody);
    const selection = resolveBillingSelection({
      plan: body?.plan,
      billing: body?.billing,
      offer: body?.offer,
    });

    if (!selection) {
      return NextResponse.json({ error: "Invalid billing selection." }, { status: 400 });
    }

    const siteUrl = req.headers.get("origin") || new URL(req.url).origin;
    const result = await createProviderCheckout(selection, userData.user.email, { siteUrl });
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          missing: result.missing,
          context: "billing_checkout_not_ready",
        },
        { status: result.code }
      );
    }

    try {
      const admin = supabaseAdmin();
      await insertAnalyticsEventForUser(admin, "checkout_started", {
        req,
        user: userData.user,
        path: tracking.path,
        anonId: tracking.anonId,
        sessionId: tracking.sessionId,
        referrer: tracking.referrer,
        utmSource: tracking.utmSource,
        utmMedium: tracking.utmMedium,
        utmCampaign: tracking.utmCampaign,
        utmTerm: tracking.utmTerm,
        utmContent: tracking.utmContent,
        landingPath: tracking.landingPath,
        properties: {
          selection_kind: selection.kind,
          plan: selection.kind === "plan" ? selection.plan : null,
          billing: selection.kind === "plan" ? selection.billing : null,
          offer: selection.kind === "offer" ? selection.offer : null,
          provider_mode: result.mode,
          original_price: result.originalPrice,
          effective_price: result.effectivePrice,
          founding_discount_applied: result.foundingDiscountApplied,
          founding_discount_percent: result.foundingDiscountPercent,
        },
      });
    } catch (error) {
      console.error("Analytics checkout_started failed", error);
    }

    return NextResponse.json({
      mode: result.mode,
      checkoutId: result.checkoutId,
      redirectDataHtml: result.redirectDataHtml,
      original_price: result.originalPrice,
      effective_price: result.effectivePrice,
      founding_discount_applied: result.foundingDiscountApplied,
      founding_discount_percent: result.foundingDiscountPercent,
    });
  } catch {
    return NextResponse.json({ error: "Checkout initialization failed." }, { status: 500 });
  }
}
