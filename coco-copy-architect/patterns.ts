import type {
  CopyArchitecturePattern,
  CopyArchitectInput,
  CopyDensity,
  CopyFact,
  CopyGroup,
  CopyTone,
} from "./types.ts";
import {
  composeBadgeCopy,
  composeExperienceCopy,
  composeLogisticsCopy,
  composeVenueCopy,
  rewriteAccent,
  buildRewritePolicy,
} from "./rewrite.ts";
import { applyCase, compactSeparators, normalizeWhitespace } from "./utils.ts";

export function recommendPatterns(input: CopyArchitectInput): CopyArchitecturePattern[] {
  const marketingGoal = input.creativeDirection?.marketingGoal ?? input.scene?.creativeDecisions?.marketingIntent ?? "sell-event";
  const density = inferDensity(input);
  const result: CopyArchitecturePattern[] = [];

  if (marketingGoal === "sell-lifestyle") {
    result.push("identity-emotion-metadata-logistics", "identity-experience-logistics", "minimal-editorial");
  } else if (marketingGoal === "sell-music") {
    result.push("identity-music-offer-logistics", "identity-emotion-metadata-logistics", "dense-club");
  } else if (marketingGoal === "sell-vip" || marketingGoal === "sell-product") {
    result.push("identity-product-logistics", "minimal-editorial", "footer-heavy");
  } else if (marketingGoal === "sell-artist") {
    result.push("identity-artist-logistics", "identity-music-offer-logistics", "split-information");
  } else {
    result.push("identity-emotion-metadata-logistics", "identity-date-venue", "minimal-editorial");
  }

  if (density === "minimal") result.unshift("minimal-editorial");
  if (density === "dense") result.unshift("dense-club");
  return [...new Set(result)];
}

export function buildGroupsForPattern(
  pattern: CopyArchitecturePattern,
  facts: CopyFact[],
  input: CopyArchitectInput,
  tone: CopyTone
): CopyGroup[] {
  const density = inferDensity(input);
  const rewritePolicy = buildRewritePolicy(tone);

  const identityText =
    facts.find((fact) => fact.source === "headline")?.text ||
    facts.find((fact) => fact.source === "name")?.text ||
    input.event.name;

  const accentRaw = facts.find((fact) => fact.category === "mood")?.text ?? "";
  const experienceText = composeExperienceCopy(facts, rewritePolicy);
  const logisticsText = composeLogisticsCopy(facts, true);
  const venueText = composeVenueCopy(facts, Boolean(input.userPreferences?.keepAddress), true);
  const badgeText = composeBadgeCopy(facts);
  const presenterText = facts.find((fact) => fact.category === "presenter")?.text ?? "";
  const socialText = facts.find((fact) => fact.category === "social")?.text ?? "";
  const ageText = facts.find((fact) => fact.category === "age")?.text ?? "";
  const footerText = compactSeparators([ageText, socialText], " • ").toUpperCase();

  const identity = group({
    id: "identity",
    role: "identity",
    treatment: "hero",
    sources: ["headline", "name"],
    text: formatHeadline(identityText),
    case: "uppercase",
    priority: 1,
    maxLines: 3,
    maxCharactersPerLine: 18,
    maxWords: 6,
    powerRatio: 1,
    spacingBefore: 0,
    spacingAfter: 1.5,
    reasoning: ["The event identity is the poster's first textual read."],
  });

  const emotion = group({
    id: "emotion",
    role: "emotion",
    treatment: accentRaw ? "accent" : "hide",
    sources: ["accent"],
    text: rewriteAccent(accentRaw, tone),
    case: tone === "energetic" || tone === "underground" ? "uppercase" : "titlecase",
    priority: 2,
    maxLines: 2,
    maxCharactersPerLine: 24,
    maxWords: 5,
    powerRatio: 0.42,
    spacingBefore: 0,
    spacingAfter: 2,
    hiddenReason: accentRaw ? undefined : "No accent copy supplied.",
    reasoning: ["Accent adds emotional flavor but remains subordinate to identity."],
  });

  const experience = group({
    id: "experience",
    role: pattern.includes("music") ? "music" : "experience",
    treatment: experienceText ? "metadata" : "hide",
    sources: ["details", "details2", "custom"],
    text: experienceText,
    case: "uppercase",
    priority: 3,
    maxLines: density === "minimal" ? 2 : density === "low" ? 3 : 4,
    maxCharactersPerLine: 34,
    maxWords: density === "minimal" ? 10 : 18,
    powerRatio: 0.25,
    spacingBefore: 0,
    spacingAfter: 2.5,
    mergePolicy: "merge-secondary",
    hiddenReason: experienceText ? undefined : "No music, experience, or offer facts supplied.",
    reasoning: ["Long body copy is rewritten as premium metadata."],
  });

  const logistics = group({
    id: "logistics",
    role: "logistics",
    treatment: logisticsText ? "metadata" : "hide",
    sources: ["date", "time"],
    text: logisticsText,
    case: "uppercase",
    priority: 3,
    maxLines: 2,
    maxCharactersPerLine: 28,
    maxWords: 8,
    powerRatio: 0.24,
    spacingBefore: 0,
    spacingAfter: 1.5,
    reasoning: ["Date and time form one logistics unit."],
  });

  const venue = group({
    id: "venue",
    role: "venue",
    treatment: venueText ? "footer" : "hide",
    sources: ["venue", "address"],
    text: venueText,
    case: "uppercase",
    priority: 4,
    maxLines: input.userPreferences?.keepAddress ? 2 : 1,
    maxCharactersPerLine: 34,
    maxWords: 10,
    powerRatio: 0.18,
    spacingBefore: 0,
    spacingAfter: 1,
    reasoning: ["Venue is easy to find but never competes with the headline."],
  });

  const badge = group({
    id: "badge",
    role: "badge",
    treatment: badgeText && input.userPreferences?.keepPrice !== false ? "badge" : "hide",
    sources: ["price"],
    text: badgeText,
    case: "uppercase",
    priority: 4,
    maxLines: 2,
    maxCharactersPerLine: 10,
    maxWords: 3,
    powerRatio: 0.2,
    spacingBefore: 0,
    spacingAfter: 0,
    hiddenReason: badgeText ? undefined : "No price supplied.",
    reasoning: ["Price is a secondary offer anchor."],
  });

  const presenter = group({
    id: "presenter",
    role: "presenter",
    treatment: presenterText && input.userPreferences?.keepPresenter ? "microcopy" : presenterText ? "mute" : "hide",
    sources: ["presenter"],
    text: presenterText.toUpperCase(),
    case: "uppercase",
    priority: 5,
    maxLines: 1,
    maxCharactersPerLine: 32,
    maxWords: 8,
    powerRatio: 0.13,
    spacingBefore: 0,
    spacingAfter: 1,
    hiddenReason: presenterText ? undefined : "No presenter supplied.",
    reasoning: ["Presenter remains an eyebrow or microcopy line."],
  });

  const footer = group({
    id: "footer",
    role: "footer",
    treatment: footerText && density !== "minimal" ? "footer" : footerText ? "mute" : "hide",
    sources: ["ageRestriction", "social", "callToAction"],
    text: footerText,
    case: "uppercase",
    priority: 5,
    maxLines: 1,
    maxCharactersPerLine: 40,
    maxWords: 10,
    powerRatio: 0.12,
    spacingBefore: 0,
    spacingAfter: 0,
    hiddenReason: footerText ? undefined : "No footer facts supplied.",
    reasoning: ["Administrative copy is kept quiet."],
  });

  return arrangePattern(pattern, { identity, emotion, experience, logistics, venue, badge, presenter, footer });
}

function arrangePattern(
  pattern: CopyArchitecturePattern,
  groups: Record<string, CopyGroup>
): CopyGroup[] {
  const map: Record<CopyArchitecturePattern, string[]> = {
    "identity-emotion-metadata-logistics": ["presenter", "identity", "emotion", "experience", "logistics", "venue", "badge", "footer"],
    "identity-experience-logistics": ["presenter", "identity", "experience", "logistics", "venue", "badge", "footer"],
    "identity-music-offer-logistics": ["presenter", "identity", "emotion", "experience", "badge", "logistics", "venue", "footer"],
    "identity-date-venue": ["presenter", "identity", "emotion", "logistics", "venue", "badge", "footer"],
    "identity-product-logistics": ["presenter", "identity", "emotion", "badge", "experience", "logistics", "venue", "footer"],
    "identity-artist-logistics": ["presenter", "identity", "emotion", "experience", "logistics", "venue", "footer"],
    "minimal-editorial": ["presenter", "identity", "emotion", "experience", "logistics", "venue", "badge"],
    "dense-club": ["presenter", "identity", "emotion", "experience", "badge", "logistics", "venue", "footer"],
    "split-information": ["presenter", "identity", "emotion", "experience", "logistics", "venue", "badge", "footer"],
    "footer-heavy": ["presenter", "identity", "emotion", "experience", "badge", "footer", "logistics", "venue"],
  };
  return map[pattern].map((id) => groups[id]).filter(Boolean);
}

function group(input: Omit<CopyGroup, "facts" | "mergePolicy"> & Partial<Pick<CopyGroup, "facts" | "mergePolicy">>): CopyGroup {
  return {
    facts: [],
    mergePolicy: "none",
    ...input,
  };
}

function formatHeadline(value: string): string {
  const clean = normalizeWhitespace(value);
  const words = clean.split(" ");
  if (clean.includes("\n") || words.length <= 1) return clean.toUpperCase();
  if (words.length === 2) return `${words[0]}\n${words[1]}`.toUpperCase();
  if (words.length === 3) return `${words.slice(0, 2).join(" ")}\n${words[2]}`.toUpperCase();
  const midpoint = Math.ceil(words.length / 2);
  return `${words.slice(0, midpoint).join(" ")}\n${words.slice(midpoint).join(" ")}`.toUpperCase();
}

function inferDensity(input: CopyArchitectInput): CopyDensity {
  return (
    input.userPreferences?.maxVisibleGroups && input.userPreferences.maxVisibleGroups <= 4
      ? "minimal"
      : input.creativeDirection?.informationDensity ??
        (input.scene?.creativeDecisions?.densityPolicy?.policy as CopyDensity | undefined) ??
        "low"
  );
}
