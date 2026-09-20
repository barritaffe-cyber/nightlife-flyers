import { scaffoldRecipe, auditRecipe, loadRecipeAdapter } from "./coco-recipe-kit.mjs";
import { compileCssMaster } from "./lib/coco-css-master-compiler.mjs";

const [command, id, ...rest] = process.argv.slice(2);
const option = (name) => { const index = rest.indexOf(name); return index >= 0 ? rest[index + 1] : undefined; };
const usage = `Usage:\n  npm run coco:recipe -- init <recipe-id> [--name "Display Name"]\n  npm run coco:recipe -- audit <recipe-id>\n  npm run coco:recipe -- build <recipe-id>`;
if (!command || !id) throw new Error(usage);

if (command === "init") {
  const files = await scaffoldRecipe(id, option("--name"));
  console.log(`Scaffolded ${id}:\n${files.map((file) => `  ${file}`).join("\n")}\n\nNext: author the CSS master and mappings, then run audit.`);
} else if (command === "audit") {
  const result = await auditRecipe(id);
  for (const warning of result.warnings) console.warn(`warning: ${warning}`);
  if (!result.ok) throw new Error(`Recipe audit failed:\n${result.errors.map((error) => `  - ${error}`).join("\n")}`);
  const counts = ["square", "story"].map((format) => `${format}: ${result.compileResult[format].cocoCssCompiler.ir.objects.length} objects`).join(", ");
  console.log(`Recipe ${id} is ready (${counts}).`);
} else if (command === "build") {
  const audit = await auditRecipe(id);
  if (!audit.ok) throw new Error(`Recipe audit failed:\n${audit.errors.map((error) => `  - ${error}`).join("\n")}`);
  const { adapter } = await loadRecipeAdapter(id);
  await compileCssMaster(adapter);
  console.log(`Built ${id}: ${adapter.outputPath.pathname}`);
} else {
  throw new Error(usage);
}
