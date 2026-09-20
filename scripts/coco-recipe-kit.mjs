import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { compileCssMaster } from "./lib/coco-css-master-compiler.mjs";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const FORMATS = ["square", "story"];
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function adapterPathFor(id) {
  return resolve(ROOT, "scripts", `build-${id}-master.mjs`);
}

export async function loadRecipeAdapter(id) {
  assert(ID_PATTERN.test(id), "Recipe ID must use lowercase kebab-case.");
  const adapterPath = adapterPathFor(id);
  await access(adapterPath);
  const adapterModule = await import(`${pathToFileURL(adapterPath).href}?audit=${Date.now()}`);
  const adapter = adapterModule.cocoCssMasterAdapter;
  assert(adapter, `${basename(adapterPath)} must export cocoCssMasterAdapter.`);
  assert(adapter.id === id, `Adapter ID ${adapter.id} does not match ${id}.`);
  return { adapter, adapterPath, module: adapterModule };
}

export async function auditRecipe(id, options = {}) {
  const { adapter, adapterPath } = await loadRecipeAdapter(id);
  const errors = [];
  const warnings = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  const warn = (condition, message) => { if (!condition) warnings.push(message); };

  check(adapter.recipe?.id === id, "Recipe and adapter IDs must match.");
  check(Number(adapter.recipe?.version) > 0, "Recipe needs a positive version.");
  check(Boolean(adapter.recipe?.summary), "Recipe needs a summary.");
  check(Boolean(adapter.masterPath), "Adapter needs a masterPath.");
  check(Boolean(adapter.outputPath), "Adapter needs an outputPath.");
  check(Boolean(adapter.publicRoot), "Adapter needs a publicRoot.");
  check(Array.isArray(adapter.requiredRoles) && adapter.requiredRoles.length > 0, "Declare requiredRoles.");
  check(adapter.semanticRoles && typeof adapter.semanticRoles === "object", "Declare semanticRoles.");
  check(adapter.fontMap && typeof adapter.fontMap === "object", "Declare fontMap.");
  check(adapter.eventBrief && typeof adapter.eventBrief === "object", "Declare eventBrief.");

  const requiredRoles = new Set(adapter.requiredRoles || []);
  const mappedRoles = new Map();
  for (const [sourceId, config] of Object.entries(adapter.semanticRoles || {})) {
    const role = config?.semanticRole;
    if (!role) continue;
    if (mappedRoles.has(role)) {
      errors.push(`Semantic role ${role} is mapped by both ${mappedRoles.get(role)} and ${sourceId}.`);
    }
    mappedRoles.set(role, sourceId);
    warn(config.editable !== false, `${sourceId} explicitly disables editing.`);
  }
  for (const role of requiredRoles) {
    check(mappedRoles.has(role), `Required role ${role} has no semantic mapping.`);
  }

  for (const format of FORMATS) {
    const formatDefinition =
      adapter.recipe?.runtime?.formats?.[format] ?? adapter.recipe?.composition?.[format];
    check(Boolean(formatDefinition), `Recipe is missing ${format} format geometry.`);
    const roleIds = new Set((adapter.recipe?.composition?.roles || []).map((role) => role.id));
    for (const role of requiredRoles) {
      warn(roleIds.has(role) || mappedRoles.has(role), `${format} does not document role ${role}.`);
    }
  }

  let master = "";
  try {
    master = await readFile(adapter.masterPath, "utf8");
  } catch {
    errors.push(`Cannot read CSS master: ${adapter.masterPath.pathname || adapter.masterPath}`);
  }
  check(/data-coco-canvas/.test(master), "CSS master needs [data-coco-canvas].");
  check(/format=|URLSearchParams|data-format/.test(master), "CSS master must support Square and Story selection.");
  for (const sourceId of Object.keys(adapter.semanticRoles || {})) {
    check(
      new RegExp(`data-coco-object=["']${sourceId}["']`).test(master),
      `CSS master is missing mapped source object ${sourceId}.`,
    );
  }

  const integrationFiles = [
    ["lib/visualRecipes.ts", "active recipe registry"],
    ["components/coco/artDirections/library.ts", "Coco art-direction library"],
    ["components/coco/artDirections/recipePreviewExports.ts", "preview export registry"],
    ["lib/coco/portableRecipeRuntime.ts", "portable recipe loader"],
  ];
  for (const [relativePath, label] of integrationFiles) {
    const source = await readFile(resolve(ROOT, relativePath), "utf8");
    check(source.includes(id), `Register ${id} in the ${label} (${relativePath}).`);
  }

  let compileResult = null;
  if (errors.length === 0 && options.compile !== false) {
    const tempOutput = pathToFileURL(resolve("/tmp", `coco-${id}-audit-${process.pid}.nflyer`));
    try {
      compileResult = await compileCssMaster(adapter, { outputPath: tempOutput });
      for (const format of FORMATS) {
        const objects = compileResult?.[format]?.cocoCssCompiler?.ir?.objects || [];
        check(objects.length > 0, `${format} compiled no objects.`);
        const compiledRoles = new Set(objects.map((object) => object.semanticRole).filter(Boolean));
        for (const role of requiredRoles) check(compiledRoles.has(role), `${format} is missing compiled role ${role}.`);
        for (const object of objects) {
          if (!object.semanticRole || object.kind !== "text") continue;
          check(object.editable !== false, `${format}/${object.id} is semantic text but not editable.`);
          check(Boolean(object.binding?.text), `${format}/${object.id} has no Coco state-field binding.`);
        }
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return { adapterPath, errors, warnings, compileResult, ok: errors.length === 0 };
}

export async function scaffoldRecipe(id, name) {
  assert(ID_PATTERN.test(id), "Recipe ID must use lowercase kebab-case.");
  const title = String(name || id.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "));
  const recipeFileName = id.replace(/-([a-z0-9])/g, (_, value) => value.toUpperCase());
  const recipePath = resolve(ROOT, "lib", "recipes", `${recipeFileName}.ts`);
  const adapterPath = adapterPathFor(id);
  const masterPath = resolve(ROOT, "public", "generated-flyers", `${id}-reference-master.html`);
  const files = [recipePath, adapterPath, masterPath];
  for (const file of files) {
    try { await access(file); throw new Error(`Refusing to overwrite ${file}`); } catch (error) {
      if (error?.message?.startsWith("Refusing")) throw error;
    }
  }
  await mkdir(resolve(ROOT, "public", "generated-flyers"), { recursive: true });
  await writeFile(recipePath, `import type { VisualRecipe } from "./types.ts";\n\nexport const ${recipeFileName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}_RECIPE = {\n  id: "${id}",\n  name: ${JSON.stringify(title)},\n  version: 1,\n  reference: "${id}-reference-master.html",\n  referenceMode: "visual-inheritance",\n  summary: "TODO: Describe the reusable visual system.",\n  composition: {\n    square: { canvas: { format: "square", safeArea: { x: 4, y: 4, width: 92, height: 92 } }, roles: [] },\n    story: { canvas: { format: "story", safeArea: { x: 4, y: 3, width: 92, height: 94 } }, roles: [] },\n  },\n  requiredElements: [],\n  hierarchy: [],\n  palette: { primary: "#ffffff", secondary: "#000000", accent: "#ff2a8a", neutral: "#ffffff" },\n  typography: { display: "sans-serif", support: "sans-serif" },\n  avoid: [],\n} satisfies VisualRecipe;\n`);
  await writeFile(masterPath, `<!doctype html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>\n*{box-sizing:border-box}body{margin:0;background:#111}.canvas{position:relative;width:1080px;overflow:hidden;background:#050505;color:white}.canvas[data-format="square"]{height:1080px}.canvas[data-format="story"]{height:1920px}\n</style></head><body><main class="canvas" data-coco-canvas data-format="story"></main><script>\nconst format=new URLSearchParams(location.search).get("format")==="square"?"square":"story";document.querySelector("[data-coco-canvas]").dataset.format=format;\n</script></body></html>\n`);
  await writeFile(adapterPath, `import { pathToFileURL } from "node:url";\nimport { compileCssMaster } from "./lib/coco-css-master-compiler.mjs";\nimport { ${recipeFileName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}_RECIPE } from "../lib/recipes/${recipeFileName}.ts";\n\nexport const cocoCssMasterAdapter = {\n  id: "${id}",\n  masterPath: new URL("../public/generated-flyers/${id}-reference-master.html", import.meta.url),\n  outputPath: new URL("../public/generated-flyers/${id}.nflyer", import.meta.url),\n  publicRoot: new URL("../public/", import.meta.url),\n  recipe: ${recipeFileName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}_RECIPE,\n  requiredFonts: [],\n  requiredRoles: [],\n  semanticRoles: {},\n  fontMap: {},\n  eventBrief: { eventName: ${JSON.stringify(title)} },\n};\n\nexport async function build${recipeFileName[0].toUpperCase() + recipeFileName.slice(1)}Master(overrides={}) { return compileCssMaster(cocoCssMasterAdapter, overrides); }\nconst invoked=process.argv[1]?pathToFileURL(process.argv[1]).href:"";\nif(import.meta.url===invoked) await build${recipeFileName[0].toUpperCase() + recipeFileName.slice(1)}Master();\n`);
  return files;
}
