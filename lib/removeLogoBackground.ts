/** Local edge-connected background removal for logos on a solid background. */
export type LogoPixels = { width: number; height: number; data: Uint8ClampedArray };

export type LogoBackgroundOptions = { clearEnclosedGaps?: boolean };

export function removeLogoBackgroundPixels(image: LogoPixels, tolerance = 20, options: LogoBackgroundOptions = {}): LogoPixels {
  const { width, height, data } = image;
  const count = width * height;
  if (!count || data.length !== count * 4) throw new Error('This image could not be read.');
  const edge: number[] = [];
  for (let x = 0; x < width; x++) { edge.push(x); if (height > 1) edge.push((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y++) { edge.push(y * width); if (width > 1) edge.push(y * width + width - 1); }

  // Find the dominant opaque edge color. Quantization tolerates JPEG noise.
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  let opaqueEdges = 0;
  for (const p of edge) {
    const i = p * 4;
    if (data[i + 3] < 240) continue;
    opaqueEdges++;
    const key = (data[i] >> 4) * 256 + (data[i + 1] >> 4) * 16 + (data[i + 2] >> 4);
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n++; bucket.r += data[i]; bucket.g += data[i + 1]; bucket.b += data[i + 2];
    buckets.set(key, bucket);
  }
  if (opaqueEdges < edge.length * .1) throw new Error('This logo already has a transparent background.');
  const dominant = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
  const bg = [dominant.r / dominant.n, dominant.g / dominant.n, dominant.b / dominant.n];
  const distance = (p: number) => Math.max(Math.abs(data[p * 4] - bg[0]), Math.abs(data[p * 4 + 1] - bg[1]), Math.abs(data[p * 4 + 2] - bg[2]));
  const threshold = 8 + Math.max(0, Math.min(100, tolerance)) * 1.2;
  if (edge.filter(p => data[p * 4 + 3] >= 240 && distance(p) <= threshold).length < opaqueEdges * .5) {
    throw new Error('Use a logo with a plain background for this cleanup. Your original is unchanged.');
  }

  const visited = new Uint8Array(count), removed = new Uint8Array(count), queue = new Uint32Array(count);
  let head = 0, tail = 0;
  const visit = (p: number) => {
    if (visited[p]) return;
    visited[p] = 1;
    if (data[p * 4 + 3] <= 8 || distance(p) <= threshold) { removed[p] = 1; queue[tail++] = p; }
  };
  if (options.clearEnclosedGaps) {
    // Include background-colored pockets trapped between strokes. This is
    // opt-in because a white counter and intentional white artwork can have
    // identical pixels; topology alone cannot distinguish them reliably.
    for (let p = 0; p < count; p++) visit(p);
  } else {
    for (const p of edge) visit(p);
    while (head < tail) {
      const p = queue[head++], x = p % width, y = Math.floor(p / width);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if ((!dx && !dy) || x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
        visit(p + dy * width + dx);
      }
    }
  }
  // Small disconnected near-background islands are compression residue. Do not
  // remove strong-color dots, accents, or any component enclosed by the logo.
  const componentsSeen = new Uint8Array(count);
  const maxSpeck = Math.max(4, Math.min(64, Math.round(count * .0002)));
  for (let seed = 0; seed < count; seed++) {
    if (removed[seed] || componentsSeen[seed]) continue;
    head = 0; tail = 0; queue[tail++] = seed; componentsSeen[seed] = 1;
    let maxDistance = 0, touchesExterior = false;
    while (head < tail) {
      const p = queue[head++], x = p % width, y = Math.floor(p / width);
      maxDistance = Math.max(maxDistance, distance(p));
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if ((!dx && !dy) || x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
        const n = p + dy * width + dx;
        if (removed[n]) { touchesExterior = true; continue; }
        if (!componentsSeen[n]) { componentsSeen[n] = 1; queue[tail++] = n; }
      }
    }
    if (touchesExterior && tail <= maxSpeck && maxDistance <= Math.min(80, threshold + 24)) {
      for (let i = 0; i < tail; i++) removed[queue[i]] = 1;
    }
  }
  let visible = 0, kept = 0;
  for (let p = 0; p < count; p++) if (data[p * 4 + 3] > 8) { visible++; if (!removed[p]) kept++; }
  if (!kept || kept < visible * .001) throw new Error('The logo is too similar to its background. Try a lower tolerance or another image.');

  // Measure a narrow exterior band, including diagonal edges. Sampling only an
  // immediately adjacent pixel mistakes wider JPEG halos for solid foreground.
  const radius = 4;
  const depth = new Uint8Array(count).fill(255);
  head = 0; tail = 0;
  for (let p = 0; p < count; p++) if (removed[p]) { depth[p] = 0; queue[tail++] = p; }
  while (head < tail) {
    const p = queue[head++];
    if (depth[p] >= radius) continue;
    const x = p % width, y = Math.floor(p / width);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if ((!dx && !dy) || x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
      const n = p + dy * width + dx;
      if (depth[n] !== 255 || (!removed[p] && distance(n) + 8 < distance(p))) continue;
      depth[n] = depth[p] + 1; queue[tail++] = n;
    }
  }
  const output = new Uint8ClampedArray(data);
  for (let p = 0; p < count; p++) {
    if (removed[p]) { output[p * 4 + 3] = 0; continue; }
    if (!data[p * 4 + 3] || depth[p] > radius) continue;
    const x = p % width, y = Math.floor(p / width);
    let inner = -1, contrast = distance(p) + 8, nearest = Infinity;
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      if (x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
      const n = p + dy * width + dx, span = dx * dx + dy * dy;
      if (removed[n] || depth[n] < depth[p] || data[n * 4 + 3] < 240) continue;
      const delta = distance(n);
      if (delta > contrast || (delta === contrast && span < nearest)) { inner = n; contrast = delta; nearest = span; }
    }
    if (inner < 0) continue;
    let numerator = 0, denominator = 0;
    for (let c = 0; c < 3; c++) {
      const vector = data[inner * 4 + c] - bg[c];
      numerator += (data[p * 4 + c] - bg[c]) * vector; denominator += vector * vector;
    }
    const alpha = Math.max(0, Math.min(1, numerator / (denominator || 1)));
    if (alpha > .98) continue;
    const residual = Math.max(...bg.map((b, c) => Math.abs(data[p * 4 + c] - (b + alpha * (data[inner * 4 + c] - b)))));
    if (residual > 12) continue;
    output[p * 4 + 3] = alpha < .03 ? 0 : Math.round(data[p * 4 + 3] * alpha);
    if (alpha >= .03) for (let c = 0; c < 3; c++) output[p * 4 + c] = (data[p * 4 + c] - (1 - alpha) * bg[c]) / alpha;
  }
  return { width, height, data: output };
}

export async function removeLogoBackground(url: string, tolerance = 20, options: LogoBackgroundOptions = {}): Promise<string> {
  const image = new Image(); image.src = url; await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Background cleanup is unavailable in this browser.');
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const result = removeLogoBackgroundPixels(pixels, tolerance, options);
  pixels.data.set(result.data); context.putImageData(pixels, 0, 0);
  return canvas.toDataURL('image/png');
}
