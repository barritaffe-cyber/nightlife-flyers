/* =========================================
   LIB: Unreal-quality prompt builder
   - Accepts readonly arrays from STYLE_KEYWORDS
   - Builds one clean, comma-separated prompt
   ========================================= */

export const NEGATIVES = [
  "text, letters, words, numbers, logo, watermark, poster layout",
  "low detail, oversharpen, jpeg artifacts, banding",
  "bad anatomy, extra limbs, duplicate faces, deformed",
];

export const CAMERA_GRADING = [
  "85mm portrait, shallow depth of field",
  "high dynamic range, deep rich blacks",
  "Unreal Engine lighting, filmic, subtle grain",
];

export type BuildPromptOptions = {
  basePresetHint: string;             // e.g., BG_PRESETS[preset].hint
  styleBits: ReadonlyArray<string>;   // <-- key change: readonly OK
  subject: string;                    // user keywords
  textColumn: "left" | "right";
  textColumnWidthPct: number;         // ~42..56
  paletteHint?: string;               // e.g., "warm amber & gold glow"
  environmentHint?: string;           // e.g., "premium nightclub interior"
};

export function buildUnrealPrompt(opts: BuildPromptOptions) {
  const {
    basePresetHint,
    styleBits,
    subject,
    textColumn,
    textColumnWidthPct,
    paletteHint = "warm amber & gold glow",
    environmentHint = "premium nightclub interior",
  } = opts;

  const columnInstr =
    `composition: reserved ${textColumn} text column ${textColumnWidthPct}% clean, ` +
    `soft gradient darkening for legibility, protected face zone`;

  const lighting =
    "lighting: strong key light, colored rim light, volumetric haze, bloom, crisp bokeh";

  const materials =
    "materials: glossy metal and glass highlights, emissive accents, physically based shading";

  const camera = CAMERA_GRADING.join(", ");
  const negatives = `--negatives: ${NEGATIVES.join(", ")}`;
  const subjectLine = subject?.trim() ? `subject focus: ${subject.trim()}` : "";

  // Build as a single comma-separated string
  return [
    basePresetHint,
    environmentHint,
    paletteHint,
    ...styleBits,
    lighting,
    materials,
    camera,
    columnInstr,
    subjectLine,
    "typography-ready",
    "no text, no letters, no logos, no watermark",
    negatives,
  ]
    .filter(Boolean)
    .join(", ");
}
