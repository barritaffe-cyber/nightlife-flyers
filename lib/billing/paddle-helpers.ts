import crypto from "node:crypto";

export type ResolvedBillingSelection =
  | { kind: "plan"; plan: "creator" | "studio"; billing: "monthly" | "yearly" }
  | { kind: "offer"; offer: "night-pass" | "weekend-pass" };

function normalizeSelection(input: {
  plan?: string | null;
  billing?: string | null;
  offer?: string | null;
}): ResolvedBillingSelection | null {
  if (input.offer === "night-pass" || input.offer === "weekend-pass") {
    return { kind: "offer", offer: input.offer };
  }
  if (input.plan === "creator" || input.plan === "studio") {
    return {
      kind: "plan",
      plan: input.plan,
      billing: input.billing === "yearly" ? "yearly" : "monthly",
    };
  }
  return null;
}

function getProductEnv() {
  return {
    creatorMonthly: process.env.PADDLE_PRICE_CREATOR_MONTHLY || "",
    creatorYearly: process.env.PADDLE_PRICE_CREATOR_YEARLY || "",
    studioMonthly: process.env.PADDLE_PRICE_STUDIO_MONTHLY || "",
    studioYearly: process.env.PADDLE_PRICE_STUDIO_YEARLY || "",
    nightPass: process.env.PADDLE_PRICE_NIGHT_PASS || "",
    weekendPass: process.env.PADDLE_PRICE_WEEKEND_PASS || "",
  };
}

export function resolveSelectionFromPaddleCustomData(
  customData: Record<string, unknown> | null | undefined
): ResolvedBillingSelection | null {
  return normalizeSelection({
    plan: typeof customData?.plan === "string" ? customData.plan : null,
    billing: typeof customData?.billing === "string" ? customData.billing : null,
    offer: typeof customData?.offer === "string" ? customData.offer : null,
  });
}

export function resolveSelectionFromPaddlePriceIds(priceIds: string[]): ResolvedBillingSelection | null {
  const productEnv = getProductEnv();
  const matchedPriceId = priceIds.find((priceId) => Object.values(productEnv).includes(priceId));

  if (!matchedPriceId) {
    return null;
  }
  if (matchedPriceId === productEnv.creatorMonthly) {
    return { kind: "plan", plan: "creator", billing: "monthly" };
  }
  if (matchedPriceId === productEnv.creatorYearly) {
    return { kind: "plan", plan: "creator", billing: "yearly" };
  }
  if (matchedPriceId === productEnv.studioMonthly) {
    return { kind: "plan", plan: "studio", billing: "monthly" };
  }
  if (matchedPriceId === productEnv.studioYearly) {
    return { kind: "plan", plan: "studio", billing: "yearly" };
  }
  if (matchedPriceId === productEnv.nightPass) {
    return { kind: "offer", offer: "night-pass" };
  }
  if (matchedPriceId === productEnv.weekendPass) {
    return { kind: "offer", offer: "weekend-pass" };
  }
  return null;
}

export function mapPaddleSubscriptionStatus(value: string | null | undefined): string {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "trialing") return "trial";
  return raw || "inactive";
}

export function extractPaddlePriceIds(items: unknown): string[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const ids = new Set<string>();
  for (const item of items) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const priceId = typeof (item as { price_id?: unknown }).price_id === "string"
      ? (item as { price_id: string }).price_id
      : typeof (item as { price?: { id?: unknown } }).price?.id === "string"
        ? (item as { price: { id: string } }).price.id
        : null;
    if (priceId) {
      ids.add(priceId);
    }
  }

  return Array.from(ids);
}

export function readPaddleUserEmail(customData: Record<string, unknown> | null | undefined): string | null {
  const value =
    typeof customData?.user_email === "string"
      ? customData.user_email
      : typeof customData?.email === "string"
        ? customData.email
        : null;
  return value ? value.trim().toLowerCase() : null;
}

export function verifyPaddleWebhookSignature(rawBody: string, signatureHeader: string | null | undefined): boolean {
  const secret = String(process.env.PADDLE_WEBHOOK_SECRET || "").trim();
  if (!secret || !signatureHeader) {
    return false;
  }

  const pairs = signatureHeader.split(";").map((part) => part.trim().split("="));
  const timestamp = pairs.find(([key]) => key === "ts")?.[1];
  const signatures = pairs.filter(([key]) => key === "h1").map(([, value]) => value);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const payload = `${timestamp}:${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");

  return signatures.some((value) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(value, "hex"), Buffer.from(expected, "hex"));
    } catch {
      return false;
    }
  });
}
