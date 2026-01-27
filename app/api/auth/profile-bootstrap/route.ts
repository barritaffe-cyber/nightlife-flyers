import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const admin = supabaseAdmin();
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const user = userData.user;

    await admin.from("profiles").upsert({
      id: user.id,
      email: user.email,
      status: "trial",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Profile bootstrap failed" }, { status: 500 });
  }
}
