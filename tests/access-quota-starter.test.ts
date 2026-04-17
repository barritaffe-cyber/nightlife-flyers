import test from "node:test";
import assert from "node:assert/strict";

import {
  STARTER_TRIAL_CLEAN_EXPORT_LIMIT,
  STARTER_TRIAL_GENERATION_LIMIT,
  STARTER_TRIAL_UPLOAD_LIMIT,
  buildAccessSnapshot,
} from "../lib/accessQuota.ts";

test("buildAccessSnapshot exposes starter trial quotas for free profiles", () => {
  const snapshot = buildAccessSnapshot({
    id: "user_1",
    email: "starter@example.com",
    status: "trial",
    current_period_end: null,
    plan: "monthly",
    founding_discount_percent: 0,
    generation_used: 0,
    generation_cycle_end: null,
    starter_generations_used: 1,
    starter_uploads_used: 0,
    starter_clean_exports_used: 0,
  });

  assert.equal(snapshot.status, "starter");
  assert.equal(snapshot.generationLimit, STARTER_TRIAL_GENERATION_LIMIT);
  assert.equal(snapshot.generationUsed, 1);
  assert.equal(
    snapshot.generationRemaining,
    STARTER_TRIAL_GENERATION_LIMIT - 1
  );
  assert.equal(snapshot.generationUsageBucket, "starter");
  assert.equal(snapshot.starterUploadLimit, STARTER_TRIAL_UPLOAD_LIMIT);
  assert.equal(snapshot.starterUploadRemaining, STARTER_TRIAL_UPLOAD_LIMIT);
  assert.equal(
    snapshot.starterCleanExportRemaining,
    STARTER_TRIAL_CLEAN_EXPORT_LIMIT
  );
});

test("buildAccessSnapshot keeps paid subscriptions on the standard quota bucket", () => {
  const snapshot = buildAccessSnapshot({
    id: "user_2",
    email: "paid@example.com",
    status: "active",
    current_period_end: new Date(Date.now() + 86_400_000).toISOString(),
    plan: "creator",
    founding_discount_percent: 20,
    generation_used: 12,
    generation_cycle_end: new Date(Date.now() + 86_400_000).toISOString(),
    starter_generations_used: 2,
    starter_uploads_used: 1,
    starter_clean_exports_used: 1,
  });

  assert.equal(snapshot.status, "active");
  assert.equal(snapshot.generationUsageBucket, "standard");
  assert.equal(snapshot.generationLimit, 90);
  assert.equal(snapshot.generationUsed, 12);
  assert.equal(snapshot.foundingDiscountPercent, 20);
});
