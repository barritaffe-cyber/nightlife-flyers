import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { compileCssRecipeAdapter } from "./lib/coco-css-recipe-compiler.mjs";

const recipeId = String(process.argv[2] || "").trim();
if (!recipeId) {
  throw new Error("Usage: node scripts/promote-coco-recipe-refinements.mjs <recipe-id> [approved-project.nflyer]");
}

const adapterPath = resolve(new URL(`./build-${recipeId}-master.mjs`, import.meta.url).pathname);
const adapterModule = await import(pathToFileURL(adapterPath).href);
const adapter = adapterModule.cocoCssRecipeAdapter || adapterModule.default;
if (!adapter || adapter.id !== recipeId) throw new Error(`No adapter found for ${recipeId}`);
if (!adapter.refinementPath) throw new Error(`${recipeId} adapter has no refinementPath`);

const approvedProjectPath = process.argv[3] ? resolve(process.argv[3]) : adapter.outputPath;
const temporaryDirectory = await mkdtemp(join(tmpdir(), `coco-${recipeId}-baseline-`));
const baselinePath = join(temporaryDirectory, `${recipeId}.nflyer`);
await compileCssRecipeAdapter(adapter, { outputPath: baselinePath, formatRefinements: {} });

const approvedProject = JSON.parse(await readFile(approvedProjectPath, "utf8"));
const baselineProject = JSON.parse(await readFile(baselinePath, "utf8"));
const approvedSessions = approvedProject.state?.session;
const baselineSessions = baselineProject.state?.session;
if (!approvedSessions?.square || !approvedSessions?.story) {
  throw new Error(`${approvedProjectPath} has no Square and Story sessions`);
}

const excludedFields = new Set([
  "savedAt",
  "session",
  "cocoLayoutSessions",
  "format",
  "cocoVisualRecipeId",
  "cocoVisualRecipeVersion",
  "cocoVisualRecipeMaterializedVersion",
]);
const formats = {};
for (const format of ["square", "story"]) {
  const baseline = baselineSessions[format];
  const approved = approvedSessions[format];
  const refinement = {};
  for (const key of Object.keys(baseline)) {
    if (excludedFields.has(key) || !(key in approved)) continue;
    if (JSON.stringify(baseline[key]) !== JSON.stringify(approved[key])) refinement[key] = approved[key];
  }
  formats[format] = refinement;
}

const document = {
  schemaVersion: 1,
  recipeId: adapter.id,
  recipeVersion: adapter.recipe.version,
  sourceProject: String(approvedProjectPath.pathname || approvedProjectPath),
  formats,
};
await writeFile(adapter.refinementPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
console.log(`Promoted ${recipeId} refinements to ${adapter.refinementPath.pathname || adapter.refinementPath}`);
