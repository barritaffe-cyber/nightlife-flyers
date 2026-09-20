import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const [finishedPath, backgroundPath, outputPath, rawRegion, mode = "difference"] = process.argv.slice(2);
if (!finishedPath || !backgroundPath || !outputPath || !rawRegion) {
  throw new Error("Usage: node scripts/extract-layer-from-reference.mjs <finished> <background> <output> x,y,width,height");
}

const [left, top, width, height] = rawRegion.split(",").map(Number);
if (![left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
  throw new Error(`Invalid region: ${rawRegion}`);
}

const extract = { left, top, width, height };
const finished = await sharp(finishedPath).extract(extract).ensureAlpha().raw().toBuffer();
const background = await sharp(backgroundPath).extract(extract).ensureAlpha().raw().toBuffer();
const output = Buffer.alloc(finished.length);

for (let index = 0; index < finished.length; index += 4) {
  const difference = Math.max(
    Math.abs(finished[index] - background[index]),
    Math.abs(finished[index + 1] - background[index + 1]),
    Math.abs(finished[index + 2] - background[index + 2]),
  );
  // Suppress compression/noise, retain antialiasing, and reach full opacity
  // quickly enough for solid poster artwork.
  const redDominance = finished[index] - Math.max(finished[index + 1], finished[index + 2]);
  const alpha = mode === "red"
    ? Math.max(0, Math.min(255, Math.round((redDominance - 18) * 7)))
    : mode === "opaque"
      ? 255
      : Math.max(0, Math.min(255, Math.round((difference - 7) * 8.5)));
  output[index] = finished[index];
  output[index + 1] = finished[index + 1];
  output[index + 2] = finished[index + 2];
  output[index + 3] = alpha;
}

await mkdir(dirname(outputPath), { recursive: true });
await sharp(output, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

console.log(`Extracted ${outputPath} from ${rawRegion}`);
