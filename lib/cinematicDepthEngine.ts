import type {
  BlendMode,
  ImageLayer,
  PosterCandidate,
  PosterSize,
  Rect,
  SceneLayer,
  TextLayer,
} from "./artDirectorEngine";

export type DepthFxKind =
  | "distantFog"
  | "midFog"
  | "foregroundFog"
  | "backGlow"
  | "subjectShadow"
  | "rimLight"
  | "volumetricBeams"
  | "particlesFar"
  | "particlesNear"
  | "vignette"
  | "grain"
  | "contrastWash";

export type CinematicDepthMood = "red_glamour" | "gold_luxe" | "neon_club" | "dark_editorial";

export type DepthPlane = {
  id: string;
  kind: DepthFxKind;
  zIndex: number;
  depth: number;
  bounds: Rect;
  opacity: number;
  color: string;
  blendMode: BlendMode;
  blur: number;
  intensity: number;
  seed: number;
  meta?: Record<string, unknown>;
};

export type CinematicDepthOptions = {
  enabled?: boolean;
  mood?: CinematicDepthMood;
  intensity?: number;
  fogAmount?: number;
  glowAmount?: number;
  particleAmount?: number;
  protectText?: boolean;
  protectFace?: boolean;
};

export type CinematicDepthEditorFx = {
  haze: number;
  grade: number;
  leak: number;
  vignette: boolean;
  vignetteStrength: number;
  contrast: number;
  saturation: number;
  vibrance: number;
  filmGrade: number;
};

export function applyCinematicDepth(
  candidate: PosterCandidate,
  options: CinematicDepthOptions = {}
): PosterCandidate {
  if (options.enabled === false) return cloneCandidate(candidate);

  const c = cloneCandidate(candidate);
  const mood = options.mood ?? inferDepthMood(candidate);
  const palette = getDepthPalette(mood);
  const intensity = clamp(options.intensity ?? 0.86, 0, 1);
  const fogAmount = clamp(options.fogAmount ?? 0.72, 0, 1);
  const glowAmount = clamp(options.glowAmount ?? 0.88, 0, 1);
  const particleAmount = clamp(options.particleAmount ?? 0.56, 0, 1);

  const subject = findSubjectLayer(c);
  const subjectBounds = subject?.bounds ?? centerRect(c.size, 0.52, 0.58);
  const focal = getFocalPoint(subjectBounds);

  const depthPlanes: DepthPlane[] = [
    {
      id: "depth_distant_fog",
      kind: "distantFog",
      zIndex: 7,
      depth: 0.12,
      bounds: expandRect(fullRect(c.size), c.size.width * 0.08, c.size.height * 0.06),
      opacity: 0.26 * fogAmount * intensity,
      color: palette.fog,
      blendMode: "screen",
      blur: 34,
      intensity: 0.5,
      seed: 11,
    },
    {
      id: "depth_volumetric_beams",
      kind: "volumetricBeams",
      zIndex: 18,
      depth: 0.34,
      bounds: fullRect(c.size),
      opacity: 0.22 * glowAmount * intensity,
      color: palette.beam,
      blendMode: "screen",
      blur: 18,
      intensity: 0.75,
      seed: 33,
    },
    {
      id: "depth_mid_fog",
      kind: "midFog",
      zIndex: 19,
      depth: 0.38,
      bounds: {
        x: -c.size.width * 0.08,
        y: c.size.height * 0.2,
        width: c.size.width * 1.16,
        height: c.size.height * 0.58,
      },
      opacity: 0.34 * fogAmount * intensity,
      color: palette.fog,
      blendMode: "screen",
      blur: 24,
      intensity: 0.72,
      seed: 22,
    },
    {
      id: "depth_particles_far",
      kind: "particlesFar",
      zIndex: 21,
      depth: 0.46,
      bounds: {
        x: 0,
        y: c.size.height * 0.18,
        width: c.size.width,
        height: c.size.height * 0.62,
      },
      opacity: 0.32 * particleAmount * intensity,
      color: palette.particle,
      blendMode: "screen",
      blur: 1.6,
      intensity: 0.62,
      seed: 44,
    },
    {
      id: "depth_back_glow",
      kind: "backGlow",
      zIndex: 24,
      depth: 0.55,
      bounds: expandRect(subjectBounds, c.size.width * 0.26, c.size.height * 0.18),
      opacity: 0.72 * glowAmount * intensity,
      color: palette.glow,
      blendMode: "screen",
      blur: 80,
      intensity: 1,
      seed: 55,
      meta: { focal },
    },
    {
      id: "depth_rim_light",
      kind: "rimLight",
      zIndex: 34,
      depth: 0.68,
      bounds: expandRect(subjectBounds, c.size.width * 0.025, c.size.height * 0.018),
      opacity: 0.42 * glowAmount * intensity,
      color: palette.rim,
      blendMode: "screen",
      blur: 14,
      intensity: 0.8,
      seed: 66,
    },
    {
      id: "depth_foreground_fog",
      kind: "foregroundFog",
      zIndex: 47,
      depth: 0.82,
      bounds: {
        x: -c.size.width * 0.12,
        y: c.size.height * 0.56,
        width: c.size.width * 1.24,
        height: c.size.height * 0.34,
      },
      opacity: 0.2 * fogAmount * intensity,
      color: palette.fog,
      blendMode: "screen",
      blur: 28,
      intensity: 0.55,
      seed: 77,
    },
    {
      id: "depth_particles_near",
      kind: "particlesNear",
      zIndex: 49,
      depth: 0.86,
      bounds: fullRect(c.size),
      opacity: 0.18 * particleAmount * intensity,
      color: palette.particle,
      blendMode: "screen",
      blur: 0,
      intensity: 0.48,
      seed: 88,
    },
    {
      id: "depth_vignette",
      kind: "vignette",
      zIndex: 92,
      depth: 0.95,
      bounds: fullRect(c.size),
      opacity: 0.56 * intensity,
      color: "#000000",
      blendMode: "multiply",
      blur: 0,
      intensity: 0.85,
      seed: 99,
      meta: { focal },
    },
    {
      id: "depth_grain",
      kind: "grain",
      zIndex: 96,
      depth: 0.98,
      bounds: fullRect(c.size),
      opacity: 0.075 * intensity,
      color: "#FFFFFF",
      blendMode: "overlay",
      blur: 0,
      intensity: 0.55,
      seed: 111,
    },
    {
      id: "depth_contrast_wash",
      kind: "contrastWash",
      zIndex: 98,
      depth: 1,
      bounds: fullRect(c.size),
      opacity: 0.12 * intensity,
      color: palette.contrast,
      blendMode: "soft-light",
      blur: 0,
      intensity: 0.5,
      seed: 122,
    },
  ];

  c.layers = c.layers.filter((layer) => {
    const slot = String(layer.meta?.blueprintSlot ?? layer.meta?.role ?? "");
    const replacesFlatFx =
      layer.meta?.cinematicDepth === true ||
      ["fog", "particles", "vignette", "texture"].includes(slot);
    return !replacesFlatFx;
  });

  if (subject) {
    c.layers.push(createSubjectShadowLayer(subject, c.size));
    subject.zIndex = 30;
    subject.filter = {
      ...(subject.filter ?? {}),
      brightness: Math.max(subject.filter?.brightness ?? 1, 1.04),
      contrast: Math.max(subject.filter?.contrast ?? 1, 1.12),
    };
  }

  c.layers.push(...depthPlanes.map(depthPlaneToLayer));

  if (options.protectText ?? true) {
    protectTextLayers(c.layers);
  }

  c.layers = c.layers.sort((a, b) => a.zIndex - b.zIndex);
  return c;
}

export function enhanceBlueprintPoster(candidate: PosterCandidate): PosterCandidate {
  return applyCinematicDepth(candidate, {
    enabled: true,
    mood: inferDepthMood(candidate),
    intensity: candidate.score?.rejected ? 0.72 : 0.9,
    fogAmount: 0.72,
    glowAmount: 0.88,
    particleAmount: 0.55,
    protectText: true,
    protectFace: true,
  });
}

export function getCinematicDepthEditorFx(candidateOrMood: PosterCandidate | CinematicDepthMood): CinematicDepthEditorFx {
  const mood = typeof candidateOrMood === "string" ? candidateOrMood : inferDepthMood(candidateOrMood);

  switch (mood) {
    case "gold_luxe":
      return {
        haze: 0.22,
        grade: 0.46,
        leak: 0.18,
        vignette: true,
        vignetteStrength: 0.58,
        contrast: 1.1,
        saturation: 1.1,
        vibrance: 0.2,
        filmGrade: 0.62,
      };
    case "neon_club":
      return {
        haze: 0.28,
        grade: 0.5,
        leak: 0.22,
        vignette: true,
        vignetteStrength: 0.56,
        contrast: 1.12,
        saturation: 1.18,
        vibrance: 0.28,
        filmGrade: 0.6,
      };
    case "dark_editorial":
      return {
        haze: 0.14,
        grade: 0.36,
        leak: 0.06,
        vignette: true,
        vignetteStrength: 0.62,
        contrast: 1.08,
        saturation: 0.92,
        vibrance: 0.08,
        filmGrade: 0.56,
      };
    case "red_glamour":
    default:
      return {
        haze: 0.24,
        grade: 0.48,
        leak: 0.18,
        vignette: true,
        vignetteStrength: 0.6,
        contrast: 1.1,
        saturation: 1.14,
        vibrance: 0.22,
        filmGrade: 0.62,
      };
  }
}

export function inferDepthMood(candidate: PosterCandidate): CinematicDepthMood {
  const vibe = candidate.brief.vibe;
  const text = `${candidate.brief.title} ${candidate.brief.accentTitle ?? ""} ${candidate.brief.callToAction ?? ""}`.toLowerCase();

  if (vibe === "neon_club" || vibe === "trap_urban") return "neon_club";
  if (vibe === "fashion_editorial") return "dark_editorial";
  if (vibe === "miami_luxe" || vibe === "luxury_lounge" || vibe === "rooftop_sunset") {
    return /\b(ladies|girls|pink|night)\b/.test(text) ? "red_glamour" : "gold_luxe";
  }
  return "red_glamour";
}

function depthPlaneToLayer(plane: DepthPlane): ImageLayer {
  return {
    id: plane.id,
    type: plane.kind === "vignette" || plane.kind === "grain" || plane.kind === "contrastWash" ? "fx" : "atmosphere",
    zIndex: plane.zIndex,
    bounds: plane.bounds,
    opacity: plane.opacity,
    fit: "cover",
    blendMode: plane.blendMode,
    filter: { blur: plane.blur },
    meta: {
      cinematicDepth: true,
      depthKind: plane.kind,
      depth: plane.depth,
      color: plane.color,
      intensity: plane.intensity,
      seed: plane.seed,
      ...plane.meta,
    },
  };
}

function createSubjectShadowLayer(subject: ImageLayer, size: PosterSize): ImageLayer {
  return {
    ...subject,
    id: `${subject.id}_cinematic_shadow`,
    zIndex: 27,
    bounds: {
      ...subject.bounds,
      x: subject.bounds.x + size.width * 0.018,
      y: subject.bounds.y + size.height * 0.016,
    },
    opacity: 0.36,
    filter: {
      blur: 18,
      brightness: 0,
      contrast: 1,
      saturation: 0,
    },
    meta: {
      ...(subject.meta ?? {}),
      cinematicDepth: true,
      depthKind: "subjectShadow",
      dominant: false,
      role: "subjectShadow",
    },
  };
}

function protectTextLayers(layers: SceneLayer[]) {
  for (const layer of layers) {
    if (!isTextLayer(layer)) continue;

    const slot = String(layer.meta?.blueprintSlot ?? layer.meta?.role ?? "");
    if (slot === "ghostTitle") {
      layer.zIndex = Math.min(layer.zIndex, 13);
      layer.opacity = Math.min(layer.opacity, 0.6);
      continue;
    }

    if (slot === "scriptAccent") {
      layer.zIndex = Math.max(layer.zIndex, 50);
      layer.shadow = layer.shadow ?? {
        color: "rgba(255,255,255,0.9)",
        blur: 16,
        offsetX: 0,
        offsetY: 0,
      };
      continue;
    }

    if (["dateBlock", "artistBlock", "footerTitle", "addressLine", "offerLine", "presenter"].includes(slot)) {
      layer.zIndex = Math.max(layer.zIndex, 54);
      layer.shadow = layer.shadow ?? {
        color: "rgba(0,0,0,0.72)",
        blur: 10,
        offsetX: 0,
        offsetY: 4,
      };
    }
  }
}

function getDepthPalette(mood: CinematicDepthMood) {
  switch (mood) {
    case "gold_luxe":
      return {
        fog: "#F5A623",
        glow: "#FFC85A",
        rim: "#FFE0A3",
        beam: "#F8C15C",
        particle: "#FFD27A",
        contrast: "#B46A12",
      };
    case "neon_club":
      return {
        fog: "#FF2BD6",
        glow: "#00E5FF",
        rim: "#FFFFFF",
        beam: "#FF2BD6",
        particle: "#00E5FF",
        contrast: "#7B2BFF",
      };
    case "dark_editorial":
      return {
        fog: "#FFFFFF",
        glow: "#B8B8B8",
        rim: "#FFFFFF",
        beam: "#CFCFCF",
        particle: "#FFFFFF",
        contrast: "#888888",
      };
    case "red_glamour":
    default:
      return {
        fog: "#FF174F",
        glow: "#FF0048",
        rim: "#FF6A8E",
        beam: "#FF174F",
        particle: "#FF2A62",
        contrast: "#A90032",
      };
  }
}

function findSubjectLayer(candidate: PosterCandidate): ImageLayer | undefined {
  return candidate.layers.find((layer) => {
    const slot = String(layer.meta?.blueprintSlot ?? layer.meta?.role ?? "");
    return layer.type === "subject" && (slot === "subject" || Boolean(layer.meta?.dominant));
  }) as ImageLayer | undefined;
}

function isTextLayer(layer: SceneLayer): layer is TextLayer {
  return ["ghostText", "headline", "scriptAccent", "metadata", "footer"].includes(layer.type);
}

function cloneCandidate(candidate: PosterCandidate): PosterCandidate {
  return {
    ...candidate,
    score: candidate.score ? { ...candidate.score, failures: [...candidate.score.failures], notes: [...candidate.score.notes] } : undefined,
    layers: candidate.layers.map((layer) => {
      if (isTextLayer(layer)) {
        return {
          ...layer,
          bounds: { ...layer.bounds },
          meta: { ...layer.meta },
          shadow: layer.shadow ? { ...layer.shadow } : undefined,
          stroke: layer.stroke ? { ...layer.stroke } : undefined,
        };
      }
      return {
        ...layer,
        bounds: { ...layer.bounds },
        meta: { ...layer.meta },
        filter: layer.filter ? { ...layer.filter } : undefined,
      };
    }) as SceneLayer[],
  };
}

function centerRect(size: PosterSize, widthRatio: number, heightRatio: number): Rect {
  const width = size.width * widthRatio;
  const height = size.height * heightRatio;
  return {
    x: (size.width - width) / 2,
    y: (size.height - height) / 2,
    width,
    height,
  };
}

function fullRect(size: PosterSize): Rect {
  return { x: 0, y: 0, width: size.width, height: size.height };
}

function expandRect(rect: Rect, dx: number, dy: number): Rect {
  return {
    x: rect.x - dx,
    y: rect.y - dy,
    width: rect.width + dx * 2,
    height: rect.height + dy * 2,
  };
}

function getFocalPoint(rect: Rect) {
  return {
    x: rect.x + rect.width * 0.5,
    y: rect.y + rect.height * 0.42,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
