import assert from "node:assert/strict";
import test from "node:test";
import { auditRecipe } from "../scripts/coco-recipe-kit.mjs";

test("recipe kit audits Grey Rave through both rendered formats", async () => {
  const result = await auditRecipe("grey-rave-festival");
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.ok(result.compileResult);
  assert.ok(result.compileResult.square.cocoCssCompiler.ir.objects.length > 0);
  assert.ok(result.compileResult.story.cocoCssCompiler.ir.objects.length > 0);
});
