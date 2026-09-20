import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (relativePath: string) =>
  JSON.parse(await readFile(new URL(relativePath, import.meta.url), "utf8"));

test("Black Gold Party master preserves the approved Square and Story refinements", async () => {
  const [project, refinements] = await Promise.all([
    readJson("../public/generated-flyers/black-gold-party.nflyer"),
    readJson("../public/generated-flyers/black-gold-party-refinements.json"),
  ]);

  assert.equal(refinements.schemaVersion, 1);
  assert.equal(refinements.recipeId, "black-gold-party");
  assert.match(refinements.sourceProjectSha256, /^[a-f\d]{64}$/);

  for (const format of ["square", "story"] as const) {
    const session = project.state.session[format];
    const approved = refinements.formats[format];
    assert.equal(session.format, format);
    assert.equal(session.cocoVisualRecipeId, "black-gold-party");
    assert.equal(session.cocoVisualRecipeVersion, refinements.recipeVersion);
    assert.equal(session.cocoCssCompiler.sourceHash, refinements.sourceHash);

    for (const [field, value] of Object.entries(approved.fields)) {
      assert.deepEqual(session[field], value, `${format} did not preserve ${field}`);
    }

    const assets = session.emojiList;
    assert.equal(assets.length, format === "square" ? 20 : 21);
    assert.equal(
      assets.find((asset: { cocoCompiledObjectId?: string }) => asset.cocoCompiledObjectId === "background")?.locked,
      true,
    );
    assert.equal(
      assets.some((asset: { cocoCompiledObjectId?: string }) => asset.cocoCompiledObjectId === "brand-two"),
      false,
    );
    assert.equal(
      assets.filter((asset: { id: string }) => asset.id.startsWith("sticker_")).length,
      3,
    );
    assert.deepEqual(approved.assets.removeCompiledObjectIds, ["brand-two"]);
    assert.equal(session.cocoCompositionSystem.compiledObjectOverrides["brand-two"].removed, true);
  }

  assert.equal(project.state.session.square.headManualPx, 90);
  assert.equal(project.state.session.story.headManualPx, 102);
  assert.equal(project.state.session.story.djLineupLabel, "MUSIC BY");
  assert.equal(project.state.session.story.subtag, "soire");
});
