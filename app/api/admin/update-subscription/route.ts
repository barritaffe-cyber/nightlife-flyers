import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { applyDirectBillingUpdate } from "../../../../lib/billing/entitlements";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-admin-secret") || "";
    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      email,
      status,
      current_period_end,
      plan,
    } = body as {
      email: string;
      status:
        | "active"
        | "past_due"
        | "canceled"
        | "trial"
        | "ondemand"
        | "on_demand"
        | "day_pass"
        | "night_pass"
        | "weekend_pass"
        | "export_pass";
      current_period_end: string;
      plan?: "creator" | "studio" | "monthly" | "yearly";
    };

    if (!email || !status || !current_period_end) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data: users, error: userErr } = await admin
      .from("profiles")
      .select("id,email")
      .eq("email", email)
      .limit(1);

    if (userErr) {
      return NextResponse.json({ error: "User lookup failed" }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "User not found. Please log in once to create a profile." },
        { status: 404 }
      );
    }

    await applyDirectBillingUpdate(admin, {
      email,
      status,
      plan,
      current_period_end,
      billing_provider: "manual",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
