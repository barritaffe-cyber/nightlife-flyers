import type { SupabaseClient } from "@supabase/supabase-js";

export type AccessStatus = "active" | "ondemand" | "starter" | "inactive";
export type GenerationUsageBucket = "standard" | "starter";
export type StarterBenefitKind = "upload" | "clean_export";

export type ProfileQuotaRow = {
  id: string;
  email: string | null;
  status: string | null;
  current_period_end: string | null;
  plan: string | null;
  founding_discount_percent: number | null;
  generation_used: number | null;
  generation_cycle_end: string | null;
  starter_generations_used: number | null;
  starter_uploads_used: number | null;
  starter_clean_exports_used: number | null;
};

export type AccessSnapshot = {
  profile: ProfileQuotaRow;
  status: AccessStatus;
  rawStatus: string;
  currentPeriodEnd: string | null;
  generationLimit: number;
  generationUsed: number;
  generationRemaining: number;
  generationUsageBucket: GenerationUsageBucket;
  starterUploadLimit: number;
  starterUploadUsed: number;
  starterUploadRemaining: number;
  starterCleanExportLimit: number;
  starterCleanExportUsed: number;
  starterCleanExportRemaining: number;
  foundingDiscountPercent: number;
};

const PROFILE_QUOTA_FIELDS =
  "id,email,status,current_period_end,plan,founding_discount_percent,generation_used,generation_cycle_end,starter_generations_used,starter_uploads_used,starter_clean_exports_used";

export const STARTER_TRIAL_GENERATION_LIMIT = 3;
export const STARTER_TRIAL_UPLOAD_LIMIT = 1;
export const STARTER_TRIAL_CLEAN_EXPORT_LIMIT = 1;

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

const STARTER_BENEFIT_COLUMNS: Record<StarterBenefitKind, keyof Pick<
  ProfileQuotaRow,
  "starter_uploads_used" | "starter_clean_exports_used"
>> = {
  upload: "starter_uploads_used",
  clean_export: "starter_clean_exports_used",
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
  if (active && SUBSCRIPTION_STATUSES.has(rawStatus)) return "active";
  if (active && rawStatus in ON_DEMAND_LIMITS) return "ondemand";
  return "starter";
}

function deriveGenerationLimit(rawStatus: string, plan: string): number {
  if (rawStatus in ON_DEMAND_LIMITS) return ON_DEMAND_LIMITS[rawStatus];
  if (SUBSCRIPTION_STATUSES.has(rawStatus)) {
    return SUBSCRIPTION_LIMITS[plan] ?? SUBSCRIPTION_LIMITS.monthly;
  }
  return STARTER_TRIAL_GENERATION_LIMIT;
}

function getGenerationUsageBucket(status: AccessStatus): GenerationUsageBucket {
  return status === "starter" ? "starter" : "standard";
}

function getGenerationUsageColumn(bucket: GenerationUsageBucket) {
  return bucket === "starter" ? "starter_generations_used" : "generation_used";
}

export function buildAccessSnapshot(profile: ProfileQuotaRow): AccessSnapshot {
  const rawStatus = normalizeStatus(profile.status);
  const normalizedPlan = normalizePlan(profile.plan);
  const status = deriveStatus(rawStatus, profile.current_period_end);
  const generationUsageBucket = getGenerationUsageBucket(status);
  const generationLimit =
    status === "inactive"
      ? 0
      : status === "starter"
        ? STARTER_TRIAL_GENERATION_LIMIT
        : deriveGenerationLimit(rawStatus, normalizedPlan);
  const generationUsed = Math.max(
    0,
    Number(
      generationUsageBucket === "starter"
        ? profile.starter_generations_used || 0
        : profile.generation_used || 0
    )
  );
  const generationRemaining = Math.max(0, generationLimit - generationUsed);
  const starterUploadUsed = Math.max(0, Number(profile.starter_uploads_used || 0));
  const starterCleanExportUsed = Math.max(0, Number(profile.starter_clean_exports_used || 0));

  return {
    profile,
    status,
    rawStatus,
    currentPeriodEnd: normalizeIso(profile.current_period_end),
    generationLimit,
    generationUsed,
    generationRemaining,
    generationUsageBucket,
    starterUploadLimit: STARTER_TRIAL_UPLOAD_LIMIT,
    starterUploadUsed,
    starterUploadRemaining: Math.max(0, STARTER_TRIAL_UPLOAD_LIMIT - starterUploadUsed),
    starterCleanExportLimit: STARTER_TRIAL_CLEAN_EXPORT_LIMIT,
    starterCleanExportUsed,
    starterCleanExportRemaining: Math.max(
      0,
      STARTER_TRIAL_CLEAN_EXPORT_LIMIT - starterCleanExportUsed
    ),
    foundingDiscountPercent: Math.max(0, Number(profile.founding_discount_percent || 0)),
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
  | { ok: true; snapshot: AccessSnapshot; previousUsed: number; usageBucket: GenerationUsageBucket }
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
    const usageColumn = getGenerationUsageColumn(snapshot.generationUsageBucket);
    const { data, error } = await admin
      .from("profiles")
      .update({
        [usageColumn]: nextUsed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .eq(usageColumn, previousUsed)
      .select(PROFILE_QUOTA_FIELDS)
      .maybeSingle();

    if (!error && data) {
      return {
        ok: true,
        previousUsed,
        usageBucket: snapshot.generationUsageBucket,
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
  previousUsed: number,
  usageBucket: GenerationUsageBucket = "standard"
): Promise<void> {
  const usageColumn = getGenerationUsageColumn(usageBucket);
  await admin
    .from("profiles")
    .update({
      [usageColumn]: Math.max(0, previousUsed),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq(usageColumn, previousUsed + 1)
    .select("id")
    .maybeSingle();
}

export async function refundReservedUnits(
  admin: SupabaseClient,
  userId: string,
  previousUsed: number,
  units: number,
  usageBucket: GenerationUsageBucket = "standard"
): Promise<void> {
  const usageColumn = getGenerationUsageColumn(usageBucket);
  await admin
    .from("profiles")
    .update({
      [usageColumn]: Math.max(0, previousUsed),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq(usageColumn, previousUsed + units)
    .select("id")
    .maybeSingle();
}

export async function consumeStarterBenefit(
  admin: SupabaseClient,
  userId: string,
  kind: StarterBenefitKind
): Promise<
  | { ok: true; snapshot: AccessSnapshot }
  | { ok: false; code: number; message: string; snapshot?: AccessSnapshot }
> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const snapshot = await getAccessSnapshotForUser(admin, userId);
    if (!snapshot) {
      return { ok: false, code: 404, message: "Profile not found." };
    }

    if (snapshot.status !== "starter") {
      return {
        ok: false,
        code: 403,
        message: "Starter trial only applies to free accounts.",
        snapshot,
      };
    }

    const remaining =
      kind === "upload"
        ? snapshot.starterUploadRemaining
        : snapshot.starterCleanExportRemaining;
    if (remaining <= 0) {
      return {
        ok: false,
        code: 402,
        message:
          kind === "upload"
            ? "Starter upload already used."
            : "Starter clean export already used.",
        snapshot,
      };
    }

    const column = STARTER_BENEFIT_COLUMNS[kind];
    const previousUsed = Math.max(0, Number(snapshot.profile[column] || 0));
    const nextUsed = previousUsed + 1;
    const { data, error } = await admin
      .from("profiles")
      .update({
        [column]: nextUsed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .eq(column, previousUsed)
      .select(PROFILE_QUOTA_FIELDS)
      .maybeSingle();

    if (!error && data) {
      return {
        ok: true,
        snapshot: buildAccessSnapshot(data as ProfileQuotaRow),
      };
    }
  }

  return {
    ok: false,
    code: 409,
    message: `Could not reserve starter ${kind === "upload" ? "upload" : "clean export"}. Please retry.`,
  };
}
