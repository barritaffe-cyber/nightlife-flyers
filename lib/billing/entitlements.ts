import type { SupabaseClient } from "@supabase/supabase-js";
import { computeBillingPeriodEnd, getBillingCatalogItem, type BillingSelection } from "./catalog";

export async function applyBillingSelectionToProfile(
  admin: SupabaseClient,
  email: string,
  selection: BillingSelection,
  options?: {
    from?: Date;
    paddleCustomerId?: string | null;
    paddleSubscriptionId?: string | null;
  }
) {
  const item = getBillingCatalogItem(selection);
  const currentPeriodEnd = computeBillingPeriodEnd(selection, options?.from);

  const { data: user, error: lookupError } = await admin
    .from("profiles")
    .select("id,email")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    throw new Error("User lookup failed.");
  }

  if (!user?.email) {
    throw new Error("User not found. Please log in once to create a profile.");
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      status: item.status,
      plan: item.plan,
      billing_provider: "paddle",
      ...(options?.paddleCustomerId ? { paddle_customer_id: options.paddleCustomerId } : {}),
      ...(options?.paddleSubscriptionId ? { paddle_subscription_id: options.paddleSubscriptionId } : {}),
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
    paddle_customer_id?: string | null;
    paddle_subscription_id?: string | null;
  }
) {
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      status: payload.status,
      current_period_end: payload.current_period_end,
      ...(payload.plan ? { plan: payload.plan } : {}),
      ...(payload.billing_provider ? { billing_provider: payload.billing_provider } : {}),
      ...(payload.paddle_customer_id ? { paddle_customer_id: payload.paddle_customer_id } : {}),
      ...(payload.paddle_subscription_id ? { paddle_subscription_id: payload.paddle_subscription_id } : {}),
      generation_used: 0,
      generation_cycle_end: payload.current_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("email", payload.email);

  if (updateError) {
    throw new Error("Profile update failed.");
  }
}
