type CurvePoint = { x: number; y: number };

const FINAL_FILM_GRADE_SAMPLE_COUNT = 16;

const FINAL_FILM_GRADE_POINTS = {
  rgb: [
    { x: 0, y: 15 },
    { x: 60, y: 50 },
    { x: 190, y: 205 },
    { x: 255, y: 245 },
  ],
  r: [
    { x: 0, y: 5 },
    { x: 120, y: 135 },
    { x: 255, y: 255 },
  ],
  g: [
    { x: 0, y: 10 },
    { x: 128, y: 128 },
    { x: 255, y: 250 },
  ],
  b: [
    { x: 0, y: 35 },
    { x: 128, y: 128 },
    { x: 255, y: 230 },
  ],
} as const;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(Number.isFinite(value) ? value : 0)));
}

function buildCurveSamples(points: readonly CurvePoint[], samples = FINAL_FILM_GRADE_SAMPLE_COUNT) {
  const pts = [...points].sort((a, b) => a.x - b.x);
  const values: number[] = [];

  for (let i = 0; i < samples; i += 1) {
    const x = (i / (samples - 1)) * 255;
    let p0 = pts[0];
    let p1 = pts[pts.length - 1];

    for (let j = 0; j < pts.length - 1; j += 1) {
      const a = pts[j];
      const b = pts[j + 1];
      if (x >= a.x && x <= b.x) {
        p0 = a;
        p1 = b;
        break;
      }
    }

    const t = p1.x === p0.x ? 0 : (x - p0.x) / (p1.x - p0.x);
    values.push(clamp01((p0.y + (p1.y - p0.y) * t) / 255));
  }

  return values;
}

const FINAL_FILM_GRADE_CURVES = {
  rgb: buildCurveSamples(FINAL_FILM_GRADE_POINTS.rgb),
  r: buildCurveSamples(FINAL_FILM_GRADE_POINTS.r),
  g: buildCurveSamples(FINAL_FILM_GRADE_POINTS.g),
  b: buildCurveSamples(FINAL_FILM_GRADE_POINTS.b),
};

export const FINAL_FILM_GRADE_TABLES = {
  rgb: FINAL_FILM_GRADE_CURVES.rgb.map((value) => value.toFixed(4)).join(" "),
  r: FINAL_FILM_GRADE_CURVES.r.map((value) => value.toFixed(4)).join(" "),
  g: FINAL_FILM_GRADE_CURVES.g.map((value) => value.toFixed(4)).join(" "),
  b: FINAL_FILM_GRADE_CURVES.b.map((value) => value.toFixed(4)).join(" "),
};

export function normalizeFinalFilmGrade(value: unknown) {
  return clamp01(Number(value));
}

type FinalCssFilterOp = {
  name: "brightness" | "contrast" | "saturate" | "sepia" | "hue-rotate";
  value: number;
};

function parseFinalCssFilterOps(filterCss?: string) {
  const css = String(filterCss || "none").trim();
  if (!css || css === "none") return { ops: [] as FinalCssFilterOp[], fullySupported: true };

  const ops: FinalCssFilterOp[] = [];
  let fullySupported = true;
  const re = /([a-z-]+)\(([^()]*)\)/gi;
  let match: RegExpExecArray | null;

  while ((match = re.exec(css))) {
    const name = match[1].toLowerCase();
    const rawValue = String(match[2] || "").trim();
    const numeric = rawValue.match(/^([-+]?\d*\.?\d+)(%|deg|rad|turn)?$/i);
    if (!numeric) {
      fullySupported = false;
      continue;
    }

    const number = Number(numeric[1]);
    const unit = String(numeric[2] || "").toLowerCase();
    if (!Number.isFinite(number)) {
      fullySupported = false;
      continue;
    }

    let value = number;
    if (name === "hue-rotate") {
      if (unit === "rad") value = number * (180 / Math.PI);
      else if (unit === "turn") value = number * 360;
      else if (unit && unit !== "deg") {
        fullySupported = false;
        continue;
      }
    } else if (unit === "%") {
      value = number / 100;
    } else if (unit) {
      fullySupported = false;
      continue;
    }

    if (
      name === "brightness" ||
      name === "contrast" ||
      name === "saturate" ||
      name === "sepia" ||
      name === "hue-rotate"
    ) {
      ops.push({ name, value } as FinalCssFilterOp);
    } else {
      fullySupported = false;
    }
  }

  const unmatched = css.replace(re, " ").replace(/\s+/g, "").trim();
  if (unmatched) fullySupported = false;

  return { ops, fullySupported };
}

function buildFinalSepiaColorMatrix(amount: number) {
  const a = Math.max(0, Math.min(1, amount));
  const inv = 1 - a;
  return [
    inv + a * 0.393, a * 0.769, a * 0.189, 0, 0,
    a * 0.349, inv + a * 0.686, a * 0.168, 0, 0,
    a * 0.272, a * 0.534, inv + a * 0.131, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

function multiplyFinalColorMatrices(a: number[], b: number[]) {
  const out = [...a];
  out[0] = a[0] * b[0] + a[1] * b[5] + a[2] * b[10] + a[3] * b[15];
  out[1] = a[0] * b[1] + a[1] * b[6] + a[2] * b[11] + a[3] * b[16];
  out[2] = a[0] * b[2] + a[1] * b[7] + a[2] * b[12] + a[3] * b[17];
  out[3] = a[0] * b[3] + a[1] * b[8] + a[2] * b[13] + a[3] * b[18];
  out[4] = a[0] * b[4] + a[1] * b[9] + a[2] * b[14] + a[3] * b[19] + a[4];
  out[5] = a[5] * b[0] + a[6] * b[5] + a[7] * b[10] + a[8] * b[15];
  out[6] = a[5] * b[1] + a[6] * b[6] + a[7] * b[11] + a[8] * b[16];
  out[7] = a[5] * b[2] + a[6] * b[7] + a[7] * b[12] + a[8] * b[17];
  out[8] = a[5] * b[3] + a[6] * b[8] + a[7] * b[13] + a[8] * b[18];
  out[9] = a[5] * b[4] + a[6] * b[9] + a[7] * b[14] + a[8] * b[19] + a[9];
  out[10] = a[10] * b[0] + a[11] * b[5] + a[12] * b[10] + a[13] * b[15];
  out[11] = a[10] * b[1] + a[11] * b[6] + a[12] * b[11] + a[13] * b[16];
  out[12] = a[10] * b[2] + a[11] * b[7] + a[12] * b[12] + a[13] * b[17];
  out[13] = a[10] * b[3] + a[11] * b[8] + a[12] * b[13] + a[13] * b[18];
  out[14] = a[10] * b[4] + a[11] * b[9] + a[12] * b[14] + a[13] * b[19] + a[14];
  out[15] = a[15] * b[0] + a[16] * b[5] + a[17] * b[10] + a[18] * b[15];
  out[16] = a[15] * b[1] + a[16] * b[6] + a[17] * b[11] + a[18] * b[16];
  out[17] = a[15] * b[2] + a[16] * b[7] + a[17] * b[12] + a[18] * b[17];
  out[18] = a[15] * b[3] + a[16] * b[8] + a[17] * b[13] + a[18] * b[18];
  out[19] = a[15] * b[4] + a[16] * b[9] + a[17] * b[14] + a[18] * b[19] + a[19];
  return out;
}

function buildFinalCssFilterMatrix(op: FinalCssFilterOp) {
  if (op.name === "brightness") {
    const b = Math.max(0, op.value);
    return [
      b, 0, 0, 0, 0,
      0, b, 0, 0, 0,
      0, 0, b, 0, 0,
      0, 0, 0, 1, 0,
    ];
  }

  if (op.name === "contrast") {
    const c = Math.max(0, op.value);
    const offset = 0.5 * (1 - c);
    return [
      c, 0, 0, 0, offset,
      0, c, 0, 0, offset,
      0, 0, c, 0, offset,
      0, 0, 0, 1, 0,
    ];
  }

  if (op.name === "saturate") {
    const s = Math.max(0, op.value);
    return [
      0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0, 0,
      0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0, 0,
      0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s, 0, 0,
      0, 0, 0, 1, 0,
    ];
  }

  if (op.name === "sepia") {
    return buildFinalSepiaColorMatrix(op.value);
  }

  const rad = (op.value * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [
    0.213 + cos * 0.787 - sin * 0.213,
    0.715 - cos * 0.715 - sin * 0.715,
    0.072 - cos * 0.072 + sin * 0.928,
    0,
    0,
    0.213 - cos * 0.213 + sin * 0.143,
    0.715 + cos * 0.285 + sin * 0.14,
    0.072 - cos * 0.072 - sin * 0.283,
    0,
    0,
    0.213 - cos * 0.213 - sin * 0.787,
    0.715 - cos * 0.715 + sin * 0.715,
    0.072 + cos * 0.928 + sin * 0.072,
    0,
    0,
    0, 0, 0, 1, 0,
  ];
}

function buildFinalCssColorMatrix(ops: FinalCssFilterOp[]) {
  let matrix = [
    1, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, 1, 0,
  ];

  for (const op of ops) {
    matrix = multiplyFinalColorMatrices(buildFinalCssFilterMatrix(op), matrix);
  }

  return matrix;
}

export function applyFinalCssColorFilterToCanvas(
  sourceCanvas: HTMLCanvasElement,
  filterCss?: string
) {
  const parsed = parseFinalCssFilterOps(filterCss);
  if (!parsed.fullySupported || parsed.ops.length === 0) {
    return parsed.ops.length === 0 && parsed.fullySupported ? sourceCanvas : null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(sourceCanvas, 0, 0);

  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const matrix = buildFinalCssColorMatrix(parsed.ops);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      data[i] = clampByte((matrix[0] * r + matrix[1] * g + matrix[2] * b + matrix[4]) * 255);
      data[i + 1] = clampByte((matrix[5] * r + matrix[6] * g + matrix[7] * b + matrix[9]) * 255);
      data[i + 2] = clampByte((matrix[10] * r + matrix[11] * g + matrix[12] * b + matrix[14]) * 255);
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  } catch {
    return null;
  }
}

export function applyFinalColorGradeToCanvas(
  sourceCanvas: HTMLCanvasElement,
  baseFilter?: string,
  finalFilmGrade?: unknown
) {
  const filtered = applyFinalCssColorFilterToCanvas(sourceCanvas, baseFilter);
  const base = filtered || sourceCanvas;
  return applyFinalFilmGradeToCanvas(base, finalFilmGrade);
}

function applySampledCurve(samples: number[], channel: number) {
  if (!samples.length) return clampByte(channel);
  if (samples.length === 1) return clampByte(samples[0] * 255);

  const x = clamp01(channel / 255) * (samples.length - 1);
  const index = Math.floor(x);
  const nextIndex = Math.min(samples.length - 1, index + 1);
  const t = x - index;
  return (samples[index] + (samples[nextIndex] - samples[index]) * t) * 255;
}

export function buildFinalFilmGradeCssFilter(
  baseFilter?: string,
  strength?: unknown,
  filterId = "master-grade"
) {
  const normalizedBase = String(baseFilter || "none").trim();
  const parts: string[] = [];
  if (normalizedBase && normalizedBase !== "none") parts.push(normalizedBase);
  if (normalizeFinalFilmGrade(strength) > 0.001) parts.push(`url(#${filterId})`);
  return parts.length ? parts.join(" ") : "none";
}

export function applyFinalFilmGradeToCanvas(
  sourceCanvas: HTMLCanvasElement,
  strength?: unknown
) {
  const gradeStrength = normalizeFinalFilmGrade(strength);
  if (gradeStrength <= 0.001 || !sourceCanvas.width || !sourceCanvas.height) {
    return sourceCanvas;
  }

  const canvas = document.createElement("canvas");
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);

  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const rgbR = applySampledCurve(FINAL_FILM_GRADE_CURVES.rgb, r);
      const rgbG = applySampledCurve(FINAL_FILM_GRADE_CURVES.rgb, g);
      const rgbB = applySampledCurve(FINAL_FILM_GRADE_CURVES.rgb, b);
      const gradedR = applySampledCurve(FINAL_FILM_GRADE_CURVES.r, rgbR);
      const gradedG = applySampledCurve(FINAL_FILM_GRADE_CURVES.g, rgbG);
      const gradedB = applySampledCurve(FINAL_FILM_GRADE_CURVES.b, rgbB);

      data[i] = clampByte(r + (gradedR - r) * gradeStrength);
      data[i + 1] = clampByte(g + (gradedG - g) * gradeStrength);
      data[i + 2] = clampByte(b + (gradedB - b) * gradeStrength);
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  } catch {
    return sourceCanvas;
  }
}
