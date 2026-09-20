import type { CocoTypographyFormat, TypePersonality } from "./types";

type HeadlineBreakInput = {
  format: CocoTypographyFormat;
  hasSubheadline?: boolean;
  personality: TypePersonality;
  text: string;
};

type HeadlineBreakCandidate = {
  lines: string[];
  score: number;
  text: string;
};

const WEAK_LINE_STARTS = new Set(["&", "and", "at", "by", "for", "in", "of", "on", "the", "to", "with"]);
const IMPACT_PERSONALITIES = new Set<TypePersonality>(["aggressive", "nightclub", "throwback", "festival"]);
const RESTRAINED_PERSONALITIES = new Set<TypePersonality>(["editorial", "elegant", "luxury", "minimal"]);

export function chooseTypographyHeadlineText(input: HeadlineBreakInput): string {
  return chooseTypographyHeadlineBreak(input).text;
}

export function chooseTypographyHeadlineBreak(input: HeadlineBreakInput): HeadlineBreakCandidate {
  const clean = normalizeHeadline(input.text || "EVENT NAME");
  // Typography chooses font, weight, tracking and treatment. Structural line
  // breaks belong to the composition stage because only it knows the final
  // image-safe zone. Preserve an authored break; otherwise keep one line for
  // the measured Headline Director to evaluate later.
  const lines = clean.split("\n").filter(Boolean);
  return {
    lines,
    score: scoreTypographyLineBreaks({ ...input, lines }),
    text: lines.join("\n"),
  };
}

export function scoreTypographyLineBreaks(input: HeadlineBreakInput & { lines: string[] }): number {
  const lines = input.lines.map(normalizeHeadline).filter(Boolean);
  if (!lines.length) return 0;
  const clean = normalizeHeadline(input.text || lines.join(" "));
  const maxLines = input.format === "story" ? 3 : 2;
  const lineLengths = lines.map((line) => line.replace(/\s/g, "").length);
  const longest = Math.max(...lineLengths, 1);
  const shortest = Math.max(Math.min(...lineLengths), 1);
  const ratio = longest / shortest;
  const hasWeakStart = lines.slice(1).some((line) => WEAK_LINE_STARTS.has(line.split(" ")[0]?.toLowerCase() || ""));
  const hasTinyLine = lines.some((line) => line.replace(/\s/g, "").length <= 2);
  const targetLines = idealHeadlineLineCount(clean, input);
  let score = 100;

  score -= Math.abs(lines.length - targetLines) * 13;
  if (lines.length > maxLines) score -= (lines.length - maxLines) * 28;
  if (ratio > 2.4) score -= 22;
  else if (ratio > 1.8) score -= 12;
  if (hasWeakStart) score -= 14;
  if (hasTinyLine) score -= 18;
  if (input.hasSubheadline && lines.length > 1 && clean.length <= 22) score -= 24;
  if (RESTRAINED_PERSONALITIES.has(input.personality) && lines.length > 2) score -= 18;
  if (IMPACT_PERSONALITIES.has(input.personality) && lines.length === 1 && clean.length > 24) score -= 10;

  return clamp(score, 0, 100);
}

function idealHeadlineLineCount(text: string, input: HeadlineBreakInput) {
  const words = text.split(" ").filter(Boolean);
  if (input.hasSubheadline && text.length <= 24) return 1;
  if (words.length <= 2 && text.length <= 18) return 1;
  if (RESTRAINED_PERSONALITIES.has(input.personality) && text.length <= 28) return 1;
  if (text.length > (input.format === "story" ? 34 : 29) && words.length >= 4) return 2;
  if (text.length > (input.format === "story" ? 48 : 40) && words.length >= 5) return 3;
  return 2;
}

function normalizeHeadline(value: string) {
  return String(value || "")
    .replace(/\s*\n\s*/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
