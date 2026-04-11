import { NextResponse } from "next/server";
import { sendEmail } from "../../../lib/email/sendEmail";
import { getPublicSupportEmail } from "../../../lib/publicIdentity";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim();
    const subject = String(body?.subject || "").trim();
    const message = String(body?.message || "").trim();
    const website = String(body?.website || "").trim();

    if (website) {
      return NextResponse.json({ ok: true });
    }

    if (!name || name.length < 2) {
      return NextResponse.json({ ok: false, error: "Enter your name." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
    }

    if (!subject || subject.length < 3) {
      return NextResponse.json({ ok: false, error: "Enter a subject." }, { status: 400 });
    }

    if (!message || message.length < 10) {
      return NextResponse.json({ ok: false, error: "Enter a longer message." }, { status: 400 });
    }

    const supportEmail = getPublicSupportEmail();
    const result = await sendEmail({
      to: supportEmail,
      subject: `[Contact] ${subject}`,
      replyTo: email,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
          <h2 style="margin:0 0 12px">New contact message</h2>
          <p style="margin:0 0 8px"><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p style="margin:0 0 8px"><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p style="margin:0 0 8px"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <div style="margin-top:16px;padding:12px;border:1px solid #ddd;background:#fafafa;white-space:pre-wrap">${escapeHtml(message)}</div>
        </div>
      `,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: "Email delivery is not configured right now." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not send message." }, { status: 500 });
  }
}
