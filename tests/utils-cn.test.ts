import test from "node:test";
import assert from "node:assert/strict";

import { cn } from "../lib/utils.ts";

test("cn merges conflicting tailwind classes with last class winning", () => {
  const out = cn("p-2 text-sm", "p-4");
  assert.equal(out, "text-sm p-4");
});

test("cn drops falsy values and keeps valid classes", () => {
  const out = cn("font-bold", false && "hidden", null, undefined, "tracking-wide");
  assert.equal(out, "font-bold tracking-wide");
});
