import type { SupabaseClient } from "@supabase/supabase-js";
import { computeBillingPeriodEnd, getBillingCatalogItem, type BillingSelection } from "./catalog.ts";

export async function applyBillingSelectionToProfile(
  admin: SupabaseClient,
  email: string,
  selection: BillingSelection,
  options?: {
    from?: Date;
    providerTransactionId?: string | null;
    panToken?: string | null;
    orderIdentifier?: string | null;
    foundingDiscountPercent?: number | null;
  }
) {
  const item = getBillingCatalogItem(selection);
  const currentPeriodEnd = computeBillingPeriodEnd(selection, options?.from);

  const { data: user, error: lookupError } = await admin
    .from("profiles")
    .select("id,email,founding_discount_percent")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    throw new Error("User lookup failed.");
  }

  if (!user?.email) {
    throw new Error("User not found. Please log in once to create a profile.");
  }

  if (selection.kind === "offer" && selection.offer === "one-flyer") {
    const paymentId = options?.providerTransactionId || options?.orderIdentifier;
    if (!paymentId) throw new Error("One Flyer requires a verified payment reference.");
    // Separate credits never replace a subscription. Retries grant exactly once.
    const {error} = await admin.from("coco_flyer_credits").upsert(
      {payment_id: paymentId, user_id: user.id}, {onConflict:"payment_id", ignoreDuplicates:true}
    );
    if (error) throw new Error("Could not grant the flyer purchase.");
    return {currentPeriodEnd: null, item};
  }

  const nextFoundingDiscountPercent =
    selection.kind === "plan"
      ? Math.max(
          Number(
            (user as { founding_discount_percent?: number | null }).founding_discount_percent || 0
          ),
          Number(options?.foundingDiscountPercent || 0)
        )
      : Number(
          (user as { founding_discount_percent?: number | null }).founding_discount_percent || 0
        );

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      status: item.status,
      plan: item.plan,
      billing_provider: "powertranz",
      founding_discount_percent: nextFoundingDiscountPercent,
      ...(options?.providerTransactionId ? { powertranz_transaction_id: options.providerTransactionId } : {}),
      ...(options?.panToken ? { powertranz_pan_token: options.panToken } : {}),
      ...(options?.orderIdentifier ? { powertranz_order_id: options.orderIdentifier } : {}),
      current_period_end: currentPeriodEnd,
      generation_used: 0,
      generation_cycle_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("email", email);

  if (updateError) {
    throw new Error("Profile update failed.");
  }

  return { currentPeriodEnd, item };
}

export async function applyDirectBillingUpdate(
  admin: SupabaseClient,
  payload: {
    email: string;
    status: string;
    plan?: string | null;
    current_period_end: string;
    billing_provider?: string | null;
    powertranz_transaction_id?: string | null;
    powertranz_pan_token?: string | null;
    powertranz_order_id?: string | null;
  }
) {
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      status: payload.status,
      current_period_end: payload.current_period_end,
      ...(payload.plan ? { plan: payload.plan } : {}),
      ...(payload.billing_provider ? { billing_provider: payload.billing_provider } : {}),
      ...(payload.powertranz_transaction_id ? { powertranz_transaction_id: payload.powertranz_transaction_id } : {}),
      ...(payload.powertranz_pan_token ? { powertranz_pan_token: payload.powertranz_pan_token } : {}),
      ...(payload.powertranz_order_id ? { powertranz_order_id: payload.powertranz_order_id } : {}),
      generation_used: 0,
      generation_cycle_end: payload.current_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("email", payload.email);

  if (updateError) {
    throw new Error("Profile update failed.");
  }
}
