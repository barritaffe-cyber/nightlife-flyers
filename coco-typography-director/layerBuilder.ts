import type {
  CopyGroupLike,
  TypographyDirectorInput,
  TypographyLayer,
  TypographyPersonality,
  TypographyRole,
} from "./types.ts";
import type { FontChoice } from "./fontSelection.ts";
import { clamp } from "./utils.ts";

export function buildTypographyLayer(
  role: TypographyRole,
  copyGroups: CopyGroupLike[],
  personality: TypographyPersonality,
  fontChoice: FontChoice,
  input: TypographyDirectorInput
): TypographyLayer | undefined {
  const relevant = groupsForRole(role, copyGroups);
  const visible = relevant.filter((group) => group.treatment !== "hide");
  if (!visible.length) return undefined;

  const text = visible.map((group) => group.text).filter(Boolean).join("\n");
  if (!text) return undefined;

  const hierarchy = resolveHierarchy(input);
  const roleConfig = roleConfiguration(role, hierarchy, input);
  const alignment =
    input.composition?.alignment ??
    input.scene?.creativeDecisions?.composition?.stackAlignment ??
    "left";

  return {
    role,
    sourceGroupIds: visible.map((group) => group.id),
    text,
    fontFamily: fontChoice.font.family,
    fallbackFamilies: resolveFallbacks(role, input),
    personality,
    category: fontChoice.font.category,
    sizeScale: roleConfig.sizeScale,
    weight: chooseWeight(fontChoice.font.weights, roleConfig.targetWeight),
    style: role === "accent" && fontChoice.font.italic ? "italic" : "normal",
    tracking: roleConfig.tracking,
    lineHeight: roleConfig.lineHeight,
    case: roleConfig.case,
    align: alignment,
    visualPower: roleConfig.visualPower,
    maxLines: Math.max(...visible.map((group) => group.maxLines ?? roleConfig.maxLines)),
    effects: roleEffects(role, input),
    spacingBefore: Math.min(...visible.map((group) => group.spacingBefore ?? 0)),
    spacingAfter: Math.max(...visible.map((group) => group.spacingAfter ?? 0)),
    offsetX: 0,
    offsetY: 0,
    rotationDeg: 0,
    reasoning: [
      `${fontChoice.font.family} selected for ${role}.`,
      ...fontChoice.reason,
      `Visual power is ${roleConfig.visualPower}.`,
    ],
  };
}

function groupsForRole(role: TypographyRole, groups: CopyGroupLike[]): CopyGroupLike[] {
  const roles: Record<TypographyRole, string[]> = {
    headline: ["identity"],
    accent: ["emotion"],
    metadata: ["experience", "music", "offer"],
    dateTime: ["logistics"],
    venue: ["venue"],
    badge: ["badge"],
    presenter: ["presenter"],
    footer: ["footer", "social", "age", "sponsor"],
  };
  return groups.filter((group) => roles[role].includes(group.role));
}

function resolveHierarchy(input: TypographyDirectorInput) {
  const hierarchy = input.creativeDirection?.hierarchy ?? input.scene?.creativeDecisions?.hierarchy ?? {};
  return {
    headlinePower: hierarchy.headlinePower ?? 100,
    accentMaxRatio: hierarchy.accentMaxRatio ?? 0.44,
    bodyMaxRatio: hierarchy.bodyMaxRatio ?? 0.29,
    dateMaxRatio: hierarchy.dateMaxRatio ?? 0.27,
    venueMaxRatio: hierarchy.venueMaxRatio ?? 0.22,
    badgeMaxRatio: hierarchy.badgeMaxRatio ?? 0.24,
    presenterMaxRatio: hierarchy.presenterMaxRatio ?? 0.15,
    headlineMustWinBy: input.creativeDirection?.hierarchy?.headlineMustWinBy ?? 1.8,
  };
}

function roleConfiguration(
  role: TypographyRole,
  hierarchy: ReturnType<typeof resolveHierarchy>,
  input: TypographyDirectorInput
) {
  const density = input.creativeDirection?.informationDensity ?? input.scene?.creativeDecisions?.densityPolicy?.policy ?? "low";
  const trackingPolicy = input.creativeDirection?.typography?.trackingPolicy ?? "neutral";
  const bodyTracking = input.creativeDirection?.typography?.bodyTracking ?? 0.07;
  const bodyLineHeight = input.creativeDirection?.typography?.bodyLineHeight ?? 0.9;

  const headlineTracking =
    trackingPolicy === "tight" ? -0.035 :
    trackingPolicy === "wide" ? 0.025 :
    -0.01;

  const configs = {
    headline: {
      sizeScale: 1,
      targetWeight: 800,
      tracking: headlineTracking,
      lineHeight: 0.82,
      case: "uppercase" as const,
      visualPower: hierarchy.headlinePower,
      maxLines: 3,
    },
    accent: {
      sizeScale: 0.44,
      targetWeight: 500,
      tracking: 0,
      lineHeight: 0.9,
      case: "titlecase" as const,
      visualPower: hierarchy.headlinePower * Math.min(hierarchy.accentMaxRatio, 0.44),
      maxLines: 2,
    },
    metadata: {
      sizeScale: density === "minimal" ? 0.22 : 0.25,
      targetWeight: 600,
      tracking: Math.max(bodyTracking, 0.06),
      lineHeight: Math.min(bodyLineHeight, 0.92),
      case: "uppercase" as const,
      visualPower: hierarchy.headlinePower * Math.min(hierarchy.bodyMaxRatio, 0.3),
      maxLines: density === "minimal" ? 2 : 4,
    },
    dateTime: {
      sizeScale: 0.24,
      targetWeight: 650,
      tracking: Math.max(bodyTracking, 0.07),
      lineHeight: 0.9,
      case: "uppercase" as const,
      visualPower: hierarchy.headlinePower * hierarchy.dateMaxRatio,
      maxLines: 2,
    },
    venue: {
      sizeScale: 0.2,
      targetWeight: 550,
      tracking: Math.max(bodyTracking, 0.09),
      lineHeight: 0.9,
      case: "uppercase" as const,
      visualPower: hierarchy.headlinePower * hierarchy.venueMaxRatio,
      maxLines: 2,
    },
    badge: {
      sizeScale: 0.22,
      targetWeight: 700,
      tracking: 0.04,
      lineHeight: 0.88,
      case: "uppercase" as const,
      visualPower: hierarchy.headlinePower * hierarchy.badgeMaxRatio,
      maxLines: 2,
    },
    presenter: {
      sizeScale: 0.15,
      targetWeight: 500,
      tracking: 0.12,
      lineHeight: 0.95,
      case: "uppercase" as const,
      visualPower: hierarchy.headlinePower * hierarchy.presenterMaxRatio,
      maxLines: 1,
    },
    footer: {
      sizeScale: 0.14,
      targetWeight: 500,
      tracking: 0.09,
      lineHeight: 0.95,
      case: "uppercase" as const,
      visualPower: hierarchy.headlinePower * 0.14,
      maxLines: 2,
    },
  };

  return configs[role];
}

function roleEffects(role: TypographyRole, input: TypographyDirectorInput) {
  const effectPolicy = input.creativeDirection?.effects?.policy ?? input.scene?.creativeDecisions?.effectPolicy?.policy ?? "moderate";
  const maxGlow = input.creativeDirection?.effects?.maxGlow ?? 0.18;
  const maxShadow = input.creativeDirection?.effects?.maxShadow ?? 0.36;

  const restrained = effectPolicy === "none" || effectPolicy === "restrained";

  if (role === "headline") {
    return {
      glow: restrained ? Math.min(maxGlow, 0.08) : Math.min(maxGlow, 0.22),
      shadow: Math.min(maxShadow, 0.4),
      stroke: 0.02,
      blur: 0,
      opacity: 1,
      uppercaseTransform: true,
    };
  }

  if (role === "accent") {
    return {
      glow: restrained ? 0.03 : Math.min(maxGlow, 0.12),
      shadow: Math.min(maxShadow, 0.28),
      stroke: 0,
      blur: 0,
      opacity: 1,
      uppercaseTransform: false,
    };
  }

  return {
    glow: 0,
    shadow: Math.min(maxShadow, 0.18),
    stroke: 0,
    blur: 0,
    opacity: role === "presenter" || role === "footer" ? 0.86 : 1,
    uppercaseTransform: true,
  };
}

function chooseWeight(weights: number[], target: number): number {
  const available = weights.length ? weights : [400, 500, 600, 700];
  return available.sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0];
}

function resolveFallbacks(role: TypographyRole, input: TypographyDirectorInput): string[] {
  const explicit = input.availableFonts.fallbackFamilies?.[role];
  const safeExplicit = explicit?.filter(
    (family) =>
      !family.split(",").some(
        (candidate) =>
          candidate.trim().replace(/^['"]|['"]$/g, "").toLowerCase() === "inter"
      )
  );
  if (safeExplicit?.length) return safeExplicit;
  if (role === "accent") return ["cursive", "sans-serif"];
  if (role === "headline") return ["Arial Narrow", "Impact", "sans-serif"];
  if (role === "footer" || role === "venue") {
    return ["LEMONMILK-Light", "LEMONMILK-Regular", "sans-serif"];
  }
  return ["LEMONMILK-Regular", "Bebas Neue", "sans-serif"];
}
