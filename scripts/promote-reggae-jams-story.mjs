import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourcePath = resolve(process.argv[2] || "/Users/thepartyrocker/Desktop/reggae.nflyer");
const targetPath = resolve(process.argv[3] || "public/generated-flyers/reggae-jams.nflyer");

const [source, target] = await Promise.all([
  readFile(sourcePath, "utf8").then(JSON.parse),
  readFile(targetPath, "utf8").then(JSON.parse),
]);
const sourceState = source.state;
const targetState = target.state;
const importedStory = sourceState?.session?.story;
const preservedSquare = targetState?.session?.square;
assert(importedStory && preservedSquare, "both projects must contain Square and Story sessions");
assert.equal(importedStory.format, "story");
assert.equal(preservedSquare.format, "square");
assert.equal(importedStory.cocoVisualRecipeId, "reggae-jams");
assert.equal(preservedSquare.cocoVisualRecipeId, "reggae-jams");

const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const squareHash = digest(preservedSquare);
const previousStoryHash = digest(targetState.session.story);
const isFormatMap = (value) =>
  value && typeof value === "object" && !Array.isArray(value) && "square" in value && "story" in value;

// Square remains the selected root state. Replace only Story members in the
// project session and root-level per-format containers.
for (const [key, sourceValue] of Object.entries(sourceState)) {
  if (!isFormatMap(sourceValue)) continue;
  const targetValue = targetState[key];
  targetState[key] = {
    ...(isFormatMap(targetValue) ? targetValue : {}),
    square: structuredClone(isFormatMap(targetValue) ? targetValue.square : preservedSquare[key]),
    story: structuredClone(sourceValue.story),
  };
}
targetState.session = {
  square: preservedSquare,
  story: structuredClone(importedStory),
};
targetState.format = "square";
targetState.sessionDirty = false;
targetState.savedAt = new Date().toISOString();

assert.equal(digest(targetState.session.square), squareHash, "Square session changed");
assert.equal(digest(targetState.session.story), digest(importedStory), "Story import changed");
await writeFile(targetPath, JSON.stringify(target), "utf8");

console.log(JSON.stringify({
  source: sourcePath,
  target: targetPath,
  preservedSquareHash: squareHash,
  previousStoryHash,
  importedStoryHash: digest(importedStory),
}, null, 2));
