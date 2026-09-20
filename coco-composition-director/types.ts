export type PercentRect = { x:number; y:number; width:number; height:number };
export type Point = { x:number; y:number };
export type CocoFormat = "square" | "story";
export type Align = "left" | "center" | "right";
export type TypeField = "left" | "right" | "center" | "top" | "bottom" | "split";
export type CompositionFamily =
  | "left-premium-stack"
  | "right-premium-stack"
  | "center-poster-stack"
  | "bottom-lockup"
  | "split-editorial"
  | "diagonal-energy"
  | "full-bleed-type"
  | "type-around-subject"
  | "top-lockup"
  | "corner-editorial"
  | "fashion-club-vertical"
  | "golden-hero-editorial"
  | "center-hero-event-poster";

export type CompositionSource =
  | "headline" | "accent" | "details" | "details2" | "date" | "time"
  | "venue" | "price" | "presenter" | "subtag" | "footer" | "compliance";

export type CompositionRole =
  | "identity" | "accent" | "primaryMeta" | "secondaryMeta" | "dateTime"
  | "venue" | "badge" | "presenter" | "footer";

export type ProtectionTarget =
  | "face" | "eyes" | "mouth" | "gaze" | "sunglasses" | "hair-silhouette"
  | "hands" | "drink" | "microphone" | "product" | "logo" | "jewelry";

export type ProtectionZone = {
  target: ProtectionTarget | string;
  rect: PercentRect;
  importance: "critical" | "high" | "medium" | "low" | string;
  allowOverlapRatio: number;
  reason?: string;
};

export type SceneLike = {
  confidence: number;
  creativeDecisions: {
    story: string;
    hero: { type:string; id?:string; confidence:number; secondaryHero?:string|null; reason?:string };
    composition: {
      visualWeight:string;
      typeField:string;
      typeFieldConfidence:number;
      preferredPattern:string;
      stackAlignment:Align;
      stackRect:PercentRect;
      overlapPolicy?:string;
      readingDirection?:string;
      reason?:string;
    };
    hierarchy?: {
      headlinePower:number;
      accentMaxRatio:number;
      bodyMaxRatio:number;
      dateMaxRatio:number;
      venueMaxRatio:number;
      badgeMaxRatio:number;
      presenterMaxRatio:number;
    };
    densityPolicy?: {
      policy:string;
      maxVisibleGroups:number;
      maxBodyLines:number;
      mergeSecondaryCopy:boolean;
      hideLowPriorityCopy:boolean;
    };
  };
  protectionZones?: ProtectionZone[];
  constraints?: Array<{id:string;hard?:boolean;weight:number;reason:string;parameters?:Record<string,any>}>;
  opportunities?: Array<{id:string;score:number;reason:string;target?:string;parameters?:Record<string,any>}>;
  reasoning?:string[];
  warnings?:string[];
};

export type CreativeDirectionLike = {
  id:string;
  posterIdentity:string;
  posterDNA:string;
  visualEnergy:string;
  creativeRisk:string;
  informationDensity:string;
  composition:{
    family:CompositionFamily;
    typeField:TypeField;
    alignment:Align;
    stackRect:PercentRect;
    overlapPolicy:"none"|"subtle"|"controlled";
    oneColumn:boolean;
    protectSceneZones:boolean;
    reason:string;
  };
  copyArchitecture:Array<{
    id:string;
    role:string;
    sources:string[];
    treatment:string;
    priority:number;
    maxLines:number;
    mergeWith?:string;
    hideWhenEmpty:boolean;
  }>;
  hierarchy:{
    headlinePower:number;
    accentMaxRatio:number;
    bodyMaxRatio:number;
    dateMaxRatio:number;
    venueMaxRatio:number;
    badgeMaxRatio:number;
    presenterMaxRatio:number;
    headlineMustWinBy:number;
  };
  signatureMove:{
    move:string;
    intensity:"subtle"|"medium"|"bold";
    target:string;
    reason:string;
    parameters:Record<string,string|number|boolean>;
    fallback:string;
  };
  constraints:Array<{id:string;severity:string;weight:number;description:string;parameters?:Record<string,any>}>;
  opportunities:Array<{id:string;score:number;description:string;target?:string;parameters?:Record<string,any>}>;
};

export type CompositionText = Partial<Record<CompositionSource,string>>;

export type SubjectGeometry = {
  rect:PercentRect;
  visibleRect?:PercentRect;
  centroid?:Point;
  faceRect?:PercentRect|null;
  headRect?:PercentRect|null;
  torsoRect?:PercentRect|null;
  hands?:PercentRect[];
  side?:"left"|"right"|"center"|"full";
  crop?:"close"|"half"|"three-quarter"|"full"|"unknown";
  saliency?:number;
  visualMass?:number;
};

export type CompositionBlock = {
  id:string;
  role:CompositionRole;
  source:CompositionSource|CompositionSource[];
  rect:PercentRect;
  align:Align;
  priority:1|2|3|4|5;
  parentRole?:CompositionRole;
  attachTo?:CompositionRole;
  order:number;
  minVisualPower?:number;
  maxVisualPower?:number;
  allowOverlapWithSubject:boolean;
  overlapPurpose?:"none"|"depth"|"rhythm"|"signature";
  maxProtectedOverlap:number;
  hidden:boolean;
  // Positioned directly from real subject/face geometry (e.g. a wing block
  // beside the subject), not from the column's vertical rhythm - variation
  // and refinement passes that shift/scale/tighten the column must leave
  // these rects alone instead of remapping them as if they lived inside it.
  pinned?:boolean;
};

export type CompositionRhythm = {
  headlineToAccent:number;
  accentToMeta:number;
  metaToDateTime:number;
  dateTimeToVenue:number;
  venueToFooter:number;
  baselineUnit:number;
  compression:number;
};

export type EyeFlowStep = {
  role:CompositionRole|"subject";
  order:number;
  targetPoint:Point;
  weight:number;
};

export type VisualMassItem = {
  id:string;
  kind:"subject"|"face"|"product"|"headline"|"accent"|"metadata"|"badge"|"venue";
  rect:PercentRect;
  weight:number;
  center:Point;
};

export type VisualBalance = {
  center:Point;
  targetCenter:Point;
  deviation:number;
  leftMass:number;
  rightMass:number;
  topMass:number;
  bottomMass:number;
  score:number;
};

export type CompositionSystem = {
  id:string;
  family:CompositionFamily;
  generation:"base"|"variation"|"refined";
  typeField:TypeField;
  alignment:Align;
  subjectRect:PercentRect;
  textColumn:PercentRect;
  blocks:CompositionBlock[];
  rhythm:CompositionRhythm;
  eyeFlow:EyeFlowStep[];
  visualBalance?:VisualBalance;
  owns:CompositionSource[];
  signatureMove:string;
  explanation:string;
  warnings:string[];
};

export type CompositionScore = {
  hierarchy:number;
  balance:number;
  subjectProtection:number;
  negativeSpace:number;
  eyeFlow:number;
  rhythm:number;
  alignment:number;
  sceneFit:number;
  storyFit:number;
  premium:number;
  originality:number;
  implementationConfidence:number;
  hardViolations:number;
  hasCriticalProtectionViolation:boolean;
  hasBlockOverlap:boolean;
  total:number;
};

export type CompositionCandidate = CompositionSystem & { score:CompositionScore };

export type CompositionDirectorInput = {
  scene:SceneLike;
  creativeDirection:CreativeDirectionLike;
  format:CocoFormat;
  text:CompositionText;
  subject?:SubjectGeometry|null;
  negativeSpace?:Array<{id:string;rect:PercentRect;score:number;luminance?:number;noise?:number}>;
  busyZones?:PercentRect[];
  darkZones?:PercentRect[];
  brightZones?:PercentRect[];
  preferredFamily?:CompositionFamily|null;
  debug?:boolean;
};

export type CompositionDirectorResult = {
  winner:CompositionCandidate;
  finalists:CompositionCandidate[];
  candidates:CompositionCandidate[];
  rejected:Array<{id:string;reason:string}>;
  authority:{
    compositionId:string;
    owns:CompositionSource[];
    hardRules:string[];
    rendererMustObey:string[];
  };
  trace:Array<{stage:string;decision:string;score:number;evidence:string[]}>;
};

export type RenderedCompositionSnapshot = {
  subjectRect:PercentRect;
  textColumn:PercentRect;
  blockRects:Partial<Record<CompositionRole,PercentRect>>;
  hiddenRoles:CompositionRole[];
  previewExportMatch:boolean;
  protectionViolations:Array<{target:string;overlapRatio:number;allowed:number}>;
};
