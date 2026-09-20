export function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function normalizeWhitespace(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function cleanLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function splitWords(value: string): string[] {
  return normalizeWhitespace(value)
    .replace(/[•|/]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function splitLines(value: string): string[] {
  return normalizeWhitespace(value)
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);
}

export function titleCase(value: string): string {
  const small = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with"]);
  return normalizeWhitespace(value)
    .toLowerCase()
    .split(" ")
    .map((word, index) => index > 0 && small.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function sentenceCase(value: string): string {
  const text = normalizeWhitespace(value).toLowerCase();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

export function applyCase(value: string, mode: "preserve" | "uppercase" | "titlecase" | "sentence"): string {
  if (mode === "uppercase") return value.toUpperCase();
  if (mode === "titlecase") return titleCase(value);
  if (mode === "sentence") return sentenceCase(value);
  return value;
}

export function unique<T>(values: T[]): T[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

export function stableSort<T>(items: T[], compare: (a: T, b: T) => number): T[] {
  return items.map((item, index) => ({ item, index }))
    .sort((a, b) => compare(a.item, b.item) || a.index - b.index)
    .map(({ item }) => item);
}

export function slug(value: string): string {
  return normalizeWhitespace(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function average(values: number[]): number {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return 0;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

export function weightedAverage(entries: Array<[number, number]>): number {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (total <= 0) return 0;
  return entries.reduce((sum, [value, weight]) => sum + value * weight, 0) / total;
}

export function similarity(a: string, b: string): number {
  const aa = tokens(a);
  const bb = tokens(b);
  if (!aa.size && !bb.size) return 1;
  const intersection = [...aa].filter((token) => bb.has(token)).length;
  const union = new Set([...aa, ...bb]).size;
  return union ? intersection / union : 0;
}

function tokens(value: string): Set<string> {
  return new Set(
    normalizeWhitespace(value)
      .toLowerCase()
      .replace(/[^a-z0-9&]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1)
  );
}

export function truncateWords(value: string, maxWords: number): string {
  const words = splitWords(value);
  if (words.length <= maxWords) return value;
  return words.slice(0, maxWords).join(" ");
}

export function compactSeparators(parts: Array<string | undefined | null>, separator = " • "): string {
  return parts.map((part) => normalizeWhitespace(part)).filter(Boolean).join(separator);
}

export function dedupeStrings(values: string[]): string[] {
  const result: string[] = [];
  for (const value of values) {
    if (!result.some((existing) => similarity(existing, value) >= 0.82)) result.push(value);
  }
  return result;
}
