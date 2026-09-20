import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateCopyCapacity,
  type CopyCapacityStyle,
} from "../components/coco/typographyStack/calculateCopyCapacity.ts";

const style: CopyCapacityStyle = {
  fontFamily: "Test Sans",
  fontWeight: 700,
  lineHeight: 1,
};
const measure = (text: string, size: number) => ({
  width: text.length * size * 0.55,
});

test("copy capacity selects the largest fitting size and reports breathing room", () => {
  const capacity = calculateCopyCapacity({
    role: "headline",
    text: "SUPER SATURDAY",
    zone: { width: 300, height: 150 },
    style,
    measure,
  });

  assert.equal(capacity.fits, true);
  assert.ok(capacity.fontSize >= 28);
  assert.ok(capacity.lineCount <= 3);
  assert.ok(capacity.occupancy > 0 && capacity.occupancy <= 1);
  assert.ok(capacity.breathingRoom >= 0 && capacity.breathingRoom <= 1);
});

test("copy capacity rejects copy that cannot meet its readable minimum", () => {
  const capacity = calculateCopyCapacity({
    role: "headline",
    text: "AN EXTREMELY LONG HEADLINE THAT CANNOT FIT",
    zone: { width: 70, height: 40 },
    style,
    measure,
  });

  assert.equal(capacity.fits, false);
  assert.ok(
    capacity.reason === "too-many-lines" ||
      capacity.reason === "below-minimum-size"
  );
});

test("explicit line breaks are preserved during capacity calculation", () => {
  const capacity = calculateCopyCapacity({
    role: "date",
    text: "FRIDAY\nJULY 24",
    zone: { width: 160, height: 100 },
    style,
    measure,
  });

  assert.equal(capacity.fits, true);
  assert.equal(capacity.lineCount, 2);
  assert.deepEqual(capacity.lines.map((line) => line.trim()), ["FRIDAY", "JULY 24"]);
});
