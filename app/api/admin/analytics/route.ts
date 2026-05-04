import { NextResponse } from "next/server";
import { resolveAdminUserFromRequest } from "../../../../lib/adminAccess";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

type AnalyticsRow = {
  id: string;
  event_name: string | null;
  path: string | null;
  properties: Record<string, unknown> | null;
  user_id: string | null;
  email: string | null;
  anon_id: string | null;
  session_id: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  landing_path: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  created_at: string;
};

function clampDays(value: string | null) {
  const parsed = Number.parseInt(String(value || "1"), 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(180, parsed));
}

function increment(map: Map<string, number>, rawKey: string | null | undefined, fallback = "(unknown)") {
  const key = String(rawKey || "").trim() || fallback;
  map.set(key, (map.get(key) || 0) + 1);
}

function topEntries(map: Map<string, number>, limit = 10) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function uniqueVisitorKey(row: AnalyticsRow) {
  return row.anon_id || row.session_id || row.user_id || row.ip_hash || row.email || row.id;
}

export const runtime = "nodejs";

export async function GET(req: Request) {
  const adminUser = await resolveAdminUserFromRequest(req);
  if (!adminUser.ok) {
    return NextResponse.json({ error: adminUser.error }, { status: adminUser.code });
  }

  try {
    const url = new URL(req.url);
    const days = clampDays(url.searchParams.get("days"));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const admin = supabaseAdmin();

    const [countResult, rowsResult] = await Promise.all([
      admin
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since),
      admin
        .from("analytics_events")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);

    if (countResult.error) {
      throw new Error(countResult.error.message);
    }
    if (rowsResult.error) {
      throw new Error(rowsResult.error.message);
    }

    const rows = ((rowsResult.data || []) as AnalyticsRow[]).filter((row) => row && row.created_at);
    const eventCounts = new Map<string, number>();
    const sourceCounts = new Map<string, number>();
    const pathCounts = new Map<string, number>();
    const landingCounts = new Map<string, number>();
    const visitorIds = new Set<string>();

    for (const row of rows) {
      increment(eventCounts, row.event_name);
      increment(sourceCounts, row.utm_source);
      increment(pathCounts, row.path);
      increment(landingCounts, row.landing_path);
      visitorIds.add(uniqueVisitorKey(row));
    }

    const recentEvents = rows.slice(0, 120).map((row) => ({
      id: row.id,
      created_at: row.created_at,
      event_name: row.event_name,
      path: row.path,
      email: row.email,
      utm_source: row.utm_source,
      properties: row.properties || {},
    }));

    return NextResponse.json({
      ok: true,
      admin_email: adminUser.user.email || null,
      days,
      range_start: since,
      total_events: countResult.count || 0,
      sampled_events: rows.length,
      summary: {
        unique_visitors: visitorIds.size,
        page_views: eventCounts.get("page_view") || 0,
        pricing_views: eventCounts.get("pricing_view") || 0,
        signup_started: eventCounts.get("signup_started") || 0,
        signup_requested: eventCounts.get("signup_requested") || 0,
        login_started: eventCounts.get("login_started") || 0,
        login_succeeded: eventCounts.get("login_succeeded") || 0,
        checkout_started: eventCounts.get("checkout_started") || 0,
        checkout_succeeded: eventCounts.get("checkout_succeeded") || 0,
        subscriptions_activated: eventCounts.get("subscription_activated") || 0,
        starter_benefits_used: eventCounts.get("starter_trial_benefit_used") || 0,
        ai_generations_started: eventCounts.get("ai_generation_started") || 0,
        ai_generations_succeeded: eventCounts.get("ai_generation_succeeded") || 0,
        ai_generations_failed: eventCounts.get("ai_generation_failed") || 0,
        magic_blends_started: eventCounts.get("magic_blend_started") || 0,
        magic_blends_succeeded: eventCounts.get("magic_blend_succeeded") || 0,
        magic_blends_failed: eventCounts.get("magic_blend_failed") || 0,
        auto_layout_started: eventCounts.get("auto_layout_started") || 0,
        auto_layout_succeeded: eventCounts.get("auto_layout_succeeded") || 0,
        auto_layout_failed: eventCounts.get("auto_layout_failed") || 0,
      },
      top_sources: topEntries(sourceCounts),
      top_paths: topEntries(pathCounts),
      top_landings: topEntries(landingCounts),
      recent_events: recentEvents,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analytics dashboard failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
