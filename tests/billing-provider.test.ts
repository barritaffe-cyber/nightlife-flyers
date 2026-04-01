import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import {
  extractPaddlePriceIds,
  mapPaddleSubscriptionStatus,
  readPaddleUserEmail,
  resolveSelectionFromPaddleCustomData,
  resolveSelectionFromPaddlePriceIds,
  verifyPaddleWebhookSignature,
} from "../lib/billing/paddle-helpers.ts";

function withEnv<T>(patch: Record<string, string>, fn: () => T): T {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(patch)) {
    previous.set(key, process.env[key]);
    process.env[key] = value;
  }

  try {
    return fn();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value == null) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("resolveSelectionFromPaddleCustomData maps offer and plan selections", () => {
  assert.deepEqual(
    resolveSelectionFromPaddleCustomData({ offer: "night-pass" }),
    { kind: "offer", offer: "night-pass" }
  );

  assert.deepEqual(
    resolveSelectionFromPaddleCustomData({ plan: "studio", billing: "yearly" }),
    { kind: "plan", plan: "studio", billing: "yearly" }
  );
});

test("resolveSelectionFromPaddlePriceIds matches configured Paddle prices", () => {
  withEnv(
    {
      PADDLE_PRICE_CREATOR_MONTHLY: "pri_creator_monthly",
      PADDLE_PRICE_CREATOR_YEARLY: "pri_creator_yearly",
      PADDLE_PRICE_STUDIO_MONTHLY: "pri_studio_monthly",
      PADDLE_PRICE_STUDIO_YEARLY: "pri_studio_yearly",
      PADDLE_PRICE_NIGHT_PASS: "pri_night_pass",
      PADDLE_PRICE_WEEKEND_PASS: "pri_weekend_pass",
    },
    () => {
      assert.deepEqual(resolveSelectionFromPaddlePriceIds(["pri_studio_yearly"]), {
        kind: "plan",
        plan: "studio",
        billing: "yearly",
      });
      assert.deepEqual(resolveSelectionFromPaddlePriceIds(["pri_weekend_pass"]), {
        kind: "offer",
        offer: "weekend-pass",
      });
      assert.equal(resolveSelectionFromPaddlePriceIds(["pri_unknown"]), null);
    }
  );
});

test("extractPaddlePriceIds reads both price_id and nested price.id values", () => {
  assert.deepEqual(
    extractPaddlePriceIds([
      { price_id: "pri_direct" },
      { price: { id: "pri_nested" } },
      { price: { id: "pri_nested" } },
    ]),
    ["pri_direct", "pri_nested"]
  );
});

test("readPaddleUserEmail prefers user_email and normalizes casing", () => {
  assert.equal(readPaddleUserEmail({ user_email: "User@Example.com " }), "user@example.com");
  assert.equal(readPaddleUserEmail({ email: "Alt@Example.com" }), "alt@example.com");
  assert.equal(readPaddleUserEmail(null), null);
});

test("mapPaddleSubscriptionStatus normalizes trialing", () => {
  assert.equal(mapPaddleSubscriptionStatus("trialing"), "trial");
  assert.equal(mapPaddleSubscriptionStatus("active"), "active");
  assert.equal(mapPaddleSubscriptionStatus(""), "inactive");
});

test("verifyPaddleWebhookSignature validates Paddle HMAC signatures", () => {
  withEnv({ PADDLE_WEBHOOK_SECRET: "whsec_test_secret" }, () => {
    const rawBody = JSON.stringify({ event_type: "transaction.completed" });
    const timestamp = "1710000000";
    const expected = crypto
      .createHmac("sha256", process.env.PADDLE_WEBHOOK_SECRET as string)
      .update(`${timestamp}:${rawBody}`, "utf8")
      .digest("hex");
    const header = `ts=${timestamp};h1=${expected}`;

    assert.equal(verifyPaddleWebhookSignature(rawBody, header), true);
    assert.equal(verifyPaddleWebhookSignature(rawBody, `ts=${timestamp};h1=deadbeef`), false);
  });
});
