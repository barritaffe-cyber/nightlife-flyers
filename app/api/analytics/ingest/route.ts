import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { supabaseAuth } from "../../../../lib/supabase/auth";
import { extractClientTrackingPayload, insertAnalyticsEvent } from "../../../../lib/analytics/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const event = typeof body?.event === "string" ? body.event.trim() : "";
    if (!event) {
      return NextResponse.json({ error: "Missing event name." }, { status: 400 });
    }

    let userId: string | null = null;
    let email: string | null = null;
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (token) {
      try {
        const authClient = supabaseAuth();
        const { data } = await authClient.auth.getUser(token);
        userId = data?.user?.id || null;
        email = data?.user?.email || null;
      } catch {}
    }

    const tracking = extractClientTrackingPayload(req, body);
    const admin = supabaseAdmin();
    await insertAnalyticsEvent(admin, {
      eventName: event,
      path: tracking.path,
      properties:
        body?.properties && typeof body.properties === "object" && !Array.isArray(body.properties)
          ? (body.properties as Record<string, unknown>)
          : {},
      userId,
      email,
      anonId: tracking.anonId,
      sessionId: tracking.sessionId,
      referrer: tracking.referrer,
      utmSource: tracking.utmSource,
      utmMedium: tracking.utmMedium,
      utmCampaign: tracking.utmCampaign,
      utmTerm: tracking.utmTerm,
      utmContent: tracking.utmContent,
      landingPath: tracking.landingPath,
      userAgent: tracking.userAgent,
      ipHash: tracking.ipHash,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analytics ingest failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
