import { NextResponse } from "next/server";
import { supabaseAuth } from "../../../../lib/supabase/auth";
import { createProviderPortal } from "../../../../lib/billing/provider";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const authClient = supabaseAuth();
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user?.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const result = await createProviderPortal(userData.user.email);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          missing: result.missing,
          context: "billing_portal_not_ready",
        },
        { status: result.code }
      );
    }

    return NextResponse.json({ url: result.url });
  } catch {
    return NextResponse.json({ error: "Billing portal failed." }, { status: 500 });
  }
}
