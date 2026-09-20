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
const importedSquare = sourceState?.session?.square;
const preservedStory = targetState?.session?.story;
assert(importedSquare && preservedStory, "both projects must contain Square and Story sessions");
assert.equal(importedSquare.format, "square");
assert.equal(preservedStory.format, "story");
assert.equal(importedSquare.cocoVisualRecipeId, "reggae-jams");
assert.equal(preservedStory.cocoVisualRecipeId, "reggae-jams");

const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const storyHash = digest(preservedStory);
const previousSquareHash = digest(targetState.session.square);

const isFormatMap = (value) =>
  value && typeof value === "object" && !Array.isArray(value) && "square" in value && "story" in value;
const neutralStoryValue = (value, key) => {
  if (key in preservedStory) return preservedStory[key];
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") return {};
  return value;
};

// The root mirrors the currently selected Square session. Keep existing global
// containers, then replace only Square values inside per-format maps.
const priorRoot = structuredClone(targetState);
Object.assign(targetState, structuredClone(importedSquare));
for (const [key, sourceValue] of Object.entries(sourceState)) {
  if (!isFormatMap(sourceValue)) continue;
  const priorValue = priorRoot[key];
  const storyValue = isFormatMap(priorValue)
    ? priorValue.story
    : neutralStoryValue(sourceValue.story, key);
  targetState[key] = {
    ...(isFormatMap(priorValue) ? priorValue : {}),
    square: structuredClone(sourceValue.square),
    story: structuredClone(storyValue),
  };
}
targetState.format = "square";
targetState.session = {
  square: structuredClone(importedSquare),
  story: preservedStory,
};
targetState.sessionDirty = false;
targetState.savedAt = new Date().toISOString();

assert.equal(digest(targetState.session.square), digest(importedSquare), "Square import changed");
assert.equal(digest(targetState.session.story), storyHash, "Story session changed");
await writeFile(targetPath, JSON.stringify(target), "utf8");

console.log(JSON.stringify({
  source: sourcePath,
  target: targetPath,
  previousSquareHash,
  importedSquareHash: digest(importedSquare),
  preservedStoryHash: storyHash,
}, null, 2));
