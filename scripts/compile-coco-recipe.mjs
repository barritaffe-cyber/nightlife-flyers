import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { compileCssRecipeAdapter } from "./lib/coco-css-recipe-compiler.mjs";
import { compileCssMaster } from "./lib/coco-css-master-compiler.mjs";

function readArgs(argv) {
  const options = {};
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      positional.push(value);
      continue;
    }
    const [rawKey, inlineValue] = value.slice(2).split("=", 2);
    const nextValue = inlineValue ?? argv[index + 1];
    if (!nextValue || (inlineValue === undefined && nextValue.startsWith("--"))) {
      throw new Error(`Missing value for --${rawKey}`);
    }
    options[rawKey] = nextValue;
    if (inlineValue === undefined) index += 1;
  }
  return { options, positional };
}

const usage = `Usage:
  npm run coco:compile-recipe -- <recipe-id>
  npm run coco:compile-recipe -- --adapter <adapter.mjs> [--master <master.html>] [--output <project.nflyer>]

An adapter exports cocoCssMasterAdapter (rendered Chromium CSS) or
cocoCssRecipeAdapter (legacy embedded geometry). Recipe IDs resolve by convention to
scripts/build-<recipe-id>-master.mjs, so new recipes do not require changes to
the shared compiler or this CLI.`;

const { options, positional } = readArgs(process.argv.slice(2));
const recipeId = String(positional[0] ?? "").trim();
const adapterPath = options.adapter
  ? resolve(options.adapter)
  : recipeId
    ? resolve(new URL(`./build-${recipeId}-master.mjs`, import.meta.url).pathname)
    : "";

if (!adapterPath) throw new Error(usage);

try {
  await access(adapterPath);
} catch {
  throw new Error(`No CSS recipe adapter found at ${adapterPath}\n\n${usage}`);
}

const adapterModule = await import(pathToFileURL(adapterPath).href);
const renderedAdapter = adapterModule.cocoCssMasterAdapter;
const legacyAdapter = adapterModule.cocoCssRecipeAdapter || (!renderedAdapter ? adapterModule.default : undefined);
const adapter = renderedAdapter || legacyAdapter;
if (!adapter) throw new Error(`${adapterPath} must export cocoCssMasterAdapter, cocoCssRecipeAdapter, or a default legacy adapter`);
if (recipeId && adapter.id !== recipeId) {
  throw new Error(`Adapter ID ${adapter.id} does not match requested recipe ID ${recipeId}`);
}

const overrides = {};
if (options.master) overrides.masterPath = pathToFileURL(resolve(options.master));
if (options.output) overrides.outputPath = pathToFileURL(resolve(options.output));

if (renderedAdapter) await compileCssMaster(renderedAdapter, overrides);
else await compileCssRecipeAdapter(legacyAdapter, overrides);
const output = overrides.outputPath || adapter.outputPath;
const master = overrides.masterPath || adapter.masterPath;
console.log(`Compiled ${output.pathname || output} from ${master.pathname || master} using adapter ${adapter.id}`);
