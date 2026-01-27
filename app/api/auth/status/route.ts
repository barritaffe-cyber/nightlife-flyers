import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { supabaseAuth } from "../../../../lib/supabase/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const admin = supabaseAdmin();
    const auth = supabaseAuth();
    const { data: userData, error: userErr } = await auth.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = userData.user.id;
    const { data: profile, error } = await admin
      .from("profiles")
      .select("status,current_period_end,email")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json(
        { status: "inactive", reason: "no_profile" },
        { status: 403 }
      );
    }

    const now = new Date();
    const periodEnd = profile.current_period_end
      ? new Date(profile.current_period_end)
      : null;
    const active =
      profile.status === "active" &&
      periodEnd != null &&
      periodEnd.getTime() > now.getTime();

    return NextResponse.json({
      status: active ? "active" : "inactive",
      current_period_end: profile.current_period_end,
      email: profile.email,
    });
  } catch {
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}
