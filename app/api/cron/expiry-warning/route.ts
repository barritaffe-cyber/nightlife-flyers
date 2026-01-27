import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin.ts";
import { sendEmail } from "../../../../lib/email/sendEmail.ts";

export const runtime = "nodejs";

export async function GET() {
  try {
    const admin = supabaseAdmin();
    const target = new Date();
    target.setDate(target.getDate() + 3);
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id,email,current_period_end")
      .eq("status", "active")
      .gte("current_period_end", start.toISOString())
      .lte("current_period_end", end.toISOString());

    if (error) {
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    const sent: string[] = [];
    for (const p of profiles || []) {
      if (!p.email) continue;
      const dateStr = new Date(p.current_period_end).toDateString();
      await sendEmail({
        to: p.email,
        subject: "Your Nightlife Flyers access expires soon",
        html: `<p>Your subscription expires on <b>${dateStr}</b>.</p><p>Please renew to keep access.</p>`,
      });
      sent.push(p.email);
    }

    return NextResponse.json({ ok: true, sent });
  } catch {
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
