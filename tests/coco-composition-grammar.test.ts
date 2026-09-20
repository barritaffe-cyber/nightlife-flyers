import test from "node:test";
import assert from "node:assert/strict";

import { evaluateCompositionGrammar } from "../components/coco/compositionDirector/evaluateCompositionGrammar.ts";

test("composition grammar recognizes a centered symmetrical flyer system", () => {
  const result = evaluateCompositionGrammar([
    { role: "presenter", rect: { x: 35, y: 6, width: 30, height: 7 } },
    { role: "date", rect: { x: 8, y: 30, width: 20, height: 10 } },
    { role: "price", rect: { x: 72, y: 30, width: 20, height: 10 } },
    { role: "accent", rect: { x: 32, y: 51, width: 36, height: 8 } },
    { role: "headline", rect: { x: 20, y: 60, width: 60, height: 22 } },
    { role: "venue", rect: { x: 25, y: 88, width: 50, height: 7 } },
    { role: "compliance", rect: { x: 78, y: 88, width: 12, height: 7 } },
  ]);

  assert.equal(result.grammarId, "centered-symmetrical");
  assert.ok(result.symmetryScore > 15);
  assert.ok(result.lockupScore > 0);
  assert.ok(result.rhythmScore > 0);
});

test("composition grammar penalizes scattered guide systems", () => {
  const coherent = evaluateCompositionGrammar([
    { role: "headline", rect: { x: 8, y: 52, width: 46, height: 22 } },
    { role: "accent", rect: { x: 8, y: 43, width: 34, height: 7 } },
    { role: "details", rect: { x: 8, y: 24, width: 28, height: 16 } },
    { role: "presenter", rect: { x: 8, y: 12, width: 28, height: 7 } },
    { role: "venue", rect: { x: 8, y: 88, width: 48, height: 7 } },
  ]);
  const scattered = evaluateCompositionGrammar([
    { role: "headline", rect: { x: 8, y: 52, width: 46, height: 22 } },
    { role: "accent", rect: { x: 61, y: 8, width: 31, height: 7 } },
    { role: "details", rect: { x: 67, y: 31, width: 25, height: 16 } },
    { role: "presenter", rect: { x: 29, y: 17, width: 31, height: 7 } },
    { role: "venue", rect: { x: 38, y: 82, width: 47, height: 7 } },
  ]);

  assert.ok(coherent.score > scattered.score);
  assert.ok(coherent.lockupScore > scattered.lockupScore);
  assert.ok(coherent.guidePenalty <= scattered.guidePenalty);
});
