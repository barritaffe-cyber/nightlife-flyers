import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { supabaseAuth } from "../../../../lib/supabase/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const { deviceId, deviceType, replace } = (await req.json()) as {
      deviceId?: string;
      deviceType?: "pc" | "mobile";
      replace?: boolean;
    };

    if (!deviceId || !deviceType) {
      return NextResponse.json({ error: "Missing deviceId or deviceType" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const auth = supabaseAuth();
    const { data: userData, error: userErr } = await auth.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const userId = userData.user.id;

    const { data: existing, error: fetchErr } = await admin
      .from("devices")
      .select("*")
      .eq("user_id", userId)
      .eq("device_type", deviceType)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: "Device lookup failed" }, { status: 500 });
    }

    if (!existing) {
      await admin.from("devices").insert({
        user_id: userId,
        device_id: deviceId,
        device_type: deviceType,
        last_seen_at: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, status: "registered" });
    }

    if (existing.device_id === deviceId) {
      await admin
        .from("devices")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", existing.id);
      return NextResponse.json({ ok: true, status: "ok" });
    }

    if (!replace) {
      return NextResponse.json(
        { ok: false, status: "replace_required" },
        { status: 409 }
      );
    }

    await admin
      .from("devices")
      .update({ device_id: deviceId, last_seen_at: new Date().toISOString() })
      .eq("id", existing.id);

    return NextResponse.json({ ok: true, status: "replaced" });
  } catch {
    return NextResponse.json({ error: "Device check failed" }, { status: 500 });
  }
}
