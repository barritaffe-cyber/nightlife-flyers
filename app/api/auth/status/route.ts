import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { supabaseAuth } from "../../../../lib/supabase/auth";
import { getAccessSnapshotForUser } from "../../../../lib/accessQuota";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const admin = supabaseAdmin();
    const authClient = supabaseAuth();
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = userData.user.id;
    const snapshot = await getAccessSnapshotForUser(admin, userId);
    if (!snapshot) {
      return NextResponse.json(
        { status: "inactive", reason: "no_profile" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      status: snapshot.status,
      raw_status: snapshot.rawStatus,
      current_period_end: snapshot.profile.current_period_end,
      email: snapshot.profile.email,
      plan: snapshot.profile.plan,
      generation_limit: snapshot.generationLimit,
      generation_used: snapshot.generationUsed,
      generation_remaining: snapshot.generationRemaining,
    });
  } catch {
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}
