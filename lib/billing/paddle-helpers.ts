import crypto from "node:crypto";
import {
  resolveBillingSelection,
  type BillingCycle,
  type BillingOfferId,
  type BillingPlanId,
  type BillingSelection,
} from "./catalog.ts";

type PaddleCustomData = {
  plan?: unknown;
  billing?: unknown;
  offer?: unknown;
} | null;

type PaddleLineItem = {
  price_id?: unknown;
  price?: {
    id?: unknown;
  } | null;
} | null;

const PADDLE_PRICE_ENV: Record<string, BillingSelection> = {
  PADDLE_PRICE_CREATOR_MONTHLY: { kind: "plan", plan: "creator", billing: "monthly" },
  PADDLE_PRICE_CREATOR_YEARLY: { kind: "plan", plan: "creator", billing: "yearly" },
  PADDLE_PRICE_STUDIO_MONTHLY: { kind: "plan", plan: "studio", billing: "monthly" },
  PADDLE_PRICE_STUDIO_YEARLY: { kind: "plan", plan: "studio", billing: "yearly" },
  PADDLE_PRICE_NIGHT_PASS: { kind: "offer", offer: "night-pass" },
  PADDLE_PRICE_WEEKEND_PASS: { kind: "offer", offer: "weekend-pass" },
};

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function resolveSelectionFromPaddleCustomData(
  customData: PaddleCustomData
): BillingSelection | null {
  if (!customData) return null;
  return resolveBillingSelection({
    plan: readString(customData.plan) as BillingPlanId | null,
    billing: readString(customData.billing) as BillingCycle | null,
    offer: readString(customData.offer) as BillingOfferId | null,
  });
}

export function resolveSelectionFromPaddlePriceIds(
  priceIds: string[]
): BillingSelection | null {
  const normalized = new Set(priceIds.map((id) => id.trim()).filter(Boolean));

  for (const [envKey, selection] of Object.entries(PADDLE_PRICE_ENV)) {
    const configuredPriceId = String(process.env[envKey] || "").trim();
    if (configuredPriceId && normalized.has(configuredPriceId)) {
      return selection;
    }
  }

  return null;
}

export function extractPaddlePriceIds(items: PaddleLineItem[]): string[] {
  const seen = new Set<string>();

  for (const item of items) {
    const priceId = readString(item?.price_id) ?? readString(item?.price?.id);
    if (priceId) {
      seen.add(priceId);
    }
  }

  return [...seen];
}

export function readPaddleUserEmail(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as { user_email?: unknown; email?: unknown };
  const email = readString(data.user_email) ?? readString(data.email);
  return email ? email.toLowerCase() : null;
}

export function mapPaddleSubscriptionStatus(status: unknown): string {
  const normalized = readString(status)?.toLowerCase();
  if (!normalized) return "inactive";
  if (normalized === "trialing") return "trial";
  return normalized;
}

export function verifyPaddleWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = String(process.env.PADDLE_WEBHOOK_SECRET || "").trim();
  if (!secret || !signatureHeader) return false;

  const fields = Object.fromEntries(
    signatureHeader
      .split(";")
      .map((part) => part.split("="))
      .filter((part): part is [string, string] => part.length === 2)
      .map(([key, value]) => [key.trim(), value.trim()])
  );
  const timestamp = fields.ts;
  const signature = fields.h1;
  if (!timestamp || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}:${rawBody}`, "utf8")
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
