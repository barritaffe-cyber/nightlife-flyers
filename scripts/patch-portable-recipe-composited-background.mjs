import { readFile, writeFile } from "node:fs/promises";

const [projectPath, oldBackgroundUrl, newBackgroundUrl, removedObjectId = "car"] = process.argv.slice(2);
if (!projectPath || !oldBackgroundUrl || !newBackgroundUrl) {
  throw new Error("Usage: node scripts/patch-portable-recipe-composited-background.mjs <project> <old-bg> <new-bg> [removed-object-id]");
}

const project = JSON.parse(await readFile(projectPath, "utf8"));
let backgroundUpdates = 0;
let removedAssets = 0;
let removedObjects = 0;
let existingNewBackgrounds = 0;

function visit(value) {
  if (!value || typeof value !== "object") return;
  for (const key of Object.keys(value)) {
    const child = value[key];
    if (typeof child === "string" && child === oldBackgroundUrl) {
      value[key] = newBackgroundUrl;
      backgroundUpdates += 1;
      continue;
    }
    if (typeof child === "string" && child === newBackgroundUrl) existingNewBackgrounds += 1;
    if (Array.isArray(child) && (key === "emojiList" || key === "portraits")) {
      const retained = child.filter((asset) => asset?.cocoCompiledObjectId !== removedObjectId);
      removedAssets += child.length - retained.length;
      value[key] = retained;
    }
    if (Array.isArray(child) && child.some((asset) => asset?.cocoCompiledObjectId)) {
      const retained = child.filter((asset) => asset?.cocoCompiledObjectId !== removedObjectId);
      removedAssets += child.length - retained.length;
      value[key] = retained;
    }
    if (Array.isArray(child) && key === "objects") {
      const retained = child.filter((object) => object?.id !== removedObjectId);
      removedObjects += child.length - retained.length;
      value[key] = retained;
    }
    if (Array.isArray(child) && key === "layerOrder") {
      value[key] = child.filter((id) => id !== removedObjectId);
    }
    visit(value[key]);
  }
}

visit(project);
if (backgroundUpdates === 0 && existingNewBackgrounds === 0) throw new Error("Neither background URL was found");
await writeFile(projectPath, `${JSON.stringify(project, null, 2)}\n`);
console.log(`Updated ${backgroundUpdates} background references and removed ${removedAssets} asset plus ${removedObjects} compiled ${removedObjectId} entries`);
