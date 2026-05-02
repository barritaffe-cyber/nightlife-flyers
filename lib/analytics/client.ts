"use client";

import { supabaseBrowser } from "../supabase/client";

const ANON_ID_KEY = "nightlife_analytics_anon_id";
const SESSION_ID_KEY = "nightlife_analytics_session_id";
const ATTRIBUTION_KEY = "nightlife_analytics_attribution_v1";

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

async function readAccessToken() {
  try {
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

export async function trackClientEvent(
  event: string,
  options: {
    path?: string;
    properties?: Record<string, unknown>;
  } = {}
) {
  if (typeof window === "undefined") return;

  const payload = {
    event,
    properties: options.properties || {},
    ...getClientTrackingPayload(options.path),
  };

  const token = await readAccessToken();

  try {
    await fetch("/api/analytics/ingest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
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
