import test from "node:test";
import assert from "node:assert/strict";

import { isActiveUtil } from "../lib/isActiveUtil.ts";

test("isActiveUtil returns true when target is actively being dragged", () => {
  const active = isActiveUtil("headline", false, null, "headline");
  assert.equal(active, true);
});

test("isActiveUtil returns true in move mode when moveTarget matches", () => {
  const active = isActiveUtil("details", true, "details", null);
  assert.equal(active, true);
});

test("isActiveUtil returns false when neither dragging nor active move target", () => {
  const active = isActiveUtil("venue", true, "headline", null);
  assert.equal(active, false);
});
