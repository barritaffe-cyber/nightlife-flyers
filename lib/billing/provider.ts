import { buildBillingCheckoutHref, type BillingSelection } from "./catalog";
import {
  extractPaddlePriceIds,
  mapPaddleSubscriptionStatus,
  readPaddleUserEmail,
  resolveSelectionFromPaddleCustomData,
  resolveSelectionFromPaddlePriceIds,
  verifyPaddleWebhookSignature,
} from "./paddle-helpers";
import { supabaseAdmin } from "../supabase/admin";

export type BillingProvider = "paddle";

export type BillingProviderState = {
  provider: BillingProvider;
  configured: boolean;
  missing: string[];
  productEnv: Record<string, string>;
  apiBase: string;
};

type BillingProviderFailure = {
  ok: false;
  code: number;
  error: string;
  missing: string[];
  context?: Record<string, unknown>;
};

type BillingProviderSuccess = {
  ok: true;
  url: string;
};

type PaddleApiListResponse<T> = {
  data: T[];
};

type PaddleApiEntityResponse<T> = {
  data: T;
};

type PaddleTransactionResponse = {
  id: string;
  checkout?: {
    url?: string | null;
  } | null;
};

type PaddlePortalSessionResponse = {
  urls?: {
    general?: {
      overview?: string | null;
    } | null;
  } | null;
};

type PaddleProfileRow = {
  paddle_customer_id: string | null;
  paddle_subscription_id: string | null;
};

const PADDLE_API_VERSION = "1";

const PRICE_ENV_KEYS = {
  creatorMonthly: "PADDLE_PRICE_CREATOR_MONTHLY",
  creatorYearly: "PADDLE_PRICE_CREATOR_YEARLY",
  studioMonthly: "PADDLE_PRICE_STUDIO_MONTHLY",
  studioYearly: "PADDLE_PRICE_STUDIO_YEARLY",
  nightPass: "PADDLE_PRICE_NIGHT_PASS",
  weekendPass: "PADDLE_PRICE_WEEKEND_PASS",
} as const;

class PaddleApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "PaddleApiError";
    this.status = status;
    this.details = details;
  }
}

function getPaddleApiKey(): string {
  return String(process.env.PADDLE_API_KEY || "").trim();
}

function getPaddleWebhookSecret(): string {
  return String(process.env.PADDLE_WEBHOOK_SECRET || "").trim();
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

function requiredPriceEnvKeys() {
  return Object.values(PRICE_ENV_KEYS);
}

function buildProviderState(options?: {
  requireApiKey?: boolean;
  requireWebhookSecret?: boolean;
  requirePrices?: boolean;
}): BillingProviderState {
  const apiKey = getPaddleApiKey();
  const productEnv = getProductEnv();
  const missing: string[] = [];

  if (options?.requireApiKey !== false && !apiKey) {
    missing.push("PADDLE_API_KEY");
  }
  if (options?.requireWebhookSecret && !getPaddleWebhookSecret()) {
    missing.push("PADDLE_WEBHOOK_SECRET");
  }
  if (options?.requirePrices) {
    for (const key of requiredPriceEnvKeys()) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
  }

  return {
    provider: "paddle",
    configured: missing.length === 0,
    missing,
    productEnv,
    apiBase: getPaddleApiBase(apiKey),
  };
}

export function getBillingProviderState(): BillingProviderState {
  return buildProviderState({ requireApiKey: true, requireWebhookSecret: true, requirePrices: true });
}

export function getPaddleWebhookState(): BillingProviderState {
  return buildProviderState({ requireApiKey: false, requireWebhookSecret: true });
}

export function getPaddleApiBase(apiKey = getPaddleApiKey()): string {
  return apiKey.includes("_sdbx_") ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
}

function selectionToPriceId(selection: BillingSelection): string {
  const productEnv = getProductEnv();
  if (selection.kind === "offer") {
    return selection.offer === "night-pass" ? productEnv.nightPass : productEnv.weekendPass;
  }
  if (selection.plan === "creator") {
    return selection.billing === "monthly" ? productEnv.creatorMonthly : productEnv.creatorYearly;
  }
  return selection.billing === "monthly" ? productEnv.studioMonthly : productEnv.studioYearly;
}

function buildSelectionCustomData(selection: BillingSelection, customerEmail: string) {
  return selection.kind === "offer"
    ? {
        app: "nightlife-flyers",
        user_email: customerEmail,
        selection_kind: "offer",
        offer: selection.offer,
      }
    : {
        app: "nightlife-flyers",
        user_email: customerEmail,
        selection_kind: "plan",
        plan: selection.plan,
        billing: selection.billing,
      };
}

async function paddleRequest<T>(
  path: string,
  options?: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
    query?: Record<string, string | undefined>;
  }
): Promise<T> {
  const apiKey = getPaddleApiKey();
  if (!apiKey) {
    throw new PaddleApiError("Paddle is not configured yet.", 503, { missing: ["PADDLE_API_KEY"] });
  }

  const url = new URL(path, `${getPaddleApiBase(apiKey)}/`);
  for (const [key, value] of Object.entries(options?.query || {})) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url, {
    method: options?.method || "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Paddle-Version": PADDLE_API_VERSION,
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
    cache: "no-store",
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const errorMessage =
      json?.error?.detail ||
      json?.error?.message ||
      json?.errors?.[0]?.detail ||
      json?.errors?.[0]?.message ||
      "Paddle request failed.";
    throw new PaddleApiError(errorMessage, res.status, json);
  }

  return json as T;
}

function toFailure(error: unknown, fallbackContext?: Record<string, unknown>): BillingProviderFailure {
  if (error instanceof PaddleApiError) {
    return {
      ok: false,
      code: error.status,
      error: error.message,
      missing: [],
      ...(fallbackContext ? { context: fallbackContext } : {}),
    };
  }

  return {
    ok: false,
    code: 500,
    error: "Paddle request failed.",
    missing: [],
    ...(fallbackContext ? { context: fallbackContext } : {}),
  };
}

export {
  extractPaddlePriceIds,
  mapPaddleSubscriptionStatus,
  readPaddleUserEmail,
  resolveSelectionFromPaddleCustomData,
  resolveSelectionFromPaddlePriceIds,
  verifyPaddleWebhookSignature,
};

export async function createProviderCheckout(
  selection: BillingSelection,
  customerEmail: string
): Promise<BillingProviderFailure | BillingProviderSuccess> {
  const providerState = buildProviderState({ requirePrices: true });
  if (!providerState.configured) {
    return {
      ok: false,
      code: 503,
      error: "Paddle checkout is not configured yet.",
      missing: providerState.missing,
    };
  }

  const priceId = selectionToPriceId(selection);
  if (!priceId) {
    return {
      ok: false,
      code: 503,
      error: "Missing Paddle price ID for this billing selection.",
      missing: [],
      context: {
        selection,
      },
    };
  }

  try {
    const response = await paddleRequest<PaddleApiEntityResponse<PaddleTransactionResponse>>("/transactions", {
      method: "POST",
      body: {
        items: [{ price_id: priceId, quantity: 1 }],
        collection_mode: "automatic",
        checkout: {
          url: process.env.NEXT_PUBLIC_SITE_URL || null,
        },
        custom_data: buildSelectionCustomData(selection, customerEmail),
      },
    });

    const checkoutUrl = response.data?.checkout?.url;
    if (!checkoutUrl) {
      return {
        ok: false,
        code: 502,
        error: "Paddle did not return a checkout URL.",
        missing: [],
        context: {
          selection,
          customerEmail,
          nextPath: buildBillingCheckoutHref(selection),
        },
      };
    }

    return {
      ok: true,
      url: checkoutUrl,
    };
  } catch (error) {
    return toFailure(error, {
      selection,
      customerEmail,
      nextPath: buildBillingCheckoutHref(selection),
    });
  }
}

async function getProfileBillingState(email: string): Promise<PaddleProfileRow | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select("paddle_customer_id,paddle_subscription_id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PaddleProfileRow;
}

async function listPortalSubscriptionIds(customerId: string, fallbackSubscriptionId: string | null): Promise<string[]> {
  if (fallbackSubscriptionId) {
    return [fallbackSubscriptionId];
  }

  try {
    const response = await paddleRequest<PaddleApiListResponse<{ id: string }>>("/subscriptions", {
      query: {
        customer_id: customerId,
        status: "active,trialing,past_due,paused",
        per_page: "10",
      },
    });
    return response.data.map((subscription) => subscription.id).filter(Boolean);
  } catch {
    return [];
  }
}

export async function createProviderPortal(
  customerEmail: string
): Promise<BillingProviderFailure | BillingProviderSuccess> {
  const providerState = buildProviderState({ requireApiKey: true });
  if (!providerState.configured) {
    return {
      ok: false,
      code: 503,
      error: "Paddle portal is not configured yet.",
      missing: providerState.missing,
    };
  }

  const profile = await getProfileBillingState(customerEmail);
  if (!profile?.paddle_customer_id) {
    return {
      ok: false,
      code: 404,
      error: "No Paddle customer was found for this account yet.",
      missing: [],
    };
  }

  try {
    const subscriptionIds = await listPortalSubscriptionIds(
      profile.paddle_customer_id,
      profile.paddle_subscription_id
    );
    const response = await paddleRequest<PaddleApiEntityResponse<PaddlePortalSessionResponse>>(
      `/customers/${profile.paddle_customer_id}/portal-sessions`,
      {
        method: "POST",
        body: subscriptionIds.length > 0 ? { subscription_ids: subscriptionIds } : {},
      }
    );

    const url = response.data?.urls?.general?.overview;
    if (!url) {
      return {
        ok: false,
        code: 502,
        error: "Paddle did not return a customer portal URL.",
        missing: [],
      };
    }

    return {
      ok: true,
      url,
    };
  } catch (error) {
    return toFailure(error, { customerEmail });
  }
}
