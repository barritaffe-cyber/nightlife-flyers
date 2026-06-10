import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BODY_LENGTH = 32_768;
const SENSITIVE_QUERY_KEYS = new Set([
  "access_token",
  "code",
  "email",
  "password",
  "refresh_token",
  "token",
]);

function cleanString(value: unknown, max = 2000): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function cleanUrl(value: unknown): string | undefined {
  const input = cleanString(value, 2000);
  if (!input) return undefined;

  try {
    const url = new URL(input);
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        url.searchParams.set(key, "[redacted]");
      }
    }
    return url.toString().slice(0, 2000);
  } catch {
    return input;
  }
}

function cleanMetadata(value: unknown): Record<string, string | number | boolean | null> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const metadata: Record<string, string | number | boolean | null> = {};

  for (const [key, raw] of Object.entries(value)) {
    const cleanKey = cleanString(key, 80);
    if (!cleanKey || SENSITIVE_QUERY_KEYS.has(cleanKey.toLowerCase())) continue;

    if (typeof raw === "string") {
      metadata[cleanKey] = cleanString(raw, 500) ?? "";
    } else if (typeof raw === "number" || typeof raw === "boolean" || raw === null) {
      metadata[cleanKey] = raw;
    }
  }

  return Object.keys(metadata).length ? metadata : undefined;
}

function normalizePayload(payload: unknown, request: Request) {
  const data = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const source = cleanString(data.source, 120) ?? "unknown";
  const message = cleanString(data.message, 1000) ?? "Unknown monitored error";

  return {
    level: "error",
    source,
    message,
    name: cleanString(data.name, 120),
    detail: cleanString(data.detail, 2000),
    stack: cleanString(data.stack, 6000),
    digest: cleanString(data.digest, 300),
    href: cleanUrl(data.href),
    referer: cleanUrl(request.headers.get("referer")),
    userAgent: cleanString(data.userAgent, 800) ?? cleanString(request.headers.get("user-agent"), 800),
    metadata: cleanMetadata(data.metadata),
    timestamp: cleanString(data.timestamp, 80) ?? new Date().toISOString(),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "local",
  };
}

async function forwardToWebhook(event: ReturnType<typeof normalizePayload>) {
  const webhookUrl = cleanString(process.env.MONITORING_WEBHOOK_URL, 2000);
  if (!webhookUrl) return;

  const webhookSecret = cleanString(process.env.MONITORING_WEBHOOK_SECRET, 1000);
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(webhookSecret ? { Authorization: `Bearer ${webhookSecret}` } : {}),
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    throw new Error(`Monitoring webhook failed with ${res.status}`);
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const body = rawBody.length > MAX_BODY_LENGTH ? rawBody.slice(0, MAX_BODY_LENGTH) : rawBody;
    const payload = body ? JSON.parse(body) : {};
    const event = normalizePayload(payload, request);

    console.error("[monitoring:error]", event);

    await forwardToWebhook(event).catch((error) => {
      console.error("[monitoring:forward-failed]", error);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[monitoring:ingest-failed]", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
