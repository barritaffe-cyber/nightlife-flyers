import type { CopyFact, CopySource, NormalizedCopyField } from "./types.ts";
import { dedupeStrings, normalizeWhitespace, splitLines } from "./utils.ts";

export function extractCopyFacts(fields: NormalizedCopyField[]): CopyFact[] {
  const facts: CopyFact[] = [];

  for (const field of fields) {
    if (field.empty || field.duplicateOf) continue;

    if (field.source === "headline" || field.source === "name") {
      facts.push(fact(`${field.source}:identity`, "identity", field.text, field.source, field.source === "headline" ? 100 : 95, false));
      continue;
    }

    if (field.source === "accent") {
      facts.push(fact("accent:mood", "mood", field.text, field.source, 82, true));
      continue;
    }

    if (field.source === "details" || field.source === "details2" || field.source === "custom") {
      for (const item of splitSemanticDetails(field.text)) {
        facts.push(fact(`${field.source}:${slugFact(item)}`, classifyDetail(item), item, field.source, priorityForDetail(item), true));
      }
      continue;
    }

    if (field.source === "date") facts.push(fact("date", "date", field.text, field.source, 72, false));
    if (field.source === "time") facts.push(fact("time", "time", field.text, field.source, 72, false));
    if (field.source === "venue") facts.push(fact("venue", "venue", field.text, field.source, 66, false));
    if (field.source === "address") facts.push(fact("address", "address", field.text, field.source, 48, true));
    if (field.source === "price") facts.push(fact("price", "price", field.text, field.source, 60, true));
    if (field.source === "presenter") facts.push(fact("presenter", "presenter", field.text, field.source, 38, true));
    if (field.source === "ageRestriction") facts.push(fact("age", "age", field.text, field.source, 42, true));
    if (field.source === "social") facts.push(fact("social", "social", field.text, field.source, 28, true));
    if (field.source === "sponsors") facts.push(fact("sponsors", "sponsor", field.text, field.source, 24, true));
    if (field.source === "callToAction") facts.push(fact("cta", "call-to-action", field.text, field.source, 35, true));
  }

  return dedupeFacts(facts);
}

function splitSemanticDetails(text: string): string[] {
  const lines = splitLines(text);
  const items = lines.flatMap((line) =>
    line
      .split(/\s*[•|/]\s*|\s*[,;]\s*/)
      .map(normalizeWhitespace)
      .filter(Boolean)
  );
  return dedupeStrings(items);
}

function classifyDetail(text: string): CopyFact["category"] {
  const lower = text.toLowerCase();

  if (/\bafro|afrobeats|amapiano|latin|salsa|bachata|r&b|rnb|hip.?hop|reggae|dancehall|techno|edm|house|music|dj\b/.test(lower)) {
    return "music";
  }
  if (/\bcocktail|martini|mojito|brunch|food|dinner|bottle|champagne|island|rooftop|pool|sunset|vibes|energy\b/.test(lower)) {
    return "experience";
  }
  if (/\bfree|special|discount|entry|cover|vip|bottle service|ladies free\b/.test(lower)) {
    return "offer";
  }
  if (/\bdoors|pm|am|monday|tuesday|wednesday|thursday|friday|saturday|sunday\b/.test(lower)) {
    return "time";
  }
  return "experience";
}

function priorityForDetail(text: string): number {
  const category = classifyDetail(text);
  if (category === "music") return 58;
  if (category === "offer") return 62;
  return 52;
}

function fact(
  id: string,
  category: CopyFact["category"],
  text: string,
  source: CopySource,
  priority: number,
  optional: boolean
): CopyFact {
  return {
    id,
    category,
    text: normalizeWhitespace(text),
    source,
    priority,
    confidence: 0.92,
    optional,
  };
}

function dedupeFacts(facts: CopyFact[]): CopyFact[] {
  const seen = new Set<string>();
  return facts.filter((item) => {
    const key = `${item.category}:${item.text.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function slugFact(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36);
}
