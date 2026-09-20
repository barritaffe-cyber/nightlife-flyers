import type { CopyFact, CopyTone } from "./types.ts";
import { compactSeparators, normalizeWhitespace, titleCase, truncateWords, unique } from "./utils.ts";

export type RewritePolicy = {
  tone: CopyTone;
  maxMusicItems: number;
  maxExperienceItems: number;
  maxOfferItems: number;
  uppercaseMetadata: boolean;
  useAmpersand: boolean;
  separator: string;
};

export function buildRewritePolicy(tone: CopyTone): RewritePolicy {
  return {
    tone,
    maxMusicItems: tone === "luxury" || tone === "editorial" ? 3 : 4,
    maxExperienceItems: tone === "luxury" ? 2 : 3,
    maxOfferItems: 2,
    uppercaseMetadata: tone !== "romantic",
    useAmpersand: true,
    separator: " • ",
  };
}

export function composeExperienceCopy(facts: CopyFact[], policy: RewritePolicy): string {
  const music = unique(facts.filter((fact) => fact.category === "music").map((fact) => cleanPhrase(fact.text)))
    .slice(0, policy.maxMusicItems);

  const experience = unique(facts.filter((fact) => fact.category === "experience").map((fact) => cleanPhrase(fact.text)))
    .slice(0, policy.maxExperienceItems);

  const offers = unique(facts.filter((fact) => fact.category === "offer").map((fact) => cleanPhrase(fact.text)))
    .slice(0, policy.maxOfferItems);

  const lines: string[] = [];
  if (music.length) lines.push(compactSeparators(music, policy.separator));
  if (experience.length) lines.push(compactSeparators(experience, policy.separator));
  if (offers.length) lines.push(compactSeparators(offers, policy.separator));

  let text = lines.join("\n");
  if (policy.uppercaseMetadata) text = text.toUpperCase();
  return text;
}

export function composeLogisticsCopy(facts: CopyFact[], uppercase = true): string {
  const date = facts.find((fact) => fact.category === "date")?.text;
  const time = facts.find((fact) => fact.category === "time")?.text;
  let text = compactSeparators([date, time], " • ");
  if (uppercase) text = text.toUpperCase();
  return text;
}

export function composeVenueCopy(facts: CopyFact[], includeAddress: boolean, uppercase = true): string {
  const venue = facts.find((fact) => fact.category === "venue")?.text;
  const address = includeAddress ? facts.find((fact) => fact.category === "address")?.text : "";
  let text = [venue, address].filter(Boolean).join("\n");
  if (uppercase) text = text.toUpperCase();
  return text;
}

export function composeBadgeCopy(facts: CopyFact[]): string {
  const price = facts.find((fact) => fact.category === "price")?.text ?? "";
  const match = price.match(/(ENTRY|COVER|VIP)?\s*(\$?\d+(?:\.\d{2})?)/i);
  if (!match) return price.toUpperCase();
  const label = (match[1] || "ENTRY").toUpperCase();
  return `${label}\n${match[2]}`;
}

export function rewriteAccent(value: string, tone: CopyTone): string {
  const clean = normalizeWhitespace(value);
  if (!clean) return "";

  if (tone === "luxury" || tone === "editorial") {
    return titleCase(truncateWords(clean, 4));
  }
  if (tone === "energetic" || tone === "underground") {
    return truncateWords(clean, 5).toUpperCase();
  }
  return titleCase(truncateWords(clean, 5));
}

function cleanPhrase(value: string): string {
  return titleCase(truncateWords(normalizeWhitespace(value), 5));
}
