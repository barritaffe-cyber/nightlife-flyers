import { readFile, writeFile } from "node:fs/promises";

const [projectPath] = process.argv.slice(2);
if (!projectPath) throw new Error("Usage: node scripts/patch-dodge-native-qr.mjs <project>");

const project = JSON.parse(await readFile(projectPath, "utf8"));
let patched = 0;

function patchState(value, inheritedFormat) {
  if (!value || typeof value !== "object") return;
  const format = value.format === "story" || value.format === "square" ? value.format : inheritedFormat;
  const isDodge =
    value.cocoVisualRecipeId === "dodge-night-rides" ||
    value.cocoCampaignDirectionId === "dodge-night-rides";
  if (isDodge) {
    value.qrEnabled = true;
    value.qrImageUrl = null;
    value.qrScale = format === "story" ? 0.76 : 0.76;
    value.qrX = format === "story" ? 87.1 : 87.1;
    value.qrY = format === "story" ? 86.2 : 86.1;
    patched += 1;
  }
  for (const child of Object.values(value)) patchState(child, format);
}

patchState(project, project.state?.format || "square");
if (patched === 0) throw new Error("No Dodge recipe states were found");
await writeFile(projectPath, `${JSON.stringify(project, null, 2)}\n`);
console.log(`Enabled replaceable native QR in ${patched} Dodge recipe states`);
