import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { supabaseAuth } from "../../../../lib/supabase/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const admin = supabaseAdmin();
    const authClient = supabaseAuth();
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const user = userData.user;

    const { error: upsertErr } = await admin.from("profiles").upsert({
      id: user.id,
      email: user.email,
      status: "trial",
    });
    if (upsertErr) {
      return NextResponse.json(
        { error: "Profile upsert failed", detail: upsertErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Profile bootstrap failed" }, { status: 500 });
  }
}
