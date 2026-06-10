export type PosterSize = {
  width: number;
  height: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Point = {
  x: number;
  y: number;
};

export type EventType =
  | "club"
  | "brunch"
  | "concert"
  | "lounge"
  | "dayparty"
  | "birthday"
  | "festival"
  | "restaurant"
  | "popup";

export type Vibe =
  | "miami_luxe"
  | "neon_club"
  | "latin_night"
  | "afrobeats"
  | "luxury_lounge"
  | "trap_urban"
  | "fashion_editorial"
  | "rooftop_sunset";

export type Audience = "upscale" | "college" | "tourist" | "locals" | "vip" | "mixed";

export type SubjectKind = "person" | "dj" | "bottle" | "crowd" | "car" | "food" | "none";

export type CompositionMode =
  | "CENTER_HERO"
  | "LEFT_DOMINANT"
  | "RIGHT_DOMINANT"
  | "DUO_SPLIT"
  | "CLOSEUP_CROP"
  | "NEGATIVE_SPACE"
  | "DIAGONAL_DRAMA";

export type MetadataStyle =
  | "side_rail"
  | "footer_system"
  | "stacked_blocks"
  | "minimal_footer"
  | "badge_cluster";

export type CreativeBrief = {
  eventType: EventType;
  vibe: Vibe;
  audience: Audience;
  energy: 1 | 2 | 3 | 4 | 5;
  venueTier: "casual" | "premium" | "luxury";
  mainSubject: SubjectKind;
  title: string;
  accentTitle?: string;
  date?: string;
  time?: string;
  venue?: string;
  location?: string;
  price?: string;
  ageLimit?: string;
  callToAction?: string;
  lineup?: string[];
  socials?: string[];
};

export type SubjectAnalysis = {
  kind: SubjectKind;
  imageUrl?: string;
  originalBounds?: Rect;
  faceBox?: Rect;
  torsoBox?: Rect;
  visualWeightCenter?: Point;
  confidence: number;
};

export type AssetPack = {
  id: string;
  backgroundImages?: string[];
  foregroundOverlays?: string[];
  fogOverlays?: string[];
  glowOverlays?: string[];
  accentImages?: string[];
  textureImages?: string[];
};

export type StyleDNA = {
  scaleDrama: number;
  textOverlap: number;
  glowAmount: number;
  negativeSpace: number;
  symmetry: number;
  luxuryRestraint: number;
  chaos: number;
  typographyAggression: number;
  density: number;
};

export type ArtDirectionPreset = {
  id: Vibe;
  label: string;
  defaultComposition: CompositionMode[];
  palette: string[];
  typography: {
    displayFont: string;
    supportFont: string;
    scriptFont?: string;
    headlineCase: "uppercase" | "titlecase" | "lowercase";
    headlineTracking: number;
    metadataTracking: number;
  };
  metadataStyle: MetadataStyle;
  dna: StyleDNA;
  layerRecipe: LayerRecipeStep[];
};

export type LayerType =
  | "background"
  | "ghostText"
  | "atmosphere"
  | "accent"
  | "subject"
  | "headline"
  | "scriptAccent"
  | "metadata"
  | "footer"
  | "texture"
  | "fx";

export type LayerRecipeStep = {
  type: LayerType;
  required: boolean;
};

export type BlendMode =
  | "source-over"
  | "screen"
  | "overlay"
  | "multiply"
  | "soft-light"
  | "color-dodge";

export type TextAlign = "left" | "center" | "right";

export type BaseLayer = {
  id: string;
  type: LayerType;
  zIndex: number;
  bounds: Rect;
  opacity: number;
  rotation?: number;
  blendMode?: BlendMode;
  locked?: boolean;
  meta?: Record<string, unknown>;
};

export type TextLayer = BaseLayer & {
  type: "ghostText" | "headline" | "scriptAccent" | "metadata" | "footer";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number | string;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  align?: TextAlign;
  textTransform?: "uppercase" | "none";
  stroke?: {
    color: string;
    width: number;
  };
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
};

export type ImageLayer = BaseLayer & {
  type: "background" | "atmosphere" | "accent" | "subject" | "texture" | "fx";
  src?: string;
  fit?: "cover" | "contain" | "stretch";
  filter?: {
    blur?: number;
    brightness?: number;
    contrast?: number;
    saturation?: number;
  };
};

export type SceneLayer = TextLayer | ImageLayer;

export type PosterCandidate = {
  id: string;
  brief: CreativeBrief;
  preset: ArtDirectionPreset;
  compositionMode: CompositionMode;
  size: PosterSize;
  layers: SceneLayer[];
  score?: LayoutScore;
};

export type LayoutScore = {
  hierarchy: number;
  readability: number;
  subjectDominance: number;
  styleMatch: number;
  balance: number;
  premiumFeel: number;
  total: number;
  rejected: boolean;
  failures: string[];
  notes: string[];
};

export type ArtDirectorInput = {
  brief: CreativeBrief;
  size?: PosterSize;
  subject?: SubjectAnalysis;
  assetPack?: AssetPack;
  candidateCount?: number;
};

export type ArtDirectorOutput = {
  best: PosterCandidate;
  candidates: PosterCandidate[];
};

export const ART_DIRECTION_PRESETS: Record<Vibe, ArtDirectionPreset> = {
  miami_luxe: {
    id: "miami_luxe",
    label: "Miami Luxe",
    defaultComposition: ["CENTER_HERO", "LEFT_DOMINANT", "RIGHT_DOMINANT", "DIAGONAL_DRAMA"],
    palette: ["#050505", "#F5C76B", "#FF8A3D", "#FFFFFF"],
    typography: {
      displayFont: "Anton",
      supportFont: "Montserrat",
      scriptFont: "Great Vibes",
      headlineCase: "uppercase",
      headlineTracking: -6,
      metadataTracking: 5,
    },
    metadataStyle: "side_rail",
    dna: {
      scaleDrama: 9,
      textOverlap: 7,
      glowAmount: 7,
      negativeSpace: 4,
      symmetry: 4,
      luxuryRestraint: 7,
      chaos: 3,
      typographyAggression: 8,
      density: 6,
    },
    layerRecipe: defaultLayerRecipe(),
  },
  neon_club: {
    id: "neon_club",
    label: "Neon Club",
    defaultComposition: ["CENTER_HERO", "DIAGONAL_DRAMA", "CLOSEUP_CROP"],
    palette: ["#030014", "#00E5FF", "#FF2BD6", "#FFFFFF"],
    typography: {
      displayFont: "Bebas Neue",
      supportFont: "Inter",
      scriptFont: "Dear Script (Demo_Font)",
      headlineCase: "uppercase",
      headlineTracking: -5,
      metadataTracking: 4,
    },
    metadataStyle: "stacked_blocks",
    dna: {
      scaleDrama: 8,
      textOverlap: 8,
      glowAmount: 10,
      negativeSpace: 3,
      symmetry: 5,
      luxuryRestraint: 3,
      chaos: 7,
      typographyAggression: 9,
      density: 8,
    },
    layerRecipe: defaultLayerRecipe(),
  },
  latin_night: {
    id: "latin_night",
    label: "Latin Night",
    defaultComposition: ["LEFT_DOMINANT", "RIGHT_DOMINANT", "CENTER_HERO"],
    palette: ["#090302", "#FF3B1F", "#FFC247", "#FFFFFF"],
    typography: {
      displayFont: "Bebas Neue",
      supportFont: "Montserrat",
      scriptFont: "Pacifico",
      headlineCase: "uppercase",
      headlineTracking: -4,
      metadataTracking: 4,
    },
    metadataStyle: "side_rail",
    dna: {
      scaleDrama: 8,
      textOverlap: 7,
      glowAmount: 7,
      negativeSpace: 3,
      symmetry: 4,
      luxuryRestraint: 4,
      chaos: 6,
      typographyAggression: 8,
      density: 8,
    },
    layerRecipe: defaultLayerRecipe(),
  },
  afrobeats: {
    id: "afrobeats",
    label: "Afrobeats",
    defaultComposition: ["CENTER_HERO", "DIAGONAL_DRAMA", "RIGHT_DOMINANT"],
    palette: ["#080704", "#FFD449", "#20C997", "#FFFFFF"],
    typography: {
      displayFont: "Anton",
      supportFont: "Satoshi",
      scriptFont: "Brush Script MT",
      headlineCase: "uppercase",
      headlineTracking: -4,
      metadataTracking: 4,
    },
    metadataStyle: "badge_cluster",
    dna: {
      scaleDrama: 8,
      textOverlap: 6,
      glowAmount: 6,
      negativeSpace: 4,
      symmetry: 5,
      luxuryRestraint: 4,
      chaos: 6,
      typographyAggression: 7,
      density: 7,
    },
    layerRecipe: defaultLayerRecipe(),
  },
  luxury_lounge: {
    id: "luxury_lounge",
    label: "Luxury Lounge",
    defaultComposition: ["NEGATIVE_SPACE", "CENTER_HERO", "LEFT_DOMINANT"],
    palette: ["#0A0908", "#E8D8B0", "#C8A96A", "#FFFFFF"],
    typography: {
      displayFont: "Bodoni 72",
      supportFont: "Helvetica Neue",
      scriptFont: "Great Vibes",
      headlineCase: "uppercase",
      headlineTracking: 1,
      metadataTracking: 6,
    },
    metadataStyle: "minimal_footer",
    dna: {
      scaleDrama: 7,
      textOverlap: 4,
      glowAmount: 4,
      negativeSpace: 8,
      symmetry: 7,
      luxuryRestraint: 10,
      chaos: 1,
      typographyAggression: 5,
      density: 3,
    },
    layerRecipe: defaultLayerRecipe(),
  },
  trap_urban: {
    id: "trap_urban",
    label: "Trap / Urban",
    defaultComposition: ["CLOSEUP_CROP", "DIAGONAL_DRAMA", "CENTER_HERO"],
    palette: ["#050505", "#E6E6E6", "#FF2A2A", "#FFD400"],
    typography: {
      displayFont: "Impact",
      supportFont: "Arial Narrow",
      headlineCase: "uppercase",
      headlineTracking: -7,
      metadataTracking: 2,
    },
    metadataStyle: "stacked_blocks",
    dna: {
      scaleDrama: 10,
      textOverlap: 9,
      glowAmount: 5,
      negativeSpace: 2,
      symmetry: 3,
      luxuryRestraint: 2,
      chaos: 8,
      typographyAggression: 10,
      density: 9,
    },
    layerRecipe: defaultLayerRecipe(),
  },
  fashion_editorial: {
    id: "fashion_editorial",
    label: "Fashion Editorial",
    defaultComposition: ["NEGATIVE_SPACE", "LEFT_DOMINANT", "RIGHT_DOMINANT"],
    palette: ["#F2EFEA", "#111111", "#A88D5D", "#FFFFFF"],
    typography: {
      displayFont: "Didot",
      supportFont: "Helvetica Neue",
      scriptFont: "Snell Roundhand",
      headlineCase: "uppercase",
      headlineTracking: 2,
      metadataTracking: 7,
    },
    metadataStyle: "minimal_footer",
    dna: {
      scaleDrama: 8,
      textOverlap: 5,
      glowAmount: 2,
      negativeSpace: 9,
      symmetry: 6,
      luxuryRestraint: 9,
      chaos: 1,
      typographyAggression: 4,
      density: 3,
    },
    layerRecipe: defaultLayerRecipe(),
  },
  rooftop_sunset: {
    id: "rooftop_sunset",
    label: "Rooftop Sunset",
    defaultComposition: ["CENTER_HERO", "LEFT_DOMINANT", "NEGATIVE_SPACE"],
    palette: ["#120A18", "#FF7A45", "#FFD166", "#FFFFFF"],
    typography: {
      displayFont: "Bebas Neue",
      supportFont: "Montserrat",
      scriptFont: "Great Vibes",
      headlineCase: "uppercase",
      headlineTracking: -3,
      metadataTracking: 5,
    },
    metadataStyle: "side_rail",
    dna: {
      scaleDrama: 7,
      textOverlap: 5,
      glowAmount: 8,
      negativeSpace: 5,
      symmetry: 5,
      luxuryRestraint: 6,
      chaos: 3,
      typographyAggression: 6,
      density: 5,
    },
    layerRecipe: defaultLayerRecipe(),
  },
};

function defaultLayerRecipe(): LayerRecipeStep[] {
  return [
    { type: "background", required: true },
    { type: "ghostText", required: true },
    { type: "atmosphere", required: false },
    { type: "accent", required: false },
    { type: "subject", required: false },
    { type: "headline", required: true },
    { type: "scriptAccent", required: false },
    { type: "metadata", required: true },
    { type: "footer", required: true },
    { type: "texture", required: false },
    { type: "fx", required: false },
  ];
}

export class ArtDirectorEngine {
  generate(input: ArtDirectorInput): ArtDirectorOutput {
    const size = input.size ?? { width: 1080, height: 1350 };
    const candidateCount = clamp(input.candidateCount ?? 18, 4, 40);
    const preset = ART_DIRECTION_PRESETS[input.brief.vibe] ?? ART_DIRECTION_PRESETS.neon_club;
    const subject = input.subject ?? createFallbackSubject(input.brief.mainSubject);
    const candidates: PosterCandidate[] = [];

    for (let i = 0; i < candidateCount; i += 1) {
      const mode = pickCompositionMode(preset, i, subject);
      const candidate = this.generateCandidate({
        id: `candidate_${i + 1}`,
        brief: input.brief,
        preset,
        mode,
        size,
        subject,
        assetPack: input.assetPack,
        seed: i,
      });
      const refined = artDirectorPass(candidate, subject);
      refined.score = scoreLayout(refined, subject);
      candidates.push(refined);
    }

    candidates.sort((a, b) => {
      const aRejected = a.score?.rejected ? 1 : 0;
      const bRejected = b.score?.rejected ? 1 : 0;
      if (aRejected !== bRejected) return aRejected - bRejected;
      return (b.score?.total ?? 0) - (a.score?.total ?? 0);
    });
    return {
      best: candidates[0],
      candidates,
    };
  }

  private generateCandidate(args: {
    id: string;
    brief: CreativeBrief;
    preset: ArtDirectionPreset;
    mode: CompositionMode;
    size: PosterSize;
    subject: SubjectAnalysis;
    assetPack?: AssetPack;
    seed: number;
  }): PosterCandidate {
    const { id, brief, preset, mode, size, subject, assetPack, seed } = args;
    const palette = preset.palette;
    const layers: SceneLayer[] = [];
    const safe = getSafeArea(size);
    const subjectBounds = getSubjectBounds(size, mode, subject, preset.dna, seed);
    const headlineBounds = getHeadlineBounds(size, mode, subjectBounds, preset.dna, seed);
    const ghostBounds = getGhostTitleBounds(size, mode, preset.dna, seed);
    const metadataBounds = getMetadataBounds(size, mode, preset.metadataStyle, seed);
    const footerBounds = getFooterBounds(size, preset.metadataStyle);
    const accentBounds = getAccentBounds(size, mode, seed);

    layers.push({
      id: `${id}_background`,
      type: "background",
      zIndex: 0,
      bounds: fullRect(size),
      opacity: 1,
      src: pick(assetPack?.backgroundImages, seed),
      fit: "cover",
      filter: {
        brightness: preset.dna.luxuryRestraint > 7 ? 0.82 : 0.72,
        contrast: 1.15,
        saturation: preset.dna.glowAmount > 7 ? 1.25 : 1.05,
      },
      meta: {
        fallbackGradient: createGradientFromPalette(palette),
      },
    });

    layers.push({
      id: `${id}_ghost_title`,
      type: "ghostText",
      zIndex: 5,
      bounds: ghostBounds,
      opacity: mapRange(preset.dna.luxuryRestraint, 0, 10, 0.18, 0.07),
      text: transformTitle(brief.title, preset.typography.headlineCase),
      fontFamily: preset.typography.displayFont,
      fontSize: ghostBounds.height * 0.72,
      fontWeight: 900,
      lineHeight: 0.82,
      letterSpacing: preset.typography.headlineTracking - 4,
      color: palette[3] ?? "#FFFFFF",
      align: "center",
      textTransform: "uppercase",
      rotation: mode === "DIAGONAL_DRAMA" ? -8 : 0,
      blendMode: "screen",
      shadow: {
        color: palette[1] ?? "#FFFFFF",
        blur: preset.dna.glowAmount * 2,
        offsetX: 0,
        offsetY: 0,
      },
      meta: {
        allowCrop: true,
        purpose: "scale_anchor",
      },
    });

    layers.push({
      id: `${id}_glow_atmosphere`,
      type: "atmosphere",
      zIndex: 10,
      bounds: insetRect(fullRect(size), -size.width * 0.08),
      opacity: mapRange(preset.dna.glowAmount, 0, 10, 0.12, 0.55),
      src: pick(assetPack?.glowOverlays, seed),
      fit: "cover",
      blendMode: "screen",
      filter: {
        blur: 8 + preset.dna.glowAmount * 1.6,
        saturation: 1.25,
      },
      meta: {
        colorHint: palette[1],
      },
    });

    if (preset.dna.density > 4) {
      layers.push({
        id: `${id}_accent_overlay`,
        type: "accent",
        zIndex: 14,
        bounds: accentBounds,
        opacity: mapRange(preset.dna.density, 0, 10, 0.12, 0.38),
        src: pick(assetPack?.accentImages, seed),
        fit: "contain",
        blendMode: "screen",
        rotation: randomFromSeed(seed, -12, 12),
        meta: {
          colorHint: palette[2],
        },
      });
    }

    if (subject.kind !== "none") {
      layers.push({
        id: `${id}_subject_shadow`,
        type: "subject",
        zIndex: 20,
        bounds: {
          ...subjectBounds,
          x: subjectBounds.x + size.width * 0.018,
          y: subjectBounds.y + size.height * 0.018,
        },
        opacity: 0.36,
        src: subject.imageUrl,
        fit: "contain",
        filter: {
          blur: 18,
          brightness: 0,
          contrast: 1,
          saturation: 0,
        },
        meta: {
          role: "depth_shadow",
        },
      });

      layers.push({
        id: `${id}_subject`,
        type: "subject",
        zIndex: 30,
        bounds: subjectBounds,
        opacity: 1,
        src: subject.imageUrl,
        fit: "contain",
        filter: {
          brightness: 1.04,
          contrast: 1.1,
          saturation: preset.dna.luxuryRestraint > 7 ? 0.95 : 1.08,
        },
        meta: {
          isolated: true,
          dominant: true,
          avoidCoveringFace: true,
        },
      });
    }

    layers.push({
      id: `${id}_headline`,
      type: "headline",
      zIndex: 40,
      bounds: headlineBounds,
      opacity: 1,
      text: transformTitle(brief.title, preset.typography.headlineCase),
      fontFamily: preset.typography.displayFont,
      fontSize: calculateHeadlineFontSize(brief.title, headlineBounds, preset.dna),
      fontWeight: 900,
      lineHeight: preset.dna.typographyAggression > 7 ? 0.82 : 0.9,
      letterSpacing: preset.typography.headlineTracking,
      color: palette[3] ?? "#FFFFFF",
      align: mode === "RIGHT_DOMINANT" ? "left" : mode === "LEFT_DOMINANT" ? "right" : "center",
      textTransform: "uppercase",
      rotation: mode === "DIAGONAL_DRAMA" ? -4 : 0,
      shadow: {
        color: palette[1] ?? "#FFFFFF",
        blur: preset.dna.glowAmount * 1.8,
        offsetX: 0,
        offsetY: 0,
      },
      meta: {
        allowSubjectOverlap: preset.dna.textOverlap > 5,
        primaryTextMoment: true,
      },
    });

    if (brief.accentTitle && preset.typography.scriptFont) {
      layers.push({
        id: `${id}_script_accent`,
        type: "scriptAccent",
        zIndex: 45,
        bounds: getScriptAccentBounds(headlineBounds, size),
        opacity: 1,
        text: brief.accentTitle,
        fontFamily: preset.typography.scriptFont,
        fontSize: Math.min(size.width * 0.12, 132),
        fontWeight: 400,
        lineHeight: 1,
        letterSpacing: 0,
        color: palette[1] ?? "#F5C76B",
        align: "center",
        rotation: mode === "DIAGONAL_DRAMA" ? -8 : -5,
        shadow: {
          color: palette[0] ?? "#000000",
          blur: 8,
          offsetX: 0,
          offsetY: 4,
        },
        meta: {
          intentionalMisalignment: true,
          emotionalAccent: true,
        },
      });
    }

    layers.push({
      id: `${id}_metadata`,
      type: "metadata",
      zIndex: 50,
      bounds: metadataBounds,
      opacity: 0.94,
      text: createMetadataText(brief, preset.metadataStyle),
      fontFamily: preset.typography.supportFont,
      fontSize: getMetadataFontSize(size, preset.metadataStyle),
      fontWeight: 700,
      lineHeight: 1.18,
      letterSpacing: preset.typography.metadataTracking,
      color: palette[3] ?? "#FFFFFF",
      align: "center",
      textTransform: "uppercase",
      rotation: preset.metadataStyle === "side_rail" ? -90 : 0,
      meta: {
        informationLayer: true,
        shouldNeverCompeteWithHeadline: true,
      },
    });

    layers.push({
      id: `${id}_footer`,
      type: "footer",
      zIndex: 55,
      bounds: footerBounds,
      opacity: 0.92,
      text: createFooterText(brief),
      fontFamily: preset.typography.supportFont,
      fontSize: Math.max(18, size.width * 0.026),
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: 1.2,
      color: palette[3] ?? "#FFFFFF",
      align: "center",
      textTransform: "uppercase",
      meta: {
        modularInfoSystem: true,
      },
    });

    layers.push({
      id: `${id}_grain_texture`,
      type: "texture",
      zIndex: 80,
      bounds: fullRect(size),
      opacity: mapRange(preset.dna.luxuryRestraint, 0, 10, 0.16, 0.08),
      src: pick(assetPack?.textureImages, seed),
      fit: "cover",
      blendMode: "overlay",
      meta: {
        fallbackProcedural: "grain",
      },
    });

    layers.push({
      id: `${id}_vignette_fx`,
      type: "fx",
      zIndex: 90,
      bounds: fullRect(size),
      opacity: preset.dna.luxuryRestraint > 6 ? 0.36 : 0.28,
      fit: "cover",
      blendMode: "multiply",
      meta: {
        fallbackProcedural: "vignette",
      },
    });

    clampLayerToSafeArea(layers.find((layer) => layer.id === `${id}_footer`), safe);

    return {
      id,
      brief,
      preset,
      compositionMode: mode,
      size,
      layers: sortLayers(layers),
    };
  }
}

export function artDirectorPass(candidate: PosterCandidate, subject: SubjectAnalysis): PosterCandidate {
  const cloned: PosterCandidate = {
    ...candidate,
    layers: candidate.layers.map((layer) => ({
      ...layer,
      bounds: { ...layer.bounds },
      meta: { ...layer.meta },
    })) as SceneLayer[],
  };

  const headline = findTextLayer(cloned.layers, "headline");
  const metadata = findTextLayer(cloned.layers, "metadata");
  const footer = findTextLayer(cloned.layers, "footer");
  const subjectLayer = cloned.layers.find(
    (layer) => layer.type === "subject" && layer.meta?.dominant
  ) as ImageLayer | undefined;
  const ghost = findTextLayer(cloned.layers, "ghostText");

  if (headline && ghost && ghost.fontSize > headline.fontSize * 2.2) {
    ghost.opacity *= 0.82;
  }

  if (metadata && subjectLayer && intersects(metadata.bounds, subjectLayer.bounds)) {
    if (candidate.preset.dna.textOverlap < 6) {
      metadata.opacity *= 0.82;
      metadata.fontSize *= 0.92;
    }
  }

  if (subjectLayer && subject.faceBox) {
    const faceAbsolute = normalizedRectToAbsolute(subject.faceBox, subjectLayer.bounds);
    for (const layer of cloned.layers) {
      if ((layer.type === "headline" || layer.type === "metadata") && intersects(layer.bounds, faceAbsolute)) {
        if (layer.type === "headline" && candidate.preset.dna.textOverlap >= 7) {
          layer.opacity = Math.max(0.88, layer.opacity);
          layer.meta = { ...layer.meta, overlapsFaceRisk: true };
        } else {
          nudgeAwayFrom(layer, faceAbsolute, cloned.size);
        }
      }
    }
  }

  if (headline && metadata && metadata.fontSize > headline.fontSize * 0.24) {
    metadata.fontSize = headline.fontSize * 0.18;
  }

  if (footer) {
    footer.rotation = 0;
    footer.opacity = Math.min(footer.opacity, 0.95);
    footer.bounds = clampRect(footer.bounds, getSafeArea(cloned.size));
  }

  if (candidate.preset.dna.luxuryRestraint > 7) {
    for (const layer of cloned.layers) {
      if (layer.type === "accent" || layer.type === "atmosphere") {
        layer.opacity *= 0.78;
      }
    }
  }

  if (candidate.brief.energy >= 4 && headline) {
    headline.shadow = headline.shadow ?? {
      color: candidate.preset.palette[1] ?? "#FFFFFF",
      blur: 8,
      offsetX: 0,
      offsetY: 0,
    };
    headline.shadow.blur += 4;
  }

  cloned.layers = sortLayers(cloned.layers);
  return cloned;
}

export function scoreLayout(candidate: PosterCandidate, subject: SubjectAnalysis): LayoutScore {
  const notes: string[] = [];
  const failures: string[] = [];
  const headline = findTextLayer(candidate.layers, "headline");
  const ghost = findTextLayer(candidate.layers, "ghostText");
  const metadata = findTextLayer(candidate.layers, "metadata");
  const footer = findTextLayer(candidate.layers, "footer");
  const subjectLayer = candidate.layers.find(
    (layer) => layer.type === "subject" && layer.meta?.dominant
  ) as ImageLayer | undefined;

  let hierarchy = 70;
  let readability = 75;
  let subjectDominance = 70;
  let styleMatch = 78;
  let balance = 70;
  let premiumFeel = 70;

  if (headline) {
    const headlineRatio = area(headline.bounds) / (candidate.size.width * candidate.size.height);
    const visible = visibleRatio(headline.bounds, fullRect(candidate.size));
    if (visible < 0.72) {
      readability -= 22;
      failures.push("Headline is mostly off-canvas or clipped.");
    }
    if (headlineRatio > 0.18) hierarchy += 12;
    if (headlineRatio < 0.08) {
      hierarchy -= 15;
      notes.push("Headline may be too small for poster impact.");
    }
    if (headline.fontSize < candidate.size.width * 0.09) {
      readability -= 12;
      notes.push("Headline may fail at thumbnail size.");
    }
  } else {
    failures.push("Missing primary headline layer.");
    hierarchy -= 28;
    readability -= 20;
  }

  if (ghost && visibleRatio(ghost.bounds, fullRect(candidate.size)) < 0.24) {
    premiumFeel -= 8;
    notes.push("Ghost title crop may be too extreme.");
  }

  if (metadata && headline && metadata.fontSize > headline.fontSize * 0.24) {
    hierarchy -= 12;
    notes.push("Metadata is competing with headline.");
  }

  if (metadata) {
    const metadataVisible = visibleRatio(rotatedBoundingBox(metadata), fullRect(candidate.size));
    if (metadataVisible < 0.9) {
      readability -= 18;
      failures.push("Metadata rail is clipped or off-canvas.");
    }
  }

  if (subjectLayer) {
    const ratio = area(subjectLayer.bounds) / (candidate.size.width * candidate.size.height);
    const subjectVisible = visibleRatio(subjectLayer.bounds, fullRect(candidate.size));
    if (subjectVisible < 0.55) {
      subjectDominance -= 18;
      failures.push("Subject crop is too aggressive.");
    }
    if (ratio > 0.28) subjectDominance += 18;
    if (ratio < 0.18) {
      subjectDominance -= 18;
      notes.push("Subject is not dominant enough.");
    }
    if (subject.confidence < 0.5) {
      subjectDominance -= 6;
      notes.push("Subject analysis confidence is low, so placement may need manual review.");
    }
    if (subject.faceBox) {
      const faceAbsolute = normalizedRectToAbsolute(subject.faceBox, subjectLayer.bounds);
      const faceVisible = visibleRatio(faceAbsolute, fullRect(candidate.size));
      if (faceVisible < 0.92) {
        readability -= 22;
        subjectDominance -= 16;
        failures.push("Key face area is cropped.");
      }
      for (const layer of [metadata, footer].filter(Boolean) as TextLayer[]) {
        if (overlapRatio(layer.bounds, faceAbsolute) > 0.03) {
          readability -= 18;
          failures.push(`${layer.type} collides with the face area.`);
        }
      }
    }
  } else if (candidate.brief.mainSubject !== "none") {
    subjectDominance -= 25;
    notes.push("Brief expected a subject, but no subject layer is present.");
    failures.push("Missing required subject layer.");
  }

  const densityPenalty = calculateDensityPenalty(candidate);
  premiumFeel -= densityPenalty;

  if (candidate.preset.dna.luxuryRestraint > 7 && densityPenalty > 8) {
    styleMatch -= 12;
    notes.push("Luxury preset is too visually dense.");
  }

  balance += calculateBalanceScore(candidate) - 50;

  if (footer && !isInside(footer.bounds, getSafeArea(candidate.size))) {
    readability -= 15;
    notes.push("Footer is outside safe area.");
  }
  if (footer && visibleRatio(footer.bounds, fullRect(candidate.size)) < 0.98) {
    readability -= 18;
    failures.push("Footer is clipped or off-canvas.");
  }
  if (headline && metadata && overlapRatio(metadata.bounds, headline.bounds) > 0.12) {
    hierarchy -= 12;
    readability -= 10;
    failures.push("Metadata collides with headline.");
  }
  if (headline && footer && overlapRatio(footer.bounds, headline.bounds) > 0.08) {
    hierarchy -= 12;
    readability -= 10;
    failures.push("Footer collides with headline.");
  }

  hierarchy = clampScore(hierarchy);
  readability = clampScore(readability);
  subjectDominance = clampScore(subjectDominance);
  styleMatch = clampScore(styleMatch);
  balance = clampScore(balance);
  premiumFeel = clampScore(premiumFeel);

  const rejected =
    failures.length > 0 ||
    hierarchy < 48 ||
    readability < 52 ||
    subjectDominance < 50 ||
    premiumFeel < 42;

  const total = Math.round(
    hierarchy * 0.22 +
      readability * 0.2 +
      subjectDominance * 0.2 +
      styleMatch * 0.16 +
      balance * 0.1 +
      premiumFeel * 0.12 -
      failures.length * 10
  );

  return {
    hierarchy,
    readability,
    subjectDominance,
    styleMatch,
    balance,
    premiumFeel,
    total: clampScore(total),
    rejected,
    failures,
    notes,
  };
}

export function findTextLayer(layers: SceneLayer[], type: TextLayer["type"]): TextLayer | undefined {
  return layers.find((layer) => layer.type === type) as TextLayer | undefined;
}

export function sortLayers(layers: SceneLayer[]): SceneLayer[] {
  return [...layers].sort((a, b) => a.zIndex - b.zIndex);
}

function calculateDensityPenalty(candidate: PosterCandidate): number {
  const visibleLayers = candidate.layers.filter((layer) => layer.opacity > 0.1).length;
  const desired = mapRange(candidate.preset.dna.density, 0, 10, 5, 12);
  return Math.max(0, visibleLayers - desired) * 2;
}

function calculateBalanceScore(candidate: PosterCandidate): number {
  const midpoint = candidate.size.width / 2;
  let leftWeight = 0;
  let rightWeight = 0;

  for (const layer of candidate.layers) {
    const weight = area(layer.bounds) * layer.opacity * zWeight(layer.zIndex);
    const centerX = layer.bounds.x + layer.bounds.width / 2;
    if (centerX < midpoint) leftWeight += weight;
    else rightWeight += weight;
  }

  const total = leftWeight + rightWeight || 1;
  const imbalance = Math.abs(leftWeight - rightWeight) / total;
  return clampScore(100 - imbalance * 100);
}

function zWeight(zIndex: number): number {
  return 1 + zIndex / 100;
}

function intersectRect(a: Rect, b: Rect): Rect {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  return {
    x: x1,
    y: y1,
    width: Math.max(0, x2 - x1),
    height: Math.max(0, y2 - y1),
  };
}

function visibleRatio(rect: Rect, viewport: Rect): number {
  const rectArea = area(rect);
  if (!rectArea) return 0;
  return area(intersectRect(rect, viewport)) / rectArea;
}

function overlapRatio(a: Rect, b: Rect): number {
  const smaller = Math.min(area(a), area(b));
  if (!smaller) return 0;
  return area(intersectRect(a, b)) / smaller;
}

function rotatedBoundingBox(layer: SceneLayer): Rect {
  if (!layer.rotation) return layer.bounds;
  const radians = (Math.abs(layer.rotation) * Math.PI) / 180;
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  const width = layer.bounds.width * cos + layer.bounds.height * sin;
  const height = layer.bounds.width * sin + layer.bounds.height * cos;
  return {
    x: layer.bounds.x + layer.bounds.width / 2 - width / 2,
    y: layer.bounds.y + layer.bounds.height / 2 - height / 2,
    width,
    height,
  };
}

function getSafeArea(size: PosterSize): Rect {
  return {
    x: size.width * 0.055,
    y: size.height * 0.045,
    width: size.width * 0.89,
    height: size.height * 0.91,
  };
}

function fullRect(size: PosterSize): Rect {
  return { x: 0, y: 0, width: size.width, height: size.height };
}

function getSubjectBounds(
  size: PosterSize,
  mode: CompositionMode,
  subject: SubjectAnalysis,
  dna: StyleDNA,
  seed: number
): Rect {
  if (subject.originalBounds) {
    return { ...subject.originalBounds };
  }

  const baseHeight = size.height * mapRange(dna.scaleDrama, 0, 10, 0.48, 0.82);
  const aspect = subject.kind === "bottle" ? 0.42 : subject.kind === "car" ? 1.25 : 0.68;
  const width = baseHeight * aspect;
  const jitterX = randomFromSeed(seed, -size.width * 0.035, size.width * 0.035);
  const jitterY = randomFromSeed(seed + 19, -size.height * 0.025, size.height * 0.025);
  const centerX = subject.visualWeightCenter?.x ?? 0.5;

  switch (mode) {
    case "LEFT_DOMINANT":
      return {
        x: size.width * 0.04 + jitterX,
        y: size.height * 0.17 + jitterY,
        width,
        height: baseHeight,
      };
    case "RIGHT_DOMINANT":
      return {
        x: size.width - width - size.width * 0.04 + jitterX,
        y: size.height * 0.17 + jitterY,
        width,
        height: baseHeight,
      };
    case "CLOSEUP_CROP":
      return {
        x: size.width * centerX - width * 0.64 + jitterX,
        y: size.height * 0.08 + jitterY,
        width: width * 1.28,
        height: baseHeight * 1.28,
      };
    case "NEGATIVE_SPACE":
      return {
        x: size.width * 0.58 + jitterX,
        y: size.height * 0.2 + jitterY,
        width: width * 0.88,
        height: baseHeight * 0.88,
      };
    case "DIAGONAL_DRAMA":
      return {
        x: size.width * 0.5 - width * 0.5 + jitterX,
        y: size.height * 0.13 + jitterY,
        width,
        height: baseHeight,
      };
    case "DUO_SPLIT":
    case "CENTER_HERO":
    default:
      return {
        x: size.width * 0.5 - width * 0.5 + jitterX,
        y: size.height * 0.16 + jitterY,
        width,
        height: baseHeight,
      };
  }
}

function getHeadlineBounds(
  size: PosterSize,
  mode: CompositionMode,
  subjectBounds: Rect,
  dna: StyleDNA,
  seed: number
): Rect {
  const height = size.height * mapRange(dna.scaleDrama, 0, 10, 0.15, 0.28);
  const yLower = size.height * mapRange(dna.textOverlap, 0, 10, 0.54, 0.47);
  const jitterY = randomFromSeed(seed + 3, -size.height * 0.025, size.height * 0.025);

  switch (mode) {
    case "LEFT_DOMINANT":
      return { x: size.width * 0.32, y: yLower + jitterY, width: size.width * 0.62, height };
    case "RIGHT_DOMINANT":
      return { x: size.width * 0.06, y: yLower + jitterY, width: size.width * 0.62, height };
    case "NEGATIVE_SPACE":
      return { x: size.width * 0.07, y: size.height * 0.18 + jitterY, width: size.width * 0.5, height: height * 0.9 };
    case "CLOSEUP_CROP":
      return { x: -size.width * 0.04, y: size.height * 0.61 + jitterY, width: size.width * 1.08, height: height * 1.1 };
    case "DIAGONAL_DRAMA":
      return { x: size.width * 0.04, y: size.height * 0.58 + jitterY, width: size.width * 0.92, height };
    case "CENTER_HERO":
    default:
      return {
        x: size.width * 0.05,
        y: Math.max(size.height * 0.55, subjectBounds.y + subjectBounds.height * 0.6) + jitterY,
        width: size.width * 0.9,
        height,
      };
  }
}

function getGhostTitleBounds(size: PosterSize, mode: CompositionMode, dna: StyleDNA, seed: number): Rect {
  const scale = mapRange(dna.scaleDrama, 0, 10, 1.05, 1.55);
  const width = size.width * scale;
  const height = size.height * 0.35;
  const x = (size.width - width) / 2 + randomFromSeed(seed + 5, -size.width * 0.07, size.width * 0.07);
  let y = size.height * 0.07;
  if (mode === "NEGATIVE_SPACE") y = size.height * 0.05;
  if (mode === "CLOSEUP_CROP") y = size.height * 0.02;
  if (mode === "DIAGONAL_DRAMA") y = size.height * 0.11;
  return { x, y, width, height };
}

function getMetadataBounds(size: PosterSize, mode: CompositionMode, style: MetadataStyle, seed: number): Rect {
  if (style === "side_rail") {
    const sideLeft = mode !== "LEFT_DOMINANT";
    return {
      x: sideLeft ? size.width * 0.02 : size.width * 0.87,
      y: size.height * 0.18,
      width: size.height * 0.45,
      height: size.width * 0.08,
    };
  }

  if (style === "badge_cluster") {
    return { x: size.width * 0.06, y: size.height * 0.08, width: size.width * 0.34, height: size.height * 0.12 };
  }

  if (style === "minimal_footer") {
    return { x: size.width * 0.08, y: size.height * 0.78, width: size.width * 0.84, height: size.height * 0.055 };
  }

  return {
    x: size.width * 0.08 + randomFromSeed(seed, -12, 12),
    y: size.height * 0.08,
    width: size.width * 0.84,
    height: size.height * 0.09,
  };
}

function getFooterBounds(size: PosterSize, style: MetadataStyle): Rect {
  const height = style === "minimal_footer" ? size.height * 0.075 : size.height * 0.09;
  return {
    x: size.width * 0.07,
    y: size.height - height - size.height * 0.045,
    width: size.width * 0.86,
    height,
  };
}

function getAccentBounds(size: PosterSize, mode: CompositionMode, seed: number): Rect {
  const width = size.width * randomFromSeed(seed + 7, 0.45, 0.75);
  const height = size.height * randomFromSeed(seed + 8, 0.18, 0.34);
  if (mode === "LEFT_DOMINANT") return { x: size.width * 0.5, y: size.height * 0.16, width, height };
  if (mode === "RIGHT_DOMINANT") return { x: -size.width * 0.08, y: size.height * 0.16, width, height };
  return {
    x: size.width * randomFromSeed(seed + 9, -0.08, 0.42),
    y: size.height * randomFromSeed(seed + 10, 0.08, 0.36),
    width,
    height,
  };
}

function getScriptAccentBounds(headlineBounds: Rect, size: PosterSize): Rect {
  return {
    x: headlineBounds.x + headlineBounds.width * 0.18,
    y: headlineBounds.y - size.height * 0.035,
    width: headlineBounds.width * 0.64,
    height: headlineBounds.height * 0.42,
  };
}

function transformTitle(title: string, casing: ArtDirectionPreset["typography"]["headlineCase"]): string {
  if (casing === "uppercase") return title.toUpperCase();
  if (casing === "lowercase") return title.toLowerCase();
  return title.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function createMetadataText(brief: CreativeBrief, style: MetadataStyle): string {
  const parts = [brief.date, brief.time, brief.ageLimit].filter(Boolean);
  if (style === "side_rail") return parts.join("  *  ").toUpperCase();
  if (style === "badge_cluster") return parts.join("\n").toUpperCase();
  return parts.join("  /  ").toUpperCase();
}

function createFooterText(brief: CreativeBrief): string {
  const line1 = [brief.venue, brief.location].filter(Boolean).join(" - ");
  const line2 = [brief.callToAction, brief.price].filter(Boolean).join("  *  ");
  const lineup = brief.lineup?.length ? `MUSIC BY ${brief.lineup.join(" / ")}` : "";
  const socials = brief.socials?.length ? brief.socials.join("  ") : "";
  return [line1, lineup, line2, socials].filter(Boolean).join("\n").toUpperCase();
}

function calculateHeadlineFontSize(title: string, bounds: Rect, dna: StyleDNA): number {
  const cleanLength = Math.max(4, title.replace(/\s+/g, "").length);
  const base = bounds.width / cleanLength;
  const dramaBoost = mapRange(dna.typographyAggression, 0, 10, 1.25, 2.25);
  return clamp(base * dramaBoost, bounds.height * 0.34, bounds.height * 0.86);
}

function getMetadataFontSize(size: PosterSize, style: MetadataStyle): number {
  if (style === "side_rail") return Math.max(18, size.width * 0.028);
  if (style === "badge_cluster") return Math.max(20, size.width * 0.034);
  return Math.max(18, size.width * 0.026);
}

function pick<T>(items: T[] | undefined, seed: number): T | undefined {
  if (!items?.length) return undefined;
  return items[Math.abs(seed) % items.length];
}

function pickCompositionMode(preset: ArtDirectionPreset, index: number, subject: SubjectAnalysis): CompositionMode {
  const weighted = [...preset.defaultComposition];
  if ((subject.visualWeightCenter?.x ?? 0.5) < 0.43) weighted.unshift("LEFT_DOMINANT");
  if ((subject.visualWeightCenter?.x ?? 0.5) > 0.57) weighted.unshift("RIGHT_DOMINANT");
  if (subject.confidence > 0.65 && (subject.faceBox?.height ?? 0) > 0.25) weighted.unshift("CLOSEUP_CROP");
  return weighted[index % weighted.length];
}

function createFallbackSubject(kind: SubjectKind): SubjectAnalysis {
  return {
    kind,
    confidence: kind === "none" ? 1 : 0.35,
    visualWeightCenter: { x: 0.5, y: 0.45 },
    faceBox: kind === "person" || kind === "dj" ? { x: 0.35, y: 0.08, width: 0.3, height: 0.22 } : undefined,
  };
}

function createGradientFromPalette(palette: string[]): string {
  return `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`;
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const t = (value - inMin) / (inMax - inMin);
  return outMin + clamp(t, 0, 1) * (outMax - outMin);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampScore(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

function area(rect: Rect): number {
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function isInside(inner: Rect, outer: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

function insetRect(rect: Rect, amount: number): Rect {
  return {
    x: rect.x + amount,
    y: rect.y + amount,
    width: rect.width - amount * 2,
    height: rect.height - amount * 2,
  };
}

function clampRect(rect: Rect, bounds: Rect): Rect {
  const width = Math.min(rect.width, bounds.width);
  const height = Math.min(rect.height, bounds.height);
  return {
    x: clamp(rect.x, bounds.x, bounds.x + bounds.width - width),
    y: clamp(rect.y, bounds.y, bounds.y + bounds.height - height),
    width,
    height,
  };
}

function clampLayerToSafeArea(layer: SceneLayer | undefined, safe: Rect): void {
  if (!layer) return;
  layer.bounds = clampRect(layer.bounds, safe);
}

function normalizedRectToAbsolute(normalized: Rect, container: Rect): Rect {
  return {
    x: container.x + normalized.x * container.width,
    y: container.y + normalized.y * container.height,
    width: normalized.width * container.width,
    height: normalized.height * container.height,
  };
}

function nudgeAwayFrom(layer: SceneLayer, obstacle: Rect, size: PosterSize): void {
  const layerCenter = {
    x: layer.bounds.x + layer.bounds.width / 2,
    y: layer.bounds.y + layer.bounds.height / 2,
  };
  const obstacleCenter = {
    x: obstacle.x + obstacle.width / 2,
    y: obstacle.y + obstacle.height / 2,
  };
  const dx = layerCenter.x < obstacleCenter.x ? -size.width * 0.06 : size.width * 0.06;
  const dy = layerCenter.y < obstacleCenter.y ? -size.height * 0.04 : size.height * 0.04;
  layer.bounds.x += dx;
  layer.bounds.y += dy;
  layer.bounds = clampRect(layer.bounds, fullRect(size));
}

function randomFromSeed(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9999.123) * 10000;
  const t = x - Math.floor(x);
  return min + t * (max - min);
}
