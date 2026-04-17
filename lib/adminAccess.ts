import { supabaseAuth } from "./supabase/auth";

export function readAdminEmails(): string[] {
  return String(process.env.ANALYTICS_ADMIN_EMAILS || process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return false;
  return readAdminEmails().includes(normalized);
}

export async function resolveAdminUserFromRequest(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return { ok: false as const, code: 401, error: "Missing token" };
  }

  const authClient = supabaseAuth();
  const { data: userData, error: userErr } = await authClient.auth.getUser(token);
  if (userErr || !userData?.user) {
    return { ok: false as const, code: 401, error: "Invalid token" };
  }

  const email = userData.user.email || "";
  if (!isAdminEmail(email)) {
    return { ok: false as const, code: 403, error: "Forbidden" };
  }

  return {
    ok: true as const,
    user: userData.user,
    token,
  };
}
