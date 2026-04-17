import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getBillingCatalogItem,
  type BillingCycle,
  type BillingPlanId,
  type BillingSelection,
} from "./catalog";

export const FOUNDING_SUBSCRIBER_LIMIT = 50;
export const FOUNDING_DISCOUNT_PERCENT = 20;

export type FoundingOfferSnapshot = {
  totalSlots: number;
  claimedSlots: number;
  reservedSlots: number;
  remainingSlots: number;
  discountPercent: number;
  retainedForEmail: boolean;
};

export type ResolvedBillingAmount = {
  originalPrice: number;
  effectivePrice: number;
  foundingDiscountApplied: boolean;
  foundingDiscountPercent: number;
};

function roundCurrency(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function computeDiscountedPrice(price: number, percent: number) {
  return roundCurrency(price * (1 - percent / 100));
}

export function resolveBillingAmount(
  selection: BillingSelection,
  foundingOffer?: FoundingOfferSnapshot | null
): ResolvedBillingAmount {
  const item = getBillingCatalogItem(selection);
  if (selection.kind !== "plan") {
    return {
      originalPrice: item.price,
      effectivePrice: item.price,
      foundingDiscountApplied: false,
      foundingDiscountPercent: 0,
    };
  }

  const retained = Boolean(foundingOffer?.retainedForEmail);
  const available = Number(foundingOffer?.remainingSlots || 0) > 0;
  const foundingDiscountApplied = retained || available;
  const foundingDiscountPercent = foundingDiscountApplied
    ? foundingOffer?.discountPercent || FOUNDING_DISCOUNT_PERCENT
    : 0;

  return {
    originalPrice: item.price,
    effectivePrice: foundingDiscountApplied
      ? computeDiscountedPrice(item.price, foundingDiscountPercent)
      : item.price,
    foundingDiscountApplied,
    foundingDiscountPercent,
  };
}

export async function getFoundingOfferSnapshot(
  admin: SupabaseClient,
  args: { email?: string | null } = {}
): Promise<FoundingOfferSnapshot> {
  const nowIso = new Date().toISOString();
  const normalizedEmail = String(args.email || "").trim().toLowerCase();

  const [claimedResult, reservedResult, retainedResult] = await Promise.all([
    admin
      .from("profiles")
      .select("email,founding_discount_percent")
      .gt("founding_discount_percent", 0),
    admin
      .from("billing_checkouts")
      .select("id,email")
      .eq("status", "initiated")
      .eq("founding_discount_applied", true)
      .gt("expires_at", nowIso),
    normalizedEmail
      ? admin
          .from("profiles")
          .select("founding_discount_percent")
          .eq("email", normalizedEmail)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (claimedResult.error) {
    throw new Error(`Founding offer claimed-count lookup failed: ${claimedResult.error.message}`);
  }
  if (reservedResult.error) {
    throw new Error(`Founding offer reserved-count lookup failed: ${reservedResult.error.message}`);
  }
  if (retainedResult && "error" in retainedResult && retainedResult.error) {
    throw new Error(`Founding offer retained lookup failed: ${retainedResult.error.message}`);
  }

  const claimedRows = (claimedResult.data || []) as Array<{ email?: string | null }>;
  const claimedEmails = new Set(
    claimedRows.map((row) => String(row.email || "").trim().toLowerCase()).filter(Boolean)
  );
  const claimedSlots = claimedRows.length;
  const reservedRows = (reservedResult.data || []) as Array<{ id?: string | null; email?: string | null }>;
  const reservedSlots = reservedRows.filter(
    (row) => !claimedEmails.has(String(row.email || "").trim().toLowerCase())
  ).length;
  const retainedForEmail =
    Number(
      (retainedResult && "data" in retainedResult && retainedResult.data
        ? (retainedResult.data as { founding_discount_percent?: number | null })
            .founding_discount_percent
        : 0) || 0
    ) > 0;
  const remainingSlots = Math.max(0, FOUNDING_SUBSCRIBER_LIMIT - claimedSlots - reservedSlots);

  return {
    totalSlots: FOUNDING_SUBSCRIBER_LIMIT,
    claimedSlots,
    reservedSlots,
    remainingSlots,
    discountPercent: FOUNDING_DISCOUNT_PERCENT,
    retainedForEmail,
  };
}

export function buildFoundingOfferPlanPreview(
  plan: BillingPlanId,
  billing: BillingCycle,
  foundingOffer?: FoundingOfferSnapshot | null
) {
  const selection: BillingSelection = { kind: "plan", plan, billing };
  const pricing = resolveBillingAmount(selection, foundingOffer);
  return {
    plan,
    billing,
    original_price: pricing.originalPrice,
    effective_price: pricing.effectivePrice,
    founding_discount_applied: pricing.foundingDiscountApplied,
    founding_discount_percent: pricing.foundingDiscountPercent,
  };
}
