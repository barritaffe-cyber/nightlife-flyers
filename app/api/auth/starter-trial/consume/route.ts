import { NextResponse } from "next/server";
import { consumeStarterBenefit } from "../../../../../lib/accessQuota";
import { extractClientTrackingPayload, insertAnalyticsEventForUser } from "../../../../../lib/analytics/server";
import { supabaseAdmin } from "../../../../../lib/supabase/admin";
import { supabaseAuth } from "../../../../../lib/supabase/auth";

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
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const trackingBody =
      body?.tracking && typeof body.tracking === "object" ? body.tracking : body;
    const tracking = extractClientTrackingPayload(req, trackingBody);
    const kind = body?.kind === "upload" || body?.kind === "clean_export" ? body.kind : null;
    if (!kind) {
      return NextResponse.json({ error: "Invalid starter trial action." }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const result = await consumeStarterBenefit(admin, userData.user.id, kind);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.message,
          status: result.snapshot?.status ?? "inactive",
          generation_limit: result.snapshot?.generationLimit ?? 0,
          generation_used: result.snapshot?.generationUsed ?? 0,
          generation_remaining: result.snapshot?.generationRemaining ?? 0,
          starter_upload_limit: result.snapshot?.starterUploadLimit ?? 1,
          starter_upload_used: result.snapshot?.starterUploadUsed ?? 0,
          starter_upload_remaining: result.snapshot?.starterUploadRemaining ?? 0,
          starter_clean_export_limit: result.snapshot?.starterCleanExportLimit ?? 1,
          starter_clean_export_used: result.snapshot?.starterCleanExportUsed ?? 0,
          starter_clean_export_remaining: result.snapshot?.starterCleanExportRemaining ?? 0,
        },
        { status: result.code }
      );
    }

    try {
      await insertAnalyticsEventForUser(admin, "starter_trial_benefit_used", {
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
          benefit_kind: kind,
          starter_upload_remaining: result.snapshot.starterUploadRemaining,
          starter_clean_export_remaining: result.snapshot.starterCleanExportRemaining,
        },
      });
    } catch (error) {
      console.error("Analytics starter_trial_benefit_used failed", error);
    }

    return NextResponse.json({
      ok: true,
      status: result.snapshot.status,
      generation_limit: result.snapshot.generationLimit,
      generation_used: result.snapshot.generationUsed,
      generation_remaining: result.snapshot.generationRemaining,
      starter_upload_limit: result.snapshot.starterUploadLimit,
      starter_upload_used: result.snapshot.starterUploadUsed,
      starter_upload_remaining: result.snapshot.starterUploadRemaining,
      starter_clean_export_limit: result.snapshot.starterCleanExportLimit,
      starter_clean_export_used: result.snapshot.starterCleanExportUsed,
      starter_clean_export_remaining: result.snapshot.starterCleanExportRemaining,
    });
  } catch {
    return NextResponse.json({ error: "Starter trial update failed." }, { status: 500 });
  }
}
