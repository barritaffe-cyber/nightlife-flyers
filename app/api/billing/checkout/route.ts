import { NextResponse } from "next/server";
import { supabaseAuth } from "../../../../lib/supabase/auth";
import { createProviderCheckout } from "../../../../lib/billing/provider";
import { resolveBillingSelection } from "../../../../lib/billing/catalog";

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

    return NextResponse.json({
      mode: result.mode,
      checkoutId: result.checkoutId,
      redirectDataHtml: result.redirectDataHtml,
    });
  } catch {
    return NextResponse.json({ error: "Checkout initialization failed." }, { status: 500 });
  }
}
