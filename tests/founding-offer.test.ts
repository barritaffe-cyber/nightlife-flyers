import test from "node:test";
import assert from "node:assert/strict";

import {
  computeDiscountedPrice,
  resolveBillingAmount,
} from "../lib/billing/foundingOffer.ts";

test("computeDiscountedPrice applies the founding percentage", () => {
  assert.equal(computeDiscountedPrice(19, 20), 15.2);
  assert.equal(computeDiscountedPrice(390, 20), 312);
});

test("resolveBillingAmount keeps passes at their original price", () => {
  const amount = resolveBillingAmount({ kind: "offer", offer: "night-pass" });
  assert.equal(amount.originalPrice, 12);
  assert.equal(amount.effectivePrice, 12);
  assert.equal(amount.foundingDiscountApplied, false);
});

test("resolveBillingAmount applies the founding offer to subscriptions when a slot is open", () => {
  const amount = resolveBillingAmount(
    { kind: "plan", plan: "creator", billing: "monthly" },
    {
      totalSlots: 50,
      claimedSlots: 10,
      reservedSlots: 2,
      remainingSlots: 38,
      discountPercent: 20,
      retainedForEmail: false,
    }
  );

  assert.equal(amount.originalPrice, 19);
  assert.equal(amount.effectivePrice, 15.2);
  assert.equal(amount.foundingDiscountApplied, true);
  assert.equal(amount.foundingDiscountPercent, 20);
});
