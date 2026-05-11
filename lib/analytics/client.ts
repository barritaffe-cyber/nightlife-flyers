"use client";

const ANON_ID_KEY = "nightlife_analytics_anon_id";
const SESSION_ID_KEY = "nightlife_analytics_session_id";
const ATTRIBUTION_KEY = "nightlife_analytics_attribution_v1";
let lastKnownAnalyticsEmail: string | null = null;
const TRACKING_ENABLED = process.env.NEXT_PUBLIC_TRACKING_ENABLED;
const PRODUCTION_HOSTS = new Set(["www.nightlife-flyers.com", "nightlife-flyers.com"]);
const AUTOMATED_USER_AGENT_RE =
  /\b(node|vercel|bot|spider|crawler|crawl|curl|wget|python|go-http-client|axios|undici|headless|lighthouse|pagespeed|pingdom|uptime|monitor)\b/i;

export type ClientTrackingPayload = {
  path: string;
  anon_id: string;
  session_id: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  landing_path: string | null;
};

type StoredAttribution = Omit<ClientTrackingPayload, "path" | "anon_id" | "session_id">;

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function shouldTrackClientAnalytics() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  if (!userAgent || AUTOMATED_USER_AGENT_RE.test(userAgent)) return false;

  const configured = String(TRACKING_ENABLED || "").trim().toLowerCase();
  if (configured === "false" || configured === "0" || configured === "off") return false;
  if (configured === "true" || configured === "1" || configured === "on") return true;

  const hostname = window.location.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local")) {
    return false;
  }
  if (hostname.endsWith(".vercel.app")) return false;

  return PRODUCTION_HOSTS.has(hostname);
}

function safeStorageGet(storage: Storage, key: string) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {}
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getPersistentId(key: string, storage: Storage) {
  const existing = safeStorageGet(storage, key);
  if (existing) return existing;
  const created = createId();
  safeStorageSet(storage, key, created);
  return created;
}

function readStoredAttribution(): StoredAttribution {
  if (!canUseBrowserStorage()) {
    return {
      referrer: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      landing_path: null,
    };
  }

  try {
    const raw = safeStorageGet(window.localStorage, ATTRIBUTION_KEY);
    if (!raw) {
      return {
        referrer: null,
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        utm_term: null,
        utm_content: null,
        landing_path: null,
      };
    }
    const parsed = JSON.parse(raw) as StoredAttribution;
    return {
      referrer: parsed?.referrer || null,
      utm_source: parsed?.utm_source || null,
      utm_medium: parsed?.utm_medium || null,
      utm_campaign: parsed?.utm_campaign || null,
      utm_term: parsed?.utm_term || null,
      utm_content: parsed?.utm_content || null,
      landing_path: parsed?.landing_path || null,
    };
  } catch {
    return {
      referrer: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      landing_path: null,
    };
  }
}

function persistAttributionFromLocation() {
  if (!canUseBrowserStorage()) return readStoredAttribution();

  const existing = readStoredAttribution();
  if (existing.landing_path) {
    return existing;
  }

  const url = new URL(window.location.href);
  const stored: StoredAttribution = {
    referrer: document.referrer || null,
    utm_source: url.searchParams.get("utm_source"),
    utm_medium: url.searchParams.get("utm_medium"),
    utm_campaign: url.searchParams.get("utm_campaign"),
    utm_term: url.searchParams.get("utm_term"),
    utm_content: url.searchParams.get("utm_content"),
    landing_path: `${url.pathname}${url.search}`,
  };
  safeStorageSet(window.localStorage, ATTRIBUTION_KEY, JSON.stringify(stored));
  return stored;
}

export function getClientTrackingPayload(path?: string): ClientTrackingPayload {
  if (!canUseBrowserStorage()) {
    return {
      path: path || "/",
      anon_id: "server",
      session_id: "server",
      referrer: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      landing_path: null,
    };
  }

  const attribution = persistAttributionFromLocation();
  const anonId = getPersistentId(ANON_ID_KEY, window.localStorage);
  const sessionId = getPersistentId(SESSION_ID_KEY, window.sessionStorage);
  const resolvedPath = path || `${window.location.pathname}${window.location.search}`;

  return {
    path: resolvedPath,
    anon_id: anonId,
    session_id: sessionId,
    referrer: attribution.referrer,
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_term: attribution.utm_term,
    utm_content: attribution.utm_content,
    landing_path: attribution.landing_path,
  };
}

async function readSessionIdentity() {
  try {
    const { supabaseBrowser } = await import("../supabase/client");
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getSession();
    lastKnownAnalyticsEmail = data.session?.user?.email || lastKnownAnalyticsEmail;
    return {
      token: data.session?.access_token || null,
      email: data.session?.user?.email || null,
    };
  } catch {
    return {
      token: null,
      email: lastKnownAnalyticsEmail,
    };
  }
}

export async function trackClientEvent(
  event: string,
  options: {
    path?: string;
    properties?: Record<string, unknown>;
  } = {}
) {
  if (!shouldTrackClientAnalytics()) return;

  const identity = await readSessionIdentity();
  const payload = {
    event,
    properties: options.properties || {},
    client_email: identity.email,
    ...getClientTrackingPayload(options.path),
  };

  try {
    await fetch("/api/analytics/ingest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(identity.token ? { Authorization: `Bearer ${identity.token}` } : {}),
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {}
}

export function sendClientEventBeacon(
  event: string,
  options: {
    path?: string;
    properties?: Record<string, unknown>;
  } = {}
) {
  if (!shouldTrackClientAnalytics()) return;

  const payload = {
    event,
    properties: options.properties || {},
    client_email: lastKnownAnalyticsEmail,
    ...getClientTrackingPayload(options.path),
  };
  const body = JSON.stringify(payload);

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/analytics/ingest", blob)) return;
    }
  } catch {}

  try {
    void fetch("/api/analytics/ingest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      keepalive: true,
    });
  } catch {}
}

declare global {
  interface Window {
    fbq?: (command: string, event: string, parameters?: Record<string, unknown>) => void;
  }
}

export function trackMetaPixelEvent(event: string, parameters: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  try {
    window.fbq("track", event, parameters);
  } catch {}
}

export function trackMetaPixelCustomEvent(event: string, parameters: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  try {
    window.fbq("trackCustom", event, parameters);
  } catch {}
}
