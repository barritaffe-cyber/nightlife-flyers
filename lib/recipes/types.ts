export type VisualRecipeTextZone = {
  id: string;
  purpose: string;
  placement: string;
};

export type VisualRecipeRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VisualRecipeGradientStop = {
  offset: number;
  color: string;
};

export type VisualRecipeElement = {
  id: string;
  type: "text" | "image" | "shape" | "texture";
  rect: VisualRecipeRect;
  semanticRole?: string;
  editable?: boolean;
  typography?: {
    sourceFamily: string;
    runtimeFamily: string;
    fontSize: number;
    runtimeFontSize?: number;
    fontSizeUnit: "source-px" | "canvas-width-percent" | "canvas-height-percent";
    weight: number;
    lineHeight: number;
    letterSpacing: number;
    letterSpacingUnit: "px" | "em";
    align: "left" | "center" | "right";
    textTransform?: "none" | "uppercase" | "lowercase";
    fit?: { mode: "none" | "width" | "contain"; targetFill?: number };
  };
  transform?: {
    rotate: number;
    scaleX: number;
    scaleY: number;
    origin: string;
  };
  paint?: {
    fill:
      | { type: "solid"; color: string }
      | { type: "linear-gradient"; angle: number; stops: VisualRecipeGradientStop[] }
      | { type: "radial-gradient"; center: { x: number; y: number }; shape: string; stops: VisualRecipeGradientStop[] };
    opacity: number;
    glyphColors?: string[];
    shadow?: { x: number; y: number; blur: number; color: string };
    border?: { width: number; style: "solid"; color: string; radius: number };
    background?:
      | { type: "solid"; color: string }
      | { type: "linear-gradient"; angle: number; stops: VisualRecipeGradientStop[] };
    filter?: string;
  };
  stacking: {
    zIndex: number;
    behind?: string[];
    above?: string[];
  };
  image?: {
    fit: "contain" | "cover" | "fill";
    position: string;
    filters?: {
      saturate?: number;
      contrast?: number;
      dropShadow?: { x: number; y: number; blur: number; color: string };
    };
  };
};

export type VisualRecipeRole = {
  id: string;
  kind:
    | "background"
    | "badge"
    | "copy"
    | "footer"
    | "headline"
    | "subject"
    | "texture"
    | "utility";
  purpose: string;
  required?: boolean;
  editable?: boolean;
  bounds?: VisualRecipeRect;
  layer: "background" | "behindSubject" | "subject" | "foreground" | "utility";
  notes?: string[];
};

export type VisualRecipeOverlapRule = {
  objects: string[];
  allowed: boolean;
  maxCoveragePercent?: number;
  response: string;
};

export type VisualRecipeComposition = {
  referenceMode?: "measurement-only" | "visual-inheritance";
  referenceTemplateId?: string;
  referenceUses?: string[];
  deniedReferenceUses?: string[];
  canvas: {
    format: "square" | "story";
    safeArea: VisualRecipeRect;
  };
  roles: VisualRecipeRole[];
  layoutRules: string[];
  overlapRules: VisualRecipeOverlapRule[];
  generationSteps: string[];
};

export type VisualRecipeMeasurementReference = {
  mode: "measurement-only";
  sourceTemplateId: string;
  allowedUses: string[];
  deniedUses: string[];
  measurements: Record<
    string,
    VisualRecipeRect | { x: number; y: number; scale: number } | number | string
  >;
};

export type VisualRecipeTargetAssets = {
  backgroundUrl?: string;
  subjectUrl?: string;
  footerUrl?: string;
  dateBadgeUrl?: string;
  notes?: string[];
};

export type VisualRecipe = {
  id: string;
  name: string;
  version?: number;
  reference: string;
  referenceMode?: "measurement-only" | "visual-inheritance";
  summary: string;
  measurementReference?: VisualRecipeMeasurementReference;
  targetAssets?: VisualRecipeTargetAssets;
  composition?: VisualRecipeComposition;
  layerStack: string[];
  textZones: VisualRecipeTextZone[];
  typography: string[];
  colorGrade: string[];
  avoid: string[];
  appNotes: string[];
};
