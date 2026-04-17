import crypto from "node:crypto";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AnalyticsEventName =
  | "page_view"
  | "pricing_view"
  | "signup_started"
  | "signup_requested"
  | "login_started"
  | "login_succeeded"
  | "starter_trial_benefit_used"
  | "ai_generation_started"
  | "ai_generation_succeeded"
  | "ai_generation_failed"
  | "auto_layout_started"
  | "auto_layout_succeeded"
  | "auto_layout_failed"
  | "magic_blend_started"
  | "magic_blend_succeeded"
  | "magic_blend_failed"
  | "checkout_started"
  | "checkout_succeeded"
  | "subscription_activated";

export type AnalyticsEventInsert = {
  eventName: AnalyticsEventName | string;
  path?: string | null;
  properties?: Record<string, unknown> | null;
  userId?: string | null;
  email?: string | null;
  anonId?: string | null;
  sessionId?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  landingPath?: string | null;
  userAgent?: string | null;
  ipHash?: string | null;
};

function normalizeText(value: unknown, max = 500) {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, max) : null;
}

function normalizeJsonRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function hashIp(rawIp: string | null | undefined) {
  const normalized = String(rawIp || "")
    .split(",")[0]
    .trim();
  if (!normalized) return null;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function extractIpHashFromRequest(req: Request) {
  return hashIp(
    req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip")
  );
}

export function extractClientTrackingPayload(
  req: Request,
  body?: Record<string, unknown> | null
) {
  return {
    path: normalizeText(body?.path ?? body?.pathname ?? new URL(req.url).pathname, 300),
    referrer: normalizeText(body?.referrer ?? req.headers.get("referer"), 1000),
    anonId: normalizeText(body?.anon_id ?? body?.anonId, 120),
    sessionId: normalizeText(body?.session_id ?? body?.sessionId, 120),
    utmSource: normalizeText(body?.utm_source ?? body?.utmSource, 120),
    utmMedium: normalizeText(body?.utm_medium ?? body?.utmMedium, 120),
    utmCampaign: normalizeText(body?.utm_campaign ?? body?.utmCampaign, 160),
    utmTerm: normalizeText(body?.utm_term ?? body?.utmTerm, 160),
    utmContent: normalizeText(body?.utm_content ?? body?.utmContent, 160),
    landingPath: normalizeText(body?.landing_path ?? body?.landingPath, 300),
    userAgent: normalizeText(req.headers.get("user-agent"), 1000),
    ipHash: extractIpHashFromRequest(req),
  };
}

export async function insertAnalyticsEvent(
  admin: SupabaseClient,
  input: AnalyticsEventInsert
) {
  const { error } = await admin.from("analytics_events").insert({
    event_name: normalizeText(input.eventName, 80),
    path: normalizeText(input.path, 300),
    properties: normalizeJsonRecord(input.properties),
    user_id: normalizeText(input.userId, 120),
    email: normalizeText(input.email, 320),
    anon_id: normalizeText(input.anonId, 120),
    session_id: normalizeText(input.sessionId, 120),
    referrer: normalizeText(input.referrer, 1000),
    utm_source: normalizeText(input.utmSource, 120),
    utm_medium: normalizeText(input.utmMedium, 120),
    utm_campaign: normalizeText(input.utmCampaign, 160),
    utm_term: normalizeText(input.utmTerm, 160),
    utm_content: normalizeText(input.utmContent, 160),
    landing_path: normalizeText(input.landingPath, 300),
    user_agent: normalizeText(input.userAgent, 1000),
    ip_hash: normalizeText(input.ipHash, 128),
  });

  if (error) {
    throw new Error(`Analytics insert failed: ${error.message}`);
  }
}

export async function insertAnalyticsEventForUser(
  admin: SupabaseClient,
  eventName: AnalyticsEventName | string,
  args: {
    req?: Request | null;
    user?: User | null;
    path?: string | null;
    properties?: Record<string, unknown> | null;
    anonId?: string | null;
    sessionId?: string | null;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmTerm?: string | null;
    utmContent?: string | null;
    landingPath?: string | null;
    referrer?: string | null;
  } = {}
) {
  const requestPayload = args.req ? extractClientTrackingPayload(args.req, null) : null;

  await insertAnalyticsEvent(admin, {
    eventName,
    path: args.path ?? requestPayload?.path ?? null,
    properties: args.properties ?? {},
    userId: args.user?.id ?? null,
    email: args.user?.email ?? null,
    anonId: args.anonId ?? null,
    sessionId: args.sessionId ?? null,
    referrer: args.referrer ?? requestPayload?.referrer ?? null,
    utmSource: args.utmSource ?? null,
    utmMedium: args.utmMedium ?? null,
    utmCampaign: args.utmCampaign ?? null,
    utmTerm: args.utmTerm ?? null,
    utmContent: args.utmContent ?? null,
    landingPath: args.landingPath ?? null,
    userAgent: requestPayload?.userAgent ?? null,
    ipHash: requestPayload?.ipHash ?? null,
  });
}
