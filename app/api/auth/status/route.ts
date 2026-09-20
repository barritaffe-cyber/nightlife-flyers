import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { supabaseAuth } from "../../../../lib/supabase/auth";
import { getAccessSnapshotForUser } from "../../../../lib/accessQuota";

import { getFlyerAllowance } from "../../../../lib/billing/flyerAllowance";

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

    const flyers = await getFlyerAllowance(admin, userId);
    const oneFlyer = !["active", "ondemand"].includes(snapshot.status) && flyers.one_flyer_access;
    return NextResponse.json({
      flyers,
      status: oneFlyer ? "ondemand" : snapshot.status,
      raw_status: snapshot.rawStatus,
      current_period_end: snapshot.profile.current_period_end,
      email: snapshot.profile.email,
      plan: !["active","ondemand"].includes(snapshot.status) && flyers.has_one_flyer_purchase ? "one_flyer" : snapshot.profile.plan,
      generation_limit: snapshot.generationLimit,
      generation_used: snapshot.generationUsed,
      generation_remaining: snapshot.generationRemaining,
      starter_upload_limit: snapshot.starterUploadLimit,
      starter_upload_used: snapshot.starterUploadUsed,
      starter_upload_remaining: snapshot.starterUploadRemaining,
      starter_clean_export_limit: snapshot.starterCleanExportLimit,
      starter_clean_export_used: snapshot.starterCleanExportUsed,
      starter_clean_export_remaining: snapshot.starterCleanExportRemaining,
      founding_discount_percent: snapshot.foundingDiscountPercent,
    });
  } catch {
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}
