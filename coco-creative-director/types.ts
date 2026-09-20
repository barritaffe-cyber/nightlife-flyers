export type PosterIdentity =
  | "lifestyle-editorial" | "luxury-editorial" | "premium-nightlife"
  | "high-energy-club" | "underground-industrial" | "organic-rhythmic"
  | "retro-cultural" | "fashion-campaign" | "product-luxury"
  | "artist-led" | "minimal-event" | "cinematic-event";

export type MarketingGoal = "sell-lifestyle" | "sell-event" | "sell-vip" | "sell-music" | "sell-artist" | "sell-venue" | "sell-product";
export type EmotionalGoal = "relaxed-luxury" | "exclusive" | "energetic" | "sensual" | "playful" | "underground" | "nostalgic" | "romantic" | "fashion-forward" | "celebratory" | "intimate" | "aspirational";
export type VisualEnergy = "very-low" | "low" | "medium" | "high" | "explosive";
export type CreativeRisk = "safe" | "controlled" | "expressive" | "bold";
export type InformationDensity = "minimal" | "low" | "medium" | "dense";
export type EffectsPolicy = "none" | "restrained" | "moderate" | "cinematic" | "high-energy";
export type PosterDNA = "editorial-fashion" | "luxury-hospitality" | "nightlife-promo" | "music-festival" | "urban-culture" | "retro-era" | "minimal-swiss" | "cinematic-key-art" | "product-campaign" | "tropical-lifestyle" | "underground-rave" | "social-day-party";
export type SignatureMove = "oversized-headline" | "script-cross" | "diagonal-accent" | "cropped-type" | "luxury-serif-scale" | "editorial-spacing" | "single-electric-glow" | "subject-type-depth" | "corner-badge" | "product-callout" | "split-information-rail" | "vertical-type-rail" | "none";
export type CompositionFamily = "left-premium-stack" | "right-premium-stack" | "center-poster-stack" | "bottom-lockup" | "split-editorial" | "diagonal-energy" | "full-bleed-type" | "type-around-subject" | "golden-hero-editorial";
export type CopyRole = "identity" | "emotion" | "experience" | "music" | "offer" | "logistics" | "venue" | "presenter" | "badge" | "footer";
export type CopyTreatment = "hero" | "accent" | "metadata" | "microcopy" | "badge" | "footer" | "merge" | "mute" | "hide";
export type TypographyPersonality = "condensed-editorial" | "luxury-serif" | "clean-grotesk" | "organic-script" | "urban-heavy" | "retro-display" | "industrial-minimal" | "electric-display" | "fashion-serif" | "humanist-lifestyle";
export type PalettePolicy = "image-led" | "warm-premium" | "champagne-black" | "tropical-emerald" | "rose-glamour" | "sunset-warm" | "burgundy-intimate" | "electric-night" | "industrial-monochrome" | "retro-pop" | "neutral-editorial";
export type ConstraintSeverity = "hard" | "strong" | "soft";

export type SceneInterpretationLike = {
  confidence: number;
  creativeDecisions: {
    story: string;
    marketingIntent?: string;
    hero: { type: string; confidence: number; reason?: string; secondaryHero?: string | null };
    composition: { visualWeight: string; typeField: string; typeFieldConfidence: number; preferredPattern: string; stackAlignment: "left"|"center"|"right"; stackRect: {x:number;y:number;width:number;height:number}; overlapPolicy?: string; reason?: string };
    hierarchy?: { headlinePower:number; accentMaxRatio:number; bodyMaxRatio:number; dateMaxRatio:number; venueMaxRatio:number; badgeMaxRatio:number; presenterMaxRatio:number };
    typographyPolicy?: string;
    densityPolicy?: { policy:string; maxVisibleGroups:number; maxBodyLines:number; mergeSecondaryCopy:boolean; hideLowPriorityCopy:boolean; reason?:string };
    effectPolicy?: { policy:string; glow:number; shadow:number; texture:number; particles:number; blur:number; vignette:number; colorCast:number; reason?:string };
    colorStory?: { id:string; dominantRole:string; headlineTone:string; accentTone:string; preserveSkinTone:boolean; imageLed:boolean; saturationPolicy:string; reason?:string };
  };
  constraints?: Array<{id:string;hard?:boolean;weight:number;reason:string;parameters?:Record<string,any>}>;
  opportunities?: Array<{id:string;score:number;reason:string;target?:string;parameters?:Record<string,any>}>;
  protectionZones?: Array<{target:string;rect:{x:number;y:number;width:number;height:number};importance:string;allowOverlapRatio:number}>;
  reasoning?: string[];
  warnings?: string[];
};

export type CreativeEventInput = { name:string; headline?:string; accent?:string; details?:string; details2?:string; presenter?:string; date?:string; time?:string; venue?:string; price?:string; callToAction?:string; audienceHint?:string; brandHint?:string };
export type CreativeDirectorInput = { scene:SceneInterpretationLike; event:CreativeEventInput; userPreferences?:Partial<{preferredPosterIdentity:PosterIdentity;preferredTypography:TypographyPersonality;preferredPalette:PalettePolicy;preferredRisk:CreativeRisk;avoidSignatureMoves:SignatureMove[];preferredSignatureMoves:SignatureMove[];density:InformationDensity}>; learning?:Partial<{acceptedDirections:string[];rejectedDirections:string[];successfulSignatureMoves:SignatureMove[];successfulPosterDNA:PosterDNA[]}>; debug?:boolean };

export type CopyGroup = { id:string; role:CopyRole; sources:string[]; treatment:CopyTreatment; priority:1|2|3|4|5; maxLines:number; mergeWith?:string; hideWhenEmpty:boolean };
export type HierarchyContract = { headlinePower:number; accentMaxRatio:number; bodyMaxRatio:number; dateMaxRatio:number; venueMaxRatio:number; badgeMaxRatio:number; presenterMaxRatio:number; headlineMustWinBy:number };
export type CompositionContract = { family:CompositionFamily; typeField:"left"|"right"|"center"|"top"|"bottom"|"split"; alignment:"left"|"center"|"right"; stackRect:{x:number;y:number;width:number;height:number}; overlapPolicy:"none"|"subtle"|"controlled"; oneColumn:boolean; protectSceneZones:boolean; reason:string };
export type TypographyContract = { headlinePersonality:TypographyPersonality; accentPersonality:TypographyPersonality; bodyPersonality:TypographyPersonality; headlineTreatment:"clean"|"serif-luxury"|"chrome"|"glow"|"distressed"|"editorial"; trackingPolicy:"tight"|"neutral"|"wide"; bodyCase:"uppercase"|"titlecase"|"sentence"; bodyTracking:number; bodyLineHeight:number; maxFontFamilies:number; allowScriptAccent:boolean; reason:string };
export type PaletteContract = { policy:PalettePolicy; imageLed:boolean; preserveSkinTone:boolean; dominantRole:"image"|"background"|"headline"; headlineTone:string; accentTone:string; neutralTone:string; saturation:"restrained"|"balanced"|"vivid"; maxStrongColors:number; reason:string };
export type EffectsContract = { policy:EffectsPolicy; maxGlow:number; maxShadow:number; maxTexture:number; maxParticles:number; maxBlur:number; vignette:number; colorCast:number; oneSignatureEffect:boolean; reason:string };
export type SignatureMoveContract = { move:SignatureMove; intensity:"subtle"|"medium"|"bold"; target:"headline"|"accent"|"subject"|"badge"|"full-stack"|"product"; reason:string; parameters:Record<string,string|number|boolean>; fallback:SignatureMove };
export type CreativeConstraint = { id:string; severity:ConstraintSeverity; weight:number; description:string; parameters?:Record<string,string|number|boolean> };
export type CreativeOpportunity = { id:string; score:number; description:string; target?:string; parameters?:Record<string,string|number|boolean> };
export type CreativeDirectionScore = { sceneFit:number; storyFit:number; marketingFit:number; hierarchyPotential:number; compositionPotential:number; typographyPotential:number; palettePotential:number; effectsRestraint:number; signatureMoveFit:number; originality:number; premiumPotential:number; implementationConfidence:number; total:number };
export type CreativeDirection = { id:string; name:string; posterIdentity:PosterIdentity; posterDNA:PosterDNA; marketingGoal:MarketingGoal; emotionalGoal:EmotionalGoal; visualEnergy:VisualEnergy; creativeRisk:CreativeRisk; informationDensity:InformationDensity; composition:CompositionContract; copyArchitecture:CopyGroup[]; hierarchy:HierarchyContract; typography:TypographyContract; palette:PaletteContract; effects:EffectsContract; signatureMove:SignatureMoveContract; constraints:CreativeConstraint[]; opportunities:CreativeOpportunity[]; score:CreativeDirectionScore; reasoning:string[]; warnings:string[] };
export type CreativeDirectorResult = { winner:CreativeDirection; finalists:CreativeDirection[]; candidates:CreativeDirection[]; rejected:Array<{id:string;reason:string}>; authority:{creativeDirectionId:string;hardConstraints:CreativeConstraint[];downstreamMustObey:string[]}; trace:Array<{stage:string;decision:string;confidence:number;evidence:string[]}> };
