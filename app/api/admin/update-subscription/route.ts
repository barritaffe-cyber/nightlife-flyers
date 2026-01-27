import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

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
    } = body as {
      email: string;
      status: "active" | "past_due" | "canceled" | "trial";
      current_period_end: string;
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

    if (userErr || !users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error: updateErr } = await admin
      .from("profiles")
      .update({ status, current_period_end })
      .eq("email", email);

    if (updateErr) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
