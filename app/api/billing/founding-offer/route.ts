import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { supabaseAuth } from "../../../../lib/supabase/auth";
import {
  buildFoundingOfferPlanPreview,
  getFoundingOfferSnapshot,
} from "../../../../lib/billing/foundingOffer";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    let email: string | null = null;

    if (token) {
      const authClient = supabaseAuth();
      const { data } = await authClient.auth.getUser(token);
      email = data?.user?.email || null;
    }

    const admin = supabaseAdmin();
    const snapshot = await getFoundingOfferSnapshot(admin, { email });

    return NextResponse.json({
      active: snapshot.remainingSlots > 0,
      retained_for_user: snapshot.retainedForEmail,
      total_slots: snapshot.totalSlots,
      claimed_slots: snapshot.claimedSlots,
      reserved_slots: snapshot.reservedSlots,
      remaining_slots: snapshot.remainingSlots,
      discount_percent: snapshot.discountPercent,
      prices: {
        creator: {
          monthly: buildFoundingOfferPlanPreview("creator", "monthly", snapshot),
          yearly: buildFoundingOfferPlanPreview("creator", "yearly", snapshot),
        },
        studio: {
          monthly: buildFoundingOfferPlanPreview("studio", "monthly", snapshot),
          yearly: buildFoundingOfferPlanPreview("studio", "yearly", snapshot),
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Founding offer lookup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
