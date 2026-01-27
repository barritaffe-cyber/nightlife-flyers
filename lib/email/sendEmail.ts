import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY || "";
const fromEmail = process.env.EMAIL_FROM || "Nightlife Flyers <no-reply@nightlifeflyers.com>";

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  if (!apiKey) {
    console.warn("RESEND_API_KEY missing. Email not sent.", opts.subject);
    return { ok: false };
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  if (error) {
    console.error("Email send failed:", error);
    return { ok: false };
  }
  return { ok: true };
}
