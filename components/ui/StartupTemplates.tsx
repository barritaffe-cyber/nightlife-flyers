"use client";
import CocoOrb from "../coco/CocoOrb";
import {readHomeProject,clearHomeProject} from "../../lib/coco/homeProjectHandoff";
import { COCO_STYLE_CHOICES } from "../../lib/coco/eventBriefFields";
import { cocoQrCode } from "../../lib/coco/qrCode";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import NightlifePreloader from "./NightlifePreloader";
import { trackClientEvent } from "../../lib/analytics/client";
import {
  fallbackCocoGeneratedCopy,
  sanitizeCocoGeneratedCopy,
  type CocoGeneratedCopy,
} from "../../lib/coco/copy";
import {
  type CocoCompositionBox,
  type CocoCompositionMap,
} from "../../lib/coco/compositionAnalyzer";
import {
  analyzeImageWithAutoDetection,
  type CocoDetectionResult,
} from "../../lib/coco/compositionDetector";
import {
  classifyCocoSubjectDecision,
  type CocoSubjectClassifierEvidence,
  type CocoSubjectDecision,
} from "../../lib/coco/subjectAuthority";
import { EXTRACT_SUBJECT_CLEANUP } from "../../lib/cleanupCutoutUrl";
import { COCO_SUBJECT_LIBRARY } from "../../lib/cocoImageLibrary";
import { removeBackgroundLocal, segmentSubjectAlphaLocal } from "../../lib/removeBgLocal";
import {
  decideCocoNightlifeStyleLocal,
  type CocoNightlifeStyle,
  type CocoPhotoSignal,
  type CocoStyleDecision,
} from "../coco/intelligence";
import {
  eventCopyDescriptionForCocoIntent,
  nightlifeStyleForCocoIntentCopy,
  resolveCocoCreativeIntent,
  type CocoCreativeIntentContract,
} from "../coco/creativeIntent";
import { buildCocoMoodProfile, type CocoMoodProfile } from "../coco/moodDirector";
import {
  handRectFromNormalizedLandmarks,
  type DetectedHandRect,
} from "../coco/subjectGeometry/buildDetectedSubjectFeatures";

const PROJECT_FILE_ACCEPT =
  ".nflyer,application/vnd.nightlife-flyers.project+json,.json,application/json";
const COCO_RETURNING_SESSION_KEY = "nightlife-flyers:coco-returning-welcomed:v1";
const COCO_SEEN_STORAGE_KEY = "nightlife-flyers:coco-seen:v1";
const COCO_STARTUP_INTRO_SESSION_KEY = "nightlife-flyers:coco-startup-intro:v1";
const COCO_GENERATION_MESSAGES = [
  "Reading your event details.",
  "Analyzing the selected image.",
  "Matching the strongest recipe.",
  "Composing five editable options.",
] as const;

const COCO_NIGHTLIFE_STYLE_LABELS: Record<CocoNightlifeStyle, string> = {
  afrobeats: "Afrobeats",
  "bottle-service": "Bottle Service",
  brunch: "Brunch",
  edm: "EDM",
  "general-nightlife": "Nightlife",
  "hip-hop": "Hip-Hop",
  house: "House",
  "ladies-night": "Ladies Night",
  "latin-night": "Latin Night",
  "luxury-club": "Luxury Club",
  "rnb-lounge": "R&B Lounge",
  rooftop: "Rooftop",
  techno: "Techno",
  throwback: "Throwback",
};

export type StartupBuildPayload = {
  backgroundFile: File;
  currentText: {
    headline: string;
    head2: string;
    details: string;
    details2: string;
    venue: string;
    subtag: string;
  };
};

export type CocoReferenceCandidate = {
  imageUrl?: string;
  reason?: string;
  score?: number;
  templateId: string;
  visualId: string;
};

export type CocoComposerEventBrief = {
  [field: `recipe:${string}`]: string | undefined;
  recipeFieldBindings?: import("../../lib/coco/eventBriefFields").CocoEventBriefInput["recipeFieldBindings"];
  fieldFormats?: Record<string, ("square" | "story")[]>;
  theme?: string;
  description: string;
  subtitle: string;
  presenterName: string;
  /** Uploaded logo URL, aspect ratio and scale, serialized with the event brief. */
  presenterLogo?: string;
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  address: string;
  djs: string;
  hosts: string;
  performers: string;
  additionalActs: string;
  musicPolicy: string;
  eventDetails: string;
  dressCode: string;
  experienceFeatures: string[];
  mainPromotion: string;
  bottleSpecials: string;
  drinkSpecials: string;
  foodSpecials: string;
  hookahSpecials: string;
  promotionDeadline: string;
  additionalOffers: string;
  entryFee: string;
  freeEntryCondition: string;
  ageRequirement: string;
  entryRestrictions: string;
  responsibleDrinking: string;
  reservationLabel?: string;
  rsvpContact: string;
  bookingContact: string;
  website: string;
  email: string;
  ticketLink: string;
  socials: string;
  socialPlatforms: string[];
  qrDestination: string;
  qrLabel: string;
  requestedAssetIds: string[];
};

const COCO_FLYER_WEEKDAY_ABBREVIATIONS: Record<string, string> = {
  sunday: "SUN.",
  monday: "MON.",
  tuesday: "TUE.",
  wednesday: "WED.",
  thursday: "THU.",
  friday: "FRI.",
  saturday: "SAT.",
};

const COCO_FLYER_MONTH_ABBREVIATIONS: Record<string, string> = {
  january: "JAN.",
  february: "FEB.",
  march: "MAR.",
  april: "APR.",
  may: "MAY",
  june: "JUN.",
  july: "JUL.",
  august: "AUG.",
  september: "SEP.",
  october: "OCT.",
  november: "NOV.",
  december: "DEC.",
};

function normalizeCocoFlyerDate(value: string) {
  let normalized = String(value || "").trim();
  if (!normalized) return "";
  Object.entries(COCO_FLYER_WEEKDAY_ABBREVIATIONS).forEach(([full, short]) => {
    normalized = normalized.replace(new RegExp(`\\b${full}\\b`, "gi"), short);
  });
  Object.entries(COCO_FLYER_MONTH_ABBREVIATIONS).forEach(([full, short]) => {
    normalized = normalized.replace(new RegExp(`\\b${full}\\b`, "gi"), short);
  });
  return normalized
    .replace(/[•·|,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export type CocoComposerSubjectBounds = {
  width: number;
  height: number;
  // A compact copy of the real segmentation alpha, retained instead
  // of reducing subject isolation to rectangles. Downstream placement
  // can transform this mask after crop/zoom/pan and derive the true
  // canvas-space silhouette.
  maskDataUrl?: string;
  maskWidth?: number;
  maskHeight?: number;
  maskThreshold?: number;
  maskSource?: "transparent-upload" | "imgly-segmentation";
  alpha: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  core?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  face?: {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence?: number;
  };
  faceKeypoints?: Array<{
    x: number;
    y: number;
    label?: string;
  }>;
  hands?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence?: number;
    source?: "mediapipe-hand-landmarker";
  }>;
  props?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence?: number;
    kind: "drink";
    source?: "detr-object-detector";
  }>;
  coreMode?: "alpha-density" | "face-anchor";
  cutoutEvidence?: CocoSubjectClassifierEvidence;
};

export type StartupSelectPayload = {
  startupBackgroundSrc?: string;
  startupBackgroundDataUrl?: string;
  composer?: {
    fieldMappingVersion?: 1;
    /** Keep the selected design’s images unless Custom supplies a replacement. */
    keepDesignImages?: boolean;
    eventName: string;
    eventBrief: CocoComposerEventBrief;
    copy?: CocoGeneratedCopy;
    subjectDataUrl?: string;
    subjectBounds?: CocoComposerSubjectBounds;
    /** Presentation-quality cutout reserved for directions with a subject layer. */
    recipeSubjectDataUrl?: string;
    recipeSubjectBounds?: CocoComposerSubjectBounds;
    /** Original source retained so Quick Edit can rerun edge cleanup. */
    subjectSourceDataUrl?: string;
    subjectDecision?: CocoSubjectDecision;
    backgroundOnlyHero?: boolean;
    heroImageFace?: {
      x: number;
      y: number;
      width: number;
      height: number;
      confidence?: number;
      imageWidth: number;
      imageHeight: number;
      faceKeypoints?: Array<{
        x: number;
        y: number;
        label?: string;
      }>;
    };
    backgroundSrc?: string;
    backgroundSelectionExplicit?: boolean;
    backgroundDataUrl?: string;
    compositionMap?: CocoCompositionMap;
    initialSubjectLayoutId?: "subject-center" | "subject-left" | "subject-right";
    layoutRecipeTemplateId: string;
    visualReferenceId?: string;
    referenceCandidates?: CocoReferenceCandidate[];
    creativeIntent?: CocoCreativeIntentContract;
    selectedConceptDirectionId?: string;
    moodProfile?: CocoMoodProfile;
    photoSignals?: CocoPhotoSignal[];
    styleDecision?: CocoStyleDecision;
  };
};

export type StartupTemplateOption = {
  key: string;
  label: string;
  desc: string;
  preview?: string;
};

interface StartupTemplatesProps {
  onSelect: (key: string, payload?: StartupSelectPayload) => void;
  onFindCocoReference: (input: {
    currentCanvasImage: string;
    creativeBrief: string;
    headline: string;
    subjectLayoutId?: "subject-center" | "subject-left" | "subject-right";
    subjectMode: "required" | "none";
  }) => Promise<{
    candidates: CocoReferenceCandidate[];
    templateId: string;
    visualId: string;
  }>;
  onLoadProjectFile: (file: File) => Promise<void> | void;
  buildForYouEnabled: boolean;
  buildForYouLoading: boolean;
  buildForYouError: string | null;
  onBuildForYou: (payload: StartupBuildPayload) => Promise<void> | void;
  onLoadLadiesNightTest?: () => void;
  guestMode?: boolean;
  templateOptions?: ReadonlyArray<StartupTemplateOption>;
  djBackgroundOptions: ReadonlyArray<{
    id: string;
    src: string;
    name: string;
  }>;
}

type StartupCocoRestingFocus = "prompt" | "returningPrompt";

const CREATE_WITH_COCO_SUBJECTS = COCO_SUBJECT_LIBRARY;

const CREATE_WITH_COCO_DRINKS = [
  { id: "coco-drink-ai-01", src: "/create-with-coco/drinks/ai01.jpg", name: "Featured Drink" },
  { id: "coco-drink-cocktail-01", src: "/create-with-coco/drinks/cocktail01.jpg", name: "Cocktail 1" },
  { id: "coco-drink-cocktail-02", src: "/create-with-coco/drinks/cocktail02.jpg", name: "Cocktail 2" },
  { id: "coco-drink-margarita-01", src: "/create-with-coco/drinks/margarita01.jpg", name: "Margarita 1" },
  { id: "coco-drink-margarita-02", src: "/create-with-coco/drinks/margarita02.jpg", name: "Margarita 2" },
  { id: "coco-drink-mojito-01", src: "/create-with-coco/drinks/mojito01.jpg", name: "Mojito" },
] as const;

async function createWithCocoAssetFile(src: string) {
  const response = await fetch(src);
  if (!response.ok) throw new Error("Could not load the selected Coco image.");
  const blob = await response.blob();
  const filename = src.split("/").pop() || "coco-image.jpg";
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}

type StartupCocoFocus =
  | "advanced"
  | "composer"
  | "dj"
  | "intro"
  | "prompt"
  | "returning"
  | "returningPrompt"
  | "saved"
  | "template";

const startupCocoCopy: Record<StartupCocoFocus, { body?: string; title: string }> = {
  intro: {
    title: "COCO ONLINE",
    body: "Creative OS initialized.",
  },
  prompt: {
    title: "Welcome to Nightlife Flyers.",
    body: "Coco can compose a new flyer from your event details, or you can begin with a finished style.",
  },
  returning: {
    title: "Welcome back.",
    body: "Your workspace is ready.",
  },
  returningPrompt: {
    title: "Welcome back.",
    body: "Where to start",
  },
  dj: {
    title: "Use your own image.",
    body: "Best when the photo should drive the flyer instead of the template.",
  },
  advanced: {
    title: "Choose a template.",
    body: "Best when a ready-made design already matches the event mood.",
  },
  saved: {
    title: "Open a saved design.",
    body: "Use this for work you already started in Nightlife Flyers.",
  },
  template: {
    title: "Choose a template.",
    body: "Good when you want to pick the visual style before editing details.",
  },
  composer: {
    title: "Create with Coco.",
    body: "Pick a design, add your event details, and your flyer is ready.",
  },
};

function StartupCocoGuide({
  focus,
  prefersReducedMotion,
}: {
  focus: StartupCocoFocus;
  prefersReducedMotion: boolean | null;
}) {
  const copy = startupCocoCopy[focus] ?? startupCocoCopy.prompt;

  return (
    <motion.div
      aria-live="polite"
      className="nf-startup-coco pointer-events-none mx-auto w-full max-w-[620px] px-4 text-center text-white"
      initial={{ opacity: 0, scale: 0.98, y: prefersReducedMotion ? 0 : 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.44, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto flex w-fit max-w-full flex-col items-center gap-3">
        <motion.div
          aria-hidden="true"
          className="nf-startup-coco-orb relative grid shrink-0 place-items-center"
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  y: [0, -7, 0],
                  rotate: [0, 1.1, 0],
                }
          }
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  duration: 7.4,
                  repeat: Infinity,
                  ease: "easeInOut",
            }
          }
        >
          <span className="nf-startup-coco-orb-aura" />
          <span className="nf-startup-coco-orb-ring" />
          <img
            src="/branding/coco-orb.png?v=3"
            alt=""
            className="relative h-[72px] w-[72px] rounded-full object-cover"
            draggable={false}
          />
        </motion.div>
        <motion.div
          key={focus}
          className="nf-startup-coco-copy min-w-0 max-w-[460px]"
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="nf-startup-coco-title">
            {copy.title}
          </div>
          {copy.body ? (
            <div className="nf-startup-coco-body">
              {copy.body}
            </div>
          ) : null}
        </motion.div>
      </div>
    </motion.div>
  );
}

const GUEST_PICKER_TEMPLATE_IDS = [
  "triple_hero_takeover_red",
  "square_center_hero_nightlife",
  "miami2",
  "edm_stage_co2",
  "bottle_service",
  "hiphop_graffiti",
  "disco_mirrorball",
] as const;

const MOBILE_UPLOAD_MAX_IMAGE = 1400;

function buildTemplatePreviewSrcSet(preview: string | null | undefined) {
  const src = typeof preview === "string" ? preview : "";
  if (!src.startsWith("/template-previews/900/")) return undefined;
  return `${src.replace("/template-previews/900/", "/template-previews/720/")} 720w, ${src} 900w`;
}

async function fileToDownscaledDataUrl(
  file: File,
  maxDim = MOBILE_UPLOAD_MAX_IMAGE,
  outputType: "image/jpeg" | "image/png" = "image/jpeg"
) {
  const originalUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = () => reject(new Error("Could not read the uploaded background."));
      node.src = originalUrl;
    });
    const max = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height);
    if (!max) throw new Error("Could not read the uploaded background.");
    const scale = Math.min(1, maxDim / max);
    const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process the uploaded background.");
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return outputType === "image/png"
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", 0.86);
  } finally {
    URL.revokeObjectURL(originalUrl);
  }
}

async function imageDataUrlHasTransparency(dataUrl: string) {
  if (!dataUrl.startsWith("data:image/png") && !dataUrl.startsWith("data:image/webp")) {
    return false;
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const node = new Image();
    node.onload = () => resolve(node);
    node.onerror = () => reject(new Error("Could not read the uploaded portrait."));
    node.src = dataUrl;
  });
  const width = Math.max(1, Math.min(360, img.naturalWidth || img.width));
  const height = Math.max(1, Math.round(width * ((img.naturalHeight || img.height) / Math.max(1, img.naturalWidth || img.width))));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  let transparentPixels = 0;
  let edgePixels = 0;
  let edgeOpaquePixels = 0;
  const edgeDepth = Math.max(1, Math.ceil(Math.min(width, height) * 0.03));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3] ?? 255;
      if (alpha < 8) transparentPixels += 1;
      const edge =
        x < edgeDepth ||
        y < edgeDepth ||
        x >= width - edgeDepth ||
        y >= height - edgeDepth;
      if (!edge) continue;
      edgePixels += 1;
      if (alpha >= 8) edgeOpaquePixels += 1;
    }
  }
  return (
    transparentPixels / Math.max(1, width * height) > 0.03 &&
    edgeOpaquePixels / Math.max(1, edgePixels) < 0.94
  );
}

const COCO_PHOTO_HINT_PATTERNS: Array<{ hint: string; pattern: RegExp }> = [
  { hint: "beach", pattern: /\b(beach|pool|island|tropical)\b/i },
  { hint: "bottle", pattern: /\b(bottle|vodka|tequila|cognac)\b/i },
  { hint: "brunch", pattern: /\b(brunch|mimosa|day\s*party|dayparty)\b/i },
  { hint: "champagne", pattern: /\b(champagne|sparkling|toast)\b/i },
  { hint: "cocktail", pattern: /\b(cocktail|martini|margarita|drink|drinks)\b/i },
  { hint: "crowd", pattern: /\b(crowd|dancefloor|dance\s*floor|party)\b/i },
  { hint: "dj", pattern: /\b(dj|deejay|turntable|booth)\b/i },
  { hint: "food", pattern: /\b(food|plate|menu|dinner|waffle)\b/i },
  { hint: "laser", pattern: /\b(laser|lasers|rave|edm)\b/i },
  { hint: "lounge", pattern: /\b(lounge|sofa|velvet|couch)\b/i },
  { hint: "skyline", pattern: /\b(skyline|city|highrise|view)\b/i },
  { hint: "stage", pattern: /\b(stage|concert|festival|lights)\b/i },
  { hint: "sunset", pattern: /\b(sunset|golden\s*hour|dusk)\b/i },
  { hint: "warehouse", pattern: /\b(warehouse|industrial|underground)\b/i },
];

function cocoPhotoHintsFromFileName(file: File) {
  const name = file.name || "";
  return COCO_PHOTO_HINT_PATTERNS
    .filter(({ pattern }) => pattern.test(name))
    .map(({ hint }) => hint);
}

function cocoNightlifeStyleLabel(style: CocoNightlifeStyle) {
  return COCO_NIGHTLIFE_STYLE_LABELS[style] ?? "Nightlife";
}

function classifyCocoPhotoBrightness(value: number): NonNullable<CocoPhotoSignal["brightness"]> {
  if (value < 86) return "dark";
  if (value > 166) return "bright";
  return "mid";
}

function classifyCocoPhotoTemperature(value: number): NonNullable<CocoPhotoSignal["temperature"]> {
  if (value > 10) return "warm";
  if (value < -10) return "cool";
  return "neutral";
}

function classifyCocoPhotoSaturation(value: number): NonNullable<CocoPhotoSignal["saturation"]> {
  if (value < 0.2) return "muted";
  if (value > 0.45) return "vivid";
  return "balanced";
}

function classifyCocoPhotoContrast(value: number): NonNullable<CocoPhotoSignal["contrast"]> {
  if (value < 34) return "low";
  if (value > 68) return "high";
  return "balanced";
}

async function extractCocoPhotoSignal(
  file: File,
  role: NonNullable<CocoPhotoSignal["role"]>
): Promise<CocoPhotoSignal> {
  const filenameHints = cocoPhotoHintsFromFileName(file);
  try {
    const dataUrl = await fileToDownscaledDataUrl(file, 96, "image/jpeg");
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = () => reject(new Error("Could not read the uploaded image."));
      node.src = dataUrl;
    });
    const sourceWidth = Math.max(1, img.naturalWidth || img.width);
    const sourceHeight = Math.max(1, img.naturalHeight || img.height);
    const maxDim = 72;
    const scale = Math.min(1, maxDim / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not inspect the uploaded image.");
    ctx.drawImage(img, 0, 0, width, height);
    const data = ctx.getImageData(0, 0, width, height).data;
    const sampleStride = Math.max(4, Math.floor(data.length / 12000) * 4);
    let count = 0;
    let meanLuma = 0;
    let m2 = 0;
    let totalSaturation = 0;
    let totalWarmth = 0;
    const colorBuckets = new Map<
      string,
      { count: number; r: number; g: number; b: number }
    >();

    for (let index = 0; index < data.length; index += sampleStride) {
      const alpha = data[index + 3] ?? 255;
      if (alpha < 20) continue;
      const r = data[index] ?? 0;
      const g = data[index + 1] ?? 0;
      const b = data[index + 2] ?? 0;
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      count += 1;
      const delta = luma - meanLuma;
      meanLuma += delta / count;
      m2 += delta * (luma - meanLuma);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      totalSaturation += max > 0 ? (max - min) / max : 0;
      totalWarmth += r - b;
      const bucketKey = [r, g, b]
        .map((channel) => Math.min(224, Math.floor(channel / 32) * 32))
        .join(":");
      const bucket = colorBuckets.get(bucketKey);
      if (bucket) {
        bucket.count += 1;
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
      } else {
        colorBuckets.set(bucketKey, { count: 1, r, g, b });
      }
    }

    if (!count) throw new Error("No readable pixels.");
    const avgSaturation = totalSaturation / count;
    const avgWarmth = totalWarmth / count;
    const contrast = Math.sqrt(m2 / count);
    const sampledColors = Array.from(colorBuckets.values())
      .sort((left, right) => right.count - left.count)
      .slice(0, 6)
      .map((bucket) =>
        `#${[bucket.r, bucket.g, bucket.b]
          .map((total) => Math.round(total / bucket.count).toString(16).padStart(2, "0"))
          .join("")}`.toUpperCase()
      );
    return {
      brightness: classifyCocoPhotoBrightness(meanLuma),
      contrast: classifyCocoPhotoContrast(contrast),
      dominantHints: Array.from(new Set([...sampledColors, ...filenameHints])),
      role,
      saturation: classifyCocoPhotoSaturation(avgSaturation),
      temperature: classifyCocoPhotoTemperature(avgWarmth),
    };
  } catch {
    return {
      dominantHints: filenameHints,
      role,
    };
  }
}

const COCO_FACE_WASM_PATH = "/vendor/mediapipe/tasks-vision/wasm";
// Full-range BlazeFace handles full-body nightlife portraits where the face
// occupies a small part of the frame (and remains reliable under hats). The
// short-range model returned no detection for Background 9's red-hat subject.
const COCO_FACE_MODEL_PATH = "/models/mediapipe/blaze_face_full_range.tflite";
const COCO_HAND_MODEL_PATH = "/models/mediapipe/hand_landmarker.task";

type CocoDetectedFace = {
  face: {
    x: number;
    y: number;
    width: number;
    height: number;
      confidence?: number;
  };
  faceKeypoints?: Array<{
    x: number;
    y: number;
    label?: string;
  }>;
  imageHeight?: number;
  imageWidth?: number;
};

let cocoFaceDetectorPromise: Promise<any | null> | null = null;
let cocoHandLandmarkerPromise: Promise<any | null> | null = null;

type CocoDetectedHand = DetectedHandRect;

function clampDetectedRect(
  rect: { x: number; y: number; width: number; height: number; confidence?: number },
  imageWidth: number,
  imageHeight: number
) {
  const x = Math.max(0, Math.min(imageWidth - 1, rect.x));
  const y = Math.max(0, Math.min(imageHeight - 1, rect.y));
  const right = Math.max(x + 1, Math.min(imageWidth, rect.x + rect.width));
  const bottom = Math.max(y + 1, Math.min(imageHeight, rect.y + rect.height));
  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
    confidence: rect.confidence,
  };
}

function isCocoMediaPipeConsoleNoise(args: unknown[]) {
  return args.some(
    (arg) =>
      typeof arg === "string" &&
      arg.includes("Created TensorFlow Lite XNNPACK delegate for CPU")
  );
}

function withSuppressedCocoMediaPipeConsoleNoise<T>(run: () => T): T {
  const originalError = console.error;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const filteredError = (...args: unknown[]) => {
    if (isCocoMediaPipeConsoleNoise(args)) return;
    Reflect.apply(originalError, console, args);
  };
  const filteredInfo = (...args: unknown[]) => {
    if (isCocoMediaPipeConsoleNoise(args)) return;
    Reflect.apply(originalInfo, console, args);
  };
  const filteredWarn = (...args: unknown[]) => {
    if (isCocoMediaPipeConsoleNoise(args)) return;
    Reflect.apply(originalWarn, console, args);
  };

  console.error = filteredError as typeof console.error;
  console.info = filteredInfo as typeof console.info;
  console.warn = filteredWarn as typeof console.warn;
  try {
    return run();
  } finally {
    console.error = originalError;
    console.info = originalInfo;
    console.warn = originalWarn;
  }
}

function installCocoMediaPipeConsoleFilter() {
  // Do not replace global console methods. React/Next report runtime failures
  // through console.error; wrapping it makes the development overlay blame
  // this filter instead of the component that actually failed. MediaPipe's
  // synchronous detector calls are filtered locally below where restoration
  // is guaranteed by finally.
}

async function getCocoFaceDetector() {
  if (typeof window === "undefined") return null;
  installCocoMediaPipeConsoleFilter();
  if (!cocoFaceDetectorPromise) {
    cocoFaceDetectorPromise = import("@mediapipe/tasks-vision")
      .then(async ({ FaceDetector, FilesetResolver }) => {
        const vision = await FilesetResolver.forVisionTasks(COCO_FACE_WASM_PATH);
        return FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: COCO_FACE_MODEL_PATH,
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          minDetectionConfidence: 0.45,
          minSuppressionThreshold: 0.3,
        });
      })
      .catch((err) => {
        cocoFaceDetectorPromise = null;
        if (process.env.NODE_ENV === "development") {
          console.warn("Coco face detector unavailable.", err);
        }
        return null;
      });
  }
  return cocoFaceDetectorPromise;
}

async function getCocoHandLandmarker() {
  if (typeof window === "undefined") return null;
  installCocoMediaPipeConsoleFilter();
  if (!cocoHandLandmarkerPromise) {
    cocoHandLandmarkerPromise = import("@mediapipe/tasks-vision")
      .then(async ({ FilesetResolver, HandLandmarker }) => {
        const vision = await FilesetResolver.forVisionTasks(COCO_FACE_WASM_PATH);
        return HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: COCO_HAND_MODEL_PATH,
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          numHands: 2,
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });
      })
      .catch((err) => {
        cocoHandLandmarkerPromise = null;
        if (process.env.NODE_ENV === "development") {
          console.warn("Coco hand detector unavailable.", err);
        }
        return null;
      });
  }
  return cocoHandLandmarkerPromise;
}

async function detectCocoHandsInDataUrl(dataUrl: string): Promise<CocoDetectedHand[]> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const node = new Image();
    node.onload = () => resolve(node);
    node.onerror = () => reject(new Error("Could not read the uploaded image for hand detection."));
    node.src = dataUrl;
  });
  const width = Math.max(1, img.naturalWidth || img.width);
  const height = Math.max(1, img.naturalHeight || img.height);
  const detector = await getCocoHandLandmarker();
  if (!detector) return [];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return [];
  context.drawImage(img, 0, 0, width, height);
  const result = withSuppressedCocoMediaPipeConsoleNoise(() => detector.detect(canvas));
  const hands = Array.isArray(result?.landmarks) ? result.landmarks : [];
  return hands.flatMap((landmarks: any[], index: number) => {
    const category = result?.handedness?.[index]?.[0];
    const rect = handRectFromNormalizedLandmarks({
      landmarks: Array.isArray(landmarks) ? landmarks : [],
      imageWidth: width,
      imageHeight: height,
      confidence: Number.isFinite(Number(category?.score)) ? Number(category.score) : undefined,
    });
    return rect ? [rect] : [];
  });
}

function detectedPropsFromCompositionMap(map: CocoCompositionMap | undefined) {
  if (!map) return [];
  return (map.detectedScene?.objects ?? []).flatMap((object) => {
    if (
      object.type !== "drink" ||
      object.authoritative === false ||
      object.confidence < 0.45
    ) return [];
    return [{
      x: object.rect.x / 100 * map.width,
      y: object.rect.y / 100 * map.height,
      width: object.rect.width / 100 * map.width,
      height: object.rect.height / 100 * map.height,
      confidence: object.confidence,
      kind: "drink" as const,
      source: "detr-object-detector" as const,
    }];
  });
}

async function detectCocoFaceBounds(
  img: HTMLImageElement,
  width: number,
  height: number
): Promise<CocoDetectedFace | null> {
  const detector = await getCocoFaceDetector();
  if (!detector) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#5b5964";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const result = withSuppressedCocoMediaPipeConsoleNoise(() => detector.detect(canvas));
  const detections = Array.isArray(result?.detections) ? result.detections : [];
  const candidates = detections
    .map((detection: any) => {
      const box = detection?.boundingBox;
      const confidence = Number(detection?.categories?.[0]?.score);
      if (!box) return null;
      const face = clampDetectedRect(
        {
          x: Number(box.originX),
          y: Number(box.originY),
          width: Number(box.width),
          height: Number(box.height),
          confidence: Number.isFinite(confidence) ? confidence : undefined,
        },
        width,
        height
      );
      if (face.width <= 1 || face.height <= 1) return null;
      return {
        face,
        faceKeypoints: Array.isArray(detection?.keypoints)
          ? detection.keypoints.map((point: any) => ({
              x: Math.max(0, Math.min(width, Number(point?.x) * width)),
              y: Math.max(0, Math.min(height, Number(point?.y) * height)),
              label: typeof point?.label === "string" ? point.label : undefined,
            }))
          : undefined,
      };
    })
    .filter(Boolean) as CocoDetectedFace[];

  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const confidenceDifference =
      (b.face.confidence ?? 0.5) - (a.face.confidence ?? 0.5);
    // Confidence is the detector's face-likelihood signal and must be the
    // primary authority. Multiplying it by rectangle area allowed a larger
    // hand/waist false positive to narrowly outrank a 0.90-confidence face.
    // Area is useful only when two candidates have effectively equal
    // confidence, such as two similarly clear faces in the same photo.
    if (Math.abs(confidenceDifference) > 0.01) return confidenceDifference;
    const aArea = a.face.width * a.face.height;
    const bArea = b.face.width * b.face.height;
    return bArea - aArea;
  });
  return candidates[0];
}

async function detectCocoFaceInDataUrl(dataUrl: string): Promise<CocoDetectedFace | null> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const node = new Image();
    node.onload = () => resolve(node);
    node.onerror = () => reject(new Error("Could not read the uploaded background."));
    node.src = dataUrl;
  });
  const width = Math.max(1, img.naturalWidth || img.width);
  const height = Math.max(1, img.naturalHeight || img.height);
  const detected = await detectCocoFaceBounds(img, width, height);
  return detected ? { ...detected, imageHeight: height, imageWidth: width } : null;
}

function compositionBoxFromDetectedFace(face: CocoDetectedFace | null): CocoCompositionBox | null {
  if (!face?.imageWidth || !face.imageHeight) return null;
  const width = Math.max(1, face.imageWidth);
  const height = Math.max(1, face.imageHeight);
  const x = Math.max(0, Math.min(100, (face.face.x / width) * 100));
  const y = Math.max(0, Math.min(100, (face.face.y / height) * 100));
  const boxWidth = Math.max(1, Math.min(100 - x, (face.face.width / width) * 100));
  const boxHeight = Math.max(1, Math.min(100 - y, (face.face.height / height) * 100));
  return {
    x,
    y,
    width: boxWidth,
    height: boxHeight,
    score: face.face.confidence ?? 0.86,
    label: "detected-face",
  };
}

function mapCocoDetectionToImageSpace(
  detection: CocoDetectedFace,
  targetWidth: number,
  targetHeight: number
) {
  const sourceWidth = Math.max(1, Number(detection.imageWidth));
  const sourceHeight = Math.max(1, Number(detection.imageHeight));
  const width = Math.max(1, Number(targetWidth));
  const height = Math.max(1, Number(targetHeight));
  const scaleX = width / sourceWidth;
  const scaleY = height / sourceHeight;
  const scaleRect = <T extends { x: number; y: number; width: number; height: number }>(rect: T) => ({
    ...rect,
    x: rect.x * scaleX,
    y: rect.y * scaleY,
    width: rect.width * scaleX,
    height: rect.height * scaleY,
  });

  return {
    face: clampDetectedRect(scaleRect(detection.face), width, height),
    faceKeypoints: detection.faceKeypoints?.map((point) => ({
      ...point,
      x: Math.max(0, Math.min(width, point.x * scaleX)),
      y: Math.max(0, Math.min(height, point.y * scaleY)),
    })),
  };
}

function measureCocoSilhouetteHalo(
  data: Uint8ClampedArray,
  width: number,
  height: number
) {
  let boundaryPixels = 0;
  let likelyHaloPixels = 0;
  const isForeground = (x: number, y: number, threshold = 18) =>
    x >= 0 && y >= 0 && x < width && y < height
      ? (data[(y * width + x) * 4 + 3] ?? 0) > threshold
      : false;
  const lumaAt = (x: number, y: number) => {
    const offset = (y * width + x) * 4;
    return (
      (data[offset] ?? 0) * 0.2126 +
      (data[offset + 1] ?? 0) * 0.7152 +
      (data[offset + 2] ?? 0) * 0.0722
    );
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isForeground(x, y)) continue;
      const boundary =
        !isForeground(x - 1, y) ||
        !isForeground(x + 1, y) ||
        !isForeground(x, y - 1) ||
        !isForeground(x, y + 1);
      if (!boundary) continue;
      boundaryPixels += 1;
      const offset = (y * width + x) * 4;
      const red = data[offset] ?? 0;
      const green = data[offset + 1] ?? 0;
      const blue = data[offset + 2] ?? 0;
      const luma = lumaAt(x, y);
      const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
      if (luma <= 225 || chroma >= 22) continue;

      let darkerInterior = false;
      for (let offsetY = -2; offsetY <= 2 && !darkerInterior; offsetY += 1) {
        for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
          const sampleX = x + offsetX;
          const sampleY = y + offsetY;
          if (!isForeground(sampleX, sampleY, 160)) continue;
          if (lumaAt(sampleX, sampleY) < luma - 40) {
            darkerInterior = true;
            break;
          }
        }
      }
      if (darkerInterior) likelyHaloPixels += 1;
    }
  }

  return likelyHaloPixels / Math.max(1, boundaryPixels);
}

async function measureImageAlphaBounds(
  dataUrl: string,
  maskSource: "transparent-upload" | "imgly-segmentation" = "transparent-upload",
  options?: { detectFace?: boolean }
): Promise<NonNullable<StartupSelectPayload["composer"]>["subjectBounds"]> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const node = new Image();
    node.onload = () => resolve(node);
    node.onerror = () => reject(new Error("Could not read the uploaded portrait."));
    node.src = dataUrl;
  });
  const width = Math.max(1, img.naturalWidth || img.width);
  const height = Math.max(1, img.naturalHeight || img.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return {
      width,
      height,
      alpha: { x: 0, y: 0, width, height },
      cutoutEvidence: {
        intent: "user",
        hasForeground: false,
        transparencyRatio: 0,
        edgeOpaqueRatio: 1,
        foregroundCoverage: 0,
        alphaBoundsArea: 0,
        alphaDensity: 0,
        sourceWidth: width,
        sourceHeight: height,
      },
    };
  }

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  const retainedMask = retainSubjectAlphaMask(img, width, height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let foregroundPixels = 0;
  let transparentPixels = 0;
  let edgePixels = 0;
  let edgeOpaquePixels = 0;
  const edgeDepth = Math.max(1, Math.ceil(Math.min(width, height) * 0.03));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3] ?? 0;
      if (alpha < 8) transparentPixels += 1;
      const edge =
        x < edgeDepth ||
        y < edgeDepth ||
        x >= width - edgeDepth ||
        y >= height - edgeDepth;
      if (edge) {
        edgePixels += 1;
        if (alpha >= 8) edgeOpaquePixels += 1;
      }
      if (alpha <= 18) continue;
      foregroundPixels += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) {
    return {
      width,
      height,
      ...retainedMask,
      maskSource,
      alpha: { x: 0, y: 0, width, height },
      core: { x: 0, y: 0, width, height },
      coreMode: "alpha-density",
      cutoutEvidence: {
        intent: "user",
        hasForeground: false,
        transparencyRatio: transparentPixels / Math.max(1, width * height),
        edgeOpaqueRatio: edgeOpaquePixels / Math.max(1, edgePixels),
        foregroundCoverage: 0,
        alphaBoundsArea: 0,
        alphaDensity: 0,
        sourceWidth: width,
        sourceHeight: height,
      },
    };
  }

  const alpha = {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
  const columnMass = new Array(alpha.width).fill(0);
  let totalMass = 0;
  let weightedX = 0;

  for (let y = alpha.y; y < alpha.y + alpha.height; y += 1) {
    for (let x = alpha.x; x < alpha.x + alpha.width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= 18) continue;
      const localX = x - alpha.x;
      columnMass[localX] += 1;
      totalMass += 1;
      weightedX += localX;
    }
  }

  const smoothed = columnMass.map((_, index) => {
    let total = 0;
    let count = 0;
    for (
      let x = Math.max(0, index - 4);
      x <= Math.min(columnMass.length - 1, index + 4);
      x += 1
    ) {
      total += columnMass[x];
      count += 1;
    }
    return count > 0 ? total / count : 0;
  });
  const maxColumnMass = Math.max(1, ...smoothed);
  const massCenterX = totalMass > 0 ? weightedX / totalMass : alpha.width / 2;
  const densityThreshold = Math.max(2, maxColumnMass * 0.24, alpha.height * 0.08);
  let coreLeft = Math.max(0, Math.min(alpha.width - 1, Math.round(massCenterX)));
  let coreRight = coreLeft;

  while (coreLeft > 0 && smoothed[coreLeft - 1] >= densityThreshold) coreLeft -= 1;
  while (coreRight < alpha.width - 1 && smoothed[coreRight + 1] >= densityThreshold) coreRight += 1;

  const minCoreWidth = Math.max(1, Math.round(alpha.width * 0.38));
  const maxCoreWidth = Math.max(minCoreWidth, Math.round(alpha.width * 0.82));
  if (coreRight - coreLeft + 1 < minCoreWidth) {
    const half = minCoreWidth / 2;
    coreLeft = Math.max(0, Math.round(massCenterX - half));
    coreRight = Math.min(alpha.width - 1, coreLeft + minCoreWidth - 1);
    coreLeft = Math.max(0, coreRight - minCoreWidth + 1);
  } else if (coreRight - coreLeft + 1 > maxCoreWidth) {
    const half = maxCoreWidth / 2;
    coreLeft = Math.max(0, Math.round(massCenterX - half));
    coreRight = Math.min(alpha.width - 1, coreLeft + maxCoreWidth - 1);
    coreLeft = Math.max(0, coreRight - maxCoreWidth + 1);
  }

  const horizontalPad = Math.round(alpha.width * 0.055);
  const coreX = Math.max(alpha.x, alpha.x + coreLeft - horizontalPad);
  const coreRightX = Math.min(alpha.x + alpha.width - 1, alpha.x + coreRight + horizontalPad);
  const detectedFace = options?.detectFace === false
    ? null
    : await detectCocoFaceBounds(img, width, height).catch(() => null);
  const alphaArea = Math.max(1, alpha.width * alpha.height);
  const cutoutEvidence: CocoSubjectClassifierEvidence = {
    intent: "user",
    hasForeground: foregroundPixels > 0,
    transparencyRatio: transparentPixels / Math.max(1, width * height),
    edgeOpaqueRatio: edgeOpaquePixels / Math.max(1, edgePixels),
    foregroundCoverage: foregroundPixels / Math.max(1, width * height),
    alphaBoundsArea: alphaArea / Math.max(1, width * height),
    alphaDensity: foregroundPixels / alphaArea,
    sourceWidth: width,
    sourceHeight: height,
    haloBoundaryRatio: measureCocoSilhouetteHalo(data, width, height),
  };

  return {
    width,
    height,
    ...retainedMask,
    maskSource,
    alpha,
    cutoutEvidence,
    core: {
      x: coreX,
      y: alpha.y,
      width: Math.max(1, coreRightX - coreX + 1),
      height: alpha.height,
    },
    ...(detectedFace
      ? {
          face: detectedFace.face,
          faceKeypoints: detectedFace.faceKeypoints,
          coreMode: "face-anchor" as const,
        }
      : {
          coreMode: "alpha-density" as const,
        }),
  };
}

function classifyPreparedCocoSubject({
  bounds,
  detection,
  face,
  source,
}: {
  bounds?: CocoComposerSubjectBounds;
  detection?: CocoDetectionResult | "skipped" | null;
  face?: CocoDetectedFace | null;
  source: NonNullable<CocoSubjectDecision["source"]>;
}) {
  const detectedSubjects =
    detection && detection !== "skipped" ? detection.subjectZones : [];
  const strongestPersonConfidence = detectedSubjects.reduce(
    (highest, zone) => Math.max(highest, Number(zone.confidence ?? zone.score ?? 0)),
    0
  );
  const faceConfidence = Number(face?.face.confidence ?? 0);
  const identityConfidence = Math.max(faceConfidence, strongestPersonConfidence);
  const alpha = bounds?.alpha;
  const sourceWidth = Math.max(1, Number(bounds?.width ?? face?.imageWidth ?? 1));
  const sourceHeight = Math.max(1, Number(bounds?.height ?? face?.imageHeight ?? 1));
  const identityCenter = face
    ? {
        x:
          (face.face.x + face.face.width / 2) *
          (sourceWidth / Math.max(1, Number(face.imageWidth) || sourceWidth)),
        y:
          (face.face.y + face.face.height / 2) *
          (sourceHeight / Math.max(1, Number(face.imageHeight) || sourceHeight)),
      }
    : detectedSubjects[0]
      ? {
          x: ((detectedSubjects[0].x + detectedSubjects[0].width / 2) / 100) * sourceWidth,
          y: ((detectedSubjects[0].y + detectedSubjects[0].height / 2) / 100) * sourceHeight,
        }
      : null;
  const identityInsideMask = identityCenter && alpha
    ? identityCenter.x >= alpha.x &&
      identityCenter.x <= alpha.x + alpha.width &&
      identityCenter.y >= alpha.y &&
      identityCenter.y <= alpha.y + alpha.height
    : undefined;
  const fallbackEvidence: CocoSubjectClassifierEvidence = {
    intent: "user",
    source,
    hasForeground: false,
    transparencyRatio: 0,
    edgeOpaqueRatio: 1,
    foregroundCoverage: 0,
    alphaBoundsArea: 0,
    alphaDensity: 0,
    sourceWidth,
    sourceHeight,
  };

  return classifyCocoSubjectDecision({
    ...(bounds?.cutoutEvidence ?? fallbackEvidence),
    intent: "user",
    source,
    ...(identityConfidence > 0 ? { identityConfidence } : {}),
    ...(face?.face.width
      ? {
          faceWidthPx:
            face.face.width * (sourceWidth / Math.max(1, Number(face.imageWidth))),
        }
      : {}),
    ...(detectedSubjects.length || face
      ? { detectedPeople: Math.max(detectedSubjects.length, face ? 1 : 0) }
      : detection && detection !== "skipped" && detection.source === "no-detections"
        ? { detectedPeople: 0 }
        : {}),
    ...(identityInsideMask == null ? {} : { identityInsideMask }),
  });
}

function retainSubjectAlphaMask(
  image: HTMLImageElement,
  sourceWidth: number,
  sourceHeight: number
) {
  // Layout only needs occupancy, not a presentation-quality cutout. A
  // bounded mask keeps templates/session snapshots practical while
  // preserving substantially more geometry than one subject rectangle.
  const maxSide = 640;
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const maskWidth = Math.max(1, Math.round(sourceWidth * scale));
  const maskHeight = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = maskWidth;
  canvas.height = maskHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return {};

  ctx.clearRect(0, 0, maskWidth, maskHeight);
  ctx.drawImage(image, 0, 0, maskWidth, maskHeight);
  const pixels = ctx.getImageData(0, 0, maskWidth, maskHeight);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const alpha = pixels.data[index + 3] ?? 0;
    pixels.data[index] = 255;
    pixels.data[index + 1] = 255;
    pixels.data[index + 2] = 255;
    // Remove near-transparent segmentation haze while retaining soft hair
    // and clothing edges above the same threshold used for alpha bounds.
    pixels.data[index + 3] = alpha <= 18 ? 0 : alpha;
  }
  ctx.putImageData(pixels, 0, 0);

  return {
    maskDataUrl: canvas.toDataURL("image/png"),
    maskWidth,
    maskHeight,
    maskThreshold: 18,
  };
}

function hasAnyText(payload: StartupBuildPayload["currentText"]) {
  return Object.values(payload).some((value) => String(value || "").trim().length > 0);
}

function conciseCocoEventDescription(value: string) {
  const words = String(value || "")
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{N}&+]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const leadingFillers = new Set(["a", "an", "the", "this", "that", "its", "is"]);
  while (words.length && leadingFillers.has(words[0].toLowerCase())) words.shift();

  const selected: string[] = [];
  for (const word of words) {
    if (selected.length >= 4) break;
    const candidate = [...selected, word].join(" ");
    if (candidate.length > 28) break;
    selected.push(word);
  }

  return selected.join(" ").toUpperCase();
}

function cocoCopyPhotoHints(photoSignals: CocoPhotoSignal[]) {
  return Array.from(
    new Set(
      photoSignals
        .flatMap((signal) => signal.dominantHints ?? [])
        .map((hint) => String(hint || "").trim().toLowerCase())
        .filter((hint) => Boolean(hint) && !/^#[0-9a-f]{6}$/i.test(hint))
    )
  ).slice(0, 10);
}

async function requestCocoGeneratedCopy({
  eventName,
  eventDescription,
  eventBrief,
  nightlifeStyle,
  photoSignals,
}: {
  eventName: string;
  eventDescription?: string;
  eventBrief?: CocoComposerEventBrief;
  nightlifeStyle?: CocoNightlifeStyle | null;
  photoSignals?: CocoPhotoSignal[];
}): Promise<CocoGeneratedCopy> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  const photoHints = cocoCopyPhotoHints(photoSignals ?? []);
  const copyContext = { nightlifeStyle, photoHints, eventDescription };
  try {
    const res = await fetch("/api/coco-copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventDescription,
        eventBrief,
        nightlifeStyle,
        photoHints,
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Coco copy request failed: ${res.status}`);
    const json = await res.json().catch(() => null);
    return sanitizeCocoGeneratedCopy(
      json && typeof json === "object" && "copy" in json
        ? (json as { copy?: unknown }).copy
        : json,
      eventName,
      copyContext
    );
  } catch {
    return fallbackCocoGeneratedCopy(eventName, copyContext);
  } finally {
    window.clearTimeout(timeout);
  }
}

async function requestCocoStyleDecision({
  eventName,
  eventDescription,
  photoSignals,
  templateId,
  templateLabel,
}: {
  eventName: string;
  eventDescription?: string;
  photoSignals: CocoPhotoSignal[];
  templateId?: string | null;
  templateLabel?: string | null;
}): Promise<CocoStyleDecision> {
  const localDecision = decideCocoNightlifeStyleLocal({
    eventName: [eventName, eventDescription].filter(Boolean).join(" · "),
    photoSignals,
    source: "local",
    templateId,
    templateLabel,
  });
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch("/api/coco-style", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventDescription,
        photoSignals,
        templateId,
        templateLabel,
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Coco style request failed: ${res.status}`);
    const json = await res.json().catch(() => null);
    const decision =
      json && typeof json === "object" && "decision" in json
        ? (json as { decision?: unknown }).decision
        : null;
    if (!decision || typeof decision !== "object") return localDecision;
    const candidate = decision as Partial<CocoStyleDecision>;
    if (!candidate.style || typeof candidate.confidence !== "number") return localDecision;
    return {
      ...localDecision,
      ...candidate,
      evidence: Array.isArray(candidate.evidence) ? candidate.evidence : localDecision.evidence,
      scores: Array.isArray(candidate.scores) ? candidate.scores : localDecision.scores,
    } as CocoStyleDecision;
  } catch {
    return localDecision;
  } finally {
    window.clearTimeout(timeout);
  }
}

const StartupTemplates: React.FC<StartupTemplatesProps> = ({
  onSelect,
  onFindCocoReference,
  onLoadProjectFile,
  buildForYouEnabled,
  buildForYouLoading,
  buildForYouError,
  onBuildForYou,
  guestMode = false,
  templateOptions = [],
  djBackgroundOptions,
}) => {
  const [screen, setScreen] = React.useState<"entry" | "advanced" | "build" | "composer" | "dj">("entry");
  React.useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.get("browse")==="1")setScreen("advanced");
    else if(params.get("coco")==="1")setScreen("composer");
  },[]);
  const prefersReducedMotion = useReducedMotion();
  const [headline, setHeadline] = React.useState("");
  const [head2, setHead2] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [details2, setDetails2] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [subtag, setSubtag] = React.useState("");
  const [backgroundFile, setBackgroundFile] = React.useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = React.useState<string | null>(null);
  const [composerStep, setComposerStep] = React.useState<1 | 2>(1);
  const [composerPortraitFile, setComposerPortraitFile] = React.useState<File | null>(null);
  const [composerSubjectSrc, setComposerSubjectSrc] = React.useState("");
  const [composerImageSection, setComposerImageSection] = React.useState<
    "backgrounds" | "drinks" | "subjects"
  >("backgrounds");
  const [composerEventName, setComposerEventName] = React.useState("");
  const [composerStyle, setComposerStyle] = React.useState<string>("");
  const landingSelectionHandled = React.useRef(false);
  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("coco") !== "1" || landingSelectionHandled.current) return;
    const requested = url.searchParams.get("cocoDesign");
    const event = url.searchParams.get("eventName");
    if (event) setComposerEventName(event.slice(0, 50));
    if (!requested) { landingSelectionHandled.current = true; return; }
    const template = templateOptions.find(item => item.key === requested);
    if (!template) return;
    landingSelectionHandled.current = true;
    url.searchParams.delete("cocoDesign");
    window.history.replaceState(window.history.state, "", url);
    onSelect(template.key);
  }, [onSelect, templateOptions]);

  const [composerSubtitle] = React.useState("");
  const [composerPresenterName] = React.useState("");
  const [composerDate] = React.useState("");
  const [composerStartTime] = React.useState("");
  const [composerEndTime] = React.useState("");
  const [composerVenueName] = React.useState("");
  const [composerAddress] = React.useState("");
  const [composerDjs] = React.useState("");
  const [composerHosts] = React.useState("");
  const [composerPerformers] = React.useState("");
  const [composerAdditionalActs] = React.useState("");
  const [composerMusicPolicy] = React.useState("");
  const [composerEventDetails] = React.useState("");
  const [composerDressCode] = React.useState("");
  const [composerExperienceFeatures] = React.useState<string[]>([]);
  const [composerMainPromotion] = React.useState("");
  const [composerBottleSpecials] = React.useState("");
  const [composerDrinkSpecials] = React.useState("");
  const [composerFoodSpecials] = React.useState("");
  const [composerHookahSpecials] = React.useState("");
  const [composerPromotionDeadline] = React.useState("");
  const [composerAdditionalOffers] = React.useState("");
  const [composerSocials] = React.useState("");
  const [composerSocialPlatforms] = React.useState<string[]>([]);
  const [composerRsvpContact] = React.useState("");
  const [composerBookingContact] = React.useState("");
  const [composerWebsite] = React.useState("");
  const [composerEmail] = React.useState("");
  const [composerTicketLink] = React.useState("");
  const [composerEntryFee] = React.useState("");
  const [composerFreeEntryCondition] = React.useState("");
  const [composerAgeRequirement] = React.useState("");
  const [composerEntryRestrictions] = React.useState("");
  const [composerResponsibleDrinking] = React.useState("");
  const [composerQrDestination] = React.useState("");
  const [composerQrLabel] = React.useState("");
  const [composerBackgroundSrc, setComposerBackgroundSrc] = React.useState("");
  const [backgroundSelectionExplicit, setBackgroundSelectionExplicit] = React.useState(false);
  const [composerSubmitting, setComposerSubmitting] = React.useState(false);
  const [composerStatus, setComposerStatus] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const homeProjectHandled=React.useRef(false);
  React.useEffect(()=>{
    const url=new URL(window.location.href);
    const key=url.searchParams.get("openProject");
    if(!key||homeProjectHandled.current)return;
    homeProjectHandled.current=true;
    void (async()=>{
      try{
        const file=await readHomeProject(key);
        if(!file)throw new Error("Please choose your saved design again.");
        await onLoadProjectFile(file);
        await clearHomeProject(key);
      }catch(error){setLocalError(error instanceof Error?error.message:"Could not open your saved design.");}
      finally{
        url.searchParams.delete("openProject");
        window.history.replaceState(window.history.state,"",url);
      }
    })();
  },[onLoadProjectFile]);

  const [guestMoreOpen, setGuestMoreOpen] = React.useState(false);
  const [startupCocoFocus, setStartupCocoFocus] = React.useState<StartupCocoFocus>("prompt");
  const [startupCocoReady, setStartupCocoReady] = React.useState(false);
  const startupCocoRestingFocusRef = React.useRef<StartupCocoRestingFocus>("prompt");
  const pickerSeenRef = React.useRef(new Set<string>());
  const pickerScrolledRef = React.useRef(new Set<string>());
  const guestOrderedTemplates = React.useMemo(() => {
    if (!guestMode) return templateOptions;
    const preferredTemplates = GUEST_PICKER_TEMPLATE_IDS.flatMap((templateId) => {
      const template = templateOptions.find((item) => item.key === templateId);
      return template ? [template] : [];
    });
    const preferredKeys = new Set(preferredTemplates.map((template) => template.key));
    return [
      ...preferredTemplates,
      ...templateOptions.filter((template) => !preferredKeys.has(template.key)),
    ];
  }, [guestMode, templateOptions]);
  const guestFeaturedTemplate = guestMode ? guestOrderedTemplates[0] : null;
  const guestSecondaryTemplates = guestMode ? guestOrderedTemplates.slice(1, 5) : [];
  const guestExtraTemplates = guestMode && guestMoreOpen ? guestOrderedTemplates.slice(5) : [];
  const guestVisibleTemplateCount =
    guestMode && guestFeaturedTemplate
      ? 1 + guestSecondaryTemplates.length + guestExtraTemplates.length
      : templateOptions.length;

  const pickerSurface = React.useMemo(() => {
    if (screen === "entry" && guestMode) return "startup_guest_entry";
    if (screen === "advanced") return "startup_advanced";
    return null;
  }, [guestMode, screen]);

  React.useEffect(() => {
    if (!pickerSurface || !templateOptions.length) return;
    if (pickerSeenRef.current.has(pickerSurface)) return;
    pickerSeenRef.current.add(pickerSurface);
    void trackClientEvent("template_picker_seen", {
      properties: {
        source: "startup",
        surface: pickerSurface,
        screen,
        guest_mode: guestMode,
        template_count: templateOptions.length,
        visible_template_count: guestVisibleTemplateCount,
      },
    });
  }, [guestMode, guestVisibleTemplateCount, pickerSurface, screen, templateOptions.length]);

  const trackPickerScrolled = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!pickerSurface || pickerScrolledRef.current.has(pickerSurface)) return;
      const node = event.currentTarget;
      if (node.scrollTop < 24) return;
      pickerScrolledRef.current.add(pickerSurface);
      void trackClientEvent("template_picker_scrolled", {
        properties: {
          source: "startup",
          surface: pickerSurface,
          screen,
          guest_mode: guestMode,
          template_count: templateOptions.length,
          visible_template_count: guestVisibleTemplateCount,
          scroll_top: Math.round(node.scrollTop),
          scroll_height: Math.round(node.scrollHeight),
          viewport_height: Math.round(node.clientHeight),
        },
      });
    },
    [guestMode, guestVisibleTemplateCount, pickerSurface, screen, templateOptions.length]
  );

  React.useEffect(() => {
    if (!backgroundFile) {
      setBackgroundPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(backgroundFile);
    setBackgroundPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [backgroundFile]);

  React.useEffect(() => {
    if (composerBackgroundSrc || !djBackgroundOptions.length) return;
    setComposerBackgroundSrc(djBackgroundOptions[0].src);
  }, [composerBackgroundSrc, djBackgroundOptions]);

  React.useEffect(() => {
    if (screen !== "entry" || guestMode) {
      setStartupCocoReady(false);
      return;
    }

    let hasSeenCoco = false;
    let welcomedThisSession = false;

    try {
      hasSeenCoco = window.localStorage.getItem(COCO_SEEN_STORAGE_KEY) === "1";
      welcomedThisSession =
        window.sessionStorage.getItem(COCO_RETURNING_SESSION_KEY) === "1";
      window.sessionStorage.setItem(COCO_STARTUP_INTRO_SESSION_KEY, "1");
      window.localStorage.setItem(COCO_SEEN_STORAGE_KEY, "1");
      window.sessionStorage.setItem(COCO_RETURNING_SESSION_KEY, "1");
    } catch {
      // Storage is only a flow hint; Coco can fall back to the first-time intro.
    }

    const restingFocus: StartupCocoRestingFocus = hasSeenCoco ? "returningPrompt" : "prompt";
    const entryFocus: StartupCocoFocus = hasSeenCoco
      ? welcomedThisSession
        ? restingFocus
        : "returning"
      : "intro";

    startupCocoRestingFocusRef.current = restingFocus;
    setStartupCocoFocus(entryFocus);
    setStartupCocoReady(true);

    if (entryFocus === restingFocus) return;

    const timer = window.setTimeout(() => setStartupCocoFocus(restingFocus), 2200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [guestMode, screen]);

  const handleBuildSubmit = async () => {
    setLocalError(null);
    if (!buildForYouEnabled) {
      setLocalError("Creator and Studio plans include Build For You.");
      return;
    }
    if (!backgroundFile) {
      setLocalError("Upload a background first.");
      return;
    }

    const currentText = { headline, head2, details, details2, venue, subtag };
    if (!hasAnyText(currentText)) {
      setLocalError("Add at least one text field so AI has something to lay out.");
      return;
    }

    await onBuildForYou({
      backgroundFile,
      currentText,
    });
  };

  const handleComposerSubmit = async () => {
    if (composerSubmitting) return;
    setLocalError(null);
    setComposerStatus(null);
    const eventName = composerEventName.trim();
    if (!eventName) {
      setLocalError("Add the event name first.");
      return;
    }
    if (!composerStyle) { setLocalError('Choose a theme to continue.'); return; }
    const eventDescription = `${composerStyle} flyer theme`;
    const eventBrief = {
      theme: composerStyle,
      description: eventDescription,
      subtitle: composerSubtitle.trim(),
      presenterName: composerPresenterName.trim(),
      date: composerDate.trim(),
      startTime: composerStartTime.trim(),
      endTime: composerEndTime.trim(),
      venueName: composerVenueName.trim(),
      address: composerAddress.trim(),
      djs: composerDjs.trim(),
      hosts: composerHosts.trim(),
      performers: composerPerformers.trim(),
      additionalActs: composerAdditionalActs.trim(),
      musicPolicy: composerMusicPolicy.trim(),
      eventDetails: composerEventDetails.trim(),
      dressCode: composerDressCode.trim(),
      experienceFeatures: composerExperienceFeatures,
      mainPromotion: composerMainPromotion.trim(),
      bottleSpecials: composerBottleSpecials.trim(),
      drinkSpecials: composerDrinkSpecials.trim(),
      foodSpecials: composerFoodSpecials.trim(),
      hookahSpecials: composerHookahSpecials.trim(),
      promotionDeadline: composerPromotionDeadline.trim(),
      additionalOffers: composerAdditionalOffers.trim(),
      socials: composerSocials.trim(),
      socialPlatforms: composerSocialPlatforms,
      rsvpContact: composerRsvpContact.trim(),
      bookingContact: composerBookingContact.trim(),
      website: composerWebsite.trim(),
      email: composerEmail.trim(),
      ticketLink: composerTicketLink.trim(),
      entryFee: composerEntryFee.trim(),
      freeEntryCondition: composerFreeEntryCondition.trim(),
      ageRequirement: composerAgeRequirement.trim(),
      entryRestrictions: composerEntryRestrictions.trim(),
      responsibleDrinking: composerResponsibleDrinking.trim(),
      qrDestination: composerQrDestination.trim(),
      qrLabel: composerQrLabel.trim(),
      requestedAssetIds: Array.from(
        new Set([
          ...composerSocialPlatforms.map((platform) => `social:${platform}`),
          ...composerExperienceFeatures.map((feature) => `feature:${feature}`),
          ...(composerQrDestination.trim() ? ["utility:qr"] : []),
        ])
      ),
    };
    const qrCheck = cocoQrCode(eventBrief);
    if (qrCheck && "error" in qrCheck) { setLocalError(qrCheck.error); return; }
    const selectedStandaloneSubject = CREATE_WITH_COCO_SUBJECTS.some(
      (asset) => asset.src === composerSubjectSrc
    );
    // The quick path uses the authored design, without image processing or
    // generated filler copy. Custom images are opt-in.
    if (!composerPortraitFile && !selectedStandaloneSubject && !backgroundFile && !backgroundSelectionExplicit) {
      onSelect("coco-composer", { composer: {
        fieldMappingVersion: 1, keepDesignImages: true, eventName, eventBrief,
        subjectDecision: { intent: "none", quality: "none" },
        layoutRecipeTemplateId: "", referenceCandidates: [],
      }});
      return;
    }
    setComposerStatus("Reviewing your event details...");
    setComposerSubmitting(true);
    try {
      // Only assets from the dedicated Subjects collection are foregrounds.
      // Drinks and background-library images must always remain intact backgrounds,
      // even if an older composer session left their source in foreground state.
      const selectedSubjectFile = composerPortraitFile || (selectedStandaloneSubject
        ? await createWithCocoAssetFile(composerSubjectSrc).catch((err) => {
            setLocalError(err instanceof Error ? err.message : "Could not load the selected Coco image.");
            return null;
          })
        : null);
      if (selectedStandaloneSubject && !selectedSubjectFile) return;
      setComposerStatus("Preparing background...");
      const backgroundDataUrl = backgroundFile
        ? await fileToDownscaledDataUrl(backgroundFile).catch((err) => {
            setLocalError(err instanceof Error ? err.message : "Could not read the uploaded background.");
            return null;
          })
        : null;
      if (backgroundFile && !backgroundDataUrl) return;
      const selectedBackgroundFile = backgroundFile || (composerBackgroundSrc
        ? await createWithCocoAssetFile(composerBackgroundSrc).catch((err) => {
            setLocalError(err instanceof Error ? err.message : "Could not load the selected Coco background.");
            return null;
          })
        : null);
      if (composerBackgroundSrc && !selectedBackgroundFile) return;
      const backgroundAnalysisDataUrl = backgroundDataUrl || (selectedBackgroundFile
        ? await fileToDownscaledDataUrl(selectedBackgroundFile).catch((err) => {
            setLocalError(err instanceof Error ? err.message : "Could not read the selected Coco background.");
            return null;
          })
        : null);
      if (selectedBackgroundFile && !backgroundAnalysisDataUrl) return;

      let compositionMap: CocoCompositionMap | undefined;
      // Complete backgrounds use the authored recipe geometry. Only an
      // explicitly selected foreground subject needs detection below.

      setComposerStatus("Reading event direction...");
      const backgroundSignalPromise = selectedBackgroundFile
        ? extractCocoPhotoSignal(selectedBackgroundFile, "background").catch(() => null)
        : Promise.resolve<CocoPhotoSignal | null>(null);
      const subjectSignalPromise = selectedSubjectFile
        ? extractCocoPhotoSignal(selectedSubjectFile, "subject").catch(() => null)
        : Promise.resolve<CocoPhotoSignal | null>(null);
      const photoSignals = (
        await Promise.all([
          subjectSignalPromise,
          backgroundSignalPromise,
        ])
      ).filter((signal): signal is CocoPhotoSignal => Boolean(signal));
      const creativeIntent = resolveCocoCreativeIntent({
        eventName,
        eventDescription,
      });
      const eventCopyDescription = eventCopyDescriptionForCocoIntent(
        eventDescription,
        creativeIntent
      );
      const styleDecision = await requestCocoStyleDecision({
        eventName,
        eventDescription: eventDescription || [eventBrief.musicPolicy, eventBrief.eventDetails, eventBrief.dressCode, ...eventBrief.experienceFeatures].filter(Boolean).join(" · "),
        photoSignals,
      });

      setComposerStatus(`Generating ${cocoNightlifeStyleLabel(styleDecision.style)} flyer copy...`);
      const generatedCopy = await requestCocoGeneratedCopy({
        eventName,
        eventDescription: eventCopyDescription,
        eventBrief: {
          ...eventBrief,
          description: eventCopyDescription,
        },
        nightlifeStyle: nightlifeStyleForCocoIntentCopy(
          creativeIntent,
          styleDecision.style
        ),
        photoSignals,
      });
      const flyerLines = (values: Array<string | undefined>) =>
        values
          .flatMap((value) => String(value || "").split(/\s*[|;]\s*|\r?\n/))
          .map((value) => value.replace(/\s+/g, " ").trim())
          .filter(Boolean)
          .join("\n");
      const suppliedProgramming = flyerLines([
        eventBrief.hosts ? `HOSTED BY ${eventBrief.hosts}` : "",
        eventBrief.performers ? `LIVE ${eventBrief.performers}` : "",
        eventBrief.additionalActs,
      ]);
      const suppliedOffers = flyerLines([
        eventBrief.mainPromotion,
        eventBrief.promotionDeadline,
        eventBrief.bottleSpecials,
        eventBrief.drinkSpecials,
        eventBrief.foodSpecials,
        eventBrief.hookahSpecials,
        eventBrief.additionalOffers,
        eventBrief.freeEntryCondition,
      ]);
      const copy: CocoGeneratedCopy = {
        ...generatedCopy,
        presenter: eventBrief.presenterName
          ? /\bpresents?\b/i.test(eventBrief.presenterName)
            ? eventBrief.presenterName
            : `${eventBrief.presenterName} PRESENTS`
          : "",
        subheadline: eventBrief.subtitle || generatedCopy.subheadline,
        venue: [eventBrief.venueName, eventBrief.address].filter(Boolean).join("\n"),
        date: [eventBrief.date, [eventBrief.startTime, eventBrief.endTime].filter(Boolean).join(" — ")]
          .filter(Boolean)
          .join("\n"),
        details: flyerLines([
          eventBrief.eventDetails,
          eventBrief.experienceFeatures.join(" • "),
        ]) || generatedCopy.details || conciseCocoEventDescription(eventCopyDescription),
        details2: suppliedProgramming || generatedCopy.details2,
        djLineup: eventBrief.djs
          ? `MUSIC BY\n${eventBrief.djs.replace(/\s*[,|]\s*/g, " • ")}`
          : "",
        musicPolicy: eventBrief.musicPolicy || generatedCopy.musicPolicy,
        socials: eventBrief.socials,
        rsvpContact: eventBrief.rsvpContact || eventBrief.bookingContact
          ? [eventBrief.rsvpContact && `RSVP ${eventBrief.rsvpContact}`, eventBrief.bookingContact && `TABLES ${eventBrief.bookingContact}`].filter(Boolean).join("\n")
          : "",
        price: eventBrief.entryFee
          ? `ENTRY\n${eventBrief.entryFee}`
          : "",
        compliance: eventBrief.ageRequirement
          ? eventBrief.ageRequirement
          : "",
        subtag: suppliedOffers,
        addons: flyerLines([
          eventBrief.dressCode,
          eventBrief.entryRestrictions,
          eventBrief.responsibleDrinking,
        ]),
      };
      const moodProfile = buildCocoMoodProfile({
        event: {
          title: eventName,
          subtitle: [copy.headline, copy.subheadline].filter(Boolean).join(" "),
          description: [eventDescription, copy.details, copy.details2, copy.subtag]
            .filter(Boolean)
            .join(" "),
          venue: copy.venue,
        },
        nightlifeStyle: styleDecision.style,
        photoSignals,
        styleDecision,
      });

      let subjectDataUrl = "";
      let recipeSubjectDataUrl = "";
      let subjectReferenceImage = "";
      let subjectBounds: NonNullable<StartupSelectPayload["composer"]>["subjectBounds"] | undefined;
      let recipeSubjectBounds: NonNullable<StartupSelectPayload["composer"]>["subjectBounds"] | undefined;
      let subjectSourceDataUrl = "";
      let subjectDecision: CocoSubjectDecision = { intent: "none", quality: "none" };
      let backgroundOnlyHero = false;
      let subjectMaskSource: "transparent-upload" | "imgly-segmentation" =
        "transparent-upload";
      let heroImageFace: NonNullable<StartupSelectPayload["composer"]>["heroImageFace"] | undefined;
      const detectedBackgroundFace: CocoDetectedFace | null = null;
      let detectedSubjectFace: CocoDetectedFace | null = null;
      let subjectDetection: CocoDetectionResult | "skipped" | null = null;
      let detectedHands: CocoDetectedHand[] = [];
      let detectedProps = detectedPropsFromCompositionMap(compositionMap);
      if (selectedSubjectFile) {
        setComposerStatus("Preparing portrait...");
        const rawSubjectDataUrl = await fileToDownscaledDataUrl(
          selectedSubjectFile,
          1800,
          selectedSubjectFile.type === "image/png" || selectedSubjectFile.type === "image/webp"
            ? "image/png"
            : "image/jpeg"
        ).catch((err) => {
          setLocalError(err instanceof Error ? err.message : "Could not read the uploaded portrait.");
          return null;
        });
        if (!rawSubjectDataUrl) return;
        subjectReferenceImage = rawSubjectDataUrl;

        setComposerStatus("Detecting hands and important props...");
        const [hands, subjectAnalysis, subjectFace] = await Promise.all([
          detectCocoHandsInDataUrl(rawSubjectDataUrl).catch(() => []),
          analyzeImageWithAutoDetection(rawSubjectDataUrl).catch(() => null),
          detectCocoFaceInDataUrl(rawSubjectDataUrl).catch(() => null),
        ]);
        detectedHands = hands;
        detectedSubjectFace =
          subjectFace && (subjectFace.face.confidence ?? 0) >= 0.42
            ? subjectFace
            : null;
        subjectDetection = subjectAnalysis?.detection ?? null;
        detectedProps = detectedPropsFromCompositionMap(subjectAnalysis?.map ?? undefined);

        subjectDataUrl = rawSubjectDataUrl;
        subjectSourceDataUrl = rawSubjectDataUrl;
        const alreadyCutout = await imageDataUrlHasTransparency(rawSubjectDataUrl).catch(() => false);
        if (!alreadyCutout) {
          subjectMaskSource = "imgly-segmentation";
          setComposerStatus("Removing portrait background...");
          subjectDataUrl = await removeBackgroundLocal(rawSubjectDataUrl, {
            cleanup: EXTRACT_SUBJECT_CLEANUP,
          }).catch(() => "");
          setLocalError(null);
        }
      } else if (backgroundAnalysisDataUrl) {
        // An intact background is not a cutout. Authored recipes own placement;
        // do not download detection/segmentation models just to offer recipes.
        backgroundOnlyHero = true;
      }

      if ((composerPortraitFile || selectedStandaloneSubject) && !subjectDataUrl) {
        setLocalError("Coco could not prepare that portrait. Try another photo or choose one from the library.");
        return;
      }
      if (subjectDataUrl) {
        setComposerStatus("Measuring subject...");
        subjectBounds = await measureImageAlphaBounds(
          subjectDataUrl,
          subjectMaskSource,
          // Face detection already ran on the unmodified source. Re-detecting
          // on a transparent/cleaned cutout creates a second, often different
          // face authority. Preserve the source detection and map it into the
          // cutout's pixel space below instead. If the source detector found
          // nothing, the simplified cutout remains a useful fallback pass.
          { detectFace: !(detectedSubjectFace ?? detectedBackgroundFace) }
        ).catch(() => undefined);
        if (subjectBounds) {
          const detectedFace = detectedSubjectFace ?? detectedBackgroundFace;
          const mappedDetection = detectedFace
            ? mapCocoDetectionToImageSpace(
                detectedFace,
                subjectBounds.width,
                subjectBounds.height
              )
            : null;
          const sourceWidth = Math.max(
            1,
            Number(detectedFace?.imageWidth) || subjectBounds.width
          );
          const sourceHeight = Math.max(
            1,
            Number(detectedFace?.imageHeight) || subjectBounds.height
          );
          const scaleX = subjectBounds.width / sourceWidth;
          const scaleY = subjectBounds.height / sourceHeight;
          const mapRect = <T extends { x: number; y: number; width: number; height: number }>(rect: T) => ({
            ...rect,
            x: rect.x * scaleX,
            y: rect.y * scaleY,
            width: rect.width * scaleX,
            height: rect.height * scaleY,
          });
          subjectBounds = {
            ...subjectBounds,
            ...(mappedDetection
              ? {
                  face: mappedDetection.face,
                  faceKeypoints: mappedDetection.faceKeypoints,
                  coreMode: "face-anchor" as const,
                }
              : {}),
            hands: detectedHands.map(mapRect),
            props: detectedProps.map(mapRect),
          };
        }
      }
      if (selectedSubjectFile) {
        recipeSubjectDataUrl = subjectDataUrl;
        recipeSubjectBounds = subjectBounds;
        subjectDecision = classifyPreparedCocoSubject({
          bounds: subjectBounds,
          detection: subjectDetection,
          face: detectedSubjectFace,
          source: composerPortraitFile ? "uploaded-photo" : "library-subject",
        });
      } else {
        subjectDecision = { intent: "none", quality: "none" };
      }
      let initialSubjectLayoutId:
        | "subject-center"
        | "subject-left"
        | "subject-right"
        | undefined;
      const subjectFace = subjectBounds?.face;
      const detectedFaceForLayout = detectedSubjectFace ?? detectedBackgroundFace;
      // The mapped face stored on subjectBounds is also the authority used by
      // the canvas fitter. Use that exact box for layout selection so Coco
      // cannot choose left/center/right from one coordinate space and place
      // the subject from another.
      const faceCenterRatio = subjectFace && subjectBounds?.width
        ? (subjectFace.x + subjectFace.width / 2) / Math.max(1, subjectBounds.width)
        : detectedFaceForLayout?.imageWidth
          ? (detectedFaceForLayout.face.x + detectedFaceForLayout.face.width / 2) /
            Math.max(1, detectedFaceForLayout.imageWidth)
          : null;
      if (faceCenterRatio != null) {
        initialSubjectLayoutId =
          faceCenterRatio < 0.42
            ? "subject-left"
            : faceCenterRatio > 0.58
            ? "subject-right"
            : "subject-center";
      }
      const backgroundSrc =
        backgroundDataUrl ? undefined : composerBackgroundSrc || undefined;
      // Authored recipe choices are ranked by the event brief in the editor.
      // Gallery image search must not gate (or supply a template to) this flow.
      setComposerStatus("Finding matching directions for your event...");
      onSelect("coco-composer", {
        composer: {
          fieldMappingVersion: 1,
          keepDesignImages: !selectedSubjectFile,
          eventName,
          eventBrief,
          copy,
          subjectDataUrl: subjectDataUrl || undefined,
          subjectBounds,
          recipeSubjectDataUrl: recipeSubjectDataUrl || undefined,
          recipeSubjectBounds,
          subjectSourceDataUrl: subjectSourceDataUrl || undefined,
          subjectDecision,
          backgroundOnlyHero: backgroundOnlyHero || undefined,
          heroImageFace,
          backgroundDataUrl: backgroundDataUrl || undefined,
          backgroundSrc,
          backgroundSelectionExplicit: Boolean(backgroundFile) || backgroundSelectionExplicit,
          compositionMap,
          initialSubjectLayoutId,
          layoutRecipeTemplateId: "",
          referenceCandidates: [],
          creativeIntent: creativeIntent ?? undefined,
          moodProfile,
          photoSignals,
          styleDecision,
        },
      });
    } finally {
      setComposerSubmitting(false);
      setComposerStatus(null);
    }
  };

  const openComposerStudio = () => {
    setLocalError(null);
    setScreen("composer");
  };

  const openAdvancedStudio = () => {
    setLocalError(null);
    setScreen("advanced");
  };

  const goBackToEntry = () => {
    setLocalError(null);
    setScreen("entry");
  };

  const goBackToAdvanced = () => {
    setLocalError(null);
    setScreen("advanced");
  };

  const handleDjBackgroundUpload = async (file?: File | null) => {
    if (!file) return;
    setLocalError(null);
    const dataUrl = await fileToDownscaledDataUrl(file).catch((err) => {
      setLocalError(err instanceof Error ? err.message : "Could not read the uploaded background.");
      return null;
    });
    if (!dataUrl) return;
    onSelect("dj", { startupBackgroundDataUrl: dataUrl });
  };

  const modalClassName =
    guestMode && screen === "entry"
      ? "nf-startup-panel nf-startup-panel-scroll nf-startup-panel-gallery w-[min(94vw,780px)] max-h-[86vh] p-5 text-center"
    : screen === "entry"
      ? "nf-startup-panel nf-startup-panel-scroll nf-startup-panel-entry w-[min(92vw,430px)] max-h-[84vh] p-5 text-center"
    : screen === "advanced"
      ? "nf-startup-panel nf-startup-panel-scroll w-[min(94vw,920px)] max-h-[84vh] p-5 text-center"
      : screen === "composer"
      ? "w-[min(92vw,640px)] max-h-[92dvh] overflow-y-auto px-2 py-5 text-center"
      : "nf-startup-panel nf-startup-panel-scroll w-[min(92vw,620px)] max-h-[84vh] p-5 text-center";

  const startupSecondaryButtonClass =
    "nf-bloom-hover nf-startup-secondary-button px-3 py-2 text-xs";
  const advancedCardClass =
    "nf-startup-card p-4 text-left";
  const advancedTemplateCardClass =
    "nf-bloom-hover nf-startup-template-card group relative overflow-hidden text-left text-white";
  const advancedLabelClass = "text-[11px] uppercase tracking-[0.16em] text-fuchsia-100/[0.55]";
  const advancedBackButtonClass =
    startupSecondaryButtonClass + " bg-fuchsia-500/[0.06] text-fuchsia-50 hover:bg-fuchsia-500/[0.10]";
  const handleProjectFilePick = async (file?: File | null) => {
    if (!file) return;
    await onLoadProjectFile(file);
  };

  const trackTemplateTapped = React.useCallback(
    (
      template: StartupTemplateOption,
      index: number,
      options: { featured?: boolean; surface?: string } = {}
    ) => {
      void trackClientEvent("template_card_tapped", {
        properties: {
          source: "startup",
          surface: options.surface || pickerSurface || "startup_template_grid",
          screen,
          guest_mode: guestMode,
          template_id: template.key,
          template_label: template.label,
          template_index: index,
          template_count: templateOptions.length,
          visible_template_count: guestVisibleTemplateCount,
          featured: Boolean(options.featured),
        },
      });
    },
    [guestMode, guestVisibleTemplateCount, pickerSurface, screen, templateOptions.length]
  );

  const selectTemplate = React.useCallback(
    (
      template: StartupTemplateOption,
      index: number,
      options: { featured?: boolean; surface?: string } = {}
    ) => {
      trackTemplateTapped(template, index, options);
      onSelect(template.key);
    },
    [onSelect, trackTemplateTapped]
  );

  const renderTemplateCard = (template: StartupTemplateOption, index: number) => (
    <button
      key={template.key}
      type="button"
      disabled={buildForYouLoading}
      onClick={() => {
        selectTemplate(template, index);
      }}
      className={advancedTemplateCardClass}
    >
      <div className="aspect-[1.35] w-full overflow-hidden bg-black">
        {template.preview ? (
          <img
            src={template.preview}
            alt={template.label}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            width={450}
            height={334}
            loading={index < 2 ? "eager" : "lazy"}
            decoding="async"
            srcSet={buildTemplatePreviewSrcSet(template.preview)}
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 220px"
            draggable={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-500">
            Template
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 truncate text-sm font-semibold text-white">{template.label}</div>
          <div className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-fuchsia-100/60 transition group-hover:text-fuchsia-100">
            Start
          </div>
        </div>
        <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-neutral-300">
          {template.desc}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-white/0 transition group-hover:bg-fuchsia-400/[0.04]" />
    </button>
  );

  const renderGuestSecondaryTemplateCard = (template: StartupTemplateOption, index: number) => (
    <button
      key={template.key}
      type="button"
      disabled={buildForYouLoading}
      onClick={() => selectTemplate(template, index, { surface: "startup_guest_secondary" })}
      className="nf-bloom-hover group relative overflow-hidden bg-white/[0.045] text-left text-white shadow-[0_18px_42px_rgba(0,0,0,0.26)] hover:bg-white/[0.06] disabled:opacity-60"
    >
      <div className="aspect-[1.18] w-full overflow-hidden bg-black">
        {template.preview ? (
          <img
            src={template.preview}
            alt={template.label}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
            width={360}
            height={305}
            loading="lazy"
            decoding="async"
            srcSet={buildTemplatePreviewSrcSet(template.preview)}
            sizes="(max-width: 640px) 45vw, 220px"
            draggable={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-500">Template</div>
        )}
      </div>
      <div className="flex min-h-[54px] items-center justify-between gap-2 px-2.5 py-2.5">
        <div className="min-w-0 truncate text-[12px] font-semibold text-white">{template.label}</div>
        <div className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-100/60 transition group-hover:text-cyan-100">
          Start
        </div>
      </div>
    </button>
  );

  const renderGuestFeaturedTemplateCard = (template: StartupTemplateOption) => (
    <motion.button
      key={template.key}
      type="button"
      disabled={buildForYouLoading}
      onClick={() => selectTemplate(template, 0, { featured: true, surface: "startup_guest_featured" })}
      animate={
        prefersReducedMotion
          ? undefined
          : {
              y: [0, -2, 0],
              scale: [1, 1.006, 1],
              boxShadow: [
                "0 22px 70px rgba(0,0,0,0.42), 0 0 0 rgba(103,232,249,0)",
                "0 24px 78px rgba(0,0,0,0.48), 0 0 30px rgba(103,232,249,0.18)",
                "0 22px 70px rgba(0,0,0,0.42), 0 0 0 rgba(103,232,249,0)",
              ],
            }
      }
      transition={
        prefersReducedMotion
          ? undefined
          : {
              duration: 3.8,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
      className="nf-bloom-hover group relative w-full overflow-hidden bg-[linear-gradient(180deg,rgba(17,24,35,0.92),rgba(6,8,13,0.96))] text-left text-white shadow-[0_26px_82px_rgba(0,0,0,0.48)] disabled:opacity-60"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(103,232,249,0.18),rgba(217,70,239,0.08)_38%,transparent_70%)]" />
      <div className="relative aspect-[1.12] w-full overflow-hidden bg-black sm:aspect-[1.28]">
        {template.preview ? (
          <motion.img
            src={template.preview}
            alt={template.label}
            className="h-full w-full object-cover"
            width={680}
            height={607}
            draggable={false}
            loading="eager"
            decoding="async"
            srcSet={buildTemplatePreviewSrcSet(template.preview)}
            sizes="(max-width: 720px) 92vw, 680px"
            animate={prefersReducedMotion ? undefined : { scale: [1.01, 1.035, 1.01] }}
            transition={
              prefersReducedMotion
                ? undefined
                : {
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">Template</div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_48%,rgba(0,0,0,0.74)_100%)]" />
        <div className="pointer-events-none absolute left-4 top-4 bg-black/[0.38] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 shadow-[0_18px_36px_rgba(0,0,0,0.28)] backdrop-blur">
          Tap a flyer to start
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/75">
                Featured starter
              </div>
              <div className="mt-1 truncate text-2xl font-black leading-7 text-white sm:text-3xl">
                {template.label}
              </div>
              <div className="mt-1 line-clamp-1 text-xs text-neutral-200">{template.desc}</div>
            </div>
            <div className="shrink-0 bg-cyan-300 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-black shadow-[0_0_24px_rgba(103,232,249,0.28)] transition group-hover:bg-white">
              Start
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );

  const startupCocoGuideFocus: StartupCocoFocus =
    screen === "composer"
      ? "composer"
      : screen === "advanced" || (screen === "entry" && guestMode)
      ? "template"
      : startupCocoFocus;
  const showStartupCocoGuide =
    screen === "advanced" ||
    (screen === "entry" && guestMode) ||
    (screen === "entry" && startupCocoReady);
  const appleEase = [0.16, 1, 0.3, 1] as const;
  const startupPanelMotion = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.18 },
      }
    : {
        initial: { opacity: 0, y: 24, scale: 0.985, filter: "blur(18px)" },
        animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
        transition: { duration: 0.86, delay: showStartupCocoGuide ? 0.22 : 0.08, ease: appleEase },
      };
  const startupChoiceMotion = (index: number) =>
    prefersReducedMotion
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.18 },
        }
      : {
          initial: { opacity: 0, y: 18, scale: 0.985, filter: "blur(12px)" },
          animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
          transition: { duration: 0.78, delay: 0.5 + index * 0.08, ease: appleEase },
        };
  const selectedComposerBackground = [
    ...djBackgroundOptions,
    ...CREATE_WITH_COCO_DRINKS,
  ].find((asset) => asset.src === composerBackgroundSrc);
  const selectedComposerForeground = CREATE_WITH_COCO_SUBJECTS.find(
    (asset) => asset.src === composerSubjectSrc
  );

  return (
    <AnimatePresence>
      {composerSubmitting ? (
        <NightlifePreloader
          key="coco-generation-overlay"
          surface="glass"
          showCoco
          title="COCO IS CREATING"
          subtitle="Building your five flyer options"
          detail={composerStatus || "Reviewing your event details..."}
          messages={COCO_GENERATION_MESSAGES}
        />
      ) : null}
      <motion.div
        key="startup-templates-screen"
        aria-hidden={composerSubmitting || undefined}
        inert={composerSubmitting || undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.72, ease: appleEase }}
        className={`nf-startup-shell ${screen === 'composer' ? 'coco-conversation' : ''} fixed inset-0 z-[999] flex flex-col items-center gap-4 ${
          screen === "composer" ? "justify-center px-3 py-5" : screen === "advanced" || guestMode
            ? "nf-startup-shell-scroll justify-start px-3 py-6"
            : "justify-center"
        }`}
      >
        {showStartupCocoGuide ? (
          <StartupCocoGuide focus={startupCocoGuideFocus} prefersReducedMotion={prefersReducedMotion} />
        ) : null}
        <AnimatePresence mode="wait" initial={false}>
        <motion.div key={screen} exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -80, scale: .96, filter: 'blur(12px)', transition: { duration: .3 } }} className={modalClassName} onScroll={trackPickerScrolled} {...startupPanelMotion}>
          {screen === "entry" ? (
            guestMode ? (
              <div className="flex min-h-full flex-col justify-center text-left">
                <div className="mx-auto w-full max-w-[680px] text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                    Try the studio
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Start your flyer</h2>
                  <p className="mt-2 text-sm text-neutral-400">
                    Let Coco compose a new editable flyer, or begin from a style that is already designed.
                  </p>
                </div>

                <div className="mx-auto mt-5 w-full max-w-[680px]">
                  <motion.button
                    type="button"
                    disabled={buildForYouLoading}
                    onClick={openComposerStudio}
                    className="nf-bloom-hover group w-full bg-cyan-200 px-5 py-4 text-left text-black shadow-[0_22px_62px_rgba(103,232,249,0.18)] transition hover:bg-white disabled:opacity-60"
                    {...startupChoiceMotion(0)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-base font-black">Create with Coco</div>
                        <div className="mt-1 text-sm font-semibold text-black/55">
                          Add an event name and choose your images. Style notes are optional.
                        </div>
                      </div>
                      <div className="shrink-0 text-[11px] font-black uppercase tracking-[0.18em] text-black/60">
                        Start
                      </div>
                    </div>
                  </motion.button>
                  <div className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/50">
                    Or start from a template
                  </div>
                </div>

                {guestFeaturedTemplate ? (
                  <>
                    <div className="mx-auto mt-3 w-full max-w-[680px]">
                      {renderGuestFeaturedTemplateCard(guestFeaturedTemplate)}
                    </div>

                    {guestSecondaryTemplates.length ? (
                      <div className="mx-auto mt-3 grid w-full max-w-[680px] grid-cols-2 gap-2.5">
                        {guestSecondaryTemplates.map((template, index) =>
                          renderGuestSecondaryTemplateCard(template, index + 1)
                        )}
                      </div>
                    ) : null}

                    {guestExtraTemplates.length ? (
                      <div className="mx-auto mt-3 grid w-full max-w-[680px] grid-cols-2 gap-2.5 sm:grid-cols-3">
                        {guestExtraTemplates.map((template, index) =>
                          renderGuestSecondaryTemplateCard(template, index + 5)
                        )}
                      </div>
                    ) : null}

                    {guestOrderedTemplates.length > 5 ? (
                      <div className="mx-auto mt-3 flex w-full max-w-[680px] justify-center">
                        <button
                          type="button"
                          onClick={() => setGuestMoreOpen((open) => !open)}
                          className="nf-bloom-hover bg-white/[0.055] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 hover:bg-white/[0.07] hover:text-cyan-100"
                        >
                          {guestMoreOpen ? "Show fewer" : "More styles"}
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="mx-auto mt-5 w-full max-w-[680px] bg-white/[0.035] p-6 text-center text-sm text-neutral-400 shadow-[0_18px_42px_rgba(0,0,0,0.24)]">
                    Templates are loading.
                  </div>
                )}

                <div className="mx-auto mt-4 max-w-[680px] text-center text-[11px] text-neutral-500">
                  You can switch templates later inside Nightlife Flyers.
                </div>
              </div>
            ) : (
            <div className="flex min-h-full flex-col justify-center">
              <h2 className="nf-startup-panel-title mb-4">Where do you want to start?</h2>

              <div className="mx-auto flex w-full max-w-[360px] flex-col gap-2.5">
                <motion.button
                  type="button"
                  disabled={buildForYouLoading}
                  onFocus={() => setStartupCocoFocus("composer")}
                  onMouseEnter={() => setStartupCocoFocus("composer")}
                  onMouseLeave={() =>
                    setStartupCocoFocus(startupCocoRestingFocusRef.current)
                  }
                  onBlur={() => setStartupCocoFocus(startupCocoRestingFocusRef.current)}
                  onClick={openComposerStudio}
                  className="nf-bloom-hover nf-startup-choice nf-startup-choice-primary group w-full px-4 py-4 text-left disabled:opacity-60"
                  {...startupChoiceMotion(0)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="nf-startup-choice-title">Create with Coco</div>
                      <div className="nf-startup-choice-subtitle mt-1">
                        Give Coco an event name and choose your images. Style notes are optional.
                      </div>
                    </div>
                    <div className="nf-startup-choice-action">
                      Start
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  disabled={buildForYouLoading}
                  className="nf-bloom-hover nf-startup-choice group w-full px-4 py-4 text-left disabled:opacity-60"
                  onFocus={() => setStartupCocoFocus("template")}
                  onMouseEnter={() => setStartupCocoFocus("template")}
                  onMouseLeave={() => setStartupCocoFocus(startupCocoRestingFocusRef.current)}
                  onBlur={() => setStartupCocoFocus(startupCocoRestingFocusRef.current)}
                  onClick={openAdvancedStudio}
                  {...startupChoiceMotion(1)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="nf-startup-choice-title">Browse templates</div>
                      <div className="nf-startup-choice-subtitle mt-1">
                        Choose a finished style first, then replace the text, images, and colors.
                      </div>
                    </div>
                    <div className="nf-startup-choice-action">
                      Browse
                    </div>
                  </div>
                </motion.button>

                <motion.label
                  className="nf-bloom-hover nf-startup-choice nf-startup-choice-saved group w-full cursor-pointer px-4 py-4 text-left"
                  onMouseEnter={() => setStartupCocoFocus("saved")}
                  onMouseLeave={() => setStartupCocoFocus(startupCocoRestingFocusRef.current)}
                  {...startupChoiceMotion(2)}
                >
                  <input
                    type="file"
                    accept={PROJECT_FILE_ACCEPT}
                    className="hidden"
                    onBlur={() => setStartupCocoFocus(startupCocoRestingFocusRef.current)}
                    onFocus={() => setStartupCocoFocus("saved")}
                    onClick={(e) => {
                      setStartupCocoFocus("saved");
                      (e.target as HTMLInputElement).value = "";
                    }}
                    onChange={(e) => {
                      void handleProjectFilePick(e.target.files?.[0]);
                    }}
                  />
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="nf-startup-choice-title">Open saved design</div>
                      <div className="nf-startup-choice-subtitle mt-1">
                        Load a .nflyer file with your previous layout, assets, and edits.
                      </div>
                    </div>
                    <div className="nf-startup-choice-action">
                      Open
                    </div>
                  </div>
                </motion.label>
              </div>

              {localError ? (
                <div className="mx-auto mt-3 w-full max-w-[360px] bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                  {localError}
                </div>
              ) : null}
            </div>
            )
          ) : screen === "composer" ? (
            <>
              <button type="button" onClick={() => composerStep === 2 ? setComposerStep(1) : goBackToEntry()} className="mb-6 block text-sm text-white/45">← Back</button>
              <CocoOrb busy={composerSubmitting}/>
              <h2 className="text-2xl font-normal tracking-tight text-white sm:text-[28px]">{composerStep === 1 ? 'What are we celebrating?' : 'Which images would you like to use?'}</h2>
              <p className="mx-auto mb-8 mt-3 max-w-sm text-sm leading-6 text-white/50">{composerStep === 1 ? 'Tell me your event name and choose a mood. I’ll find your designs.' : 'Add your own, or keep the images in your chosen design.'}</p>
              <div className="mx-auto max-w-md space-y-5 text-left">
                {(localError || buildForYouError) && <p role="alert" className="text-sm text-rose-200">{localError || buildForYouError}</p>}
                {composerStatus && <p role="status" className="text-sm text-cyan-200">{composerStatus}</p>}
                {composerStep === 1 && <form className="coco-answer space-y-6" data-testid="coco-build-event-step" onSubmit={e => { e.preventDefault(); void handleComposerSubmit(); }}>
                  <div data-testid="coco-event-brief">
                    <input autoFocus aria-label="Event name" value={composerEventName} onChange={e => setComposerEventName(e.target.value)} placeholder="Your event name" className="w-full bg-transparent text-center text-xl text-white outline-none placeholder:text-white/25"/>
                    <p className="mb-3 mt-6 text-center text-xs text-white/40">What’s the mood?</p>
                    <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Flyer style">
                      {COCO_STYLE_CHOICES.map(style => <button key={style} type="button" aria-pressed={composerStyle === style} onClick={() => setComposerStyle(style)} className="coco-response !min-h-10 !px-4 !py-2 !text-xs">{style}</button>)}
                    </div>
                  </div>
                  <div className="text-center"><button type="submit" data-testid="coco-build-event-next" disabled={composerSubmitting || !composerEventName.trim() || !composerStyle} className="coco-response coco-response-primary">Show my designs →</button></div>
                  <button type="button" onClick={() => setComposerStep(2)} className="mx-auto block text-xs text-white/35 hover:text-white/70">I’d like to use my own images</button>
                </form>}

                {composerStep === 2 && <div className="space-y-4" data-testid="coco-build-images-step">
                  <label className="block rounded border border-dashed border-cyan-200/40 p-4 text-sm text-cyan-100">Photo of a person (optional)
                    <input type="file" accept="image/*" data-testid="coco-composer-portrait-upload" aria-label="Upload portrait" className="mt-2 block w-full text-xs" onChange={e => { const file = e.target.files?.[0]; if (file) { setComposerPortraitFile(file); setComposerSubjectSrc(''); } }}/>
                    {(composerPortraitFile || composerSubjectSrc) && <button type="button" className="mt-2 underline" onClick={() => { setComposerPortraitFile(null); setComposerSubjectSrc(''); }}>Keep the design’s portrait</button>}
                  </label>
                  {(localError || buildForYouError) ? (
                    <div className="bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                      {localError || buildForYouError}
                    </div>
                  ) : null}
                  {composerStatus && !localError && !buildForYouError ? (
                    <div className="bg-cyan-300/10 px-3 py-2 text-[12px] text-cyan-100 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                      {composerStatus}
                    </div>
                  ) : null}

                  <div
                    className="bg-white/[0.045] p-3 shadow-[0_18px_44px_rgba(0,0,0,0.24)]"
                    data-testid="coco-image-library"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/65">
                          Choose images
                        </div>
                        <div className="mt-1 text-[11px] text-white/40">
                          Choose a new background or portrait, or keep the design as it is.
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {(["backgrounds", "drinks", "subjects"] as const).map((section) => (
                          <button
                            key={section}
                            type="button"
                            aria-pressed={composerImageSection === section}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setComposerImageSection(section);
                            }}
                            className={`px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${
                              composerImageSection === section
                                ? "bg-cyan-200 text-black"
                                : "bg-black/35 text-white/55 hover:bg-white/10"
                            }`}
                          >
                            {section === "subjects" ? "People" : section}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex items-stretch gap-2">
                      <label className="nf-bloom-hover flex min-w-0 flex-1 cursor-pointer items-center gap-3 border border-dashed border-cyan-200/25 bg-cyan-200/[0.045] p-2.5 text-left hover:border-cyan-100/50 hover:bg-cyan-200/[0.075] focus-within:border-cyan-100/60 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cyan-200/70">
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          data-testid="coco-composer-image-upload"
                          aria-label="Upload your photo"
                          onClick={(event) => {
                            event.currentTarget.value = "";
                          }}
                          onChange={(event) => {
                            const file = event.currentTarget.files?.[0];
                            if (!file) return;
                            setLocalError(null);
                            setBackgroundFile(file);
                          }}
                        />
                        {backgroundPreview ? (
                          <img
                            src={backgroundPreview}
                            alt="Uploaded photo preview"
                            className="h-16 w-14 shrink-0 object-cover"
                            width={56}
                            height={64}
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="grid h-10 w-10 shrink-0 place-items-center bg-cyan-200/10 text-xl text-cyan-100"
                          >
                            +
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-50">
                            {backgroundFile ? "Change your photo" : "Upload your photo"}
                          </span>
                          <span className="mt-1 block truncate text-[10px] text-white/40">
                            {backgroundFile
                              ? backgroundFile.name
                              : "Coco will crop and compose this image."}
                          </span>
                        </span>
                      </label>
                      {backgroundFile ? (
                        <button
                          type="button"
                          onClick={() => setBackgroundFile(null)}
                          aria-label="Remove uploaded photo and use the image library"
                          className="nf-bloom-hover shrink-0 border border-white/10 bg-black/30 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 hover:bg-white/10 hover:text-white"
                        >
                          Use library
                        </button>
                      ) : null}
                    </div>

                    <button type="button" onClick={() => { setBackgroundFile(null); setComposerBackgroundSrc(''); setBackgroundSelectionExplicit(false); }} className="mt-3 text-xs text-cyan-200 underline">Keep the design’s background</button>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                      <span className="bg-cyan-200/10 px-2 py-1 text-cyan-100">
                        Background: {backgroundFile ? "Uploaded photo" : selectedComposerBackground?.name || "Design’s background"}
                      </span>
                      <span className="bg-fuchsia-200/10 px-2 py-1 text-fuchsia-100">
                        Portrait: {composerPortraitFile?.name || selectedComposerForeground?.name || "Design’s portrait"}
                      </span>
                    </div>

                    <div className="mt-3 grid max-h-[285px] grid-cols-4 gap-2 overflow-y-auto p-0.5 pr-1">
                      {(composerImageSection === "backgrounds"
                        ? djBackgroundOptions
                        : composerImageSection === "drinks"
                        ? CREATE_WITH_COCO_DRINKS
                        : CREATE_WITH_COCO_SUBJECTS
                      ).map((asset) => {
                        const isDrinkBackground = composerImageSection === "drinks";
                        const isBackground = composerImageSection !== "subjects";
                        const selected = isBackground
                          ? composerBackgroundSrc === asset.src && !backgroundFile
                          : composerSubjectSrc === asset.src;
                        return (
                          <button
                            key={asset.id}
                            type="button"
                            data-coco-image-id={asset.id}
                            data-selected={selected ? "true" : "false"}
                            aria-pressed={selected}
                            aria-label={`${selected ? "Selected " : "Select "}${asset.name}`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setLocalError(null);
                              if (isBackground) {
                                setBackgroundFile(null);
                                setComposerBackgroundSrc(asset.src);
                                setBackgroundSelectionExplicit(true);
                                if (composerSubjectSrc === asset.src) setComposerSubjectSrc("");
                              } else {
                                setComposerSubjectSrc(asset.src);
                                setComposerPortraitFile(null);
                              }
                            }}
                            className={`nf-bloom-hover cursor-pointer touch-manipulation overflow-hidden border-2 bg-black text-left ${
                              selected
                                ? isDrinkBackground
                                  ? "border-amber-200 bg-amber-200/10"
                                  : isBackground
                                  ? "border-cyan-200 bg-cyan-200/10"
                                  : "border-fuchsia-200 bg-fuchsia-200/10"
                                : "border-white/10 hover:border-white/35"
                            }`}
                          >
                            <img
                              src={asset.src}
                              alt={asset.name}
                              className={`aspect-square w-full object-cover ${composerImageSection === "subjects" ? "object-top" : ""}`}
                              width={130}
                              height={130}
                              loading="lazy"
                              decoding="async"
                              draggable={false}
                            />
                            <div className="truncate px-1.5 py-1 text-[9px] text-white/65">{asset.name}</div>
                            {selected ? (
                              <span className="pointer-events-none absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] font-black text-black shadow-lg">
                                ✓
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid="coco-build-images-next"
                    onClick={() => { setLocalError(null); setComposerStep(1); }}
                    disabled={
                      buildForYouLoading ||
                      composerSubmitting
                    }
                    className="nf-bloom-hover w-full bg-cyan-200 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-black shadow-[0_0_28px_rgba(103,232,249,0.24)] transition hover:bg-white disabled:opacity-60"
                  >
                    {composerSubmitting
                      ? "Finding your directions..."
                      : "Done — back to designs"}
                  </button>
                </div>}
              </div>
            </>
          ) : screen === "dj" ? (
            <>
              <div className="mb-6 flex items-start justify-between gap-4 text-left">
                <div>
                  <h2 className="text-xl font-semibold text-white">DJ / Artist</h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    Pick the background first, then we&apos;ll open the flyer with the DJ / Artist workflow ready.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={goBackToEntry}
                  className={startupSecondaryButtonClass}
                >
                  Back
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {djBackgroundOptions.map((background) => (
                  <button
                    key={background.id}
                    type="button"
                    disabled={buildForYouLoading}
                    onClick={() => onSelect("dj", { startupBackgroundSrc: background.src })}
                    className="nf-bloom-hover group overflow-hidden border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,34,0.98),rgba(16,20,29,0.98))] text-left shadow-[0_18px_40px_rgba(0,0,0,0.2)] hover:bg-[linear-gradient(180deg,rgba(22,28,40,1),rgba(18,23,33,1))] disabled:opacity-60"
                  >
                    <div className="aspect-[4/5] w-full overflow-hidden bg-black">
                      <img
                        src={background.src}
                        alt={background.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        width={360}
                        height={450}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    </div>
                    <div className="px-3 py-2">
                      <div className="text-[13px] font-semibold text-white">{background.name}</div>
                    </div>
                  </button>
                ))}
              </div>

              <label className="nf-bloom-hover mt-4 flex w-full cursor-pointer items-center justify-center border border-white/10 bg-neutral-800 px-4 py-3 text-sm text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)] hover:bg-neutral-700">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    void handleDjBackgroundUpload(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                />
                Upload My Background
              </label>

              {localError && (
                <div className="mt-3 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                  {localError}
                </div>
              )}
            </>
          ) : screen === "advanced" ? (
            <>
              <div className="mb-6 flex items-start justify-between gap-4 text-left">
                <div>
                  <h2 className="text-xl font-semibold text-white">Choose a template</h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    Pick the closest look. We&apos;ll make it yours.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={goBackToEntry}
                  className={advancedBackButtonClass}
                >
                  Back
                </button>
              </div>

              <div className={advancedCardClass}>
                <div className="flex items-center justify-between gap-3">
                  <div className={advancedLabelClass}>
                    Recommended
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-fuchsia-100/[0.72]">
                    Start Here
                  </div>
                </div>
                <div className="mt-2 text-sm font-medium text-white">Start From Template</div>
                <div className="mt-1 text-sm text-neutral-300">
                  Fastest path for most flyers. Pick a layout, then swap text, background, portraits, and brand elements.
                </div>
                <div className="mt-4 max-h-[48vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {templateOptions.map(renderTemplateCard)}
                  </div>
                </div>
              </div>

            </>
          ) : (
            <>
              <div className="mb-6 flex items-start justify-between gap-4 text-left">
                <div>
                  <h2 className="text-2xl font-bold text-white">Build For You</h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    Upload your background, enter the text you want to appear, and AI will format both square and story flyers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={goBackToAdvanced}
                  className={startupSecondaryButtonClass}
                >
                  Back
                </button>
              </div>

              <div className="grid gap-5 text-left md:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-neutral-400">
                      Headline
                    </label>
                    <textarea
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      rows={2}
                      placeholder="Main event title"
                      className="w-full bg-black/20 px-3 py-2 text-sm text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] outline-none placeholder:text-neutral-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-neutral-400">
                      Headline 2
                    </label>
                    <input
                      value={head2}
                      onChange={(e) => setHead2(e.target.value)}
                      placeholder="Optional sub-headline"
                      className="w-full bg-black/20 px-3 py-2 text-sm text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] outline-none placeholder:text-neutral-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-neutral-400">
                      Details
                    </label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      rows={4}
                      placeholder={"Date / time / attractions\nLine breaks are preserved"}
                      className="w-full bg-black/20 px-3 py-2 text-sm text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] outline-none placeholder:text-neutral-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-neutral-400">
                      Details 2
                    </label>
                    <textarea
                      value={details2}
                      onChange={(e) => setDetails2(e.target.value)}
                      rows={2}
                      placeholder="Optional supporting line"
                      className="w-full bg-black/20 px-3 py-2 text-sm text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] outline-none placeholder:text-neutral-500"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-neutral-400">
                        Venue
                      </label>
                      <input
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="Optional venue"
                        className="w-full bg-black/20 px-3 py-2 text-sm text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] outline-none placeholder:text-neutral-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-neutral-400">
                        Subtag
                      </label>
                      <input
                        value={subtag}
                        onChange={(e) => setSubtag(e.target.value)}
                        placeholder="Optional pill label"
                        className="w-full bg-black/20 px-3 py-2 text-sm text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] outline-none placeholder:text-neutral-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-neutral-400">
                      Background
                    </label>
                    <label className="nf-bloom-hover flex min-h-[220px] cursor-pointer items-center justify-center border border-white/10 bg-black/20 p-4 text-center shadow-[0_14px_32px_rgba(0,0,0,0.18)] hover:bg-white/[0.04]">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setBackgroundFile(file);
                        }}
                      />
                      {backgroundPreview ? (
                        <img
                          src={backgroundPreview}
                          alt="Background preview"
                          className="max-h-[280px] w-full object-cover"
                          width={420}
                          height={280}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-white">Upload background image</div>
                          <div className="mt-2 text-xs text-neutral-500">
                            AI will analyze this exact image and build square + story layouts from it.
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  {(localError || buildForYouError) && (
                    <div className="bg-amber-400/10 px-3 py-2 text-xs text-amber-200 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                      {localError || buildForYouError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleBuildSubmit()}
                    disabled={buildForYouLoading}
                    className="nf-bloom-hover w-full border border-fuchsia-200/20 bg-fuchsia-600 px-4 py-3 text-sm font-semibold text-white hover:bg-fuchsia-500 disabled:opacity-60"
                  >
                    {buildForYouLoading ? "Building square + story..." : "Build Flyer"}
                  </button>

                  <div className="text-[11px] text-neutral-500">
                    Anything left blank stays out. AI handles layout, font choice, spacing, and color treatment around your supplied text.
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default StartupTemplates;
