import type { CompositionDecision, CreativeOpportunity, HeroDecision, SceneEvidence, SceneStory } from "./types.ts";

export function buildOpportunities(
  evidence: SceneEvidence,
  story: SceneStory,
  hero: HeroDecision,
  composition: CompositionDecision
): CreativeOpportunity[] {
  const opportunities: CreativeOpportunity[] = [
    {
      id: "large-headline",
      score: hero.type === "headline" ? 96 : 88,
      reason: "Strong headline is clearest memorable move.",
      target: "headline",
      parameters: { scale: hero.type === "headline" ? 1.14 : 1.06 },
    },
    {
      id: "venue-lockup",
      score: 68,
      reason: "Date, time, and venue should form one compact logistics module.",
      target: "metadata",
    },
  ];

  if (["luxury-tropical-brunch", "afrobeats-sunset", "latin-night", "premium-ladies-night"].includes(story)) {
    opportunities.push({
      id: "script-accent",
      score: story === "luxury-tropical-brunch" ? 84 : 78,
      reason: "One organic script accent can contrast the strong headline.",
      target: "accent",
      parameters: { maxHeadlineRatio: 0.42, rotation: -4 },
    });
  }
  if (composition.overlapPolicy !== "none" && hero.type === "subject") {
    opportunities.push({
      id: "subject-type-overlap",
      score: composition.overlapPolicy === "controlled" ? 80 : 67,
      reason: "Small controlled overlap can connect typography and subject.",
      target: "accent",
      parameters: { maxOverlapRatio: composition.overlapPolicy === "controlled" ? 0.12 : 0.06 },
    });
  }
  if (evidence.subjects.some((subject) => subject.torsoRect)) {
    opportunities.push({
      id: "shoulder-overlap",
      score: 62,
      reason: "Shoulder can accept a small accent overlap.",
      target: "accent",
      parameters: { maxOverlapRatio: 0.1 },
    });
  }
  if (evidence.subjects.some((subject) => subject.crop === "close" && subject.silhouetteComplexity > 0.5)) {
    opportunities.push({
      id: "hair-edge-overlap",
      score: 58,
      reason: "Hair silhouette can create depth behind a controlled headline edge.",
      target: "headline",
      parameters: { maxOverlapRatio: 0.04 },
    });
  }
  if (/\bentry\b/i.test(evidence.eventText) || evidence.eventText.includes("$")) {
    opportunities.push({
      id: "corner-badge",
      score: 70,
      reason: "Price information can become a secondary corner anchor.",
      target: "badge",
      parameters: { maxPowerRatio: 0.22 },
    });
  }
  if (["vip-bottle-service", "editorial-fashion", "rnb-lounge", "luxury-tropical-brunch"].includes(story)) {
    opportunities.push({
      id: "editorial-spacing",
      score: 82,
      reason: "Restraint, margins, and rhythm can become signature move.",
      target: "full-stack",
    });
  }
  if (evidence.image.warmth > 0.58) {
    opportunities.push({
      id: "warm-highlight",
      score: 74,
      reason: "Warm image light supports ivory typography.",
      target: "headline",
    });
  }
  if (evidence.image.dominantColors.length >= 2) {
    opportunities.push({
      id: "image-led-palette",
      score: 88,
      reason: "Image already provides enough color information.",
      target: "palette",
    });
  }
  if (evidence.image.visualNoise > 0.52 || evidence.image.depth > 0.62) {
    opportunities.push({
      id: "minimal-effects",
      score: 86,
      reason: "Image already supplies texture and depth.",
      target: "effects",
    });
  }
  if (["afrobeats-sunset", "latin-night", "edm-rave"].includes(story)) {
    opportunities.push({
      id: "diagonal-accent",
      score: 72,
      reason: "One diagonal accent can express rhythm.",
      target: "accent",
      parameters: { rotation: -7 },
    });
  }
  if (["hiphop-showcase", "edm-rave", "throwback-party"].includes(story)) {
    opportunities.push({
      id: "cropped-headline",
      score: 75,
      reason: "Oversized cropped display type can become memorable move.",
      target: "headline",
      parameters: { edgeRisk: 0.18 },
    });
  }
  if (evidence.objects.some((object) => object.type === "bottle" || object.type === "cocktail")) {
    opportunities.push({
      id: "product-callout",
      score: 61,
      reason: "Drink/product can support story without competing.",
      target: "product",
    });
  }

  return opportunities.sort((a, b) => b.score - a.score);
}
