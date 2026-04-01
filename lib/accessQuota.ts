import type { SupabaseClient } from "@supabase/supabase-js";

export type AccessStatus = "active" | "ondemand" | "inactive";

export type ProfileQuotaRow = {
  id: string;
  email: string | null;
  status: string | null;
  current_period_end: string | null;
  plan: string | null;
  generation_used: number | null;
  generation_cycle_end: string | null;
};

export type AccessSnapshot = {
  profile: ProfileQuotaRow;
  status: AccessStatus;
  rawStatus: string;
  currentPeriodEnd: string | null;
  generationLimit: number;
  generationUsed: number;
  generationRemaining: number;
};

const PROFILE_QUOTA_FIELDS =
  "id,email,status,current_period_end,plan,generation_used,generation_cycle_end";

const SUBSCRIPTION_STATUSES = new Set(["active", "trial"]);
const ON_DEMAND_LIMITS: Record<string, number> = {
  ondemand: 5,
  on_demand: 5,
  day_pass: 5,
  night_pass: 5,
  export_pass: 5,
  weekend_pass: 18,
};

const SUBSCRIPTION_LIMITS: Record<string, number> = {
  creator: 90,
  studio: 180,
  monthly: 90,
  yearly: 90,
};

function normalizeStatus(raw: string | null | undefined): string {
  return String(raw || "").trim().toLowerCase();
}

function normalizePlan(raw: string | null | undefined): string {
  return String(raw || "").trim().toLowerCase();
}

function normalizeIso(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function isAccessActive(rawStatus: string, currentPeriodEnd: string | null): boolean {
  const iso = normalizeIso(currentPeriodEnd);
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now();
}

function deriveStatus(rawStatus: string, currentPeriodEnd: string | null): AccessStatus {
  const active = isAccessActive(rawStatus, currentPeriodEnd);
  if (!active) return "inactive";
  if (SUBSCRIPTION_STATUSES.has(rawStatus)) return "active";
  if (rawStatus in ON_DEMAND_LIMITS) return "ondemand";
  return "inactive";
}

function deriveGenerationLimit(rawStatus: string, plan: string): number {
  if (rawStatus in ON_DEMAND_LIMITS) return ON_DEMAND_LIMITS[rawStatus];
  if (SUBSCRIPTION_STATUSES.has(rawStatus)) {
    return SUBSCRIPTION_LIMITS[plan] ?? SUBSCRIPTION_LIMITS.monthly;
  }
  return 0;
}

export function buildAccessSnapshot(profile: ProfileQuotaRow): AccessSnapshot {
  const rawStatus = normalizeStatus(profile.status);
  const normalizedPlan = normalizePlan(profile.plan);
  const status = deriveStatus(rawStatus, profile.current_period_end);
  const generationLimit = status === "inactive" ? 0 : deriveGenerationLimit(rawStatus, normalizedPlan);
  const generationUsed = Math.max(0, Number(profile.generation_used || 0));
  const generationRemaining = Math.max(0, generationLimit - generationUsed);

  return {
    profile,
    status,
    rawStatus,
    currentPeriodEnd: normalizeIso(profile.current_period_end),
    generationLimit,
    generationUsed,
    generationRemaining,
  };
}

export async function syncProfileQuotaWindow(
  admin: SupabaseClient,
  profile: ProfileQuotaRow
): Promise<ProfileQuotaRow> {
  const currentPeriodEnd = normalizeIso(profile.current_period_end);
  const cycleEnd = normalizeIso(profile.generation_cycle_end);
  const needsReset =
    Number(profile.generation_used ?? 0) < 0 ||
    cycleEnd !== currentPeriodEnd;

  if (!needsReset) {
    if (profile.generation_used == null) {
      return { ...profile, generation_used: 0 };
    }
    return profile;
  }

  const { data, error } = await admin
    .from("profiles")
    .update({
      generation_used: 0,
      generation_cycle_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id)
    .select(PROFILE_QUOTA_FIELDS)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Failed to sync quota window");
  }

  return data as ProfileQuotaRow;
}

export async function getAccessSnapshotForUser(
  admin: SupabaseClient,
  userId: string
): Promise<AccessSnapshot | null> {
  const { data, error } = await admin
    .from("profiles")
    .select(PROFILE_QUOTA_FIELDS)
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const synced = await syncProfileQuotaWindow(admin, data as ProfileQuotaRow);
  return buildAccessSnapshot(synced);
}

export async function reserveGenerationUnits(
  admin: SupabaseClient,
  userId: string,
  units: number
): Promise<
  | { ok: true; snapshot: AccessSnapshot; previousUsed: number }
  | { ok: false; code: number; message: string; snapshot?: AccessSnapshot }
> {
  if (units <= 0) {
    return { ok: false, code: 400, message: "Invalid generation units requested." };
  }

  let lastSnapshot: AccessSnapshot | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const snapshot = await getAccessSnapshotForUser(admin, userId);
    if (!snapshot) {
      return { ok: false, code: 404, message: "Profile not found." };
    }
    lastSnapshot = snapshot;

    if (snapshot.status === "inactive") {
      return { ok: false, code: 403, message: "Paid access required for AI generation.", snapshot };
    }

    if (snapshot.generationRemaining < units) {
      return {
        ok: false,
        code: 402,
        message: `No generations left. ${snapshot.generationLimit} included for this access window.`,
        snapshot,
      };
    }

    const previousUsed = snapshot.generationUsed;
    const nextUsed = previousUsed + units;
    const { data, error } = await admin
      .from("profiles")
      .update({
        generation_used: nextUsed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .eq("generation_used", previousUsed)
      .select(PROFILE_QUOTA_FIELDS)
      .maybeSingle();

    if (!error && data) {
      return {
        ok: true,
        previousUsed,
        snapshot: buildAccessSnapshot(data as ProfileQuotaRow),
      };
    }
  }

  return {
    ok: false,
    code: 409,
    message: "Could not reserve generation quota. Please retry.",
    ...(lastSnapshot ? { snapshot: lastSnapshot } : {}),
  };
}

export async function refundGenerationUnits(
  admin: SupabaseClient,
  userId: string,
  previousUsed: number
): Promise<void> {
  await admin
    .from("profiles")
    .update({
      generation_used: Math.max(0, previousUsed),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("generation_used", previousUsed + 1)
    .select("id")
    .maybeSingle();
}

export async function refundReservedUnits(
  admin: SupabaseClient,
  userId: string,
  previousUsed: number,
  units: number
): Promise<void> {
  await admin
    .from("profiles")
    .update({
      generation_used: Math.max(0, previousUsed),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("generation_used", previousUsed + units)
    .select("id")
    .maybeSingle();
}
