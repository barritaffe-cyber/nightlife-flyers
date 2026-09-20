import type { RuleTrace, SceneInterpretation, SceneInterpreterInput } from "./types.ts";
import { computeSceneConfidence } from "./confidence.ts";
import { decideComposition } from "./composition.ts";
import { buildConstraints } from "./constraints.ts";
import { chooseHero } from "./hero.ts";
import { normalizeSceneInput } from "./normalize.ts";
import { buildOpportunities } from "./opportunities.ts";
import {
  colorStoryForScene,
  densityForStory,
  effectsForStory,
  hierarchyForStory,
  inferMarketingIntent,
  typographyPolicyForStory,
} from "./policies.ts";
import { buildProtectionZones } from "./protection.ts";
import { inferStoryHypotheses } from "./story.ts";
import { validateSceneInput, validateSceneInterpretation } from "./validate.ts";
import { analyzeVisualWeight } from "./visualWeight.ts";

export function interpretCocoScene(input: SceneInterpreterInput): SceneInterpretation {
  const inputErrors = validateSceneInput(input);
  if (inputErrors.length) {
    throw new Error(`Invalid Coco scene input:\n${inputErrors.join("\n")}`);
  }

  const evidence = normalizeSceneInput(input);
  const storyHypotheses = inferStoryHypotheses(evidence);
  const story = storyHypotheses[0]?.story ?? "general-nightlife";
  const hero = chooseHero(evidence, story);
  const visualWeight = analyzeVisualWeight(evidence);
  const composition = decideComposition(evidence, story, hero, visualWeight);
  const hierarchy = hierarchyForStory(story);
  const typographyPolicy = typographyPolicyForStory(story);
  const densityPolicy = densityForStory(story, evidence);
  const effectPolicy = effectsForStory(story, evidence);
  const colorStory = colorStoryForScene(story, evidence);
  const marketingIntent = inferMarketingIntent(evidence, story);
  const protectionZones = buildProtectionZones(evidence);
  const constraints = buildConstraints(evidence, story, hero, composition, densityPolicy, effectPolicy);
  const opportunities = buildOpportunities(evidence, story, hero, composition);
  const confidence = computeSceneConfidence(evidence, storyHypotheses);

  const reasoning = [
    `Story: ${story}. ${(storyHypotheses[0]?.evidence ?? []).join(" ")}`,
    `Marketing intent: ${marketingIntent}.`,
    `Hero: ${hero.type}. ${hero.reason}`,
    visualWeight.reason,
    `Composition: ${composition.preferredPattern} in ${composition.typeField} field. ${composition.reason}`,
    `Hierarchy: headline ${hierarchy.headlinePower}, accent <= ${hierarchy.accentMaxRatio}, body <= ${hierarchy.bodyMaxRatio}.`,
    `Typography policy: ${typographyPolicy}.`,
    `Density: ${densityPolicy.policy}. ${densityPolicy.reason}`,
    `Effects: ${effectPolicy.policy}. ${effectPolicy.reason}`,
    `Color story: ${colorStory.id}. ${colorStory.reason}`,
  ];

  const trace: RuleTrace[] = [
    {
      ruleId: "story-selection",
      fired: true,
      score: storyHypotheses[0]?.score ?? 0,
      reason: `Selected ${story}.`,
      outputs: storyHypotheses[0]?.evidence,
    },
    {
      ruleId: "hero-selection",
      fired: true,
      score: hero.confidence * 100,
      reason: hero.reason,
      outputs: [hero.type],
    },
    {
      ruleId: "visual-weight",
      fired: true,
      score: visualWeight.confidence * 100,
      reason: visualWeight.reason,
      outputs: [visualWeight.side],
    },
    {
      ruleId: "composition-selection",
      fired: true,
      score: composition.typeFieldConfidence * 100,
      reason: composition.reason,
      outputs: [composition.typeField, composition.preferredPattern],
    },
    {
      ruleId: "restraint-policy",
      fired: effectPolicy.policy === "restrained" || ["low", "minimal"].includes(densityPolicy.policy),
      reason: `${effectPolicy.policy} effects and ${densityPolicy.policy} density.`,
      outputs: [effectPolicy.policy, densityPolicy.policy],
    },
  ];

  const result: SceneInterpretation = {
    version: "1.0",
    confidence: confidence.confidence,
    evidence,
    storyHypotheses,
    creativeDecisions: {
      story,
      marketingIntent,
      hero,
      composition,
      hierarchy,
      typographyPolicy,
      densityPolicy,
      effectPolicy,
      colorStory,
    },
    protectionZones,
    constraints,
    opportunities,
    reasoning,
    warnings: confidence.warnings,
    trace,
  };

  const resultErrors = validateSceneInterpretation(result);
  if (resultErrors.length) {
    throw new Error(`Invalid Coco scene interpretation:\n${resultErrors.join("\n")}`);
  }

  return result;
}
