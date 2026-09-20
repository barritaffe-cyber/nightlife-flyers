import path from "node:path";
import sharp from "sharp";

import type { VisualReferenceCandidate } from "../../components/coco/referenceLayouts/visualReferenceSearch.ts";

function publicAssetPath(imageUrl: string) {
  const clean = imageUrl.split(/[?#]/)[0];
  const relative = clean.slice("/samples/optimized/".length);
  if (!clean.startsWith("/samples/optimized/") || !relative || relative.includes("/") || relative.includes("\\")) {
    throw new Error(`Visual reference must come from /samples/optimized: ${imageUrl}`);
  }
  return path.join(process.cwd(), "public/samples/optimized", relative);
}

function labelSvg(id: string, width: number, height: number) {
  const escaped = id.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]!);
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="100%" height="100%" fill="#07070b"/>` +
      `<text x="12" y="25" fill="#fff" font-family="Arial,sans-serif" font-size="17" font-weight="700">${escaped}</text>` +
    `</svg>`
  );
}

export async function buildVisualReferenceContactSheet(
  references: readonly VisualReferenceCandidate[],
  options: { columns?: number; tileSize?: number } = {}
) {
  if (!references.length) throw new Error("Cannot build an empty visual reference contact sheet.");
  const columns = Math.max(1, Math.min(references.length, options.columns ?? 6));
  const tileSize = Math.max(120, options.tileSize ?? 220);
  const labelHeight = 36;
  const gap = 8;
  const rows = Math.ceil(references.length / columns);
  const width = columns * tileSize + (columns - 1) * gap;
  const height = rows * (tileSize + labelHeight) + (rows - 1) * gap;
  const composites: sharp.OverlayOptions[] = [];

  await Promise.all(references.map(async (reference, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const left = column * (tileSize + gap);
    const top = row * (tileSize + labelHeight + gap);
    const flyer = await sharp(publicAssetPath(reference.imageUrl))
      .resize(tileSize, tileSize, { fit: "cover", position: "centre" })
      .toBuffer();
    composites.push({ input: flyer, left, top });
    composites.push({ input: labelSvg(reference.id, tileSize, labelHeight), left, top: top + tileSize });
  }));

  const buffer = await sharp({
    create: { width, height, channels: 3, background: "#12121a" },
  }).composite(composites).jpeg({ quality: 86 }).toBuffer();

  return {
    buffer,
    dataUrl: `data:image/jpeg;base64,${buffer.toString("base64")}`,
    height,
    width,
  };
}
