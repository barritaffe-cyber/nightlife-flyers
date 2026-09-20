import type {
  TypographyDirectorInput,
  TypographyLayer,
  TypographySystem,
} from "./types.ts";

export function applyTypographySignatureMove(
  system: Omit<TypographySystem, "score">,
  input: TypographyDirectorInput
): Omit<TypographySystem, "score"> {
  const move = input.creativeDirection?.signatureMove?.move ?? "none";
  const parameters = input.creativeDirection?.signatureMove?.parameters ?? {};

  const next = cloneSystem(system);

  if (move === "oversized-headline") {
    next.headline.sizeScale *= numberParam(parameters.scale, 1.08);
    next.headline.tracking += numberParam(parameters.trackingDelta, -0.01);
    next.headline.visualPower = Math.max(next.headline.visualPower, 100);
  }

  if (move === "script-cross" && next.accent) {
    next.accent.sizeScale *= numberParam(parameters.accentScale, 0.88);
    next.accent.rotationDeg = numberParam(parameters.rotation, -5);
    next.accent.offsetX += 2.5;
    next.accent.offsetY -= 1;
    next.accent.visualPower = Math.min(next.accent.visualPower, next.headline.visualPower * 0.42);
  }

  if (move === "diagonal-accent" && next.accent) {
    next.accent.rotationDeg = numberParam(parameters.rotation, -7);
    next.accent.offsetX += numberParam(parameters.offset, 2);
  }

  if (move === "cropped-type") {
    next.headline.sizeScale *= numberParam(parameters.scale, 1.14);
    next.headline.tracking -= 0.015;
    next.headline.offsetX -= 1.5;
  }

  if (move === "luxury-serif-scale") {
    next.headline.sizeScale *= numberParam(parameters.scale, 1.08);
    next.headline.tracking += numberParam(parameters.trackingDelta, 0.025);
    next.headline.effects.glow = Math.max(0, next.headline.effects.glow + numberParam(parameters.glowDelta, -0.04));
  }

  if (move === "editorial-spacing") {
    next.headline.spacingAfter += 0.6;
    if (next.accent) next.accent.sizeScale *= numberParam(parameters.accentScale, 0.78);
    if (next.metadata) next.metadata.spacingBefore += 0.6;
  }

  if (move === "single-electric-glow") {
    next.headline.effects.glow += numberParam(parameters.glowBoost, 0.14);
    for (const layer of allOptionalLayers(next)) {
      layer.effects.glow = 0;
    }
  }

  if (move === "subject-type-depth") {
    next.headline.offsetX += 1.5;
  }

  if (move === "corner-badge" && next.badge) {
    next.badge.sizeScale *= numberParam(parameters.badgeScale, 0.84);
    next.badge.offsetX += 2;
    next.badge.offsetY -= 2;
  }

  next.signatureMove = {
    id: move,
    target: mapTarget(input.creativeDirection?.signatureMove?.target),
    parameters: Object.fromEntries(
      Object.entries(parameters).map(([key, value]) => [key, normalizeParam(value)])
    ),
  };

  return next;
}

function mapTarget(value: string | undefined): TypographyLayer["role"] | "full-stack" {
  if (value === "headline" || value === "accent" || value === "metadata" || value === "dateTime" || value === "venue" || value === "badge" || value === "presenter" || value === "footer") {
    return value;
  }
  return "full-stack";
}

function numberParam(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

function normalizeParam(value: unknown): string | number | boolean {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return String(value ?? "");
}

function cloneSystem(system: Omit<TypographySystem, "score">): Omit<TypographySystem, "score"> {
  return JSON.parse(JSON.stringify(system));
}

function allOptionalLayers(system: Omit<TypographySystem, "score">): TypographyLayer[] {
  return [
    system.accent,
    system.metadata,
    system.dateTime,
    system.venue,
    system.badge,
    system.presenter,
    system.footer,
  ].filter(Boolean) as TypographyLayer[];
}
