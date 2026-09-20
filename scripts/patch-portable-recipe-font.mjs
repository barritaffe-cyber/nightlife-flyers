import { readFile, writeFile } from "node:fs/promises";

const [projectPath, objectId, family, stateField] = process.argv.slice(2);
if (!projectPath || !objectId || !family || !stateField) {
  throw new Error("Usage: node scripts/patch-portable-recipe-font.mjs <project> <object-id> <family> <state-field>");
}

const project = JSON.parse(await readFile(projectPath, "utf8"));
let objectCount = 0;

function visit(value) {
  if (!value || typeof value !== "object") return;
  if (value.id === objectId && value.kind === "text") {
    value.typography = { ...(value.typography || {}), fontFamily: family };
    if (value.binding?.initial) value.binding.initial.family = family;
    for (const run of value.textRuns || []) {
      run.fontFamily = family;
      run.runtimeFontFamily = family;
    }
    objectCount += 1;
  }
  for (const child of Object.values(value)) visit(child);
}

visit(project);

function patchState(value) {
  if (!value || typeof value !== "object") return;
  if (Object.prototype.hasOwnProperty.call(value, stateField)) value[stateField] = family;
  for (const child of Object.values(value)) patchState(child);
}

patchState(project);
if (objectCount === 0) throw new Error(`No compiled ${objectId} objects found`);
await writeFile(projectPath, `${JSON.stringify(project, null, 2)}\n`);
console.log(`Patched ${objectCount} ${objectId} objects and ${stateField} to ${family}`);
