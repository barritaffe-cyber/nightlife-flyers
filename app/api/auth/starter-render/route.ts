import { NextResponse } from "next/server";
import {
  extractClientTrackingPayload,
  insertAnalyticsEvent,
} from "../../../../lib/analytics/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

const STARTER_FREE_RENDER_LIMIT = 2;
const STARTER_RENDER_EVENT = "starter_export_render_used";

function cleanText(value: unknown, max = 160) {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, max) : null;
}

async function countRenderEvents(args: {
  admin: ReturnType<typeof supabaseAdmin>;
  deviceId: string | null;
  ipHash: string | null;
}) {
  const counts: number[] = [];

  if (args.deviceId) {
    const { count, error } = await args.admin
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", STARTER_RENDER_EVENT)
      .eq("anon_id", args.deviceId);
    if (error) throw error;
    counts.push(count || 0);
  }

  if (args.ipHash) {
    const { count, error } = await args.admin
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", STARTER_RENDER_EVENT)
      .eq("ip_hash", args.ipHash);
    if (error) throw error;
    counts.push(count || 0);
  }

  return Math.max(0, ...counts);
}

function quotaPayload(used: number) {
  const safeUsed = Math.max(0, used);
  const remaining = Math.max(0, STARTER_FREE_RENDER_LIMIT - safeUsed);
  return {
    ok: true,
    limit: STARTER_FREE_RENDER_LIMIT,
    used: safeUsed,
    remaining,
    blocked: remaining <= 0,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action === "consume" ? "consume" : "status";
    const deviceId = cleanText(body?.deviceId ?? body?.device_id, 160);
    const deviceType = cleanText(body?.deviceType ?? body?.device_type, 40);
    const trackingBody =
      body?.tracking && typeof body.tracking === "object" ? body.tracking : body;
    const tracking = extractClientTrackingPayload(req, trackingBody);

    if (!deviceId && !tracking.ipHash) {
      return NextResponse.json(
        { error: "Device tracking unavailable." },
        { status: 400 }
      );
    }

    const admin = supabaseAdmin();
    const used = await countRenderEvents({
      admin,
      deviceId,
      ipHash: tracking.ipHash,
    });

    if (action === "status") {
      return NextResponse.json(quotaPayload(used));
    }

    if (used >= STARTER_FREE_RENDER_LIMIT) {
      return NextResponse.json(
        {
          ...quotaPayload(used),
          error: "Free render limit reached. Sign up and choose a plan to render more flyers.",
        },
        { status: 402 }
      );
    }

    await insertAnalyticsEvent(admin, {
      eventName: STARTER_RENDER_EVENT,
      path: tracking.path,
      anonId: deviceId,
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
      properties: {
        device_id: deviceId,
        device_type: deviceType,
        render_limit: STARTER_FREE_RENDER_LIMIT,
        render_number: used + 1,
      },
    });

    return NextResponse.json(quotaPayload(used + 1));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Starter render check failed.",
      },
      { status: 500 }
    );
  }
}
