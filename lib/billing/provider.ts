import { randomUUID } from "node:crypto";
import { buildBillingCheckoutHref, getBillingCatalogItem, type BillingSelection } from "./catalog";
import { supabaseAdmin } from "../supabase/admin";

export type BillingProvider = "powertranz";

export type BillingProviderState = {
  provider: BillingProvider;
  configured: boolean;
  missing: string[];
  configEnv: Record<string, string>;
  apiBase: string;
};

type BillingProviderFailure = {
  ok: false;
  code: number;
  error: string;
  missing: string[];
  context?: Record<string, unknown>;
};

type BillingProviderCheckoutSuccess = {
  ok: true;
  mode: "iframe";
  checkoutId: string;
  redirectDataHtml: string;
};

type BillingProviderSuccess = BillingProviderCheckoutSuccess;

type PowerTranzCheckoutRow = {
  id: string;
  email: string;
  selection: BillingSelection | null;
  spi_token: string | null;
  transaction_identifier: string;
  order_identifier: string;
  status: string;
  expires_at: string;
};

type PowerTranzFinancialResponse = {
  Approved?: boolean;
  AuthorizationCode?: string | null;
  CurrencyCode?: string | null;
  IsoResponseCode?: string | null;
  OrderIdentifier?: string | null;
  PanToken?: string | null;
  RedirectData?: string | null;
  ResponseMessage?: string | null;
  RRN?: string | null;
  SpiToken?: string | null;
  TotalAmount?: number | null;
  TransactionIdentifier?: string | null;
  TransactionType?: number | null;
  Errors?: Array<{ Code?: string | null; Message?: string | null }> | null;
  approved?: boolean;
  authorizationCode?: string | null;
  currencyCode?: string | null;
  isoResponseCode?: string | null;
  orderIdentifier?: string | null;
  panToken?: string | null;
  redirectData?: string | null;
  responseMessage?: string | null;
  rrn?: string | null;
  spiToken?: string | null;
  totalAmount?: number | null;
  transactionIdentifier?: string | null;
  transactionType?: number | null;
  errors?: Array<{ code?: string | null; message?: string | null }> | null;
};

const CONFIG_ENV_KEYS = {
  powerTranzId: "POWERTRANZ_ID",
  powerTranzPassword: "POWERTRANZ_PASSWORD",
  environment: "POWERTRANZ_ENVIRONMENT",
  pageSet: "POWERTRANZ_PAGESET",
  pageName: "POWERTRANZ_PAGENAME",
  currencyCode: "POWERTRANZ_CURRENCY_CODE",
} as const;

class PowerTranzApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "PowerTranzApiError";
    this.status = status;
    this.details = details;
  }
}

function getPowerTranzId(): string {
  return String(process.env.POWERTRANZ_ID || "").trim();
}

function getPowerTranzPassword(): string {
  return String(process.env.POWERTRANZ_PASSWORD || "").trim();
}

function getPowerTranzEnvironment(): string {
  const raw = String(process.env.POWERTRANZ_ENVIRONMENT || "").trim().toLowerCase();
  if (raw === "stag") {
    return "staging";
  }
  if (raw === "prod" || raw === "production" || raw === "live") {
    return "api";
  }
  return raw;
}

function getPowerTranzPageSet(): string {
  return String(process.env.POWERTRANZ_PAGESET || "").trim();
}

function getPowerTranzPageName(): string {
  return String(process.env.POWERTRANZ_PAGENAME || "").trim();
}

function getPowerTranzCurrencyCode(): string {
  return String(process.env.POWERTRANZ_CURRENCY_CODE || "").trim();
}

function getRecurringMode(): "managed" | "merchant" {
  return String(process.env.POWERTRANZ_RECURRING_MODE || "").trim().toLowerCase() === "merchant"
    ? "merchant"
    : "managed";
}

function getConfigEnv() {
  return {
    powerTranzId: process.env.POWERTRANZ_ID || "",
    powerTranzPassword: process.env.POWERTRANZ_PASSWORD || "",
    environment: process.env.POWERTRANZ_ENVIRONMENT || "",
    pageSet: process.env.POWERTRANZ_PAGESET || "",
    pageName: process.env.POWERTRANZ_PAGENAME || "",
    currencyCode: process.env.POWERTRANZ_CURRENCY_CODE || "",
  };
}

function requiredConfigEnvKeys() {
  return Object.values(CONFIG_ENV_KEYS);
}

function getPowerTranzApiBase(environment = getPowerTranzEnvironment()): string {
  return environment ? `https://${environment}.ptranz.com/Api` : "";
}

function buildPowerTranzUrl(path: string, environment = getPowerTranzEnvironment()): string {
  const base = getPowerTranzApiBase(environment).replace(/\/+$/, "");
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  return `${base}/${normalizedPath}`;
}

function buildProviderState(): BillingProviderState {
  const configEnv = getConfigEnv();
  const missing: string[] = [];

  for (const key of requiredConfigEnvKeys()) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  return {
    provider: "powertranz",
    configured: missing.length === 0,
    missing,
    configEnv,
    apiBase: getPowerTranzApiBase(),
  };
}

export function getBillingProviderState(): BillingProviderState {
  return buildProviderState();
}

function buildOrderIdentifier(selection: BillingSelection) {
  const tag = selection.kind === "offer" ? selection.offer : `${selection.plan}-${selection.billing}`;
  return `NLF-${tag}-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

function formatRecurringDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}

function buildRecurringData(selection: BillingSelection) {
  if (selection.kind !== "plan") {
    return {};
  }

  const startDate = new Date();
  const recurringFrequency = selection.billing === "yearly" ? "Y" : "M";

  return {
    RecurringInitial: true,
    Tokenize: true,
    ExtendedData: {
      Recurring: {
        Frequency: recurringFrequency,
        Managed: getRecurringMode() === "managed",
        StartDate: formatRecurringDate(startDate),
      },
    },
  };
}

function buildMerchantResponseUrl(siteUrl: string, checkoutId: string) {
  const base = siteUrl.replace(/\/+$/, "");
  return `${base}/api/billing/webhook?checkout=${encodeURIComponent(checkoutId)}`;
}

function getResponseString(response: PowerTranzFinancialResponse, ...keys: Array<keyof PowerTranzFinancialResponse>) {
  for (const key of keys) {
    const value = response[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function buildSalePayload(
  selection: BillingSelection,
  customerEmail: string,
  checkoutId: string,
  siteUrl: string
) {
  const item = getBillingCatalogItem(selection);
  const transactionIdentifier = randomUUID();
  const orderIdentifier = buildOrderIdentifier(selection);
  const merchantResponseUrl = buildMerchantResponseUrl(siteUrl, checkoutId);
  const recurring = buildRecurringData(selection);
  const hostedPage = {
    PAGESET: getPowerTranzPageSet(),
    PAGENAME: getPowerTranzPageName(),
  };
  const threeDSecure = {
    ChallengeIndicator: "01",
    ChallengeWindowSize: 4,
  };
  const extendedData = {
    // PowerTranz samples are inconsistent about key casing, so keep both forms.
    HOSTEDPAGE: hostedPage,
    HostedPage: {
      PageSet: hostedPage.PAGESET,
      PageName: hostedPage.PAGENAME,
    },
    MERCHANTRESPONSEURL: merchantResponseUrl,
    MerchantResponseUrl: merchantResponseUrl,
    ThreeDSecure: threeDSecure,
    threeDSecure: {
      challengeIndicator: "01",
      challengeWindowSize: 4,
    },
    ...(recurring.ExtendedData || {}),
  };

  return {
    transactionIdentifier,
    orderIdentifier,
    payload: {
      CurrencyCode: getPowerTranzCurrencyCode(),
      ExtendedData: extendedData,
      OrderIdentifier: orderIdentifier,
      Source: {},
      source: {},
      ThreeDSecure: true,
      TotalAmount: item.price,
      TransactionIdentifier: transactionIdentifier,
      ...(customerEmail ? { BillingAddress: { EmailAddress: customerEmail } } : {}),
      ...(recurring.RecurringInitial ? { RecurringInitial: true } : {}),
      ...(recurring.Tokenize ? { Tokenize: true } : {}),
    },
  };
}

async function powerTranzRequest<T>(
  path: string,
  options?: {
    method?: "GET" | "POST";
    body?: unknown;
  }
): Promise<T> {
  const state = buildProviderState();
  if (!state.configured) {
    throw new PowerTranzApiError("PowerTranz is not configured yet.", 503, { missing: state.missing });
  }

  const url = buildPowerTranzUrl(path);
  const res = await fetch(url, {
    method: options?.method || "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "PowerTranz-PowerTranzId": getPowerTranzId(),
      "PowerTranz-PowerTranzPassword": getPowerTranzPassword(),
    },
    ...(typeof options?.body === "undefined" ? {} : { body: JSON.stringify(options.body) }),
    cache: "no-store",
  });

  const text = await res.text();
  let json: Record<string, unknown> = {};
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      if (!res.ok) {
        throw new PowerTranzApiError(`PowerTranz returned ${res.status} with a non-JSON response.`, res.status, {
          bodyPreview: text.slice(0, 400),
          url,
        });
      }
    }
  }

  if (!res.ok) {
    const errorPayload = json as {
      ResponseMessage?: string;
      responseMessage?: string;
      Errors?: Array<{ Message?: string }>;
      errors?: Array<{ message?: string }>;
      error?: { message?: string };
    };
    const errorMessage =
      errorPayload.ResponseMessage ||
      errorPayload.responseMessage ||
      errorPayload.Errors?.[0]?.Message ||
      errorPayload.errors?.[0]?.message ||
      errorPayload.error?.message ||
      "PowerTranz request failed.";
    throw new PowerTranzApiError(errorMessage, res.status, json);
  }

  return json as T;
}

function toFailure(error: unknown, fallbackContext?: Record<string, unknown>): BillingProviderFailure {
  if (error instanceof PowerTranzApiError) {
    return {
      ok: false,
      code: error.status,
      error: error.message,
      missing: Array.isArray((error.details as { missing?: unknown })?.missing)
        ? (((error.details as { missing?: unknown }).missing as string[]) || [])
        : [],
      ...(fallbackContext ? { context: fallbackContext } : {}),
    };
  }

  return {
    ok: false,
    code: 500,
    error: "PowerTranz request failed.",
    missing: [],
    ...(fallbackContext ? { context: fallbackContext } : {}),
  };
}

export async function createProviderCheckout(
  selection: BillingSelection,
  customerEmail: string,
  options?: { siteUrl?: string }
): Promise<BillingProviderFailure | BillingProviderSuccess> {
  const providerState = buildProviderState();
  if (!providerState.configured) {
    return {
      ok: false,
      code: 503,
      error: "PowerTranz checkout is not configured yet.",
      missing: providerState.missing,
    };
  }

  const siteUrl = String(options?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (!siteUrl) {
    return {
      ok: false,
      code: 503,
      error: "Missing site URL for PowerTranz callback handling.",
      missing: ["NEXT_PUBLIC_SITE_URL"],
    };
  }

  const checkoutId = randomUUID();
  const admin = supabaseAdmin();
  const { transactionIdentifier, orderIdentifier, payload } = buildSalePayload(
    selection,
    customerEmail,
    checkoutId,
    siteUrl
  );

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const baseCheckoutRow = {
    id: checkoutId,
    email: customerEmail,
    selection,
    transaction_identifier: transactionIdentifier,
    order_identifier: orderIdentifier,
    status: "initiated",
    expires_at: expiresAt,
  };

  const { error: insertError } = await admin.from("billing_checkouts").insert({
    ...baseCheckoutRow,
    spi_token: null,
  });
  if (insertError) {
    return {
      ok: false,
      code: 500,
      error: "Unable to prepare the PowerTranz checkout session.",
      missing: [],
    };
  }

  try {
    const response = await powerTranzRequest<PowerTranzFinancialResponse>("/spi/Sale", {
      method: "POST",
      body: payload,
    });

    const redirectData = getResponseString(response, "RedirectData", "redirectData");
    const spiToken = getResponseString(response, "SpiToken", "spiToken");

    if (!redirectData || !spiToken) {
      await admin
        .from("billing_checkouts")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", checkoutId);

      return {
        ok: false,
        code: 502,
        error: "PowerTranz did not return hosted checkout markup.",
        missing: [],
        context: {
          selection,
          customerEmail,
          nextPath: buildBillingCheckoutHref(selection),
        },
      };
    }

    await admin
      .from("billing_checkouts")
      .update({
        spi_token: spiToken,
        ...(getResponseString(response, "TransactionIdentifier", "transactionIdentifier")
          ? {
              powertranz_transaction_id:
                getResponseString(response, "TransactionIdentifier", "transactionIdentifier"),
            }
          : {}),
        ...(getResponseString(response, "PanToken", "panToken")
          ? {
              powertranz_pan_token: getResponseString(response, "PanToken", "panToken"),
            }
          : {}),
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", checkoutId);

    return {
      ok: true,
      mode: "iframe",
      checkoutId,
      redirectDataHtml: redirectData,
    };
  } catch (error) {
    await admin
      .from("billing_checkouts")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", checkoutId);

    return toFailure(error, {
      selection,
      customerEmail,
      nextPath: buildBillingCheckoutHref(selection),
    });
  }
}

export async function createProviderPortal(): Promise<BillingProviderFailure> {
  return {
    ok: false,
    code: 501,
    error: "PowerTranz self-service billing portal is not available in this build.",
    missing: [],
  };
}

export async function getPendingPowerTranzCheckout(checkoutId: string): Promise<PowerTranzCheckoutRow | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("billing_checkouts")
    .select("id,email,selection,spi_token,transaction_identifier,order_identifier,status,expires_at")
    .eq("id", checkoutId)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PowerTranzCheckoutRow;
}

export async function markPowerTranzCheckoutStatus(
  checkoutId: string,
  status: string,
  details?: Partial<{
    powertranz_transaction_id: string | null;
    powertranz_pan_token: string | null;
  }>
) {
  const admin = supabaseAdmin();
  await admin
    .from("billing_checkouts")
    .update({
      status,
      ...(typeof details?.powertranz_transaction_id === "string"
        ? { powertranz_transaction_id: details.powertranz_transaction_id }
        : {}),
      ...(typeof details?.powertranz_pan_token === "string" ? { powertranz_pan_token: details.powertranz_pan_token } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkoutId);
}

export async function completePowerTranzPayment(spiToken: string) {
  return powerTranzRequest<PowerTranzFinancialResponse>("/spi/Payment", {
    method: "POST",
    body: spiToken,
  });
}
