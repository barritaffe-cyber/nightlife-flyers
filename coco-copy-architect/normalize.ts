import type { CopyArchitectInput, CopySource, NormalizedCopyField } from "./types.ts";
import { normalizeWhitespace, splitLines, splitWords, similarity } from "./utils.ts";

const SOURCES: CopySource[] = [
  "name",
  "headline",
  "accent",
  "details",
  "details2",
  "presenter",
  "date",
  "time",
  "venue",
  "address",
  "price",
  "callToAction",
  "ageRestriction",
  "social",
  "sponsors",
  "custom",
];

export function normalizeCopyInput(input: CopyArchitectInput): NormalizedCopyField[] {
  const fields = SOURCES.map((source) => {
    const raw = String(input.event[source] ?? "");
    const text = normalizeField(source, raw);
    const words = splitWords(text);
    const lines = splitLines(text);

    return {
      source,
      raw,
      text,
      empty: !text,
      words,
      lines,
      characterCount: text.length,
      wordCount: words.length,
      confidence: text ? 0.96 : 0.2,
      semanticTags: inferTags(source, text),
    } satisfies NormalizedCopyField;
  });

  markDuplicates(fields);
  return fields;
}

function normalizeField(source: CopySource, raw: string): string {
  let text = normalizeWhitespace(raw);
  if (!text) return "";

  if (source === "price") {
    text = text
      .replace(/\bentry\s*[:\-]?\s*/i, "ENTRY ")
      .replace(/\bcover\s*[:\-]?\s*/i, "ENTRY ")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (source === "date" || source === "time") {
    text = text.replace(/\s+at\s+/i, " • ").replace(/\s+/g, " ").trim();
  }

  if (source === "social") {
    text = text.replace(/\s+/g, "").trim();
  }

  return text;
}

function inferTags(source: CopySource, text: string): string[] {
  const tags: string[] = [source];
  const lower = text.toLowerCase();

  if (/\bafro|afrobeats|amapiano|latin|salsa|bachata|r&b|rnb|hip.?hop|reggae|dancehall|techno|edm|house\b/i.test(lower)) {
    tags.push("music");
  }
  if (/\bcocktail|martini|mojito|brunch|food|dinner|bottle|champagne\b/i.test(lower)) {
    tags.push("experience");
  }
  if (/\bfree|special|discount|entry|cover|\$\d+|vip\b/i.test(lower)) {
    tags.push("offer");
  }
  if (/\b21\+|18\+|age\b/i.test(lower)) {
    tags.push("age");
  }
  if (/\bdoors|pm|am|monday|tuesday|wednesday|thursday|friday|saturday|sunday\b/i.test(lower)) {
    tags.push("logistics");
  }
  return tags;
}

function markDuplicates(fields: NormalizedCopyField[]): void {
  for (const field of fields) {
    if (!field.text) continue;
    const previous = fields.find(
      (candidate) =>
        candidate.source !== field.source &&
        candidate.text &&
        SOURCES.indexOf(candidate.source) < SOURCES.indexOf(field.source) &&
        similarity(candidate.text, field.text) >= 0.84
    );
    if (previous) field.duplicateOf = previous.source;
  }
}
