"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Pencil } from "lucide-react";
import { useFlyerState, type MoveTarget } from "../../app/state/flyerState";
import { getCocoGuide } from "./guides";
import {
  buildCocoCanvasSnapshot,
  createCocoMemorySnapshot,
  getCocoAcceptedChangeLines,
  getCocoFinalArtDirectorLines,
  getCocoLinesForJudgment,
  getCocoPostChangeLines,
  inferCocoNightlifeStyle,
  runCocoRules,
  runCocoFinalArtDirectorPass,
  selectCocoJudgment,
  type CocoCanvasPhase,
  type CocoAction,
  type CocoNightlifeStyle,
  type CocoReadabilityMetricId,
  type CocoStyleDecision,
  type CocoTargetRef,
  type CocoTextReadability,
} from "./intelligence";
import type { CocoTarget, CocoTone } from "./types";

type CocoDirectorProps = {
  active: boolean;
  format: "square" | "story";
  formatTransitioning?: boolean;
  activeGradeSignature?: string | null;
  activeLayoutId?: string | null;
  activePaletteSignature?: string | null;
  activeSubjectSignature?: string | null;
  canvasLayoutSignature?: string | null;
  hasBackground?: boolean;
  hasLayoutOptions?: boolean;
  hasPaletteOptions?: boolean;
  hasSubject?: boolean;
  headline?: string;
  isMobile?: boolean;
  mobileControlsTab?: string | null;
  onCaptureCleanLayout?: () => void;
  onChooseFormat?: (format: "square" | "story") => void;
  onOpenExport?: () => void;
  onOpenCinematicText?: () => void;
  onOpenLayoutOptions?: () => void;
  onOpenPaletteOptions?: () => void;
  onOpenPolish?: () => void;
  onRunAction?: (action: CocoAction) => void;
  onOpenSubjectOptions?: () => void;
  onOpenTextField?: (role: string) => void;
  onRestoreCleanLayout?: (target: CocoPostScanRestoreTarget) => void;
  selectedPanel?: string | null;
  templateId?: string | null;
  templateLabel?: string | null;
  nightlifeStyle?: CocoNightlifeStyle | null;
  nightlifeStyleDecision?: CocoStyleDecision | null;
  uiMode?: string | null;
};

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

function cocoNightlifeStyleLabel(style: CocoNightlifeStyle) {
  return COCO_NIGHTLIFE_STYLE_LABELS[style] ?? "Nightlife";
}

type CocoPlacement = {
  left: number;
  top: number;
  width: number;
};

type Rect = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

type CocoTargetZone = Rect & {
  radius: number;
};

type CocoTextRole = Extract<
  CocoTarget,
  | "date"
  | "details"
  | "details2"
  | "headline"
  | "headline2"
  | "leftRail"
  | "presenter"
  | "price"
  | "rightRail"
  | "subtag"
  | "venue"
>;

type CocoTextTarget = Rect & {
  fontFamily?: string | null;
  fontSize?: number | null;
  fontWeight?: number | string | null;
  letterSpacing?: number | null;
  lineHeight?: number | null;
  opticalCenter?: { x: number; y: number } | null;
  priority: number;
  readability?: CocoTextReadability | null;
  role: CocoTextRole;
  rotation?: number | null;
  strokeWidth?: number | null;
  text?: string;
  textAlign?: string | null;
  textColor?: string | null;
  textShadow?: string | null;
  visualRect?: Rect | null;
};

type CocoLayoutIssue = "overflow" | "overlap" | "subject-overlap" | null;

type CocoLayoutIssueResult = {
  overlapRole: CocoTextRole | null;
  subjectIssue?: CocoSubjectIssueResult | null;
  subjectIssueKey?: string | null;
  type: CocoLayoutIssue;
};

type CocoSubjectIssue =
  | "hero-combo"
  | "off-canvas"
  | "text-overlap"
  | "too-large"
  | "too-small"
  | null;

type CocoSubjectIssueResult = {
  overlapRole: CocoTextRole | null;
  overlapRatio: number | null;
  rect: Rect | null;
  suggestion: string | null;
  type: CocoSubjectIssue;
};

type CocoSubjectSnapshot = {
  mask: CocoVisibleMask | null;
  rect: Rect;
  root: HTMLElement;
  visualRect: Rect;
  zIndex: number;
};

type CocoPolishScanStatus =
  | "clean"
  | "export"
  | "grade"
  | "idle"
  | "issue"
  | "polish"
  | "post-change"
  | "rescan-needed"
  | "rescan-offer"
  | "restored"
  | "scanning";

type CocoPostScanRestoreTarget = CocoTextRole | "canvas" | "subject";

type CocoPostScanChange = {
  issue: CocoPolishScanIssue | null;
  returnStatus: CocoPolishScanStatus;
  target: CocoPostScanRestoreTarget;
};

type CocoPolishScanIssue =
  | {
      kind: "missing-text";
      role: CocoTextRole;
    }
  | {
      kind: "subject";
      issue: CocoSubjectIssueResult;
    }
  | {
      issueType: CocoLayoutIssue;
      kind: "text-layout";
      overlapRole: CocoTextRole | null;
      role: CocoTextRole;
    };

type CocoOverlapPairKey = `${CocoTextRole}:${CocoTextRole}`;

type CocoGradePresetName =
  | "Berlin"
  | "Cyber"
  | "Film"
  | "Gold"
  | "M31"
  | "Noir"
  | "Urban Dark";

type CocoFieldProgress = {
  baseline: string;
  canKeep: boolean;
  changed: boolean;
  current: string;
  layoutIssue: CocoLayoutIssue;
  layoutIssueSeen: boolean;
  overlapRole: CocoTextRole | null;
  role: CocoTextRole | null;
  settled: boolean;
  subjectIssueKey: string | null;
};

type CocoTextNodeSnapshot = {
  node: HTMLElement;
  rect: Rect;
  role: CocoTextRole;
  text: string;
};

function emptyFieldProgress(): CocoFieldProgress {
  return {
    baseline: "",
    canKeep: false,
    changed: false,
    current: "",
    layoutIssue: null,
    layoutIssueSeen: false,
    overlapRole: null,
    role: null,
    settled: false,
    subjectIssueKey: null,
  };
}

type CocoVisibleMask = {
  data: Uint8ClampedArray;
  height: number;
  localToViewport: LocalToViewportTransform | null;
  rect: Rect;
  scaleX: number;
  scaleY: number;
  width: number;
};

type LocalToViewportTransform = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
};

const COCO_DISMISSED_STORAGE_KEY = "nightlife-flyers:coco-dismissed:v2";
const COCO_STARTUP_INTRO_SESSION_KEY = "nightlife-flyers:coco-startup-intro:v1";
const COCO_AVATAR_SRC = "/branding/coco-orb.png?v=3";
const COCO_STAGE_HEIGHT = 64;
const COCO_STAGE_TALL_HEIGHT = 88;
const COCO_STAGE_XTALL_HEIGHT = 106;
const COCO_BUBBLE_HEIGHT = 56;
const COCO_BUBBLE_TALL_HEIGHT = 78;
const COCO_BUBBLE_XTALL_HEIGHT = 96;
const COCO_MESSAGE_HEIGHT = 15;
const COCO_MESSAGE_TALL_HEIGHT = 38;
const COCO_MESSAGE_XTALL_HEIGHT = 54;
const COCO_STAGE_MIN_WIDTH = 320;
const COCO_STAGE_MAX_WIDTH = 720;
const COCO_STAGE_TEXT_CHROME_WIDTH = 245;
type CocoIntroStep =
  | { id: "begin"; measureText: string; holdMs?: number }
  | { id: "hello"; measureText: string; holdMs?: number }
  | { id: "assistant"; measureText: string; holdMs?: number }
  | { id: "plan"; measureText: string; holdMs?: number }
  | { id: "make-yours"; measureText: string; holdMs?: number };

function hasSeenStartupCocoIntro() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(COCO_STARTUP_INTRO_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function getCocoIntroSteps(startupIntroSeen = false): CocoIntroStep[] {
  if (startupIntroSeen) {
    return [{ id: "begin", holdMs: 1450, measureText: "Let's begin." }];
  }

  return [
    { id: "hello", measureText: "HI! I'm Coco" },
    {
      id: "assistant",
      measureText: "I'm your design assistant",
    },
    {
      id: "plan",
      holdMs: 3900,
      measureText: "We'll update text, colors, images, and polish.",
    },
    {
      id: "make-yours",
      measureText: "Now, let's make this flyer yours.",
    },
  ];
}

const COCO_INTRO_STEP_DURATION_MS = 2800;
const COCO_MESSAGE_TRANSITION_MS = 700;
const COCO_STATIC_LABEL_DELAY_MS = 250;
const COCO_INSTRUCTION_AFTER_LABEL_MS = 520;
const COCO_FIELD_SETTLE_MS = 1300;
const COCO_KEEP_OPTION_DELAY_MS = 3800;
const COCO_FORMAT_SWITCH_SETTLE_MS = 900;
const COCO_LAYOUT_CHECK_INTERVAL_MS = 700;
const COCO_LAYOUT_TOLERANCE_PX = 6;
const COCO_VISIBLE_PIXEL_ALPHA_THRESHOLD = 32;
const COCO_VISIBLE_PIXEL_OVERLAP_MIN_HEIGHT_PX = 12;
const COCO_VISIBLE_PIXEL_OVERLAP_THRESHOLD = 36;
const COCO_VISIBLE_GUIDE_OVERLAP_THRESHOLD = 6;
const COCO_SUBJECT_CHECK_INTERVAL_MS = 700;
const COCO_HERO_COMBO_HEADLINE_OVERLAP_MAX = 0.1;
const COCO_POLISH_SCAN_MIN_MS = 6400;
const COCO_POLISH_SCAN_MAX_MS = 12000;
const COCO_POLISH_OPEN_HOLD_MS = 2500;
const COCO_POST_SCAN_RESCAN_MIN_MS = 3600;
const COCO_POST_SCAN_RESCAN_MAX_MS = 10000;
const COCO_POST_SCAN_RESTORE_HOLD_MS = 1700;
const COCO_POST_SCAN_WATCH_SETTLE_MS = 780;
const conciseStepMessages: Record<string, string> = {
  date: "Confirm date & time.",
  details2: "Update extra details.",
  details: "Update the details.",
  export: "Export when ready.",
  headline2: "Shape the second line.",
  headline: "Rename the event.",
  leftRail: "Update left rail text.",
  presenter: "Check presenter line.",
  price: "Confirm price text.",
  rightRail: "Update right rail text.",
  subtag: "Tighten the support line.",
  venue: "Check the venue.",
};

const COCO_TEXT_ROLES: CocoTextRole[] = [
  "headline",
  "headline2",
  "subtag",
  "details",
  "details2",
  "venue",
  "date",
  "presenter",
  "leftRail",
  "rightRail",
  "price",
];

const COCO_TEXT_ROLE_PRIORITY: Record<CocoTextRole, number> = {
  headline: 0,
  headline2: 1,
  subtag: 2,
  details: 3,
  details2: 4,
  venue: 5,
  date: 6,
  presenter: 7,
  leftRail: 8,
  rightRail: 9,
  price: 10,
};

const COCO_TEXT_ROLE_LABELS: Record<CocoTextRole, string> = {
  date: "date",
  details: "details",
  details2: "extra details",
  headline: "headline",
  headline2: "second line",
  leftRail: "left rail",
  presenter: "presenter",
  price: "price",
  rightRail: "right rail",
  subtag: "support line",
  venue: "venue",
};

const COCO_TEMPLATE_ALLOWED_OVERLAP_GROUPS: Record<string, CocoTextRole[][]> = {
  miami2: [["headline", "headline2"]],
  miami_heat: [["headline", "headline2"]],
  miami_st: [["headline", "headline2"]],
  square_center_hero_nightlife: [["headline", "headline2"]],
  sugar_rush: [["headline", "headline2"]],
  triple_hero_takeover_red: [["headline", "headline2"]],
};

const PANEL_TO_TEXT_ROLE: Record<string, CocoTextRole> = {
  date: "date",
  details: "details",
  details2: "details2",
  head2: "headline2",
  headline: "headline",
  headline2: "headline2",
  leftRail: "leftRail",
  presenter: "presenter",
  price: "price",
  rightRail: "rightRail",
  subtag: "subtag",
  venue: "venue",
};

const TEXT_ROLE_TO_PANEL: Record<CocoTextRole, string> = {
  date: "date",
  details: "details",
  details2: "details2",
  headline: "headline",
  headline2: "head2",
  leftRail: "leftRail",
  presenter: "presenter",
  price: "price",
  rightRail: "rightRail",
  subtag: "subtag",
  venue: "venue",
};

let cocoMeasureCanvas: HTMLCanvasElement | null = null;
let cocoHtmlToImageModulePromise: Promise<typeof import("html-to-image")> | null = null;

const toneStyles: Record<CocoTone, { accent: string; glow: string; ring: string }> = {
  dream: {
    accent: "from-fuchsia-300 via-cyan-200 to-violet-300",
    glow: "shadow-[0_0_42px_rgba(217,70,239,0.34)]",
    ring: "border-fuchsia-200/55",
  },
  general: {
    accent: "from-cyan-200 via-white to-fuchsia-200",
    glow: "shadow-[0_0_42px_rgba(34,211,238,0.26)]",
    ring: "border-cyan-200/55",
  },
  glam: {
    accent: "from-pink-200 via-white to-fuchsia-300",
    glow: "shadow-[0_0_42px_rgba(244,114,182,0.3)]",
    ring: "border-pink-200/55",
  },
  premium: {
    accent: "from-amber-200 via-white to-cyan-200",
    glow: "shadow-[0_0_42px_rgba(251,191,36,0.24)]",
    ring: "border-amber-200/55",
  },
  retro: {
    accent: "from-orange-200 via-pink-200 to-cyan-200",
    glow: "shadow-[0_0_42px_rgba(251,146,60,0.26)]",
    ring: "border-orange-200/55",
  },
  street: {
    accent: "from-white via-cyan-200 to-lime-200",
    glow: "shadow-[0_0_42px_rgba(163,230,53,0.22)]",
    ring: "border-lime-200/50",
  },
  tropical: {
    accent: "from-teal-200 via-yellow-100 to-orange-200",
    glow: "shadow-[0_0_42px_rgba(45,212,191,0.24)]",
    ring: "border-teal-200/55",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function measureCocoMessageWidth(text: string) {
  if (typeof document === "undefined") return text.length * 7;
  cocoMeasureCanvas ??= document.createElement("canvas");
  const ctx = cocoMeasureCanvas.getContext("2d");
  if (!ctx) return text.length * 7;
  ctx.font =
    '500 12px LEMONMILK-Regular, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  return ctx.measureText(text).width;
}

function getCocoStageWidth(text: string, viewportWidth: number, isMobile?: boolean) {
  const margin = isMobile ? 16 : 24;
  const maxWidth = Math.max(
    COCO_STAGE_MIN_WIDTH,
    Math.min(COCO_STAGE_MAX_WIDTH, viewportWidth - margin * 2)
  );
  const measuredTextWidth = Math.ceil(measureCocoMessageWidth(text));
  return Math.ceil(
    clamp(measuredTextWidth + COCO_STAGE_TEXT_CHROME_WIDTH, COCO_STAGE_MIN_WIDTH, maxWidth)
  );
}

function rectsOverlap(a: Rect, b: Rect, gap = 0) {
  return !(
    a.right + gap <= b.left ||
    a.left - gap >= b.right ||
    a.bottom + gap <= b.top ||
    a.top - gap >= b.bottom
  );
}

function rectOverflowsArtboard(rect: Rect, artboardRect: Rect) {
  return (
    rect.left < artboardRect.left - COCO_LAYOUT_TOLERANCE_PX ||
    rect.right > artboardRect.right + COCO_LAYOUT_TOLERANCE_PX ||
    rect.top < artboardRect.top - COCO_LAYOUT_TOLERANCE_PX ||
    rect.bottom > artboardRect.bottom + COCO_LAYOUT_TOLERANCE_PX
  );
}

function getIntersectionRect(a: Rect, b: Rect): Rect | null {
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.right, b.right);
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.bottom, b.bottom);
  const width = right - left;
  const height = bottom - top;

  if (width <= 0 || height <= 0) return null;

  return {
    bottom,
    height,
    left,
    right,
    top,
    width,
  };
}

function getVisibleArtboardRect(rect: Rect, artboardRect: Rect | null) {
  return artboardRect ? getIntersectionRect(rect, artboardRect) ?? rect : rect;
}

function emptyLayoutIssue(): CocoLayoutIssueResult {
  return { overlapRole: null, subjectIssue: null, subjectIssueKey: null, type: null };
}

function emptySubjectIssue(rect: Rect | null = null): CocoSubjectIssueResult {
  return { overlapRatio: null, overlapRole: null, rect, suggestion: null, type: null };
}

function getRectArea(rect: Rect | null) {
  if (!rect) return 0;
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

function getRectCenter(rect: Rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function getCocoOverlapPairKey(a: CocoTextRole, b: CocoTextRole): CocoOverlapPairKey {
  const [first, second] = [a, b].sort(
    (left, right) => COCO_TEXT_ROLE_PRIORITY[left] - COCO_TEXT_ROLE_PRIORITY[right]
  );
  return `${first}:${second}` as CocoOverlapPairKey;
}

function templateAllowsCocoOverlap(
  templateId: string | null | undefined,
  a: CocoTextRole,
  b: CocoTextRole
) {
  const groups = COCO_TEMPLATE_ALLOWED_OVERLAP_GROUPS[String(templateId ?? "").toLowerCase()];
  if (!groups) return false;

  return groups.some((group) => group.includes(a) && group.includes(b));
}

function getCocoRecommendedGradePreset({
  templateId,
  templateLabel,
  tone,
}: {
  templateId?: string | null;
  templateLabel?: string | null;
  tone: CocoTone;
}): CocoGradePresetName {
  const signature = `${templateId ?? ""} ${templateLabel ?? ""} ${tone}`.toLowerCase();

  if (/(gold|lux|vip|champagne|atlanta|glam|premium)/.test(signature)) return "Gold";
  if (/(noir|dark|underground|warehouse|berlin)/.test(signature)) return "Berlin";
  if (/(tropical|latin|summer|mojito|seaside|beach)/.test(signature)) return "Film";
  if (/(street|urban|drift|car|garage)/.test(signature)) return "Urban Dark";
  if (/(cyber|techno|neon|quantum|miami|mirror|rush|dj)/.test(signature)) return "M31";

  return tone === "premium" ? "Gold" : tone === "street" ? "Urban Dark" : "M31";
}

function getCocoGradeRecommendationLines(preset: CocoGradePresetName) {
  switch (preset) {
    case "Berlin":
      return ["Try Berlin for deeper blacks.", "It keeps the flyer moody."];
    case "Film":
      return ["Try Film for warm color depth.", "It suits this scene."];
    case "Gold":
      return ["Try Gold for a richer finish.", "It gives this flyer polish."];
    case "Noir":
      return ["Try Noir for clean contrast.", "It keeps the mood controlled."];
    case "Urban Dark":
      return ["Try Urban Dark for grit.", "It fits the street energy."];
    case "Cyber":
      return ["Try Cyber for sharper neon.", "It matches the digital mood."];
    case "M31":
    default:
      return ["Try M31 for neon contrast.", "It fits this flyer's energy."];
  }
}

function getCocoGradePresetRect(preset: CocoGradePresetName): Rect | null {
  if (typeof document === "undefined") return null;

  const buttons = Array.from(
    document.querySelectorAll<HTMLElement>("[data-coco-grade-preset]")
  );
  const button = buttons.find((node) => node.dataset.cocoGradePreset === preset);
  if (!button) return null;

  const style = window.getComputedStyle(button);
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) <= 0.01) {
    return null;
  }

  const rect = toRect(button.getBoundingClientRect());
  if (rect.width < 12 || rect.height < 12) return null;
  return rect;
}

function getCocoMasterGradePanelRect(): Rect | null {
  if (typeof document === "undefined") return null;

  const panel = document.querySelector<HTMLElement>("#mastergrade-panel");
  if (!panel) return null;

  const style = window.getComputedStyle(panel);
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) <= 0.01) {
    return null;
  }

  const rect = toRect(panel.getBoundingClientRect());
  if (rect.width < 24 || rect.height < 24) return null;
  return rect;
}

function shouldIgnoreCocoOverlap({
  allowedOverlapPairs,
  templateId,
  a,
  b,
}: {
  allowedOverlapPairs: Set<CocoOverlapPairKey>;
  templateId?: string | null;
  a: CocoTextRole;
  b: CocoTextRole;
}) {
  const pairKey = getCocoOverlapPairKey(a, b);
  return allowedOverlapPairs.has(pairKey) || templateAllowsCocoOverlap(templateId, a, b);
}

function loadCocoHtmlToImageModule() {
  cocoHtmlToImageModulePromise ??= import("html-to-image");
  return cocoHtmlToImageModulePromise;
}

function shouldRenderCocoMaskNode(root: HTMLElement, domNode: Node) {
  if (!(domNode instanceof Element)) return true;
  if (domNode === root) return true;
  if (domNode.closest?.("[data-nonexport='true']")) return false;

  const tagName = domNode.tagName.toLowerCase();
  return tagName !== "button";
}

function getLocalToViewportTransform(node: HTMLElement): LocalToViewportTransform | null {
  const width = node.offsetWidth || node.scrollWidth;
  const height = node.offsetHeight || node.scrollHeight;
  const getBoxQuads = (
    node as HTMLElement & {
      getBoxQuads?: () => Array<{
        p1: { x: number; y: number };
        p2: { x: number; y: number };
        p4: { x: number; y: number };
      }>;
    }
  ).getBoxQuads;
  const quad = getBoxQuads?.call(node)?.[0];

  if (quad && width >= 1 && height >= 1) {
    return {
      a: (quad.p2.x - quad.p1.x) / width,
      b: (quad.p2.y - quad.p1.y) / width,
      c: (quad.p4.x - quad.p1.x) / height,
      d: (quad.p4.y - quad.p1.y) / height,
      e: quad.p1.x,
      f: quad.p1.y,
    };
  }

  if (width < 1 || height < 1) return null;

  const rect = node.getBoundingClientRect();
  const style = window.getComputedStyle(node);
  const matrix = new DOMMatrixReadOnly(style.transform === "none" ? undefined : style.transform);
  const [originX = width / 2, originY = height / 2] = style.transformOrigin
    .split(/\s+/)
    .map((token, index) => resolveCssPositionToken(token, index === 0 ? width : height));
  const transformLocalPoint = (x: number, y: number) => {
    const relative = new DOMPoint(x - originX, y - originY).matrixTransform(matrix);
    return {
      x: relative.x + originX,
      y: relative.y + originY,
    };
  };
  const corners = [
    transformLocalPoint(0, 0),
    transformLocalPoint(width, 0),
    transformLocalPoint(0, height),
    transformLocalPoint(width, height),
  ];
  const minX = Math.min(...corners.map((corner) => corner.x));
  const maxX = Math.max(...corners.map((corner) => corner.x));
  const minY = Math.min(...corners.map((corner) => corner.y));
  const maxY = Math.max(...corners.map((corner) => corner.y));
  const scaleX = maxX > minX ? rect.width / (maxX - minX) : 1;
  const scaleY = maxY > minY ? rect.height / (maxY - minY) : 1;
  const topLeft = transformLocalPoint(0, 0);

  return {
    a: matrix.a * scaleX,
    b: matrix.b * scaleY,
    c: matrix.c * scaleX,
    d: matrix.d * scaleY,
    e: rect.left + (topLeft.x - minX) * scaleX,
    f: rect.top + (topLeft.y - minY) * scaleY,
  };
}

function resolveCssPositionToken(token: string | undefined, size: number) {
  if (!token) return size / 2;

  const normalized = token.trim().toLowerCase();
  if (normalized.endsWith("%")) {
    const value = Number.parseFloat(normalized);
    return Number.isFinite(value) ? (value / 100) * size : size / 2;
  }

  const keywordPosition: Record<string, number> = {
    bottom: size,
    center: size / 2,
    left: 0,
    right: size,
    top: 0,
  };
  if (normalized in keywordPosition) return keywordPosition[normalized];

  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : size / 2;
}

async function renderCocoVisibleMask(snapshot: CocoTextNodeSnapshot): Promise<CocoVisibleMask | null> {
  if (snapshot.rect.width < 1 || snapshot.rect.height < 1) return null;

  const localToViewport = getLocalToViewportTransform(snapshot.node);
  const { toCanvas } = await loadCocoHtmlToImageModule();
  const canvas = await toCanvas(snapshot.node, {
    backgroundColor: "transparent",
    cacheBust: false,
    filter: (domNode) => shouldRenderCocoMaskNode(snapshot.node, domNode),
    fontEmbedCSS: "",
    pixelRatio: 1,
    skipAutoScale: true,
    skipFonts: true,
    style: {
      bottom: "auto",
      borderColor: "transparent",
      boxShadow: "none",
      left: "0px",
      margin: "0",
      outline: "0",
      position: "relative",
      right: "auto",
      top: "0px",
      transform: "none",
    },
  });

  if (canvas.width < 1 || canvas.height < 1) return null;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  return {
    data,
    height: canvas.height,
    localToViewport,
    rect: snapshot.rect,
    scaleX: canvas.width / Math.max(1, snapshot.node.offsetWidth || snapshot.node.scrollWidth || snapshot.rect.width),
    scaleY: canvas.height / Math.max(1, snapshot.node.offsetHeight || snapshot.node.scrollHeight || snapshot.rect.height),
    width: canvas.width,
  };
}

function getMaskAlphaAtViewportPoint(mask: CocoVisibleMask, viewportX: number, viewportY: number) {
  let localX = viewportX - mask.rect.left;
  let localY = viewportY - mask.rect.top;

  if (mask.localToViewport) {
    const { a, b, c, d, e, f } = mask.localToViewport;
    const det = a * d - b * c;
    if (Math.abs(det) < 0.0001) return 0;

    const dx = viewportX - e;
    const dy = viewportY - f;
    localX = (d * dx - c * dy) / det;
    localY = (-b * dx + a * dy) / det;
  }

  const x = Math.floor(localX * mask.scaleX);
  const y = Math.floor(localY * mask.scaleY);

  if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) return 0;

  return mask.data[(y * mask.width + x) * 4 + 3] ?? 0;
}

function getViewportPointForMaskPixel(mask: CocoVisibleMask, x: number, y: number) {
  const localX = (x + 0.5) / mask.scaleX;
  const localY = (y + 0.5) / mask.scaleY;

  return getViewportPointForLocal(mask.rect, mask.localToViewport, localX, localY);
}

function getViewportPointForLocal(
  rect: Rect,
  localToViewport: LocalToViewportTransform | null,
  localX: number,
  localY: number
) {
  if (localToViewport) {
    const { a, b, c, d, e, f } = localToViewport;
    return {
      x: a * localX + c * localY + e,
      y: b * localX + d * localY + f,
    };
  }

  return {
    x: rect.left + localX,
    y: rect.top + localY,
  };
}

function getLocalPointForViewport(
  rect: Rect,
  localToViewport: LocalToViewportTransform | null,
  viewportX: number,
  viewportY: number
) {
  if (!localToViewport) {
    return {
      x: viewportX - rect.left,
      y: viewportY - rect.top,
    };
  }

  const { a, b, c, d, e, f } = localToViewport;
  const det = a * d - b * c;
  if (Math.abs(det) < 0.0001) return null;

  const dx = viewportX - e;
  const dy = viewportY - f;
  return {
    x: (d * dx - c * dy) / det,
    y: (-b * dx + a * dy) / det,
  };
}

function visibleMaskOverflowsArtboard(mask: CocoVisibleMask, artboardRect: Rect) {
  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      const alpha = mask.data[(y * mask.width + x) * 4 + 3] ?? 0;
      if (alpha <= COCO_VISIBLE_PIXEL_ALPHA_THRESHOLD) continue;

      const { x: viewportX, y: viewportY } = getViewportPointForMaskPixel(mask, x, y);
      if (
        viewportX < artboardRect.left - COCO_LAYOUT_TOLERANCE_PX ||
        viewportX > artboardRect.right + COCO_LAYOUT_TOLERANCE_PX ||
        viewportY < artboardRect.top - COCO_LAYOUT_TOLERANCE_PX ||
        viewportY > artboardRect.bottom + COCO_LAYOUT_TOLERANCE_PX
      ) {
        return true;
      }
    }
  }

  return false;
}

function visibleMasksOverlap(a: CocoVisibleMask, b: CocoVisibleMask, intersection: Rect) {
  let hits = 0;
  let maxHitY = -Infinity;
  let minHitY = Infinity;
  const startX = Math.floor(intersection.left);
  const endX = Math.ceil(intersection.right);
  const startY = Math.floor(intersection.top);
  const endY = Math.ceil(intersection.bottom);

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      if (
        getMaskAlphaAtViewportPoint(a, x + 0.5, y + 0.5) > COCO_VISIBLE_PIXEL_ALPHA_THRESHOLD &&
        getMaskAlphaAtViewportPoint(b, x + 0.5, y + 0.5) > COCO_VISIBLE_PIXEL_ALPHA_THRESHOLD
      ) {
        hits += 1;
        maxHitY = Math.max(maxHitY, y);
        minHitY = Math.min(minHitY, y);
      }
    }
  }

  const visibleOverlapHeight = maxHitY - minHitY + 1;
  return (
    hits >= COCO_VISIBLE_PIXEL_OVERLAP_THRESHOLD &&
    visibleOverlapHeight >= COCO_VISIBLE_PIXEL_OVERLAP_MIN_HEIGHT_PX
  );
}

function parseCssPixelValue(value: string | null | undefined) {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCssAlpha(value: string | null | undefined) {
  const color = String(value ?? "").trim().toLowerCase();
  if (!color || color === "transparent") return 0;

  const rgbMatch = color.match(/rgba?\(([^)]+)\)/);
  if (!rgbMatch) return 1;

  const parts = rgbMatch[1]?.split(/[\s,\/]+/).filter(Boolean) ?? [];
  if (parts.length < 4) return 1;

  const alpha = Number.parseFloat(parts[3] ?? "1");
  return Number.isFinite(alpha) ? alpha : 1;
}

function visibleMaskTouchesTextGuide(activeMask: CocoVisibleMask, candidate: CocoTextNodeSnapshot) {
  const style = window.getComputedStyle(candidate.node);
  const outlineStyle = style.outlineStyle;
  const outlineWidth = parseCssPixelValue(style.outlineWidth);
  const outlineOffset = parseCssPixelValue(style.outlineOffset);
  const outlineAlpha = getCssAlpha(style.outlineColor);
  if (
    outlineWidth <= 0 ||
    outlineAlpha <= 0.01 ||
    outlineStyle === "none" ||
    outlineStyle === "hidden"
  ) {
    return false;
  }

  const width = candidate.node.offsetWidth || candidate.node.scrollWidth || candidate.rect.width;
  const height = candidate.node.offsetHeight || candidate.node.scrollHeight || candidate.rect.height;
  if (width < 1 || height < 1) return false;

  const localToViewport = getLocalToViewportTransform(candidate.node);
  const outerPad = Math.max(0, outlineOffset + outlineWidth);
  const innerPad = Math.max(0, outlineOffset);
  const scanRect = getIntersectionRect(activeMask.rect, expandRect(candidate.rect, outerPad + 2));
  if (!scanRect) return false;

  let hits = 0;
  for (let y = Math.floor(scanRect.top); y < Math.ceil(scanRect.bottom); y += 1) {
    for (let x = Math.floor(scanRect.left); x < Math.ceil(scanRect.right); x += 1) {
      if (getMaskAlphaAtViewportPoint(activeMask, x + 0.5, y + 0.5) <= COCO_VISIBLE_PIXEL_ALPHA_THRESHOLD) {
        continue;
      }

      const localPoint = getLocalPointForViewport(candidate.rect, localToViewport, x + 0.5, y + 0.5);
      if (!localPoint) continue;

      const inOuter =
        localPoint.x >= -outerPad &&
        localPoint.x <= width + outerPad &&
        localPoint.y >= -outerPad &&
        localPoint.y <= height + outerPad;
      const inInner =
        localPoint.x >= -innerPad &&
        localPoint.x <= width + innerPad &&
        localPoint.y >= -innerPad &&
        localPoint.y <= height + innerPad;

      if (inOuter && !inInner) {
        hits += 1;
        if (hits >= COCO_VISIBLE_GUIDE_OVERLAP_THRESHOLD) return true;
      }
    }
  }

  return false;
}

function placementToRect(placement: CocoPlacement, height = COCO_STAGE_HEIGHT): Rect {
  return {
    bottom: placement.top + height,
    height,
    left: placement.left,
    right: placement.left + placement.width,
    top: placement.top,
    width: placement.width,
  };
}

function toRect(rect: DOMRect): Rect {
  return {
    bottom: rect.bottom,
    height: rect.height,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    width: rect.width,
  };
}

function getArtboardRect(): Rect | null {
  if (typeof document === "undefined") return null;

  const element =
    document.querySelector("#artboard") ??
    document.querySelector('[data-coco-target~="canvas"]') ??
    document.querySelector('[data-tour="artboard"]');
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  if (rect.width < 80 || rect.height < 80) return null;

  return toRect(rect);
}

function normalizeTextRole(value: unknown): CocoTextRole | null {
  const role = String(value ?? "").trim();
  if ((COCO_TEXT_ROLES as string[]).includes(role)) return role as CocoTextRole;
  if (role === "head2") return "headline2";
  return null;
}

function getSelectedTextRole(selectedPanel?: string | null) {
  return normalizeTextRole(PANEL_TO_TEXT_ROLE[String(selectedPanel ?? "")] ?? selectedPanel);
}

function getEditorPanelForTextRole(role: CocoTextRole) {
  return TEXT_ROLE_TO_PANEL[role];
}

function getMoveTargetForTextRole(role: CocoTextRole): MoveTarget {
  return role;
}

function getSubjectIssueText(issue: CocoSubjectIssueResult) {
  const label = issue.overlapRole ? COCO_TEXT_ROLE_LABELS[issue.overlapRole] : null;

  if (issue.type === "off-canvas") return "Move subject inside canvas.";
  if (issue.type === "text-overlap") {
    if (issue.overlapRole === "headline") return issue.suggestion ?? "Move subject off headline.";
    return label ? `Subject covers ${label}.` : "Subject covers text.";
  }
  if (issue.type === "too-large") return "Subject is too large.";
  if (issue.type === "too-small") return "Subject is too small.";
  if (issue.type === "hero-combo") return "Hero combo. Keep it?";
  return "Check the subject.";
}

function getSubjectIssueKey(issue: CocoSubjectIssueResult, subjectSignature?: string | null) {
  if (!issue.type || !issue.overlapRole) return null;

  const rect = issue.rect;
  const rectKey = rect
    ? [
        Math.round(rect.left),
        Math.round(rect.top),
        Math.round(rect.width),
        Math.round(rect.height),
      ].join(":")
    : "no-rect";

  return `${subjectSignature ?? "subject"}:${issue.type}:${issue.overlapRole}:${rectKey}`;
}

function getPolishScanIssueText(issue: CocoPolishScanIssue | null) {
  if (!issue) return "Canvas looks clean.";

  if (issue.kind === "missing-text") {
    return `${COCO_TEXT_ROLE_LABELS[issue.role]} is blank.`;
  }

  if (issue.kind === "subject") {
    return getSubjectIssueText(issue.issue);
  }

  const label = COCO_TEXT_ROLE_LABELS[issue.role];
  if (issue.issueType === "overflow") {
    return `${label} may be too long.`;
  }
  if (issue.issueType === "subject-overlap") {
    return `Subject covers ${label}.`;
  }

  const overlapLabel = issue.overlapRole ? COCO_TEXT_ROLE_LABELS[issue.overlapRole] : null;
  return overlapLabel ? `${label} overlaps ${overlapLabel}.` : `${label} overlaps text.`;
}

function parseCocoLayoutSignature(signature?: string | null) {
  const map = new Map<string, string>();
  String(signature ?? "")
    .split("|")
    .forEach((part) => {
      const divider = part.indexOf(":");
      if (divider <= 0) return;
      map.set(part.slice(0, divider), part.slice(divider + 1));
    });
  return map;
}

function getChangedCanvasLayoutTarget(
  beforeSignature: string | null,
  afterSignature: string | null,
  issue?: CocoPolishScanIssue | null
): CocoPostScanRestoreTarget {
  const before = parseCocoLayoutSignature(beforeSignature);
  const after = parseCocoLayoutSignature(afterSignature);
  const changed = new Set<string>();

  after.forEach((value, key) => {
    if (before.get(key) !== value) changed.add(key);
  });
  before.forEach((value, key) => {
    if (!after.has(key) || after.get(key) !== value) changed.add(key);
  });

  if (issue?.kind === "subject" && changed.has("subject")) return "subject";
  if (issue?.kind === "text-layout") {
    if (issue.issueType === "subject-overlap" && changed.has("subject")) return "subject";
    if (changed.has(issue.role)) return issue.role;
  }
  if (issue?.kind === "missing-text" && changed.has(issue.role)) return issue.role;
  if (changed.has("subject")) return "subject";

  const textTarget = COCO_TEXT_ROLES.find((role) => changed.has(role));
  return textTarget ?? "canvas";
}

function getCocoTargetRefForPostScanTarget(target: CocoPostScanRestoreTarget): CocoTargetRef {
  if (target === "canvas") return { type: "canvas" };
  if (target === "subject") return { type: "subject" };
  return { role: target, type: "text" };
}

function getPostScanChangeLines(change: CocoPostScanChange | null) {
  if (!change) return getCocoPostChangeLines(false);

  if (change.issue) {
    return getCocoPostChangeLines(true, getPolishScanIssueText(change.issue));
  }
  return getCocoPostChangeLines(false);
}

function getPostScanTargetZone(
  change: CocoPostScanChange | null,
  textTargets: CocoTextTarget[]
): CocoTargetZone | null {
  if (!change) return null;

  if (change.target === "subject") {
    const subjectRect = change.issue?.kind === "subject" ? change.issue.issue.rect : null;
    return targetZoneFromSubjectRect(subjectRect ?? getSubjectTargetRect(getArtboardRect()));
  }

  if (change.target !== "canvas") {
    return targetZoneFromTextTarget(textTargets.find((target) => target.role === change.target) ?? null);
  }

  return null;
}

function normalizeCocoText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function isVisibleTextNode(node: HTMLElement, artboardRect: Rect | null) {
  const style = window.getComputedStyle(node);
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) <= 0.01) {
    return false;
  }

  const rect = toRect(node.getBoundingClientRect());
  if (rect.width < 6 || rect.height < 6) return false;
  if (artboardRect && !rectsOverlap(rect, artboardRect, 0)) return false;

  return true;
}

function getVisibleTextNodeForRole(role: CocoTextRole | null, artboardRect: Rect | null) {
  if (typeof document === "undefined" || !role) return null;

  const artboard = document.querySelector<HTMLElement>("#artboard");
  if (!artboard) return null;

  const nodes = Array.from(
    artboard.querySelectorAll<HTMLElement>(
      `[data-coco-text-role="${role}"], [data-node="${role}"]`
    )
  );
  return nodes.find((item) => isVisibleTextNode(item, artboardRect)) ?? null;
}

function getDisplayedTextNodeForRole(role: CocoTextRole | null, artboardRect: Rect | null) {
  if (typeof document === "undefined" || !role) return null;

  const artboard = document.querySelector<HTMLElement>("#artboard");
  if (!artboard) return null;

  const nodes = Array.from(
    artboard.querySelectorAll<HTMLElement>(
      `[data-coco-text-role="${role}"], [data-node="${role}"]`
    )
  );

  return (
    nodes.find((node) => {
      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) <= 0.01) {
        return false;
      }

      const rect = toRect(node.getBoundingClientRect());
      return !artboardRect || rect.width < 1 || rect.height < 1 || rectsOverlap(rect, artboardRect, 0);
    }) ?? null
  );
}

function getCanvasTextForRole(role: CocoTextRole | null) {
  if (typeof document === "undefined" || !role) return "";

  const node = getVisibleTextNodeForRole(role, null);
  return normalizeCocoText(node?.textContent ?? "");
}

function getLayoutOptionsRect(): Rect | null {
  if (typeof document === "undefined") return null;

  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>('[data-coco-layout-options="true"], #background-layout-section')
  );
  const node = nodes.find((item) => {
    const style = window.getComputedStyle(item);
    const rect = item.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity) > 0.01 &&
      rect.width >= 24 &&
      rect.height >= 24
    );
  });

  return node ? toRect(node.getBoundingClientRect()) : null;
}

function getPaletteOptionsRect(): Rect | null {
  if (typeof document === "undefined") return null;

  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>('[data-coco-palette-options="true"], #background-palette-section')
  );
  const node = nodes.find((item) => {
    const style = window.getComputedStyle(item);
    const rect = item.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity) > 0.01 &&
      rect.width >= 24 &&
      rect.height >= 24
    );
  });

  return node ? toRect(node.getBoundingClientRect()) : null;
}

function isVisibleSubjectRoot(node: HTMLElement, artboardRect: Rect | null) {
  const style = window.getComputedStyle(node);
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) <= 0.01) {
    return false;
  }

  const rect = toRect(node.getBoundingClientRect());
  if (rect.width < 8 || rect.height < 8) return false;
  if (artboardRect && !rectsOverlap(rect, artboardRect, 0)) return false;

  return true;
}

function renderCocoImageVisibleMask(image: HTMLImageElement): CocoVisibleMask | null {
  if (!image.complete || !image.naturalWidth || !image.naturalHeight) return null;

  const imageRect = toRect(image.getBoundingClientRect());
  const localWidth = image.offsetWidth || image.scrollWidth || imageRect.width;
  const localHeight = image.offsetHeight || image.scrollHeight || imageRect.height;
  if (localWidth < 1 || localHeight < 1 || imageRect.width < 1 || imageRect.height < 1) {
    return null;
  }

  try {
    const maxMaskSide = 192;
    const maskScale = Math.min(1, maxMaskSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * maskScale));
    const height = Math.max(1, Math.round(image.naturalHeight * maskScale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(image, 0, 0, width, height);
    const data = ctx.getImageData(0, 0, width, height).data;

    return {
      data,
      height,
      localToViewport: getLocalToViewportTransform(image),
      rect: imageRect,
      scaleX: width / Math.max(1, localWidth),
      scaleY: height / Math.max(1, localHeight),
      width,
    };
  } catch {
    return null;
  }
}

function getVisibleRectFromMask(mask: CocoVisibleMask): Rect | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      const alpha = mask.data[(y * mask.width + x) * 4 + 3] ?? 0;
      if (alpha <= COCO_VISIBLE_PIXEL_ALPHA_THRESHOLD) continue;

      const point = getViewportPointForMaskPixel(mask, x, y);
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || maxX <= minX || maxY <= minY) {
    return null;
  }

  return {
    bottom: maxY,
    height: maxY - minY,
    left: minX,
    right: maxX,
    top: minY,
    width: maxX - minX,
  };
}

function getCocoNodeZIndex(node: HTMLElement) {
  let current: HTMLElement | null = node;
  let zIndex = 0;

  while (current && current.id !== "artboard") {
    const parsed = Number.parseFloat(window.getComputedStyle(current).zIndex);
    if (Number.isFinite(parsed)) zIndex = Math.max(zIndex, parsed);
    current = current.parentElement;
  }

  return zIndex;
}

function getSubjectSnapshots(artboardRect: Rect | null): CocoSubjectSnapshot[] {
  if (typeof document === "undefined") return [];

  const artboard = document.querySelector<HTMLElement>("#artboard");
  if (!artboard) return [];

  const roots = Array.from(
    artboard.querySelectorAll<HTMLElement>(
      '[data-coco-subject="true"], [data-coco-subject-id], [data-node="subject"]'
    )
  );

  return roots.flatMap((root) => {
    if (!isVisibleSubjectRoot(root, artboardRect)) return [];

    const boundsNode =
      root.querySelector<HTMLElement>('[data-hit-bounds="true"]') ?? root;
    const image =
      root.querySelector<HTMLImageElement>('[data-hit-source="true"]') ??
      root.querySelector<HTMLImageElement>("img");
    const rect = toRect(boundsNode.getBoundingClientRect());
    if (rect.width < 8 || rect.height < 8) return [];

    const mask = image ? renderCocoImageVisibleMask(image) : null;
    const visualRect = (mask ? getVisibleRectFromMask(mask) : null) ?? rect;
    if (visualRect.width < 8 || visualRect.height < 8) return [];

    return [
      {
        mask,
        rect,
        root,
        visualRect,
        zIndex: getCocoNodeZIndex(root),
      },
    ];
  });
}

function getPrimarySubjectSnapshot(artboardRect: Rect | null) {
  return getSubjectSnapshots(artboardRect).sort(
    (a, b) => getRectArea(b.visualRect) - getRectArea(a.visualRect)
  )[0] ?? null;
}

function getSubjectTargetRect(artboardRect: Rect | null): Rect | null {
  return getPrimarySubjectSnapshot(artboardRect)?.visualRect ?? null;
}

function targetZoneFromSubjectRect(subjectRect: Rect | null): CocoTargetZone | null {
  if (!subjectRect) return null;
  const pad = Math.max(8, Math.min(18, Math.max(subjectRect.width, subjectRect.height) * 0.025));
  const expanded = expandRect(subjectRect, pad);
  return {
    ...expanded,
    radius: Math.max(16, Math.min(34, Math.min(expanded.width, expanded.height) * 0.12)),
  };
}

function getTextNodeSnapshots(artboardRect: Rect | null): CocoTextNodeSnapshot[] {
  if (typeof document === "undefined") return [];

  const artboard = document.querySelector<HTMLElement>("#artboard");
  if (!artboard) return [];

  return Array.from(
    artboard.querySelectorAll<HTMLElement>("[data-coco-text-role], [data-node]")
  ).flatMap((node) => {
    const role = normalizeTextRole(
      node.getAttribute("data-coco-text-role") || node.getAttribute("data-node")
    );
    if (!role) return [];

    const text = normalizeCocoText(node.textContent ?? "");
    if (!text) return [];
    if (!isVisibleTextNode(node, artboardRect)) return [];

    return [
      {
        node,
        rect: toRect(node.getBoundingClientRect()),
        role,
        text,
      },
    ];
  });
}

function countVisibleMaskPixels(mask: CocoVisibleMask) {
  let count = 0;

  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      if ((mask.data[(y * mask.width + x) * 4 + 3] ?? 0) > COCO_VISIBLE_PIXEL_ALPHA_THRESHOLD) {
        count += 1;
      }
    }
  }

  return count;
}

function getMaskRectOverlapMetrics(mask: CocoVisibleMask, rect: Rect, intersection: Rect) {
  let hits = 0;
  let maxHitY = -Infinity;
  let minHitY = Infinity;
  const startX = Math.floor(intersection.left);
  const endX = Math.ceil(intersection.right);
  const startY = Math.floor(intersection.top);
  const endY = Math.ceil(intersection.bottom);

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const viewportX = x + 0.5;
      const viewportY = y + 0.5;
      if (
        viewportX < rect.left ||
        viewportX > rect.right ||
        viewportY < rect.top ||
        viewportY > rect.bottom
      ) {
        continue;
      }

      if (getMaskAlphaAtViewportPoint(mask, viewportX, viewportY) > COCO_VISIBLE_PIXEL_ALPHA_THRESHOLD) {
        hits += 1;
        maxHitY = Math.max(maxHitY, y);
        minHitY = Math.min(minHitY, y);
      }
    }
  }

  return {
    hits,
    visibleOverlapHeight: maxHitY - minHitY + 1,
  };
}

function visibleMaskHasPixelsInRect(mask: CocoVisibleMask, rect: Rect, intersection: Rect) {
  const metrics = getMaskRectOverlapMetrics(mask, rect, intersection);
  return (
    metrics.hits >= COCO_VISIBLE_PIXEL_OVERLAP_THRESHOLD * 2 &&
    metrics.visibleOverlapHeight >= COCO_VISIBLE_PIXEL_OVERLAP_MIN_HEIGHT_PX
  );
}

function getVisibleMaskOverlapMetrics(a: CocoVisibleMask, b: CocoVisibleMask, intersection: Rect) {
  let hits = 0;
  let maxHitY = -Infinity;
  let minHitY = Infinity;
  const startX = Math.floor(intersection.left);
  const endX = Math.ceil(intersection.right);
  const startY = Math.floor(intersection.top);
  const endY = Math.ceil(intersection.bottom);

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      if (
        getMaskAlphaAtViewportPoint(a, x + 0.5, y + 0.5) > COCO_VISIBLE_PIXEL_ALPHA_THRESHOLD &&
        getMaskAlphaAtViewportPoint(b, x + 0.5, y + 0.5) > COCO_VISIBLE_PIXEL_ALPHA_THRESHOLD
      ) {
        hits += 1;
        maxHitY = Math.max(maxHitY, y);
        minHitY = Math.min(minHitY, y);
      }
    }
  }

  return {
    hits,
    visibleOverlapHeight: maxHitY - minHitY + 1,
  };
}

function visibleOverlapMetricsPass(metrics: { hits: number; visibleOverlapHeight: number }) {
  return (
    metrics.hits >= COCO_VISIBLE_PIXEL_OVERLAP_THRESHOLD &&
    metrics.visibleOverlapHeight >= COCO_VISIBLE_PIXEL_OVERLAP_MIN_HEIGHT_PX
  );
}

function getSubjectMoveSuggestion(subjectRect: Rect, textRect: Rect) {
  const subjectCenter = getRectCenter(subjectRect);
  const textCenter = getRectCenter(textRect);
  const overlap = getIntersectionRect(subjectRect, textRect);
  if (!overlap) return "Move subject a bit.";

  if (overlap.width < overlap.height * 0.82) {
    return subjectCenter.x < textCenter.x
      ? "Move subject left a bit."
      : "Move subject right a bit.";
  }

  if (overlap.height < overlap.width * 0.82) {
    return subjectCenter.y < textCenter.y
      ? "Move subject up a bit."
      : "Move subject down a bit.";
  }

  const horizontalDistance = Math.abs(subjectCenter.x - textCenter.x) / Math.max(1, textRect.width);
  const verticalDistance = Math.abs(subjectCenter.y - textCenter.y) / Math.max(1, textRect.height);

  if (horizontalDistance > verticalDistance) {
    return subjectCenter.x < textCenter.x
      ? "Move subject left a bit."
      : "Move subject right a bit.";
  }

  return subjectCenter.y < textCenter.y
    ? "Move subject up a bit."
    : "Move subject down a bit.";
}

async function getSubjectTextOverlapRole(
  subject: CocoSubjectSnapshot,
  snapshots: CocoTextNodeSnapshot[]
) {
  const candidates = snapshots
    .filter((item) => {
      if (!rectsOverlap(subject.visualRect, item.rect, 0)) return false;
      const textZIndex = getCocoNodeZIndex(item.node);
      return subject.zIndex >= textZIndex;
    })
    .sort((a, b) => COCO_TEXT_ROLE_PRIORITY[a.role] - COCO_TEXT_ROLE_PRIORITY[b.role]);

  for (const candidate of candidates) {
    const intersection = getIntersectionRect(subject.visualRect, candidate.rect);
    if (!intersection) continue;

    try {
      const textMask = await renderCocoVisibleMask(candidate);
      if (!textMask) continue;

      const textPixelCount = Math.max(1, countVisibleMaskPixels(textMask));

      if (subject.mask) {
        const metrics = getVisibleMaskOverlapMetrics(subject.mask, textMask, intersection);
        if (visibleOverlapMetricsPass(metrics)) {
          return {
            overlapRatio: metrics.hits / textPixelCount,
            role: candidate.role,
            suggestion: getSubjectMoveSuggestion(subject.visualRect, candidate.rect),
          };
        }
      }

      if (!subject.mask) {
        const metrics = getMaskRectOverlapMetrics(textMask, subject.visualRect, intersection);
        if (visibleMaskHasPixelsInRect(textMask, subject.visualRect, intersection)) {
          return {
            overlapRatio: metrics.hits / textPixelCount,
            role: candidate.role,
            suggestion: getSubjectMoveSuggestion(subject.visualRect, candidate.rect),
          };
        }
      }
    } catch {
      // Keep checking other text nodes if one mask cannot be rendered.
    }
  }

  return null;
}

async function getSubjectOverlapForTextSnapshot(
  active: CocoTextNodeSnapshot,
  activeMask: CocoVisibleMask,
  artboardRect: Rect,
  activeSubjectSignature?: string | null
): Promise<CocoLayoutIssueResult | null> {
  const textZIndex = getCocoNodeZIndex(active.node);
  const textPixelCount = Math.max(1, countVisibleMaskPixels(activeMask));
  const subjects = getSubjectSnapshots(artboardRect)
    .filter((subject) => {
      if (subject.zIndex < textZIndex) return false;
      return rectsOverlap(subject.visualRect, active.rect, 0);
    })
    .sort((a, b) => b.zIndex - a.zIndex || getRectArea(b.visualRect) - getRectArea(a.visualRect));

  for (const subject of subjects) {
    const intersection = getIntersectionRect(subject.visualRect, active.rect);
    if (!intersection) continue;

    if (subject.mask) {
      const metrics = getVisibleMaskOverlapMetrics(subject.mask, activeMask, intersection);
      if (visibleOverlapMetricsPass(metrics)) {
        const issue: CocoSubjectIssueResult = {
          overlapRatio: metrics.hits / textPixelCount,
          overlapRole: active.role,
          rect: subject.visualRect,
          suggestion: getSubjectMoveSuggestion(subject.visualRect, active.rect),
          type: "text-overlap",
        };
        return {
          overlapRole: active.role,
          subjectIssue: issue,
          subjectIssueKey: getSubjectIssueKey(issue, activeSubjectSignature),
          type: "subject-overlap",
        };
      }
    }

    if (!subject.mask) {
      const metrics = getMaskRectOverlapMetrics(activeMask, subject.visualRect, intersection);
      if (visibleMaskHasPixelsInRect(activeMask, subject.visualRect, intersection)) {
        const issue: CocoSubjectIssueResult = {
          overlapRatio: metrics.hits / textPixelCount,
          overlapRole: active.role,
          rect: subject.visualRect,
          suggestion: getSubjectMoveSuggestion(subject.visualRect, active.rect),
          type: "text-overlap",
        };
        return {
          overlapRole: active.role,
          subjectIssue: issue,
          subjectIssueKey: getSubjectIssueKey(issue, activeSubjectSignature),
          type: "subject-overlap",
        };
      }
    }
  }

  return null;
}

async function getSubjectPlacementIssue(format: "square" | "story"): Promise<CocoSubjectIssueResult> {
  if (typeof document === "undefined") return emptySubjectIssue();

  const artboardRect = getArtboardRect();
  if (!artboardRect) return emptySubjectIssue();

  const subject = getPrimarySubjectSnapshot(artboardRect);
  if (!subject) return emptySubjectIssue();

  const subjectRect = subject.visualRect;
  const intersection = getIntersectionRect(subjectRect, artboardRect);
  if (!intersection) {
    return { ...emptySubjectIssue(subjectRect), type: "off-canvas" };
  }

  const subjectArea = Math.max(1, getRectArea(subjectRect));
  const visibleArea = getRectArea(intersection);
  const artboardArea = Math.max(1, getRectArea(artboardRect));
  const visibleRatio = visibleArea / subjectArea;
  const artboardRatio = visibleArea / artboardArea;
  const center = getRectCenter(subjectRect);
  const centerInside =
    center.x >= artboardRect.left &&
    center.x <= artboardRect.right &&
    center.y >= artboardRect.top &&
    center.y <= artboardRect.bottom;

  if ((!centerInside && visibleRatio < 0.52) || visibleRatio < 0.38) {
    return { ...emptySubjectIssue(subjectRect), type: "off-canvas" };
  }

  const overlap = await getSubjectTextOverlapRole(subject, getTextNodeSnapshots(artboardRect));
  if (overlap) {
    const isHeroCombo =
      overlap.role === "headline" &&
      overlap.overlapRatio <= COCO_HERO_COMBO_HEADLINE_OVERLAP_MAX;

    return {
      overlapRatio: overlap.overlapRatio,
      overlapRole: overlap.role,
      rect: subjectRect,
      suggestion: overlap.suggestion,
      type: isHeroCombo ? "hero-combo" : "text-overlap",
    };
  }

  const minArea = format === "story" ? 0.022 : 0.026;
  const minWidthRatio = format === "story" ? 0.12 : 0.1;
  const minHeightRatio = format === "story" ? 0.12 : 0.14;
  if (
    artboardRatio < minArea ||
    intersection.width / artboardRect.width < minWidthRatio ||
    intersection.height / artboardRect.height < minHeightRatio
  ) {
    return { ...emptySubjectIssue(subjectRect), type: "too-small" };
  }

  const widthRatio = intersection.width / artboardRect.width;
  const heightRatio = intersection.height / artboardRect.height;
  if (
    artboardRatio > 0.82 ||
    (widthRatio > 0.96 && heightRatio > 0.92) ||
    (widthRatio > 1.08 && heightRatio > 0.78)
  ) {
    return { ...emptySubjectIssue(subjectRect), type: "too-large" };
  }

  return emptySubjectIssue(subjectRect);
}

async function getLayoutIssueForRole({
  acceptedSubjectIssueKey,
  allowedOverlapPairs,
  activeSubjectSignature,
  role,
  templateId,
}: {
  acceptedSubjectIssueKey?: string | null;
  allowedOverlapPairs: Set<CocoOverlapPairKey>;
  activeSubjectSignature?: string | null;
  role: CocoTextRole | null;
  templateId?: string | null;
}): Promise<CocoLayoutIssueResult> {
  if (typeof document === "undefined" || !role) return emptyLayoutIssue();

  const artboardRect = getArtboardRect();
  if (!artboardRect) return emptyLayoutIssue();

  const snapshots = getTextNodeSnapshots(artboardRect);
  const active = snapshots.find((item) => item.role === role);
  if (!active) return emptyLayoutIssue();

  let activeMask: CocoVisibleMask | null = null;
  try {
    activeMask = await renderCocoVisibleMask(active);
  } catch {
    return emptyLayoutIssue();
  }

  if (!activeMask) return emptyLayoutIssue();

  if (rectOverflowsArtboard(active.rect, artboardRect) && visibleMaskOverflowsArtboard(activeMask, artboardRect)) {
    return { overlapRole: null, type: "overflow" };
  }

  const subjectOverlapIssue = await getSubjectOverlapForTextSnapshot(
    active,
    activeMask,
    artboardRect,
    activeSubjectSignature
  );
	  if (
	    subjectOverlapIssue?.type &&
	    subjectOverlapIssue.subjectIssueKey !== acceptedSubjectIssueKey
	  ) {
	    return subjectOverlapIssue;
	  }

	  const candidates = snapshots
    .filter(
      (item) =>
        item.role !== role &&
        rectsOverlap(active.rect, expandRect(item.rect, 4), 0) &&
        !shouldIgnoreCocoOverlap({
          allowedOverlapPairs,
          a: role,
          b: item.role,
          templateId,
        })
    )
    .sort((a, b) => COCO_TEXT_ROLE_PRIORITY[a.role] - COCO_TEXT_ROLE_PRIORITY[b.role]);

  for (const candidate of candidates) {
    const intersection = getIntersectionRect(active.rect, candidate.rect);
    if (intersection) {
      try {
        const candidateMask = await renderCocoVisibleMask(candidate);
        if (candidateMask && visibleMasksOverlap(activeMask, candidateMask, intersection)) {
          return { overlapRole: candidate.role, type: "overlap" };
        }
      } catch {
        // If one candidate cannot render to a mask, keep checking the rest.
      }
    }

    try {
      if (visibleMaskTouchesTextGuide(activeMask, candidate)) {
        return { overlapRole: candidate.role, type: "overlap" };
      }
    } catch {
      // Guide checks are a fallback for visible editor outlines; ignore failures.
    }
  }

  return emptyLayoutIssue();
}

async function getPolishScanIssue({
  acceptedSubjectIssueKey,
  allowedOverlapPairs,
  activeSubjectSignature,
  format,
  hasSubject,
  templateId,
}: {
  acceptedSubjectIssueKey?: string | null;
  allowedOverlapPairs: Set<CocoOverlapPairKey>;
  activeSubjectSignature?: string | null;
  format: "square" | "story";
  hasSubject?: boolean;
  templateId?: string | null;
}): Promise<CocoPolishScanIssue | null> {
  const artboardRect = getArtboardRect();
  if (!artboardRect) return null;

  const visibleRoles = getTextNodeSnapshots(artboardRect)
    .map((snapshot) => snapshot.role)
    .filter((role, index, roles) => roles.indexOf(role) === index)
    .sort((a, b) => COCO_TEXT_ROLE_PRIORITY[a] - COCO_TEXT_ROLE_PRIORITY[b]);

  for (const role of ["venue", "date"] as CocoTextRole[]) {
    const node = getDisplayedTextNodeForRole(role, artboardRect);
    if (node && !normalizeCocoText(node.textContent ?? "")) {
      return { kind: "missing-text", role };
    }
  }

  for (const role of visibleRoles) {
    const issue = await getLayoutIssueForRole({
      acceptedSubjectIssueKey,
      allowedOverlapPairs,
      activeSubjectSignature,
      role,
      templateId,
    });
    if (issue.type) {
      return {
        issueType: issue.type,
        kind: "text-layout",
        overlapRole: issue.overlapRole,
        role,
      };
    }
  }

  if (hasSubject) {
    const subjectIssue = await getSubjectPlacementIssue(format);
    const subjectIssueKey = getSubjectIssueKey(subjectIssue, activeSubjectSignature);
    if (
      subjectIssue.type &&
      subjectIssue.type !== "hero-combo" &&
      subjectIssueKey !== acceptedSubjectIssueKey
    ) {
      return {
        issue: subjectIssue,
        kind: "subject",
      };
    }
  }

  return null;
}

function expandRect(rect: Rect, pad: number): Rect {
  return {
    bottom: rect.bottom + pad,
    height: rect.height + pad * 2,
    left: rect.left - pad,
    right: rect.right + pad,
    top: rect.top - pad,
    width: rect.width + pad * 2,
  };
}

function targetZoneFromTextTarget(target: CocoTextTarget | null): CocoTargetZone | null {
  if (!target) return null;
  const pad = Math.max(8, Math.min(18, Math.max(target.width, target.height) * 0.045));
  const expanded = expandRect(target, pad);
  return {
    ...expanded,
    radius: Math.max(12, Math.min(30, Math.min(expanded.width, expanded.height) * 0.14)),
  };
}

type CocoRgba = {
  a: number;
  b: number;
  g: number;
  r: number;
};

type CocoBackdropRead = {
  backgroundComplexity: number | null;
  backgroundLuminance: number | null;
};

const COCO_READABILITY_METRIC_LABELS: Record<CocoReadabilityMetricId, string> = {
  background_complexity: "Background complexity",
  contrast: "Contrast",
  edge_distance: "Distance from edge",
  glow_interference: "Glow interference",
  shadow_effectiveness: "Shadow effectiveness",
  stroke_effectiveness: "Stroke effectiveness",
  text_size: "Text size",
};

const COCO_READABILITY_MIN_FONT: Record<CocoTextRole, number> = {
  date: 20,
  details: 17,
  details2: 12,
  headline: 64,
  headline2: 28,
  leftRail: 9,
  presenter: 10,
  price: 18,
  rightRail: 9,
  subtag: 14,
  venue: 10,
};

function parseCssNumber(value: string | null | undefined, fallback = 0) {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCssRgbaPrimitive(value: string | null | undefined): CocoRgba | null {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "transparent" || raw === "none" || raw === "currentcolor") return null;

  const hex = raw.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    const part = hex[1];
    const expand = (v: string) => (v.length === 1 ? `${v}${v}` : v);
    if (part.length === 3 || part.length === 4) {
      const r = Number.parseInt(expand(part[0]), 16);
      const g = Number.parseInt(expand(part[1]), 16);
      const b = Number.parseInt(expand(part[2]), 16);
      const a = part.length === 4 ? Number.parseInt(expand(part[3]), 16) / 255 : 1;
      return { a, b, g, r };
    }
    if (part.length === 6 || part.length === 8) {
      const r = Number.parseInt(part.slice(0, 2), 16);
      const g = Number.parseInt(part.slice(2, 4), 16);
      const b = Number.parseInt(part.slice(4, 6), 16);
      const a = part.length === 8 ? Number.parseInt(part.slice(6, 8), 16) / 255 : 1;
      return { a, b, g, r };
    }
  }

  const rgb = raw.match(/^rgba?\((.+)\)$/i);
  if (!rgb) return null;
  const parts = rgb[1]
    .split(/[,/ ]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 3) return null;
  const parseChannel = (part: string) =>
    part.endsWith("%") ? (Number.parseFloat(part) / 100) * 255 : Number.parseFloat(part);
  const r = parseChannel(parts[0]);
  const g = parseChannel(parts[1]);
  const b = parseChannel(parts[2]);
  const a = parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);
  if (![r, g, b, a].every(Number.isFinite)) return null;
  return {
    a: clamp(a, 0, 1),
    b: clamp(b, 0, 255),
    g: clamp(g, 0, 255),
    r: clamp(r, 0, 255),
  };
}

function parseCssRgba(value: string | null | undefined): CocoRgba | null {
  const direct = parseCssRgbaPrimitive(value);
  if (direct) return direct;
  if (typeof document === "undefined") return null;

  const probe = document.createElement("span");
  probe.style.color = String(value ?? "");
  probe.style.position = "fixed";
  probe.style.pointerEvents = "none";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const resolved = window.getComputedStyle(probe).color;
  probe.remove();
  return parseCssRgbaPrimitive(resolved);
}

function relativeLuminance(color: CocoRgba) {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

function contrastRatio(a: number, b: number) {
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

function scoreContrast(ratio: number | null) {
  if (!Number.isFinite(ratio ?? NaN)) return 58;
  const safeRatio = Number(ratio);
  if (safeRatio >= 7) return 100;
  if (safeRatio >= 4.5) return 82 + ((safeRatio - 4.5) / 2.5) * 18;
  if (safeRatio >= 3) return 56 + ((safeRatio - 3) / 1.5) * 26;
  return clamp((safeRatio / 3) * 56, 0, 56);
}

function getTextShadowRead(style: CSSStyleDeclaration) {
  const raw = style.textShadow || "";
  if (!raw || raw === "none") {
    return { layerCount: 0, maxBlur: 0, strength: 0 };
  }
  const values = raw.match(/-?\d*\.?\d+px/g)?.map((value) => Math.abs(Number.parseFloat(value))) ?? [];
  const layerCount = Math.max(1, raw.split("),").length);
  const maxBlur = values.length ? Math.max(...values) : 0;
  return {
    layerCount,
    maxBlur,
    strength: clamp(maxBlur * 7 + layerCount * 8, 0, 100),
  };
}

function getTextColor(style: CSSStyleDeclaration) {
  const fill = style.getPropertyValue("-webkit-text-fill-color");
  const fillColor = parseCssRgba(fill);
  if (fillColor && fillColor.a > 0.05) return fill;
  return style.color || fill || null;
}

function parseCssLineHeight(style: CSSStyleDeclaration, fontSize: number) {
  const raw = String(style.lineHeight || "").trim();
  if (!raw || raw === "normal") return 1.12;
  const numeric = Number.parseFloat(raw);
  if (!Number.isFinite(numeric)) return 1.12;
  if (raw.endsWith("px")) return fontSize > 0 ? numeric / fontSize : 1.12;
  return numeric;
}

function parseCssLetterSpacing(style: CSSStyleDeclaration, fontSize: number) {
  const raw = String(style.letterSpacing || "").trim();
  if (!raw || raw === "normal") return 0;
  const numeric = Number.parseFloat(raw);
  if (!Number.isFinite(numeric)) return 0;
  if (raw.endsWith("em")) return numeric * fontSize;
  return numeric;
}

function parseCssRotation(style: CSSStyleDeclaration) {
  const transform = style.transform || "";
  if (!transform || transform === "none") return 0;
  try {
    const matrix = new DOMMatrixReadOnly(transform);
    return Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
  } catch {
    return 0;
  }
}

function measureCocoTextLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  letterSpacing: number,
  fontSize: number
) {
  const chars = Array.from(line || " ");
  let width = 0;
  let weightedCenter = 0;
  let weightTotal = 0;

  chars.forEach((char, index) => {
    const metrics = ctx.measureText(char || " ");
    const advance = Math.max(0, metrics.width || fontSize * 0.48);
    const glyph = char.trim();
    const glyphWeight =
      /[MW@#%&]/.test(glyph)
        ? 1.22
        : /[ilI1|.,'`]/.test(glyph)
          ? 0.64
          : /[A-Z]/.test(glyph)
            ? 1.08
            : glyph
              ? 1
              : 0.18;
    const center = width + advance / 2;
    weightedCenter += center * advance * glyphWeight;
    weightTotal += advance * glyphWeight;
    width += advance + (index < chars.length - 1 ? letterSpacing : 0);
  });

  return {
    opticalRatio: width > 0 && weightTotal > 0 ? weightedCenter / weightTotal / width : 0.5,
    width: Math.max(1, width),
  };
}

function buildCocoTextVisualRead({
  fontFamily,
  fontSize,
  fontStyle,
  fontWeight,
  letterSpacing,
  lineHeight,
  rect,
  text,
  textAlign,
}: {
  fontFamily: string;
  fontSize: number;
  fontStyle: string;
  fontWeight: number | string;
  letterSpacing: number;
  lineHeight: number;
  rect: Rect;
  text: string;
  textAlign: string;
}): { opticalCenter: { x: number; y: number }; visualRect: Rect } {
  cocoMeasureCanvas ??= document.createElement("canvas");
  const ctx = cocoMeasureCanvas.getContext("2d");
  const lines = String(text || " ")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => line.length > 0);
  const safeLines = lines.length ? lines : [" "];
  const safeFontSize = Math.max(1, fontSize || rect.height);
  const safeLineHeight = Math.max(0.1, lineHeight || 1.12);
  let measuredWidth = Math.max(1, rect.width);
  let opticalRatio = 0.5;

  if (ctx) {
    ctx.font = `${fontStyle || "normal"} ${fontWeight || 700} ${safeFontSize}px ${fontFamily}`;
    const measuredLines = safeLines.map((line) =>
      measureCocoTextLine(ctx, line, letterSpacing, safeFontSize)
    );
    const strongestLine = measuredLines.reduce((best, line) =>
      line.width > best.width ? line : best
    );
    measuredWidth = Math.max(1, strongestLine.width);
    opticalRatio = strongestLine.opticalRatio;
  }

  const visualWidth = Math.max(1, Math.min(rect.width, measuredWidth));
  const visualHeight = Math.max(
    1,
    Math.min(rect.height, safeLines.length * safeFontSize * safeLineHeight)
  );
  const normalizedAlign = textAlign === "right" ? "right" : textAlign === "center" ? "center" : "left";
  const visualLeft =
    normalizedAlign === "right"
      ? rect.right - visualWidth
      : normalizedAlign === "center"
        ? rect.left + (rect.width - visualWidth) / 2
        : rect.left;
  const visualTop = rect.top + Math.max(0, (rect.height - visualHeight) / 2);
  const visualRect = {
    bottom: visualTop + visualHeight,
    height: visualHeight,
    left: visualLeft,
    right: visualLeft + visualWidth,
    top: visualTop,
    width: visualWidth,
  };
  const opticalBias = clamp((opticalRatio - 0.5) * visualWidth, -safeFontSize * 0.16, safeFontSize * 0.16);

  return {
    opticalCenter: {
      x: visualRect.left + visualRect.width / 2 + opticalBias,
      y: visualRect.top + visualRect.height / 2,
    },
    visualRect,
  };
}

function readBackdropForText(node: HTMLElement, rect: Rect, artboardRect: Rect | null): CocoBackdropRead {
  if (typeof document === "undefined") {
    return { backgroundComplexity: null, backgroundLuminance: null };
  }

  const sampleXs = [0.22, 0.5, 0.78];
  const sampleYs = [0.28, 0.5, 0.72];
  const luminances: number[] = [];
  const colorKeys = new Set<string>();
  let imageHits = 0;
  let gradientHits = 0;
  let filterHits = 0;

  for (const xFactor of sampleXs) {
    for (const yFactor of sampleYs) {
      const x = rect.left + rect.width * xFactor;
      const y = rect.top + rect.height * yFactor;
      if (
        artboardRect &&
        (x < artboardRect.left || x > artboardRect.right || y < artboardRect.top || y > artboardRect.bottom)
      ) {
        continue;
      }

      const stack = document.elementsFromPoint(x, y).filter((element) => element instanceof HTMLElement);
      for (const element of stack as HTMLElement[]) {
        if (element === node || node.contains(element)) continue;
        const style = window.getComputedStyle(element);
        const tag = element.tagName.toLowerCase();
        const hasImageElement = tag === "img" || tag === "canvas" || tag === "video" || tag === "picture";
        const backgroundImage = style.backgroundImage || "";
        const hasBackgroundImage = backgroundImage && backgroundImage !== "none";
        const color = parseCssRgba(style.backgroundColor);

        if (hasImageElement || hasBackgroundImage) {
          imageHits += hasImageElement || (hasBackgroundImage && !backgroundImage.includes("gradient")) ? 1 : 0;
          gradientHits += backgroundImage.includes("gradient") ? 1 : 0;
        }
        if ((style.filter && style.filter !== "none") || (style.backdropFilter && style.backdropFilter !== "none")) {
          filterHits += 1;
        }
        if (color && color.a > 0.05) {
          const luminance = relativeLuminance(color);
          luminances.push(luminance);
          colorKeys.add(`${Math.round(color.r / 16)}:${Math.round(color.g / 16)}:${Math.round(color.b / 16)}`);
          break;
        }
        if (hasImageElement || hasBackgroundImage) break;
      }
    }
  }

  const backgroundLuminance = luminances.length
    ? luminances.reduce((sum, value) => sum + value, 0) / luminances.length
    : null;
  const luminanceRange = luminances.length ? Math.max(...luminances) - Math.min(...luminances) : 0.32;
  const visualHits = imageHits + gradientHits;
  const backgroundComplexity = clamp(
    visualHits * 8 + gradientHits * 8 + filterHits * 4 + luminanceRange * 70 + Math.max(0, colorKeys.size - 1) * 8,
    0,
    100
  );

  return {
    backgroundComplexity,
    backgroundLuminance,
  };
}

function scoreMetric(
  id: CocoReadabilityMetricId,
  score: number,
  observation: string,
  recommendation: string
) {
  return {
    id,
    label: COCO_READABILITY_METRIC_LABELS[id],
    observation,
    recommendation,
    score: Math.round(clamp(score, 0, 100)),
  };
}

function buildCocoTextReadability({
  artboardRect,
  fontSize,
  node,
  rect,
  role,
  shadowRead,
  strokeWidth,
  textColor,
}: {
  artboardRect: Rect | null;
  fontSize: number;
  node: HTMLElement;
  rect: Rect;
  role: CocoTextRole;
  shadowRead: ReturnType<typeof getTextShadowRead>;
  strokeWidth: number;
  textColor: string | null;
}): CocoTextReadability {
  const textRgba = parseCssRgba(textColor) ?? { a: 1, b: 255, g: 255, r: 255 };
  const textLuminance = relativeLuminance(textRgba);
  const backdrop = readBackdropForText(node, rect, artboardRect);
  const backgroundLuminance = backdrop.backgroundLuminance ?? 0.08;
  const ratio = contrastRatio(textLuminance, backgroundLuminance);
  const contrastScore = scoreContrast(ratio);
  const minFont = COCO_READABILITY_MIN_FONT[role] ?? 12;
  const effectiveFontSize = Math.max(fontSize, Math.min(rect.height, rect.width * 0.18));
  const textSizeScore = clamp((effectiveFontSize / minFont) * 100, 0, 100);
  const backgroundComplexity = backdrop.backgroundComplexity ?? 54;
  const backgroundScore = clamp(100 - backgroundComplexity + contrastScore * 0.14 + textSizeScore * 0.08, 0, 100);
  const needsSeparation = contrastScore < 84 || backgroundScore < 72;
  const strokeScore = needsSeparation
    ? clamp(contrastScore * 0.35 + strokeWidth * 36 + shadowRead.strength * 0.42, 0, 100)
    : 94;
  const shadowScore = needsSeparation
    ? clamp(contrastScore * 0.32 + shadowRead.strength * 0.62 + strokeWidth * 14, 0, 100)
    : 94;
  const glowLimit = Math.max(4, effectiveFontSize * (role === "headline" ? 0.32 : 0.22));
  const glowPenalty =
    Math.max(0, shadowRead.maxBlur - glowLimit) * 4.2 +
    Math.max(0, shadowRead.layerCount - 2) * 7 +
    (strokeWidth > effectiveFontSize * 0.12 ? 10 : 0);
  const glowScore = clamp(100 - glowPenalty, 0, 100);
  const edgeDistance = artboardRect
    ? Math.min(
        rect.left - artboardRect.left,
        artboardRect.right - rect.right,
        rect.top - artboardRect.top,
        artboardRect.bottom - rect.bottom
      )
    : 36;
  const minEdge = artboardRect ? Math.max(12, Math.min(artboardRect.width, artboardRect.height) * 0.035) : 18;
  const edgeScore = clamp((edgeDistance / minEdge) * 100, 0, 100);

  const metrics = [
    scoreMetric(
      "contrast",
      contrastScore,
      "This text does not have enough value separation from the area behind it.",
      "Increase value contrast, shift the text color, or add a controlled separation layer."
    ),
    scoreMetric(
      "text_size",
      textSizeScore,
      "This text is smaller than its role needs for fast scanning.",
      "Increase the type size before adding more effects."
    ),
    scoreMetric(
      "stroke_effectiveness",
      strokeScore,
      "This text needs a cleaner edge against the artwork.",
      "Use a subtle stroke or edge treatment so the letters separate without looking heavy."
    ),
    scoreMetric(
      "shadow_effectiveness",
      shadowScore,
      "This text needs stronger depth separation from the background.",
      "Add or strengthen a tight shadow so the information lifts off the image."
    ),
    scoreMetric(
      "glow_interference",
      glowScore,
      "This text effect is spreading wider than the letterforms can support.",
      "Reduce the glow blur or keep the glow behind larger headline elements only."
    ),
    scoreMetric(
      "background_complexity",
      backgroundScore,
      "The background texture behind this text is competing with the letterforms.",
      "Move the text to a calmer pocket or add a restrained plate/shadow behind it."
    ),
    scoreMetric(
      "edge_distance",
      edgeScore,
      "This text is too close to the canvas edge for a premium finish.",
      "Pull it inward so the margin feels intentional."
    ),
  ];

  const weakestMetric = metrics.reduce((weakest, metric) =>
    metric.score < weakest.score ? metric : weakest
  );
  const weightByMetric: Record<CocoReadabilityMetricId, number> = {
    background_complexity: 0.18,
    contrast: 0.24,
    edge_distance: 0.11,
    glow_interference: 0.1,
    shadow_effectiveness: 0.1,
    stroke_effectiveness: 0.11,
    text_size: 0.16,
  };
  const overallScore = Math.round(
    metrics.reduce((sum, metric) => sum + metric.score * weightByMetric[metric.id], 0)
  );

  return {
    backgroundComplexity: Math.round(backgroundComplexity),
    backgroundLuminance,
    contrastRatio: Number(ratio.toFixed(2)),
    metrics,
    overallScore,
    textLuminance,
    weakestMetric,
  };
}

function getTextTargets(artboardRect: Rect | null): CocoTextTarget[] {
  if (typeof document === "undefined") return [];
  const artboard = document.querySelector<HTMLElement>("#artboard");
  if (!artboard) return [];

  const seen = new Set<HTMLElement>();
  const nodes = Array.from(
    artboard.querySelectorAll<HTMLElement>("[data-coco-text-role], [data-node]")
  );
  const targets: CocoTextTarget[] = [];

  for (const node of nodes) {
    if (seen.has(node)) continue;
    seen.add(node);

    const role = normalizeTextRole(
      node.getAttribute("data-coco-text-role") || node.getAttribute("data-node")
    );
    if (!role) continue;

    const text = normalizeCocoText(String(node.textContent || ""));
    if (!text) continue;

    const rect = toRect(node.getBoundingClientRect());
    if (!isVisibleTextNode(node, artboardRect)) continue;
    const visibleRect = getVisibleArtboardRect(rect, artboardRect);
    const computedStyle = window.getComputedStyle(node);
    const fontSize = parseCssNumber(computedStyle.fontSize, visibleRect.height);
    const fontFamily = computedStyle.fontFamily || null;
    const fontWeight = computedStyle.fontWeight || null;
    const fontStyle = computedStyle.fontStyle || "normal";
    const letterSpacing = parseCssLetterSpacing(computedStyle, fontSize);
    const lineHeight = parseCssLineHeight(computedStyle, fontSize);
    const textAlign = computedStyle.textAlign || null;
    const rotation = parseCssRotation(computedStyle);
    const visualRead = buildCocoTextVisualRead({
      fontFamily: fontFamily || "LEMONMILK-Regular, sans-serif",
      fontSize,
      fontStyle,
      fontWeight: fontWeight || 700,
      letterSpacing,
      lineHeight,
      rect: visibleRect,
      text,
      textAlign: textAlign || "left",
    });
    const textColor = getTextColor(computedStyle);
    const textShadow = computedStyle.textShadow && computedStyle.textShadow !== "none" ? computedStyle.textShadow : null;
    const strokeWidth = parseCssNumber(computedStyle.getPropertyValue("-webkit-text-stroke-width"), 0);
    const shadowRead = getTextShadowRead(computedStyle);
    const readability = buildCocoTextReadability({
      artboardRect,
      fontSize,
      node,
      rect: visibleRect,
      role,
      shadowRead,
      strokeWidth,
      textColor,
    });

    targets.push({
      ...visibleRect,
      fontFamily,
      fontSize,
      fontWeight,
      letterSpacing,
      lineHeight,
      opticalCenter: visualRead.opticalCenter,
      priority: COCO_TEXT_ROLE_PRIORITY[role],
      readability,
      role,
      rotation,
      strokeWidth,
      text,
      textAlign,
      textColor,
      textShadow,
      visualRect: visualRead.visualRect,
    });
  }

  return targets.sort((a, b) => a.priority - b.priority || a.top - b.top || a.left - b.left);
}

function selectTextTarget({
  selectedPanel,
  stepTarget,
  textTargets,
}: {
  selectedPanel?: string | null;
  stepTarget: CocoTarget;
  textTargets: CocoTextTarget[];
}) {
  const selectedRole = getSelectedTextRole(selectedPanel);
  if (selectedRole) {
    const selectedTarget = textTargets.find((target) => target.role === selectedRole);
    if (selectedTarget) return selectedTarget;
  }

  const targetRole = normalizeTextRole(stepTarget);
  if (targetRole) {
    if (targetRole === "subtag") {
      return (
        textTargets.find((target) => target.role === "subtag") ||
        textTargets.find((target) => target.role === "headline2") ||
        textTargets.find((target) => target.role === "presenter") ||
        null
      );
    }
    if (targetRole === "details") {
      return (
        textTargets.find((target) => target.role === "details") ||
        textTargets.find((target) => target.role === "details2") ||
        textTargets.find((target) => target.role === "leftRail") ||
        textTargets.find((target) => target.role === "rightRail") ||
        null
      );
    }

    const target = textTargets.find((item) => item.role === targetRole);
    if (target) return target;
  }

  return textTargets[0] ?? null;
}

function getCocoPlacement({
  artboardRect,
  isMobile,
  reviewMode,
  stepId,
  targetZone,
}: {
  artboardRect: Rect | null;
  isMobile?: boolean;
  reviewMode: boolean;
  stepId: string;
  targetZone: CocoTargetZone | null;
}): CocoPlacement {
  if (typeof window === "undefined") {
    return { left: 24, top: 24, width: 340 };
  }

  const margin = isMobile ? 16 : 24;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(viewportWidth - margin * 2, COCO_STAGE_MIN_WIDTH);

  if (isMobile || !artboardRect) {
    return {
      left: margin,
      top: viewportHeight - COCO_STAGE_HEIGHT - (isMobile ? 90 : 28),
      width,
    };
  }

  if (reviewMode) {
    const rightDockLeft = artboardRect.right + 24;
    const canDockRight = rightDockLeft + width <= viewportWidth - margin;
    const leftDockLeft = artboardRect.left - width - 24;
    const canDockLeft = leftDockLeft >= margin;
    const belowDockTop = artboardRect.bottom + 18;
    const canDockBelow = belowDockTop + COCO_STAGE_HEIGHT <= viewportHeight - margin;

    if (canDockRight || canDockLeft) {
      const left = canDockRight ? rightDockLeft : leftDockLeft;

      return {
        left,
        top: clamp(
          artboardRect.top + artboardRect.height - COCO_STAGE_HEIGHT,
          margin,
          viewportHeight - COCO_STAGE_HEIGHT - margin
        ),
        width,
      };
    }

    if (canDockBelow) {
      return {
        left: clamp(artboardRect.left + artboardRect.width - width, margin, viewportWidth - width - margin),
        top: belowDockTop,
        width,
      };
    }

    return {
      left: margin,
      top: viewportHeight - COCO_STAGE_HEIGHT - margin,
      width,
    };
  }

  if (!targetZone) {
    return {
      left: clamp(artboardRect.left + 18, margin, viewportWidth - width - margin),
      top: clamp(artboardRect.top + 18, margin, viewportHeight - COCO_STAGE_HEIGHT - margin),
      width,
    };
  }

  if (stepId === "grade") {
    const gap = 12;
    const centeredLeft = targetZone.left + targetZone.width / 2 - width / 2;
    const belowTop = targetZone.bottom + gap;
    const aboveTop = targetZone.top - COCO_STAGE_HEIGHT - gap;
    const canPlaceBelow = belowTop + COCO_STAGE_HEIGHT <= viewportHeight - margin;

    return {
      left: clamp(centeredLeft, margin, viewportWidth - width - margin),
      top: clamp(
        canPlaceBelow ? belowTop : aboveTop,
        margin,
        viewportHeight - COCO_STAGE_HEIGHT - margin
      ),
      width,
    };
  }

  if (stepId === "layout" || stepId === "palette") {
    const canPlaceLeft = targetZone.left - width - 12 >= margin;
    const canPlaceRight = targetZone.right + 12 + width <= viewportWidth - margin;
    const left = canPlaceLeft
      ? targetZone.left - width - 12
      : canPlaceRight
        ? targetZone.right + 12
        : targetZone.left + targetZone.width / 2 - width / 2;

    return {
      left: clamp(left, margin, viewportWidth - width - margin),
      top: clamp(
        targetZone.top + targetZone.height / 2 - COCO_STAGE_HEIGHT / 2,
        margin,
        viewportHeight - COCO_STAGE_HEIGHT - margin
      ),
      width,
    };
  }

  const artPad = 8;
  const gap = 8;
  const minLeft = Math.max(margin, artboardRect.left + artPad);
  const maxLeft = Math.max(
    minLeft,
    Math.min(viewportWidth - width - margin, artboardRect.right - width - artPad)
  );
  const minTop = Math.max(margin, artboardRect.top + artPad);
  const maxTop = Math.max(
    minTop,
    Math.min(viewportHeight - COCO_STAGE_HEIGHT - margin, artboardRect.bottom - COCO_STAGE_HEIGHT - artPad)
  );
  const targetCenterX = targetZone.left + targetZone.width / 2;
  const targetCenterY = targetZone.top + targetZone.height / 2;
  const nearTop = clamp(
    targetCenterY - COCO_STAGE_HEIGHT / 2,
    minTop,
    maxTop
  );
  const nearLeft = clamp(
    targetZone.left - width + 20,
    minLeft,
    maxLeft
  );
  const nearRight = clamp(
    targetZone.right - 18,
    minLeft,
    maxLeft
  );
  const centeredLeft = clamp(
    targetCenterX - width / 2,
    minLeft,
    maxLeft
  );
  const targetIsLeftSide = targetCenterX < artboardRect.left + artboardRect.width * 0.5;
  const candidates: Array<CocoPlacement & { key: string }> = [
    {
      key: "follow-left",
      left: nearLeft,
      top: nearTop,
      width,
    },
    {
      key: "follow-right",
      left: nearRight,
      top: nearTop,
      width,
    },
    {
      key: "above",
      left: centeredLeft,
      top: clamp(targetZone.top - COCO_STAGE_HEIGHT - gap, minTop, maxTop),
      width,
    },
    {
      key: "below",
      left: centeredLeft,
      top: clamp(targetZone.bottom + gap, minTop, maxTop),
      width,
    },
  ];
  const preference =
    stepId === "headline" || stepId === "headline2" || stepId === "subtag"
      ? targetIsLeftSide
        ? ["follow-right", "below", "above", "follow-left"]
        : ["follow-left", "below", "above", "follow-right"]
      : targetIsLeftSide
        ? ["follow-right", "above", "below", "follow-left"]
        : ["follow-left", "above", "below", "follow-right"];
  const fitsCanvas = (placement: CocoPlacement) => {
    const rect = placementToRect(placement);
    return (
      placement.left >= minLeft &&
      placement.left <= maxLeft &&
      placement.top >= minTop &&
      placement.top <= maxTop &&
      !rectsOverlap(rect, targetZone, 2)
    );
  };
  const preferredPlacement = preference
    .map((key) => candidates.find((candidate) => candidate.key === key))
    .filter(Boolean)
    .find((candidate) => candidate && fitsCanvas(candidate));
  if (preferredPlacement) {
    return {
      left: preferredPlacement.left,
      top: preferredPlacement.top,
      width,
    };
  }

  const cornerCandidates: CocoPlacement[] = [
    { left: minLeft, top: minTop, width },
    { left: maxLeft, top: minTop, width },
    { left: minLeft, top: maxTop, width },
    { left: maxLeft, top: maxTop, width },
  ];
  const leastIntrusive = cornerCandidates
    .filter((placement) => !rectsOverlap(placementToRect(placement), targetZone, 2))
    .sort((a, b) => {
      const aDistance = Math.hypot(a.left + a.width / 2 - targetCenterX, a.top + COCO_STAGE_HEIGHT / 2 - targetCenterY);
      const bDistance = Math.hypot(b.left + b.width / 2 - targetCenterX, b.top + COCO_STAGE_HEIGHT / 2 - targetCenterY);
      return aDistance - bDistance;
    })[0];

  return {
    left: clamp(leastIntrusive?.left ?? centeredLeft, margin, viewportWidth - width - margin),
    top: clamp(leastIntrusive?.top ?? nearTop, margin, viewportHeight - COCO_STAGE_HEIGHT - margin),
    width,
  };
}

function resolveStepIndex({
  manualStepIndex,
  mobileControlsTab,
  selectedPanel,
  totalSteps,
  uiMode,
}: {
  manualStepIndex: number;
  mobileControlsTab?: string | null;
  selectedPanel?: string | null;
  totalSteps: number;
  uiMode?: string | null;
}) {
  const selected = `${selectedPanel ?? ""} ${mobileControlsTab ?? ""}`.toLowerCase();
  const selectedRole = normalizeTextRole(PANEL_TO_TEXT_ROLE[String(selectedPanel ?? "")] ?? selectedPanel);
  let nextIndex = manualStepIndex;

  if (selectedRole === "headline") nextIndex = 0;
  else if (selectedRole === "headline2" || selectedRole === "subtag") nextIndex = 1;
  else if (
    selectedRole === "details" ||
    selectedRole === "details2" ||
    selectedRole === "presenter" ||
    selectedRole === "leftRail" ||
    selectedRole === "rightRail"
  ) nextIndex = 2;
  else if (selectedRole === "venue") nextIndex = 3;
  else if (selectedRole === "date" || selectedRole === "price") nextIndex = 4;
  else if (selected.includes("headline")) nextIndex = 0;
  else if (selected.includes("head2") || selected.includes("subtag")) nextIndex = 1;
  else if (selected.includes("detail") || selected.includes("presenter") || selected.includes("rail")) nextIndex = 2;
  else if (selected.includes("venue")) nextIndex = 3;
  else if (selected.includes("date") || selected.includes("price")) nextIndex = 4;
  if (`${uiMode ?? ""}`.toLowerCase().includes("finish")) {
    nextIndex = Math.max(nextIndex, totalSteps - 1);
  }

  return Math.min(nextIndex, Math.max(totalSteps - 1, 0));
}

function CocoAvatar({
  className = "",
  compact = false,
  pulse = true,
}: {
  className?: string;
  compact?: boolean;
  pulse?: boolean;
}) {
  const sizeClass = compact ? "h-9 w-9" : "h-[52px] w-[52px]";

  return (
    <span
      aria-hidden="true"
      className={`relative grid ${sizeClass} shrink-0 place-items-center rounded-full ${className}`}
      style={{ animation: compact ? "cocoOrbDock 5.8s ease-in-out infinite" : "cocoOrbFloat 6.4s ease-in-out infinite" }}
    >
      {pulse ? (
        <>
          <span
            className="absolute inset-[-8px] rounded-full opacity-45 blur-[1px]"
            style={{
              animation: "cocoGradientPulse 2.85s ease-out infinite",
              background:
                "conic-gradient(from 135deg, rgba(34,211,238,.82), rgba(217,70,239,.58), rgba(251,146,60,.58), rgba(34,211,238,.82))",
            }}
          />
          <span
            className="absolute inset-[-5px] rounded-full opacity-45 blur-xl"
            style={{
              animation: "cocoAuraBreathe 3.4s ease-in-out infinite",
              background:
                "radial-gradient(circle at 30% 25%, rgba(34,211,238,.52), transparent 48%), radial-gradient(circle at 72% 76%, rgba(236,72,153,.48), transparent 42%), radial-gradient(circle at 55% 12%, rgba(251,191,36,.32), transparent 44%)",
            }}
          />
        </>
      ) : null}
      <img
        alt=""
        className="relative h-full w-full object-contain"
        draggable={false}
        src={COCO_AVATAR_SRC}
      />
      <span
        className="pointer-events-none absolute inset-[13%] rounded-full opacity-60 mix-blend-screen"
        style={{
          animation: "cocoInnerGlow 4.8s ease-in-out infinite",
          background:
            "radial-gradient(circle at 50% 52%, rgba(255,255,255,0.18) 0%, rgba(103,232,249,0.12) 28%, rgba(217,70,239,0.10) 46%, transparent 72%)",
          filter: "blur(1.6px)",
        }}
      />
    </span>
  );
}

function CocoMotionStyle() {
  return (
    <style>
      {`
        @keyframes cocoGradientPulse {
          0% {
            opacity: 0.34;
            transform: scale(0.72) rotate(0deg);
          }
          58% {
            opacity: 0.1;
          }
          100% {
            opacity: 0;
            transform: scale(1.28) rotate(70deg);
          }
        }

        @keyframes cocoAuraBreathe {
          0%, 100% {
            opacity: 0.24;
            transform: scale(0.98);
          }
          50% {
            opacity: 0.42;
            transform: scale(1.04);
          }
        }

        @keyframes cocoInnerGlow {
          0%, 100% {
            opacity: 0.42;
            transform: scale(0.94);
          }
          50% {
            opacity: 0.72;
            transform: scale(1.06);
          }
        }

        @keyframes cocoOrbFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(-1deg) scale(1);
          }
          45% {
            transform: translate3d(0, -4px, 0) rotate(3deg) scale(1.035);
          }
          72% {
            transform: translate3d(1px, 1px, 0) rotate(1deg) scale(0.992);
          }
        }

        @keyframes cocoOrbDock {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(0, -2px, 0) scale(1.045);
          }
        }

        @keyframes cocoTargetBreath {
          0%, 100% {
            opacity: 0.34;
          }
          50% {
            opacity: 0.62;
          }
        }

        @keyframes cocoTargetSweep {
          0% {
            transform: translate3d(-140%, 0, 0) skewX(-16deg);
          }
          100% {
            transform: translate3d(260%, 0, 0) skewX(-16deg);
          }
        }

        @keyframes cocoScanMeter {
          0% {
            opacity: 0.22;
            transform: translate3d(-72%, 0, 0) scaleX(0.62);
          }
          50% {
            opacity: 0.9;
            transform: translate3d(56%, 0, 0) scaleX(1);
          }
          100% {
            opacity: 0.22;
            transform: translate3d(190%, 0, 0) scaleX(0.7);
          }
        }

        #coco-director-root,
        #coco-director-root::before,
        #coco-director-root::after {
          background: transparent !important;
          border: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          outline: 0 !important;
        }

        #coco-director-root button,
        #coco-director-root button::before,
        #coco-director-root button::after {
          -webkit-appearance: none !important;
          appearance: none !important;
          background: transparent !important;
          border: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          outline: 0 !important;
        }

        #coco-director-root button[data-coco-format-choice] {
          align-items: center !important;
          background: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.16) !important;
          border-radius: 999px !important;
          color: rgba(255, 255, 255, 0.78) !important;
          display: inline-flex !important;
          font-size: 10px !important;
          font-weight: 400 !important;
          height: 18px !important;
          justify-content: center !important;
          line-height: 18px !important;
          min-width: 50px !important;
          padding: 0 8px !important;
          transition: border-color 180ms ease, color 180ms ease, background 180ms ease !important;
          white-space: nowrap !important;
        }

        #coco-director-root button[data-coco-format-choice]:hover,
        #coco-director-root button[data-coco-format-active="true"] {
          background: rgba(103, 232, 249, 0.13) !important;
          border-color: rgba(103, 232, 249, 0.52) !important;
          color: rgba(255, 255, 255, 0.94) !important;
        }
      `}
    </style>
  );
}

export default function CocoDirector({
  active,
  activeGradeSignature,
  activeLayoutId,
  activePaletteSignature,
  activeSubjectSignature,
  canvasLayoutSignature,
  format,
  formatTransitioning,
  hasLayoutOptions,
  hasPaletteOptions,
  hasSubject,
  headline,
  isMobile,
  mobileControlsTab,
  onCaptureCleanLayout,
  onChooseFormat,
  onOpenCinematicText,
  onOpenExport,
  onOpenLayoutOptions,
  onOpenPaletteOptions,
  onOpenPolish,
  onRunAction,
  onOpenSubjectOptions,
  onOpenTextField,
  onRestoreCleanLayout,
  selectedPanel,
  templateId,
  templateLabel,
  nightlifeStyle,
  nightlifeStyleDecision,
  uiMode,
}: CocoDirectorProps) {
  const [mounted, setMounted] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [introActive, setIntroActive] = React.useState(true);
  const [introStepIndex, setIntroStepIndex] = React.useState(0);
  const [staticLabelReady, setStaticLabelReady] = React.useState(false);
  const [instructionReady, setInstructionReady] = React.useState(false);
  const [tourComplete, setTourComplete] = React.useState(false);
  const [formatPromptComplete, setFormatPromptComplete] = React.useState(false);
  const [pendingFormatChoice, setPendingFormatChoice] = React.useState<"square" | "story" | null>(
    null
  );
  const [fieldProgress, setFieldProgress] = React.useState<CocoFieldProgress>(() =>
    emptyFieldProgress()
  );
  const [cinematicPromptStatus, setCinematicPromptStatus] = React.useState<
    "idle" | "offer" | "instructions"
  >("idle");
  const [cinematicPromptSeen, setCinematicPromptSeen] = React.useState(false);
  const [directorRendered, setDirectorRendered] = React.useState(false);
  const [styleReadSeen, setStyleReadSeen] = React.useState(false);
  const [manualStepIndex, setManualStepIndex] = React.useState(0);
  const [artboardRect, setArtboardRect] = React.useState<Rect | null>(null);
  const [layoutOptionsRect, setLayoutOptionsRect] = React.useState<Rect | null>(null);
  const [paletteOptionsRect, setPaletteOptionsRect] = React.useState<Rect | null>(null);
  const [subjectTargetRect, setSubjectTargetRect] = React.useState<Rect | null>(null);
  const [layoutBaselineId, setLayoutBaselineId] = React.useState<string | null>(null);
  const [layoutKeepReady, setLayoutKeepReady] = React.useState(false);
  const [layoutPreviewSeen, setLayoutPreviewSeen] = React.useState(false);
  const [layoutPromptComplete, setLayoutPromptComplete] = React.useState(false);
  const [paletteBaselineSignature, setPaletteBaselineSignature] = React.useState<string | null>(null);
  const [paletteKeepReady, setPaletteKeepReady] = React.useState(false);
  const [palettePreviewSeen, setPalettePreviewSeen] = React.useState(false);
  const [palettePromptComplete, setPalettePromptComplete] = React.useState(false);
  const [subjectBaselineSignature, setSubjectBaselineSignature] = React.useState<string | null>(null);
  const [subjectIssue, setSubjectIssue] = React.useState<CocoSubjectIssueResult>(() =>
    emptySubjectIssue()
  );
  const [acceptedSubjectIssueKey, setAcceptedSubjectIssueKey] = React.useState<string | null>(null);
  const [subjectIssueSeen, setSubjectIssueSeen] = React.useState(false);
  const [subjectKeepReady, setSubjectKeepReady] = React.useState(false);
  const [subjectPreviewSeen, setSubjectPreviewSeen] = React.useState(false);
  const [subjectPromptComplete, setSubjectPromptComplete] = React.useState(false);
  const [postScanChange, setPostScanChange] = React.useState<CocoPostScanChange | null>(null);
  const [postScanBaselineSignature, setPostScanBaselineSignature] = React.useState<string | null>(
    null
  );
  const [polishScanIssue, setPolishScanIssue] = React.useState<CocoPolishScanIssue | null>(null);
  const [polishScanStatus, setPolishScanStatus] = React.useState<CocoPolishScanStatus>("idle");
  const [gradeBaselineSignature, setGradeBaselineSignature] = React.useState<string | null>(null);
  const [gradePresetPreviewed, setGradePresetPreviewed] = React.useState(false);
  const [gradePresetChosen, setGradePresetChosen] = React.useState(false);
  const [gradePanelRect, setGradePanelRect] = React.useState<Rect | null>(null);
  const [gradePresetRect, setGradePresetRect] = React.useState<Rect | null>(null);
  const [textTargets, setTextTargets] = React.useState<CocoTextTarget[]>([]);
  const [allowedOverlapPairs, setAllowedOverlapPairs] = React.useState<Set<CocoOverlapPairKey>>(
    () => new Set()
  );
  const staticLabelTimerRef = React.useRef<number | null>(null);
  const instructionTimerRef = React.useRef<number | null>(null);
  const keepOptionTimerRef = React.useRef<number | null>(null);
  const polishFlowTimerRef = React.useRef<number | null>(null);
  const postScanResumeTimerRef = React.useRef<number | null>(null);
  const postScanWatchTimerRef = React.useRef<number | null>(null);
  const cocoSelectedPanelRef = React.useRef<string | null>(null);
  const cocoMoveTargetRef = React.useRef<MoveTarget>(null);
  const cocoOpenedTextRoleRef = React.useRef<CocoTextRole | null>(null);
  const cocoSubjectPanelOpenRef = React.useRef(false);
  const latestActiveLayoutIdRef = React.useRef<string | null>(activeLayoutId ?? null);
  const latestActivePaletteSignatureRef = React.useRef<string | null>(
    activePaletteSignature ?? null
  );
  const latestActiveGradeSignatureRef = React.useRef<string | null>(activeGradeSignature ?? null);
  const latestActiveSubjectSignatureRef = React.useRef<string | null>(
    activeSubjectSignature ?? null
  );
  const latestFormatRef = React.useRef<"square" | "story">(format);
  const latestHasLayoutOptionsRef = React.useRef(Boolean(hasLayoutOptions));
  const latestHasPaletteOptionsRef = React.useRef(Boolean(hasPaletteOptions));
  const latestHasSubjectRef = React.useRef(Boolean(hasSubject));
  const postScanBaselineSignatureRef = React.useRef<string | null>(null);
  const postScanReturnStatusRef = React.useRef<CocoPolishScanStatus>("export");
  const polishScanStatusRef = React.useRef<CocoPolishScanStatus>("idle");
  const polishScanRunIdRef = React.useRef(0);
  const polishInactiveResetDoneRef = React.useRef(false);
  const onCaptureCleanLayoutRef = React.useRef(onCaptureCleanLayout);
  latestHasLayoutOptionsRef.current = Boolean(hasLayoutOptions);
  latestHasPaletteOptionsRef.current = Boolean(hasPaletteOptions);
  latestHasSubjectRef.current = Boolean(hasSubject);
  const directorRootRef = React.useCallback((node: HTMLDivElement | null) => {
    setDirectorRendered(Boolean(node));
  }, []);
  const clearStaticLabelTimer = React.useCallback(() => {
    if (staticLabelTimerRef.current == null) return;
    window.clearTimeout(staticLabelTimerRef.current);
    staticLabelTimerRef.current = null;
  }, []);
  const scheduleStaticLabel = React.useCallback(
    (delay: number) => {
      clearStaticLabelTimer();
      staticLabelTimerRef.current = window.setTimeout(() => {
        staticLabelTimerRef.current = null;
        setStaticLabelReady(true);
      }, delay);
    },
    [clearStaticLabelTimer]
  );
  const clearInstructionTimer = React.useCallback(() => {
    if (instructionTimerRef.current == null) return;
    window.clearTimeout(instructionTimerRef.current);
    instructionTimerRef.current = null;
  }, []);
  const scheduleInstruction = React.useCallback(
    (delay: number) => {
      clearInstructionTimer();
      instructionTimerRef.current = window.setTimeout(() => {
        instructionTimerRef.current = null;
        setInstructionReady(true);
      }, delay);
    },
    [clearInstructionTimer]
  );
  const clearKeepOptionTimer = React.useCallback(() => {
    if (keepOptionTimerRef.current == null) return;
    window.clearTimeout(keepOptionTimerRef.current);
    keepOptionTimerRef.current = null;
  }, []);
  const clearPolishFlowTimer = React.useCallback(() => {
    if (polishFlowTimerRef.current == null) return;
    window.clearTimeout(polishFlowTimerRef.current);
    polishFlowTimerRef.current = null;
  }, []);
  const clearPostScanWatchTimer = React.useCallback(() => {
    if (postScanWatchTimerRef.current == null) return;
    window.clearTimeout(postScanWatchTimerRef.current);
    postScanWatchTimerRef.current = null;
  }, []);
  const clearPostScanResumeTimer = React.useCallback(() => {
    if (postScanResumeTimerRef.current == null) return;
    window.clearTimeout(postScanResumeTimerRef.current);
    postScanResumeTimerRef.current = null;
  }, []);
  const updatePostScanBaselineSignature = React.useCallback((signature: string | null) => {
    if (postScanBaselineSignatureRef.current === signature) return;
    postScanBaselineSignatureRef.current = signature;
    setPostScanBaselineSignature((current) => (current === signature ? current : signature));
  }, []);

  const guide = React.useMemo(
    () => getCocoGuide(templateId, templateLabel),
    [templateId, templateLabel]
  );
  const tone = toneStyles[guide.tone] ?? toneStyles.general;
  const recommendedGradePreset = React.useMemo(
    () =>
      getCocoRecommendedGradePreset({
        templateId,
        templateLabel,
        tone: guide.tone,
      }),
    [guide.tone, templateId, templateLabel]
  );
  const startupIntroSeen = hasSeenStartupCocoIntro();
  const introSteps = React.useMemo(
    () => getCocoIntroSteps(startupIntroSeen),
    [startupIntroSeen]
  );
  const introStageMeasureText = startupIntroSeen
    ? "Let's begin."
    : "Now, let's make this flyer yours.";
  const formatPromptActive = !formatPromptComplete && !introActive && instructionReady;
  const pendingFormatLabel =
    pendingFormatChoice === "story" ? "Story" : pendingFormatChoice === "square" ? "Square" : null;
  const layoutPromptActive =
    Boolean(hasLayoutOptions) &&
    formatPromptComplete &&
    !layoutPromptComplete &&
    !introActive &&
    instructionReady &&
    !tourComplete;
  const palettePromptActive =
    Boolean(hasPaletteOptions) &&
    formatPromptComplete &&
    tourComplete &&
    !palettePromptComplete &&
    !introActive &&
    instructionReady;
  const subjectPromptActive =
    Boolean(hasSubject) &&
    formatPromptComplete &&
    tourComplete &&
    (!hasPaletteOptions || palettePromptComplete) &&
    !subjectPromptComplete &&
    !introActive &&
    instructionReady;
  const polishScanEligible =
    tourComplete &&
    formatPromptComplete &&
    (!hasPaletteOptions || palettePromptComplete) &&
    (!hasSubject || subjectPromptComplete) &&
    !introActive &&
    instructionReady;
  const polishScanActive = polishScanEligible && polishScanStatus !== "idle";
  const postScanReviewActive =
    polishScanStatus === "post-change" ||
    polishScanStatus === "rescan-needed" ||
    polishScanStatus === "restored";
  const polishScanCentered =
    polishScanStatus === "scanning" ||
    polishScanStatus === "clean" ||
    polishScanStatus === "restored";
  const cinematicPromptActive = cinematicPromptStatus !== "idle";
  const promptModeActive =
    formatPromptActive ||
    layoutPromptActive ||
    palettePromptActive ||
    subjectPromptActive ||
    cinematicPromptActive ||
    polishScanActive;
  const tourActive =
    !introActive &&
    instructionReady &&
    formatPromptComplete &&
    !tourComplete &&
    !layoutPromptActive;
  const stepIndex = resolveStepIndex({
    manualStepIndex,
    mobileControlsTab,
    selectedPanel,
    totalSteps: guide.steps.length,
    uiMode,
  });
  const step = guide.steps[stepIndex] ?? guide.steps[0];
  const autoTextTarget = React.useMemo(() => {
    if (!tourActive || textTargets.length === 0) return null;
    const index = clamp(manualStepIndex, 0, textTargets.length - 1);
    return textTargets[index] ?? null;
  }, [manualStepIndex, textTargets, tourActive]);
  const activeTextTarget = React.useMemo(
    () =>
      autoTextTarget ??
      selectTextTarget({
        selectedPanel,
        stepTarget: step.target,
        textTargets,
      }),
    [autoTextTarget, selectedPanel, step.target, textTargets]
  );
  const activeTextRole = activeTextTarget?.role ?? normalizeTextRole(step.target);
  const tourTextTarget = tourActive ? activeTextTarget : null;
  const reviewMode =
    !promptModeActive &&
    ((!tourTextTarget && !introActive && step.id === "export") ||
      `${uiMode ?? ""}`.toLowerCase().includes("finish"));
  const textTargetZone = React.useMemo(
    () => targetZoneFromTextTarget(tourTextTarget),
    [tourTextTarget]
  );
  const layoutTargetZone = React.useMemo<CocoTargetZone | null>(
    () => (layoutOptionsRect ? { ...layoutOptionsRect, radius: 12 } : null),
    [layoutOptionsRect]
  );
  const paletteTargetZone = React.useMemo<CocoTargetZone | null>(
    () => (paletteOptionsRect ? { ...paletteOptionsRect, radius: 12 } : null),
    [paletteOptionsRect]
  );
  const subjectTargetZone = React.useMemo<CocoTargetZone | null>(
    () => targetZoneFromSubjectRect(subjectTargetRect),
    [subjectTargetRect]
  );
  const gradePresetTargetZone = React.useMemo<CocoTargetZone | null>(
    () =>
      gradePresetRect && !gradePresetPreviewed
        ? { ...expandRect(gradePresetRect, 5), radius: 9 }
        : null,
    [gradePresetPreviewed, gradePresetRect]
  );
  const gradePlacementZone = React.useMemo<CocoTargetZone | null>(
    () => (gradePanelRect ? { ...gradePanelRect, radius: 12 } : gradePresetTargetZone),
    [gradePanelRect, gradePresetTargetZone]
  );
  const postScanTargetZone = React.useMemo<CocoTargetZone | null>(
    () => getPostScanTargetZone(postScanChange, textTargets),
    [postScanChange, textTargets]
  );
  const targetZone = layoutPromptActive
    ? layoutTargetZone
    : palettePromptActive
      ? paletteTargetZone
      : subjectPromptActive
        ? subjectTargetZone
        : postScanReviewActive
          ? postScanTargetZone
          : polishScanStatus === "grade"
            ? gradePresetTargetZone
            : textTargetZone;
  const placementTargetZone =
    polishScanStatus === "grade"
      ? gradePlacementZone
      : postScanReviewActive
        ? postScanTargetZone
        : targetZone;
  const cocoPlacement = React.useMemo(
    () =>
      getCocoPlacement({
        artboardRect,
        isMobile,
        reviewMode,
        stepId: layoutPromptActive
          ? "layout"
          : palettePromptActive
            ? "palette"
            : subjectPromptActive
              ? "subject"
              : postScanReviewActive
                ? "polish-scan"
                : polishScanStatus === "grade"
                  ? "grade"
                  : polishScanActive
                    ? "polish-scan"
            : activeTextRole ?? step.id,
        targetZone: placementTargetZone,
      }),
    [
      activeTextRole,
      artboardRect,
      isMobile,
      layoutPromptActive,
      palettePromptActive,
      postScanReviewActive,
      reviewMode,
      step.id,
      polishScanActive,
      polishScanStatus,
      placementTargetZone,
      subjectPromptActive,
    ]
  );
  const headlineLooksLong = (headline ?? "").trim().split(/\s+/).filter(Boolean).length > 5;
  const currentIntroStep: CocoIntroStep =
    introSteps[introStepIndex] ??
    introSteps[introSteps.length - 1] ?? { id: "make-yours", measureText: introStageMeasureText };
  const currentFieldIsTracked = tourActive && fieldProgress.role === activeTextRole;
  const currentFieldChanged = currentFieldIsTracked && fieldProgress.changed;
  const currentLayoutIssue = currentFieldIsTracked ? fieldProgress.layoutIssue : null;
  const currentOverlapRole = currentFieldIsTracked ? fieldProgress.overlapRole : null;
  const currentSubjectIssueKey = currentFieldIsTracked ? fieldProgress.subjectIssueKey : null;
  const currentOverlapLabel = currentOverlapRole ? COCO_TEXT_ROLE_LABELS[currentOverlapRole] : null;
  const currentLayoutIssueSeen = currentFieldIsTracked && fieldProgress.layoutIssueSeen;
  const currentLayoutFixed = currentLayoutIssueSeen && !currentLayoutIssue;
  const currentFieldSettled =
    currentFieldIsTracked && fieldProgress.settled && !fieldProgress.layoutIssue;
  const currentFieldCanKeep =
    currentFieldIsTracked &&
    fieldProgress.canKeep &&
    !fieldProgress.changed &&
    !fieldProgress.layoutIssue;
  const cocoNightlifeStyle = React.useMemo(
    () =>
      nightlifeStyle ??
      inferCocoNightlifeStyle({
        templateId,
        templateLabel,
        tone: guide.tone,
      }),
    [guide.tone, nightlifeStyle, templateId, templateLabel]
  );
  const styleReadLines = React.useMemo(() => {
    if (!nightlifeStyleDecision && !nightlifeStyle) return [];
    const style = nightlifeStyleDecision?.style ?? cocoNightlifeStyle;
    const label = cocoNightlifeStyleLabel(style);
    const mood = String(nightlifeStyleDecision?.mood || "")
      .replace(/\s+/g, " ")
      .trim();
    return mood
      ? [`I'm reading this as ${label}.`, mood]
      : [`I'm reading this as ${label}.`];
  }, [cocoNightlifeStyle, nightlifeStyle, nightlifeStyleDecision]);
  const styleReadActive =
    styleReadLines.length > 0 && !styleReadSeen && !introActive && instructionReady;
  const cocoIntelligencePhase: CocoCanvasPhase = introActive
    ? "arrival"
    : formatPromptActive
      ? "format"
      : layoutPromptActive
        ? "layout"
        : palettePromptActive
          ? "palette"
          : subjectPromptActive
            ? "subject"
            : postScanReviewActive
              ? "post-change"
              : polishScanActive
                ? polishScanStatus === "export"
                  ? "export"
                  : "polish"
                : tourActive
                  ? "text"
                  : reviewMode
                    ? "export"
                    : "idle";
  const cocoIntelligenceActiveTarget = React.useMemo<CocoTargetRef>(
    () =>
      subjectPromptActive
        ? { type: "subject" }
        : layoutPromptActive
          ? { type: "layout" }
          : palettePromptActive
            ? { type: "palette" }
            : postScanChange
              ? getCocoTargetRefForPostScanTarget(postScanChange.target)
              : activeTextRole
                ? { role: activeTextRole, type: "text" }
                : reviewMode
                  ? { type: "export" }
                  : { type: "canvas" },
    [
      activeTextRole,
      layoutPromptActive,
      palettePromptActive,
      postScanChange,
      reviewMode,
      subjectPromptActive,
    ]
  );
  const cocoCanvasSnapshot = React.useMemo(
    () =>
      buildCocoCanvasSnapshot({
        activeTarget: cocoIntelligenceActiveTarget,
        artboardRect,
        field: {
          changed: currentFieldChanged,
          layoutIssue: currentLayoutIssue,
          overlapRole: currentOverlapRole,
          role: activeTextRole,
          settled: currentFieldSettled,
        },
        format,
        hasSubject: Boolean(hasSubject),
        headlineText: headline ?? null,
        isMobile,
        nightlifeStyle: cocoNightlifeStyle,
        phase: cocoIntelligencePhase,
        postChange: postScanChange
          ? {
              hasIssue: Boolean(postScanChange.issue),
              target: getCocoTargetRefForPostScanTarget(postScanChange.target),
            }
          : null,
        subjectIssue: {
          overlapRatio: subjectIssue.overlapRatio,
          overlapRole: subjectIssue.overlapRole,
          rect: subjectIssue.rect,
          suggestion: subjectIssue.suggestion,
          type: subjectIssue.type,
        },
        templateId,
        textNodes: textTargets.map((target) => ({
          fontFamily: target.fontFamily,
          fontSize: target.fontSize,
          fontWeight: target.fontWeight,
          letterSpacing: target.letterSpacing,
          lineHeight: target.lineHeight,
          opticalCenter: target.opticalCenter,
          priority: target.priority,
          readability: target.readability,
          rect: target,
          role: target.role,
          rotation: target.rotation,
          strokeWidth: target.strokeWidth,
          text: target.text,
          textAlign: target.textAlign,
          textColor: target.textColor,
          textShadow: target.textShadow,
          visualRect: target.visualRect,
        })),
        tone: guide.tone,
      }),
    [
      activeTextRole,
      artboardRect,
      cocoIntelligenceActiveTarget,
      cocoIntelligencePhase,
      currentFieldChanged,
      currentFieldSettled,
      currentLayoutIssue,
      currentOverlapRole,
      format,
      guide.tone,
      hasSubject,
      headline,
      isMobile,
      cocoNightlifeStyle,
      postScanChange,
      subjectIssue.overlapRatio,
      subjectIssue.overlapRole,
      subjectIssue.rect,
      subjectIssue.suggestion,
      subjectIssue.type,
      templateId,
      textTargets,
    ]
  );
  const cocoMemorySnapshot = React.useMemo(
    () =>
      createCocoMemorySnapshot({
        acceptedFindingIds: acceptedSubjectIssueKey ? [`subject-overlap:${acceptedSubjectIssueKey}`] : [],
      }),
    [acceptedSubjectIssueKey]
  );
  const cocoFindings = React.useMemo(
    () => runCocoRules(cocoCanvasSnapshot),
    [cocoCanvasSnapshot]
  );
  const cocoJudgment = React.useMemo(
    () =>
      selectCocoJudgment({
        findings: cocoFindings,
        memory: cocoMemorySnapshot,
        snapshot: cocoCanvasSnapshot,
      }),
    [cocoCanvasSnapshot, cocoFindings, cocoMemorySnapshot]
  );
  const cocoJudgmentLines = React.useMemo(
    () => getCocoLinesForJudgment(cocoJudgment, cocoCanvasSnapshot),
    [cocoCanvasSnapshot, cocoJudgment]
  );
  const cocoFinalArtDirectorResult = React.useMemo(
    () =>
      runCocoFinalArtDirectorPass({
        findings: cocoFindings,
        snapshot: cocoCanvasSnapshot,
      }),
    [cocoCanvasSnapshot, cocoFindings]
  );
  const cocoFinalArtDirectorLines = React.useMemo(
    () => getCocoFinalArtDirectorLines(cocoFinalArtDirectorResult),
    [cocoFinalArtDirectorResult]
  );
  const gradeRecommendationLines = React.useMemo(
    () => getCocoGradeRecommendationLines(recommendedGradePreset),
    [recommendedGradePreset]
  );
  const polishScanLines =
    polishScanStatus === "scanning"
      ? ["Checking final details.", "This takes a moment."]
      : polishScanStatus === "clean"
        ? ["Everything looks clean.", "Nice work."]
        : polishScanStatus === "issue"
          ? [getPolishScanIssueText(polishScanIssue), "Tap Fix to adjust it."]
        : polishScanStatus === "polish"
          ? ["Now let's shape the final mood.", "Then we'll export your flyer."]
          : polishScanStatus === "grade"
            ? gradePresetPreviewed
              ? ["Try any preset you like.", "Tap Done when it feels right."]
              : gradeRecommendationLines
            : polishScanStatus === "export"
              ? cocoFinalArtDirectorLines
              : polishScanStatus === "post-change"
                ? getPostScanChangeLines(postScanChange)
                : polishScanStatus === "rescan-needed"
                  ? ["Ok. Make your changes.", "Hit Rescan when finished."]
                  : polishScanStatus === "rescan-offer"
                    ? getCocoAcceptedChangeLines()
                  : polishScanStatus === "restored"
                    ? ["Got it. I put it back."]
              : [getPolishScanIssueText(polishScanIssue)];
  const subjectTextOverlapCanKeep =
    format === "story" && subjectIssue.type === "text-overlap" && subjectIssueSeen;
  const subjectPromptLines = subjectIssue.type
    ? cocoJudgmentLines && cocoJudgment.target?.type === "subject"
      ? cocoJudgmentLines
      : subjectTextOverlapCanKeep
        ? [getSubjectIssueText(subjectIssue), "Keep this placement?"]
        : [getSubjectIssueText(subjectIssue)]
    : [
        subjectIssueSeen || subjectPreviewSeen || subjectKeepReady
          ? "Keep this subject?"
          : "Check the subject.",
      ];
  const isLastTextField = manualStepIndex >= textTargets.length - 1;
  const baseInstructionText =
    headlineLooksLong && activeTextRole === "headline"
      ? "Shorten the headline."
      : conciseStepMessages[activeTextRole ?? step.id] ?? conciseStepMessages[step.id] ?? step.message;
  const fieldResponseText = tourComplete
    ? hasSubject && subjectPromptComplete
      ? "Subject set. Ready to polish."
      : hasPaletteOptions && palettePromptComplete
      ? "Colors set. Ready to polish."
      : "All text fields reviewed."
    : currentLayoutIssue === "overflow"
      ? "Too long. Resize or split."
      : currentLayoutIssue === "subject-overlap"
        ? currentOverlapLabel
          ? `Subject covers ${currentOverlapLabel}.`
          : "Subject covers text."
      : currentLayoutIssue === "overlap"
        ? currentOverlapLabel
          ? `Overlaps ${currentOverlapLabel}.`
          : "Text overlaps."
        : currentFieldSettled || currentLayoutFixed
          ? isLastTextField
            ? currentLayoutIssueSeen
              ? "That fits. Finish?"
              : "Looks good. Finish?"
            : currentLayoutIssueSeen
              ? "That fits. Next field?"
              : "Looks good. Next field?"
      : currentFieldChanged
        ? "I see the edit."
        : currentFieldCanKeep
          ? "Edit it, or keep it."
          : baseInstructionText;
  const fieldResponseLines =
    cocoJudgmentLines &&
    !currentFieldChanged &&
    !currentLayoutIssue &&
    !currentFieldSettled &&
    !currentFieldCanKeep
      ? cocoJudgmentLines
      : [fieldResponseText];
  const primaryLines = introActive
    ? [currentIntroStep.measureText]
    : styleReadActive
      ? styleReadLines
      : formatPromptActive
      ? [pendingFormatLabel ? `Preparing ${pendingFormatLabel}.` : "Choose a format."]
      : layoutPromptActive
        ? [layoutPreviewSeen ? "Chosen the one you like?" : "Choose a layout first."]
        : palettePromptActive
          ? [palettePreviewSeen ? "Keep this color mood?" : "Choose a color mood."]
          : subjectPromptActive
            ? subjectPromptLines
            : polishScanActive
              ? polishScanLines
              : cinematicPromptStatus === "offer"
                ? ["Want a more epic headline?", "Try Cinematic 3D."]
                : cinematicPromptStatus === "instructions"
                  ? [
                      "Enter one or two lines.",
                      "Pick a style, click Render.",
                      "Rendered art is not editable.",
                    ]
              : fieldResponseLines;
  const primaryText = primaryLines.join(" ");
  const longestPrimaryLine = primaryLines.reduce(
    (longest, line) => (line.length > longest.length ? line : longest),
    primaryLines[0] ?? ""
  );
  const multiLineCount = introActive ? 1 : primaryLines.length;
  const twoLineMessage = multiLineCount > 1;
  const threeLineMessage = multiLineCount > 2;
  const cocoStageHeight = threeLineMessage
    ? COCO_STAGE_XTALL_HEIGHT
    : twoLineMessage
      ? COCO_STAGE_TALL_HEIGHT
      : COCO_STAGE_HEIGHT;
  const cocoBubbleHeight = threeLineMessage
    ? COCO_BUBBLE_XTALL_HEIGHT
    : twoLineMessage
      ? COCO_BUBBLE_TALL_HEIGHT
      : COCO_BUBBLE_HEIGHT;
  const cocoMessageHeight = threeLineMessage
    ? COCO_MESSAGE_XTALL_HEIGHT
    : twoLineMessage
      ? COCO_MESSAGE_TALL_HEIGHT
      : COCO_MESSAGE_HEIGHT;
  const stageTargetText = formatPromptActive
    ? styleReadActive
      ? longestPrimaryLine
      : "Choose a format. Square Story"
    : introActive
      ? introStageMeasureText
      : longestPrimaryLine;
  const viewportWidth = typeof window === "undefined" ? COCO_STAGE_MIN_WIDTH : window.innerWidth;
  const viewportHeight =
    typeof window === "undefined" ? cocoStageHeight + 48 : window.innerHeight;
  const [stageWidthText, setStageWidthText] = React.useState(primaryText);
  const cocoStageWidth = React.useMemo(
    () => getCocoStageWidth(stageWidthText, viewportWidth, isMobile),
    [isMobile, stageWidthText, viewportWidth]
  );
  const cocoDisplayLeft = React.useMemo(() => {
    const margin = isMobile ? 16 : 24;
    if (polishScanCentered && artboardRect) {
      return clamp(
        artboardRect.left + artboardRect.width / 2 - cocoStageWidth / 2,
        margin,
        viewportWidth - cocoStageWidth - margin
      );
    }

    const maxLeft = Math.max(margin, viewportWidth - cocoStageWidth - margin);
    return clamp(cocoPlacement.left, margin, maxLeft);
  }, [artboardRect, cocoPlacement.left, cocoStageWidth, isMobile, polishScanCentered, viewportWidth]);
  const cocoDisplayTop = React.useMemo(() => {
    const margin = isMobile ? 16 : 24;
    if (polishScanCentered && artboardRect) {
      return clamp(
        artboardRect.top + artboardRect.height / 2 - cocoStageHeight / 2,
        margin,
        viewportHeight - cocoStageHeight - margin
      );
    }

    return cocoPlacement.top;
  }, [artboardRect, cocoPlacement.top, cocoStageHeight, isMobile, polishScanCentered, viewportHeight]);
  const cocoIntroReady = active && !dismissed && directorRendered;

  React.useEffect(() => {
    setMounted(true);
    try {
      setDismissed(window.localStorage.getItem(COCO_DISMISSED_STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  React.useEffect(() => {
    latestActiveLayoutIdRef.current = activeLayoutId ?? null;
  }, [activeLayoutId]);

  React.useEffect(() => {
    latestActivePaletteSignatureRef.current = activePaletteSignature ?? null;
  }, [activePaletteSignature]);

  React.useEffect(() => {
    latestActiveGradeSignatureRef.current = activeGradeSignature ?? null;
  }, [activeGradeSignature]);

  React.useEffect(() => {
    latestActiveSubjectSignatureRef.current = activeSubjectSignature ?? null;
  }, [activeSubjectSignature]);

  React.useEffect(() => {
    onCaptureCleanLayoutRef.current = onCaptureCleanLayout;
  }, [onCaptureCleanLayout]);

  React.useEffect(() => {
    polishScanStatusRef.current = polishScanStatus;
  }, [polishScanStatus]);

  React.useEffect(() => {
    if (!pendingFormatChoice) return;
    if (format !== pendingFormatChoice) return;
    if (formatTransitioning) return;

    const timer = window.setTimeout(() => {
      setPendingFormatChoice(null);
      setFormatPromptComplete(true);
    }, COCO_FORMAT_SWITCH_SETTLE_MS);

    return () => window.clearTimeout(timer);
  }, [format, formatTransitioning, pendingFormatChoice]);

  React.useEffect(() => {
    if (latestFormatRef.current === format) return;
    latestFormatRef.current = format;
    clearKeepOptionTimer();
    clearPolishFlowTimer();
    clearPostScanResumeTimer();
    clearPostScanWatchTimer();
    setManualStepIndex(0);
    setTourComplete(false);
    setFieldProgress(emptyFieldProgress());
    setTextTargets([]);
    setCinematicPromptStatus("idle");
    setLayoutPromptComplete(!latestHasLayoutOptionsRef.current);
    setLayoutBaselineId(latestActiveLayoutIdRef.current);
    setLayoutKeepReady(false);
    setLayoutPreviewSeen(false);
    setPalettePromptComplete(!latestHasPaletteOptionsRef.current);
    setPaletteBaselineSignature(latestActivePaletteSignatureRef.current);
    setPaletteKeepReady(false);
    setPalettePreviewSeen(false);
    setSubjectPromptComplete(!latestHasSubjectRef.current);
    setSubjectBaselineSignature(latestActiveSubjectSignatureRef.current);
    setSubjectIssue(emptySubjectIssue());
    setAcceptedSubjectIssueKey(null);
    setSubjectIssueSeen(false);
    setSubjectKeepReady(false);
    setSubjectPreviewSeen(false);
    setPostScanChange(null);
    updatePostScanBaselineSignature(null);
    setPolishScanIssue(null);
    polishScanStatusRef.current = "idle";
    setPolishScanStatus("idle");
    setGradeBaselineSignature(null);
    setGradePanelRect(null);
    setGradePresetPreviewed(false);
    setGradePresetChosen(false);
    setGradePresetRect(null);
  }, [
    clearKeepOptionTimer,
    clearPostScanResumeTimer,
    clearPostScanWatchTimer,
    clearPolishFlowTimer,
    format,
    hasLayoutOptions,
    hasPaletteOptions,
    hasSubject,
    updatePostScanBaselineSignature,
  ]);

  React.useEffect(
    () => () => {
      clearStaticLabelTimer();
      clearInstructionTimer();
      clearKeepOptionTimer();
      clearPolishFlowTimer();
      clearPostScanResumeTimer();
      clearPostScanWatchTimer();
    },
    [
      clearInstructionTimer,
      clearKeepOptionTimer,
      clearPolishFlowTimer,
      clearPostScanResumeTimer,
      clearPostScanWatchTimer,
      clearStaticLabelTimer,
    ]
  );

  React.useEffect(() => {
    if (!cocoIntroReady) return;

    setIntroActive(true);
    setIntroStepIndex(0);
    setStyleReadSeen(false);
    setInstructionReady(false);
    setTourComplete(false);
    setCinematicPromptStatus("idle");
    setCinematicPromptSeen(false);
    setFormatPromptComplete(false);
    setPendingFormatChoice(null);
    setManualStepIndex(0);
    setLayoutPromptComplete(!latestHasLayoutOptionsRef.current);
    setLayoutBaselineId(latestActiveLayoutIdRef.current);
    setLayoutKeepReady(false);
    setLayoutPreviewSeen(false);
    setPalettePromptComplete(!latestHasPaletteOptionsRef.current);
    setPaletteBaselineSignature(latestActivePaletteSignatureRef.current);
    setPaletteKeepReady(false);
    setPalettePreviewSeen(false);
    setSubjectPromptComplete(!latestHasSubjectRef.current);
    setSubjectBaselineSignature(latestActiveSubjectSignatureRef.current);
    setSubjectIssue(emptySubjectIssue());
    setAcceptedSubjectIssueKey(null);
    setSubjectIssueSeen(false);
    setSubjectKeepReady(false);
    setSubjectPreviewSeen(false);
    setPostScanChange(null);
    updatePostScanBaselineSignature(null);
    setPolishScanIssue(null);
    polishScanStatusRef.current = "idle";
    setPolishScanStatus("idle");
  }, [cocoIntroReady, nightlifeStyleDecision?.source, nightlifeStyleDecision?.style, templateId, updatePostScanBaselineSignature]);

  React.useEffect(() => {
    if (!styleReadActive) return;
    const timer = window.setTimeout(() => setStyleReadSeen(true), 3200);
    return () => window.clearTimeout(timer);
  }, [styleReadActive, styleReadLines]);

  React.useEffect(() => {
    if (!cocoIntroReady) return;
    if (!hasLayoutOptions) {
      setLayoutPromptComplete(true);
      setLayoutKeepReady(false);
      setLayoutPreviewSeen(false);
    }
  }, [cocoIntroReady, hasLayoutOptions]);

  React.useEffect(() => {
    if (!cocoIntroReady) return;
    if (!hasPaletteOptions) {
      setPalettePromptComplete(true);
      setPaletteKeepReady(false);
      setPalettePreviewSeen(false);
    }
  }, [cocoIntroReady, hasPaletteOptions]);

  React.useEffect(() => {
    if (!cocoIntroReady) return;
    if (!hasSubject) {
      setSubjectPromptComplete(true);
      setSubjectIssue(emptySubjectIssue());
      setSubjectIssueSeen(false);
      setSubjectKeepReady(false);
      setSubjectPreviewSeen(false);
    }
  }, [cocoIntroReady, hasSubject]);

  React.useEffect(() => {
    setAllowedOverlapPairs(new Set());
  }, [templateId]);

  React.useEffect(() => {
    if (!layoutPromptActive) {
      setLayoutKeepReady(false);
      return;
    }

    setLayoutKeepReady(false);
    const timer = window.setTimeout(() => setLayoutKeepReady(true), 2200);
    return () => window.clearTimeout(timer);
  }, [layoutPromptActive]);

  React.useEffect(() => {
    if (!layoutPromptActive) return;

    onOpenLayoutOptions?.();
  }, [layoutPromptActive, onOpenLayoutOptions]);

  React.useEffect(() => {
    if (!layoutPromptActive) return;
    if (!activeLayoutId) return;

    if (!layoutBaselineId) {
      setLayoutBaselineId(activeLayoutId);
      return;
    }

    if (activeLayoutId !== layoutBaselineId) {
      setLayoutPreviewSeen(true);
      setLayoutKeepReady(true);
    }
  }, [activeLayoutId, layoutBaselineId, layoutPromptActive]);

  React.useEffect(() => {
    if (!palettePromptActive) {
      setPaletteKeepReady(false);
      return;
    }

    setPaletteKeepReady(false);
    const timer = window.setTimeout(() => setPaletteKeepReady(true), 2200);
    return () => window.clearTimeout(timer);
  }, [palettePromptActive]);

  React.useEffect(() => {
    if (!palettePromptActive) return;

    onOpenPaletteOptions?.();
  }, [onOpenPaletteOptions, palettePromptActive]);

  React.useEffect(() => {
    if (!palettePromptActive) return;
    if (!activePaletteSignature) return;

    if (!paletteBaselineSignature) {
      setPaletteBaselineSignature(activePaletteSignature);
      return;
    }

    if (activePaletteSignature !== paletteBaselineSignature) {
      setPalettePreviewSeen(true);
      setPaletteKeepReady(true);
    }
  }, [activePaletteSignature, paletteBaselineSignature, palettePromptActive]);

  React.useEffect(() => {
    if (!subjectPromptActive) {
      setSubjectKeepReady(false);
      return;
    }

    setSubjectKeepReady(false);
    const timer = window.setTimeout(() => setSubjectKeepReady(true), 2600);
    return () => window.clearTimeout(timer);
  }, [subjectPromptActive]);

  React.useEffect(() => {
    if (!subjectPromptActive) return;

    onOpenSubjectOptions?.();
  }, [onOpenSubjectOptions, subjectPromptActive]);

  React.useEffect(() => {
    if (!subjectPromptActive) return;
    if (!activeSubjectSignature) return;

    if (!subjectBaselineSignature) {
      setSubjectBaselineSignature(activeSubjectSignature);
      return;
    }

    if (activeSubjectSignature !== subjectBaselineSignature) {
      setSubjectPreviewSeen(true);
      setSubjectKeepReady(true);
    }
  }, [activeSubjectSignature, subjectBaselineSignature, subjectPromptActive]);

  React.useEffect(() => {
    if (!cocoIntroReady || !introActive) return;

    const timer = window.setTimeout(() => {
      if (introStepIndex >= introSteps.length - 1) {
        setIntroActive(false);
        return;
      }
      setIntroStepIndex((current) => Math.min(current + 1, introSteps.length - 1));
    }, currentIntroStep.holdMs ?? COCO_INTRO_STEP_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [cocoIntroReady, currentIntroStep.holdMs, introActive, introStepIndex, introSteps.length]);

  React.useEffect(() => {
    if (stageWidthText === stageTargetText) return;

    const currentWidth = getCocoStageWidth(stageWidthText, viewportWidth, isMobile);
    const nextWidth = getCocoStageWidth(stageTargetText, viewportWidth, isMobile);
    if (nextWidth >= currentWidth) {
      setStageWidthText(stageTargetText);
      return;
    }

    const timer = window.setTimeout(
      () => setStageWidthText(stageTargetText),
      COCO_MESSAGE_TRANSITION_MS
    );
    return () => window.clearTimeout(timer);
  }, [isMobile, stageTargetText, stageWidthText, viewportWidth]);

  React.useEffect(() => {
    if (introActive) {
      clearStaticLabelTimer();
      clearInstructionTimer();
      clearKeepOptionTimer();
      setStaticLabelReady(false);
      setInstructionReady(false);
      return;
    }

    scheduleStaticLabel(COCO_STATIC_LABEL_DELAY_MS);
    return clearStaticLabelTimer;
  }, [
    clearInstructionTimer,
    clearKeepOptionTimer,
    clearStaticLabelTimer,
    introActive,
    scheduleStaticLabel,
  ]);

  React.useEffect(() => {
    if (textTargets.length === 0) {
      if (manualStepIndex !== 0) setManualStepIndex(0);
      return;
    }

    const maxIndex = textTargets.length - 1;
    if (manualStepIndex > maxIndex) setManualStepIndex(maxIndex);
  }, [manualStepIndex, textTargets.length]);

  React.useEffect(() => {
    const store = useFlyerState.getState();
    const lastPanel = cocoSelectedPanelRef.current;
    const lastMoveTarget = cocoMoveTargetRef.current;
    const shouldControlPanel =
      active &&
      !dismissed &&
      tourActive &&
      Boolean(activeTextRole) &&
      !cinematicPromptActive;

    if (!shouldControlPanel || !activeTextRole) {
      if (lastPanel && store.selectedPanel === lastPanel) {
        store.setSelectedPanel(null);
      }
      if (lastMoveTarget && store.moveTarget === lastMoveTarget) {
        store.setMoveTarget(null);
      }
      cocoSelectedPanelRef.current = null;
      cocoMoveTargetRef.current = null;
      cocoOpenedTextRoleRef.current = null;
      return;
    }

    const nextPanel = getEditorPanelForTextRole(activeTextRole);
    const nextMoveTarget = getMoveTargetForTextRole(activeTextRole);
    const cocoTargetChanged = cocoOpenedTextRoleRef.current !== activeTextRole;
    const userHasTakenMoveControl =
      Boolean(lastMoveTarget) &&
      store.moveTarget &&
      store.moveTarget !== lastMoveTarget &&
      store.moveTarget !== nextMoveTarget;
    if (userHasTakenMoveControl && !cocoTargetChanged) {
      return;
    }

    const selectedTextRole = getSelectedTextRole(store.selectedPanel);
    const userHasTakenPanelControl =
      Boolean(lastPanel) &&
      Boolean(store.selectedPanel) &&
      store.selectedPanel !== lastPanel &&
      selectedTextRole !== activeTextRole;
    if (userHasTakenPanelControl && !cocoTargetChanged) {
      return;
    }

    const moveTextRole = normalizeTextRole(store.moveTarget);
    const overlapEditRoles = [activeTextRole, currentOverlapRole].filter(Boolean);
    const userIsMovingOverlapText =
      (currentLayoutIssue === "overlap" || currentLayoutIssue === "subject-overlap") &&
      overlapEditRoles.some((role) => role === selectedTextRole || role === moveTextRole);

    if (userIsMovingOverlapText && !cocoTargetChanged) {
      return;
    }

    if (store.moveTarget !== nextMoveTarget) {
      store.setMoveTarget(nextMoveTarget);
    }
    if (store.selectedPanel !== nextPanel) {
      store.setSelectedPanel(nextPanel);
    }
    if (cocoOpenedTextRoleRef.current !== activeTextRole) {
      onOpenTextField?.(activeTextRole);
      cocoOpenedTextRoleRef.current = activeTextRole;
    }

    cocoSelectedPanelRef.current = nextPanel;
    cocoMoveTargetRef.current = nextMoveTarget;
  }, [
    active,
    activeTextRole,
    cinematicPromptActive,
    currentLayoutIssue,
    currentOverlapRole,
    dismissed,
    onOpenTextField,
    selectedPanel,
    tourActive,
  ]);

  React.useEffect(() => {
    const store = useFlyerState.getState();
    const shouldControlSubject = active && !dismissed && subjectPromptActive;

    if (!shouldControlSubject) {
      if (cocoSubjectPanelOpenRef.current) {
        if (store.selectedPanel === "portrait") store.setSelectedPanel(null);
        if (store.moveTarget === "portrait") store.setMoveTarget(null);
      }
      cocoSubjectPanelOpenRef.current = false;
      return;
    }

    if (store.moveTarget && store.moveTarget !== "portrait") {
      return;
    }

    if (store.moveTarget !== "portrait") {
      store.setMoveTarget("portrait");
    }
    if (store.selectedPanel !== "portrait") {
      store.setSelectedPanel("portrait");
    }
    cocoSubjectPanelOpenRef.current = true;
  }, [active, dismissed, subjectPromptActive]);

  React.useEffect(() => {
    if (!tourActive || !activeTextRole) {
      clearKeepOptionTimer();
      setFieldProgress((current) =>
        current.role == null
          ? current
          : {
              ...emptyFieldProgress(),
            }
      );
      return;
    }

    const baseline = getCanvasTextForRole(activeTextRole);
    let currentText = baseline;
    let lastChangedAt = Date.now();
    let latestLayoutIssue = emptyLayoutIssue();
    let layoutCheckPending = false;
    let cancelled = false;
    setFieldProgress({
      baseline,
      canKeep: false,
      changed: false,
      current: currentText,
      layoutIssue: null,
      layoutIssueSeen: false,
      overlapRole: null,
      role: activeTextRole,
      settled: false,
      subjectIssueKey: null,
    });

    const applyLayoutIssue = (layoutIssue: CocoLayoutIssueResult) => {
      latestLayoutIssue = layoutIssue;
      const now = Date.now();
      const changed = currentText !== baseline;
      const settled = changed && !layoutIssue.type && now - lastChangedAt >= COCO_FIELD_SETTLE_MS;

      setFieldProgress((current) => {
        if (current.role !== activeTextRole) return current;
        if (
          current.changed === changed &&
          current.current === currentText &&
          current.layoutIssue === layoutIssue.type &&
          current.overlapRole === layoutIssue.overlapRole &&
          current.subjectIssueKey === (layoutIssue.subjectIssueKey ?? null) &&
          current.settled === settled
        ) {
          return current;
        }
        return {
          ...current,
          changed,
          current: currentText,
          layoutIssue: layoutIssue.type,
          layoutIssueSeen: current.layoutIssueSeen || Boolean(layoutIssue.type),
          overlapRole: layoutIssue.overlapRole,
          settled,
          subjectIssueKey: layoutIssue.subjectIssueKey ?? null,
        };
      });
    };

    const runLayoutCheck = () => {
      if (layoutCheckPending) return;
      layoutCheckPending = true;

      void getLayoutIssueForRole({
        acceptedSubjectIssueKey,
        allowedOverlapPairs,
        activeSubjectSignature: activeSubjectSignature ?? null,
        role: activeTextRole,
        templateId,
      })
        .then((layoutIssue) => {
          if (!cancelled) applyLayoutIssue(layoutIssue);
        })
        .catch(() => {
          if (!cancelled) applyLayoutIssue(emptyLayoutIssue());
        })
        .finally(() => {
          layoutCheckPending = false;
        });
    };

    clearKeepOptionTimer();
    keepOptionTimerRef.current = window.setTimeout(() => {
      keepOptionTimerRef.current = null;
      setFieldProgress((current) =>
        current.role === activeTextRole && !current.changed
          ? { ...current, canKeep: true }
          : current
      );
    }, COCO_KEEP_OPTION_DELAY_MS);

    runLayoutCheck();
    const layoutInterval = window.setInterval(runLayoutCheck, COCO_LAYOUT_CHECK_INTERVAL_MS);
    const interval = window.setInterval(() => {
      const nextText = getCanvasTextForRole(activeTextRole);
      const now = Date.now();

      if (nextText !== currentText) {
        currentText = nextText;
        lastChangedAt = now;
        runLayoutCheck();
        setFieldProgress((current) =>
          current.role === activeTextRole
            ? {
                ...current,
                canKeep: false,
                changed: nextText !== baseline,
                current: nextText,
                layoutIssue: latestLayoutIssue.type,
                layoutIssueSeen: current.layoutIssueSeen || Boolean(latestLayoutIssue.type),
                overlapRole: latestLayoutIssue.overlapRole,
                settled: false,
                subjectIssueKey: latestLayoutIssue.subjectIssueKey ?? null,
              }
            : current
        );
        return;
      }

      const changed = currentText !== baseline;
      const settled = changed && !latestLayoutIssue.type && now - lastChangedAt >= COCO_FIELD_SETTLE_MS;
      setFieldProgress((current) => {
        if (current.role !== activeTextRole) return current;
        if (
          current.changed === changed &&
          current.current === currentText &&
          current.layoutIssue === latestLayoutIssue.type &&
          current.overlapRole === latestLayoutIssue.overlapRole &&
          current.subjectIssueKey === (latestLayoutIssue.subjectIssueKey ?? null) &&
          current.settled === settled
        ) {
          return current;
        }
        return {
          ...current,
          changed,
          current: currentText,
          layoutIssue: latestLayoutIssue.type,
          layoutIssueSeen: current.layoutIssueSeen || Boolean(latestLayoutIssue.type),
          overlapRole: latestLayoutIssue.overlapRole,
          settled,
          subjectIssueKey: latestLayoutIssue.subjectIssueKey ?? null,
        };
      });
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(layoutInterval);
      window.clearInterval(interval);
      clearKeepOptionTimer();
    };
  }, [
    acceptedSubjectIssueKey,
    activeSubjectSignature,
    activeTextRole,
    allowedOverlapPairs,
    clearKeepOptionTimer,
    format,
    templateId,
    tourActive,
  ]);

  React.useEffect(() => {
    if (!active || dismissed || !mounted) return;

    let animationFrame = 0;
    const update = () => {
      const nextRect = getArtboardRect();
      setArtboardRect((currentRect) => {
        if (!currentRect || !nextRect) return nextRect;
        const changed =
          Math.abs(currentRect.height - nextRect.height) > 2 ||
          Math.abs(currentRect.left - nextRect.left) > 2 ||
          Math.abs(currentRect.top - nextRect.top) > 2 ||
          Math.abs(currentRect.width - nextRect.width) > 2;
        return changed ? nextRect : currentRect;
      });
      setTextTargets(getTextTargets(nextRect));
    };
    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(update);
    };

    update();
    const interval = window.setInterval(scheduleUpdate, 350);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearInterval(interval);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
  }, [active, dismissed, mounted]);

  React.useEffect(() => {
    if (!active || dismissed || !mounted || !layoutPromptActive) {
      setLayoutOptionsRect(null);
      return;
    }

    let animationFrame = 0;
    const update = () => {
      const nextRect = getLayoutOptionsRect();
      setLayoutOptionsRect((currentRect) => {
        if (!currentRect || !nextRect) return nextRect;
        const changed =
          Math.abs(currentRect.height - nextRect.height) > 2 ||
          Math.abs(currentRect.left - nextRect.left) > 2 ||
          Math.abs(currentRect.top - nextRect.top) > 2 ||
          Math.abs(currentRect.width - nextRect.width) > 2;
        return changed ? nextRect : currentRect;
      });
    };
    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(update);
    };

    update();
    const interval = window.setInterval(scheduleUpdate, 350);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearInterval(interval);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
  }, [active, dismissed, layoutPromptActive, mounted]);

  React.useEffect(() => {
    if (!active || dismissed || !mounted || !palettePromptActive) {
      setPaletteOptionsRect(null);
      return;
    }

    let animationFrame = 0;
    const update = () => {
      const nextRect = getPaletteOptionsRect();
      setPaletteOptionsRect((currentRect) => {
        if (!currentRect || !nextRect) return nextRect;
        const changed =
          Math.abs(currentRect.height - nextRect.height) > 2 ||
          Math.abs(currentRect.left - nextRect.left) > 2 ||
          Math.abs(currentRect.top - nextRect.top) > 2 ||
          Math.abs(currentRect.width - nextRect.width) > 2;
        return changed ? nextRect : currentRect;
      });
    };
    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(update);
    };

    update();
    const interval = window.setInterval(scheduleUpdate, 350);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearInterval(interval);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
  }, [active, dismissed, mounted, palettePromptActive]);

  React.useEffect(() => {
    if (!active || dismissed || !mounted || !subjectPromptActive) {
      setSubjectTargetRect(null);
      return;
    }

    let animationFrame = 0;
    const update = () => {
      const nextRect = getSubjectTargetRect(getArtboardRect());
      setSubjectTargetRect((currentRect) => {
        if (!currentRect || !nextRect) return nextRect;
        const changed =
          Math.abs(currentRect.height - nextRect.height) > 2 ||
          Math.abs(currentRect.left - nextRect.left) > 2 ||
          Math.abs(currentRect.top - nextRect.top) > 2 ||
          Math.abs(currentRect.width - nextRect.width) > 2;
        return changed ? nextRect : currentRect;
      });
    };
    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(update);
    };

    update();
    const interval = window.setInterval(scheduleUpdate, 350);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearInterval(interval);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
  }, [active, dismissed, mounted, subjectPromptActive]);

  React.useEffect(() => {
    if (!subjectPromptActive) {
      setSubjectIssue(emptySubjectIssue());
      setSubjectIssueSeen(false);
      return;
    }

    let cancelled = false;
    let checkPending = false;

    const applyIssue = (issue: CocoSubjectIssueResult) => {
      if (cancelled) return;
      const acceptedIssueKey = getSubjectIssueKey(issue, activeSubjectSignature);
      const nextIssue =
        acceptedIssueKey && acceptedIssueKey === acceptedSubjectIssueKey
          ? emptySubjectIssue(issue.rect)
          : issue;
      setSubjectTargetRect(issue.rect);
      setSubjectIssue((current) => {
        if (
          current.type === nextIssue.type &&
          current.overlapRole === nextIssue.overlapRole &&
          current.overlapRatio === nextIssue.overlapRatio &&
          current.suggestion === nextIssue.suggestion &&
          current.rect?.left === nextIssue.rect?.left &&
          current.rect?.top === nextIssue.rect?.top &&
          current.rect?.width === nextIssue.rect?.width &&
          current.rect?.height === nextIssue.rect?.height
        ) {
          return current;
        }
        return nextIssue;
      });
      if (nextIssue.type) {
        setSubjectIssueSeen(true);
      }
    };

    const runCheck = () => {
      if (checkPending) return;
      checkPending = true;

      void getSubjectPlacementIssue(format)
        .then(applyIssue)
        .catch(() => applyIssue(emptySubjectIssue()))
        .finally(() => {
          checkPending = false;
        });
    };

    runCheck();
    const interval = window.setInterval(runCheck, COCO_SUBJECT_CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [acceptedSubjectIssueKey, activeSubjectSignature, format, subjectPromptActive]);

  React.useEffect(() => {
    if (!polishScanEligible) {
      if (polishInactiveResetDoneRef.current) return;
      polishInactiveResetDoneRef.current = true;
      setPostScanChange(null);
      updatePostScanBaselineSignature(null);
      setPolishScanIssue(null);
      setPolishScanStatus("idle");
      setGradeBaselineSignature(null);
      setGradePanelRect(null);
      setGradePresetPreviewed(false);
      setGradePresetChosen(false);
      setGradePresetRect(null);
      polishScanStatusRef.current = "idle";
      clearPolishFlowTimer();
      clearPostScanResumeTimer();
      clearPostScanWatchTimer();
      return;
    }

    polishInactiveResetDoneRef.current = false;
    if (polishScanStatusRef.current !== "idle") return;

    let cancelled = false;
    let settleTimer = 0;
    let watchdogTimer = 0;
    const runId = polishScanRunIdRef.current + 1;
    polishScanRunIdRef.current = runId;
    const startedAt = Date.now();
    setPolishScanIssue(null);
    polishScanStatusRef.current = "scanning";
    setPolishScanStatus("scanning");

    const scanPromise = Promise.race<CocoPolishScanIssue | null>([
      getPolishScanIssue({
        acceptedSubjectIssueKey,
        allowedOverlapPairs,
        activeSubjectSignature: activeSubjectSignature ?? null,
        format,
        hasSubject,
        templateId,
      }),
      new Promise<CocoPolishScanIssue | null>((resolve) => {
        watchdogTimer = window.setTimeout(() => resolve(null), COCO_POLISH_SCAN_MAX_MS);
      }),
    ]);

    void scanPromise
      .then((issue) => {
        if (watchdogTimer) {
          window.clearTimeout(watchdogTimer);
          watchdogTimer = 0;
        }
        const elapsed = Date.now() - startedAt;
        const delay = Math.max(0, COCO_POLISH_SCAN_MIN_MS - elapsed);
        settleTimer = window.setTimeout(() => {
          if (cancelled || polishScanRunIdRef.current !== runId) return;
          if (!issue) {
            updatePostScanBaselineSignature(canvasLayoutSignature ?? null);
            setPostScanChange(null);
            onCaptureCleanLayoutRef.current?.();
          } else {
            updatePostScanBaselineSignature(null);
          }
          setPolishScanIssue(issue);
          polishScanStatusRef.current = issue ? "issue" : "clean";
          setPolishScanStatus(issue ? "issue" : "clean");
        }, delay);
      })
      .catch(() => {
        if (watchdogTimer) {
          window.clearTimeout(watchdogTimer);
          watchdogTimer = 0;
        }
        const elapsed = Date.now() - startedAt;
        const delay = Math.max(0, COCO_POLISH_SCAN_MIN_MS - elapsed);
        settleTimer = window.setTimeout(() => {
          if (cancelled || polishScanRunIdRef.current !== runId) return;
          updatePostScanBaselineSignature(canvasLayoutSignature ?? null);
          setPostScanChange(null);
          onCaptureCleanLayoutRef.current?.();
          setPolishScanIssue(null);
          polishScanStatusRef.current = "clean";
          setPolishScanStatus("clean");
        }, delay);
      });

    return () => {
      cancelled = true;
      if (settleTimer) window.clearTimeout(settleTimer);
      if (watchdogTimer) window.clearTimeout(watchdogTimer);
      if (polishScanRunIdRef.current === runId && polishScanStatusRef.current === "scanning") {
        polishScanStatusRef.current = "idle";
      }
    };
  }, [
    acceptedSubjectIssueKey,
    activeSubjectSignature,
    allowedOverlapPairs,
    canvasLayoutSignature,
    clearPolishFlowTimer,
    clearPostScanResumeTimer,
    clearPostScanWatchTimer,
    format,
    hasSubject,
    polishScanEligible,
    templateId,
    updatePostScanBaselineSignature,
  ]);

  React.useEffect(() => {
    clearPolishFlowTimer();
    if (!polishScanEligible) return;

    if (polishScanStatus === "clean") return undefined;

    if (polishScanStatus === "polish") {
      setGradeBaselineSignature(latestActiveGradeSignatureRef.current);
      setGradePresetPreviewed(false);
      setGradePresetChosen(false);
      onOpenPolish?.();
      const store = useFlyerState.getState();
      if (store.moveTarget) store.setMoveTarget(null);

      polishFlowTimerRef.current = window.setTimeout(() => {
        polishFlowTimerRef.current = null;
        polishScanStatusRef.current = "grade";
        setPolishScanStatus("grade");
      }, COCO_POLISH_OPEN_HOLD_MS);
      return clearPolishFlowTimer;
    }

    return undefined;
  }, [clearPolishFlowTimer, onOpenPolish, polishScanEligible, polishScanStatus]);

  React.useEffect(() => {
    if (polishScanStatus !== "grade") {
      setGradePanelRect(null);
      setGradePresetRect(null);
      return;
    }

    const updatePresetRect = () => {
      setGradePanelRect(getCocoMasterGradePanelRect());
      setGradePresetRect(getCocoGradePresetRect(recommendedGradePreset));
    };

    updatePresetRect();
    const interval = window.setInterval(updatePresetRect, 350);
    window.addEventListener("resize", updatePresetRect);
    window.addEventListener("scroll", updatePresetRect, true);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", updatePresetRect);
      window.removeEventListener("scroll", updatePresetRect, true);
    };
  }, [polishScanStatus, recommendedGradePreset]);

  React.useEffect(() => {
    if (polishScanStatus !== "grade" || gradePresetChosen) return;

    const currentSignature = activeGradeSignature ?? null;
    if (!gradeBaselineSignature) {
      setGradeBaselineSignature(currentSignature);
      return;
    }

    if (currentSignature && currentSignature !== gradeBaselineSignature) {
      setGradePresetPreviewed(true);
    }
  }, [activeGradeSignature, gradeBaselineSignature, gradePresetChosen, polishScanStatus]);

  React.useEffect(() => {
    if (polishScanStatus !== "grade" || gradePresetChosen) return;

    const handlePresetClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("[data-coco-grade-preset]")) return;
      setGradePresetPreviewed(true);
    };

    document.addEventListener("click", handlePresetClick, true);
    return () => document.removeEventListener("click", handlePresetClick, true);
  }, [gradePresetChosen, polishScanStatus]);

  const getCurrentPolishScanIssue = React.useCallback(
    () =>
      getPolishScanIssue({
        acceptedSubjectIssueKey,
        allowedOverlapPairs,
        activeSubjectSignature: latestActiveSubjectSignatureRef.current,
        format: latestFormatRef.current,
        hasSubject: latestHasSubjectRef.current,
        templateId,
      }),
    [acceptedSubjectIssueKey, allowedOverlapPairs, templateId]
  );

  React.useEffect(() => {
    const baselineSignature = postScanBaselineSignatureRef.current;
    const nextSignature = canvasLayoutSignature ?? null;
    const watchableStatus =
      polishScanStatus === "clean" ||
      polishScanStatus === "polish" ||
      polishScanStatus === "grade" ||
      polishScanStatus === "export";

    clearPostScanWatchTimer();

    if (!polishScanEligible || !watchableStatus) return;
    if (!baselineSignature || !nextSignature || nextSignature === baselineSignature) return;

    let cancelled = false;
    const returnStatus = polishScanStatus;

    const runSettledCheck = () => {
      const store = useFlyerState.getState();
      if (store.isLiveDragging || store.dragging) {
        postScanWatchTimerRef.current = window.setTimeout(runSettledCheck, 320);
        return;
      }

      void getCurrentPolishScanIssue()
        .then((issue) => {
          if (cancelled) return;

          const change: CocoPostScanChange = {
            issue,
            returnStatus,
            target: getChangedCanvasLayoutTarget(baselineSignature, nextSignature, issue),
          };
          postScanReturnStatusRef.current = returnStatus;
          setPostScanChange(change);
          setPolishScanIssue(issue);
          clearPolishFlowTimer();
          polishScanStatusRef.current = "post-change";
          setPolishScanStatus("post-change");
        })
        .catch(() => {
          if (cancelled) return;
          const change: CocoPostScanChange = {
            issue: null,
            returnStatus,
            target: getChangedCanvasLayoutTarget(baselineSignature, nextSignature, null),
          };
          postScanReturnStatusRef.current = returnStatus;
          setPostScanChange(change);
          setPolishScanIssue(null);
          clearPolishFlowTimer();
          polishScanStatusRef.current = "post-change";
          setPolishScanStatus("post-change");
        })
        .finally(() => {
          postScanWatchTimerRef.current = null;
        });
    };

    postScanWatchTimerRef.current = window.setTimeout(
      runSettledCheck,
      COCO_POST_SCAN_WATCH_SETTLE_MS
    );

    return () => {
      cancelled = true;
      clearPostScanWatchTimer();
    };
  }, [
    canvasLayoutSignature,
    clearPolishFlowTimer,
    clearPostScanWatchTimer,
    getCurrentPolishScanIssue,
    polishScanEligible,
    polishScanStatus,
  ]);

  const hideCoco = React.useCallback(() => {
    clearInstructionTimer();
    clearKeepOptionTimer();
    clearPolishFlowTimer();
    clearPostScanResumeTimer();
    clearPostScanWatchTimer();
    clearStaticLabelTimer();
    setPostScanChange(null);
    updatePostScanBaselineSignature(null);
    setDismissed(true);
    try {
      window.localStorage.setItem(COCO_DISMISSED_STORAGE_KEY, "1");
    } catch {
      // Ignore storage failures; the session state still hides Coco.
    }
  }, [
    clearInstructionTimer,
    clearKeepOptionTimer,
    clearPolishFlowTimer,
    clearPostScanResumeTimer,
    clearPostScanWatchTimer,
    clearStaticLabelTimer,
    updatePostScanBaselineSignature,
  ]);

  const openCoco = React.useCallback(() => {
    setDismissed(false);
    setIntroActive(true);
    setIntroStepIndex(0);
    setInstructionReady(false);
    setStaticLabelReady(false);
    setTourComplete(false);
    setCinematicPromptStatus("idle");
    setCinematicPromptSeen(false);
    setManualStepIndex(0);
    setLayoutPromptComplete(!hasLayoutOptions);
    setLayoutBaselineId(latestActiveLayoutIdRef.current);
    setLayoutKeepReady(false);
    setLayoutPreviewSeen(false);
    setPalettePromptComplete(!hasPaletteOptions);
    setPaletteBaselineSignature(latestActivePaletteSignatureRef.current);
    setPaletteKeepReady(false);
    setPalettePreviewSeen(false);
    setSubjectPromptComplete(!hasSubject);
    setSubjectBaselineSignature(latestActiveSubjectSignatureRef.current);
    setSubjectIssue(emptySubjectIssue());
    setAcceptedSubjectIssueKey(null);
    setSubjectIssueSeen(false);
    setSubjectKeepReady(false);
    setSubjectPreviewSeen(false);
    setPostScanChange(null);
    updatePostScanBaselineSignature(null);
    setPolishScanIssue(null);
    polishScanStatusRef.current = "idle";
    setPolishScanStatus("idle");
    setGradeBaselineSignature(null);
    setGradePanelRect(null);
    setGradePresetPreviewed(false);
    setGradePresetChosen(false);
    setGradePresetRect(null);
    clearInstructionTimer();
    clearKeepOptionTimer();
    clearPolishFlowTimer();
    clearPostScanResumeTimer();
    clearPostScanWatchTimer();
    clearStaticLabelTimer();
    try {
      window.localStorage.removeItem(COCO_DISMISSED_STORAGE_KEY);
    } catch {
      // Ignore storage failures; the session state still opens Coco.
    }
  }, [
    clearInstructionTimer,
    clearKeepOptionTimer,
    clearPolishFlowTimer,
    clearPostScanResumeTimer,
    clearPostScanWatchTimer,
    clearStaticLabelTimer,
    hasLayoutOptions,
    hasPaletteOptions,
    hasSubject,
    updatePostScanBaselineSignature,
  ]);

  const completeCurrentField = React.useCallback(() => {
    if (!tourActive) return;

    clearKeepOptionTimer();
    setFieldProgress((current) => ({ ...current, canKeep: false }));

    if (activeTextRole === "headline" && onOpenCinematicText && !cinematicPromptSeen) {
      setCinematicPromptSeen(true);
      setCinematicPromptStatus("offer");
      return;
    }

    const maxIndex = textTargets.length - 1;
    if (maxIndex <= 0 || manualStepIndex >= maxIndex) {
      setTourComplete(true);
      return;
    }

    setManualStepIndex((current) => Math.min(current + 1, maxIndex));
  }, [
    activeTextRole,
    cinematicPromptSeen,
    clearKeepOptionTimer,
    manualStepIndex,
    onOpenCinematicText,
    textTargets.length,
    tourActive,
  ]);

  const advanceAfterCinematicPrompt = React.useCallback(() => {
    setCinematicPromptStatus("idle");

    const maxIndex = textTargets.length - 1;
    if (maxIndex <= 0 || manualStepIndex >= maxIndex) {
      setTourComplete(true);
      return;
    }

    setManualStepIndex((current) => Math.min(current + 1, maxIndex));
  }, [manualStepIndex, textTargets.length]);

  const acceptCinematicPrompt = React.useCallback(() => {
    if (!onOpenCinematicText) return;
    setCinematicPromptStatus("instructions");
    onOpenCinematicText();
  }, [onOpenCinematicText]);

  const completeLayoutPrompt = React.useCallback(() => {
    setLayoutBaselineId(latestActiveLayoutIdRef.current);
    setLayoutPreviewSeen(false);
    setLayoutPromptComplete(true);
    setLayoutKeepReady(false);
  }, []);

  const completePalettePrompt = React.useCallback(() => {
    setPaletteBaselineSignature(latestActivePaletteSignatureRef.current);
    setPalettePreviewSeen(false);
    setPalettePromptComplete(true);
    setPaletteKeepReady(false);
  }, []);

  const completeSubjectPrompt = React.useCallback(() => {
    setSubjectBaselineSignature(latestActiveSubjectSignatureRef.current);
    const acceptedKey = getSubjectIssueKey(subjectIssue, latestActiveSubjectSignatureRef.current);
    if (
      acceptedKey &&
      (subjectIssue.type === "hero-combo" ||
        (format === "story" && subjectIssue.type === "text-overlap"))
    ) {
      setAcceptedSubjectIssueKey(acceptedKey);
    }
    setSubjectIssue(emptySubjectIssue(subjectIssue.rect));
    setSubjectIssueSeen(false);
    setSubjectPreviewSeen(false);
    setSubjectPromptComplete(true);
    setSubjectKeepReady(false);
  }, [format, subjectIssue]);

  const chooseFormat = React.useCallback(
    (nextFormat: "square" | "story") => {
      if (pendingFormatChoice) return;

      if (nextFormat === format) {
        setFormatPromptComplete(true);
        return;
      }

      if (!onChooseFormat) {
        setFormatPromptComplete(true);
        return;
      }

      setPendingFormatChoice(nextFormat);
      onChooseFormat(nextFormat);
    },
    [format, onChooseFormat, pendingFormatChoice]
  );

  const focusCurrentTextField = React.useCallback(() => {
    if (!tourActive || !activeTextRole) return;

    const store = useFlyerState.getState();
    const nextPanel = getEditorPanelForTextRole(activeTextRole);
    const nextMoveTarget = getMoveTargetForTextRole(activeTextRole);

    if (store.moveTarget !== nextMoveTarget) {
      store.setMoveTarget(nextMoveTarget);
    }
    if (store.selectedPanel !== nextPanel) {
      store.setSelectedPanel(nextPanel);
    }
    onOpenTextField?.(activeTextRole);
    cocoOpenedTextRoleRef.current = activeTextRole;

    cocoSelectedPanelRef.current = nextPanel;
    cocoMoveTargetRef.current = nextMoveTarget;
    setFieldProgress((current) =>
      current.role === activeTextRole ? { ...current, canKeep: false } : current
    );
  }, [activeTextRole, onOpenTextField, tourActive]);
  const keepCurrentOverlap = React.useCallback(() => {
    if (!tourActive || !activeTextRole) return;

    if (currentLayoutIssue === "subject-overlap") {
      if (currentSubjectIssueKey) {
        setAcceptedSubjectIssueKey(currentSubjectIssueKey);
      }
      setFieldProgress((current) =>
        current.role === activeTextRole
          ? {
              ...current,
              canKeep: false,
              layoutIssue: null,
              layoutIssueSeen: true,
              overlapRole: null,
              settled: true,
              subjectIssueKey: null,
            }
          : current
      );
      completeCurrentField();
      return;
    }

    if (!currentOverlapRole) return;

    const pairKey = getCocoOverlapPairKey(activeTextRole, currentOverlapRole);
    setAllowedOverlapPairs((current) => {
      if (current.has(pairKey)) return current;
      const next = new Set(current);
      next.add(pairKey);
      return next;
    });
    setFieldProgress((current) =>
      current.role === activeTextRole
        ? {
            ...current,
            canKeep: false,
            layoutIssue: null,
            layoutIssueSeen: true,
            overlapRole: null,
            settled: true,
            subjectIssueKey: null,
          }
        : current
    );
    completeCurrentField();
  }, [
    activeTextRole,
    completeCurrentField,
    currentLayoutIssue,
    currentOverlapRole,
    currentSubjectIssueKey,
    tourActive,
  ]);
  const openFinalExport = React.useCallback(() => {
    onOpenExport?.();
  }, [onOpenExport]);
  const continuePolishAfterCleanScan = React.useCallback(() => {
    if (polishScanStatusRef.current !== "clean") return;
    clearPolishFlowTimer();
    polishScanStatusRef.current = "polish";
    setPolishScanStatus("polish");
  }, [clearPolishFlowTimer]);
  const completeGradeSelection = React.useCallback(() => {
    if (polishScanStatusRef.current !== "grade") return;
    clearPolishFlowTimer();
    setGradePresetChosen(true);
    polishScanStatusRef.current = "export";
    setPolishScanStatus("export");
  }, [clearPolishFlowTimer]);

  const focusPolishScanIssue = React.useCallback(() => {
    if (!polishScanIssue) return;

    clearPolishFlowTimer();
    clearPostScanWatchTimer();
    setPostScanChange(null);

    if (
      polishScanIssue.kind === "subject" ||
      (polishScanIssue.kind === "text-layout" &&
        polishScanIssue.issueType === "subject-overlap" &&
        onOpenSubjectOptions)
    ) {
      const store = useFlyerState.getState();
      if (store.moveTarget !== "portrait") {
        store.setMoveTarget("portrait");
      }
      if (store.selectedPanel !== "portrait") {
        store.setSelectedPanel("portrait");
      }
      onOpenSubjectOptions?.();
      cocoSubjectPanelOpenRef.current = true;
      cocoSelectedPanelRef.current = "portrait";
      cocoMoveTargetRef.current = "portrait";
      cocoOpenedTextRoleRef.current = null;
    } else {
      const role = polishScanIssue.role;
      const store = useFlyerState.getState();
      const nextPanel = getEditorPanelForTextRole(role);
      const nextMoveTarget = getMoveTargetForTextRole(role);

      if (store.moveTarget !== nextMoveTarget) {
        store.setMoveTarget(nextMoveTarget);
      }
      if (store.selectedPanel !== nextPanel) {
        store.setSelectedPanel(nextPanel);
      }
      onOpenTextField?.(role);
      cocoOpenedTextRoleRef.current = role;
      cocoSelectedPanelRef.current = nextPanel;
      cocoMoveTargetRef.current = nextMoveTarget;

      const nextIndex = textTargets.findIndex((target) => target.role === role);
      if (nextIndex >= 0) {
        setManualStepIndex(nextIndex);
      }
    }

    postScanReturnStatusRef.current = "clean";
    polishScanStatusRef.current = "rescan-needed";
    setPolishScanStatus("rescan-needed");
  }, [
    clearPolishFlowTimer,
    clearPostScanWatchTimer,
    onOpenSubjectOptions,
    onOpenTextField,
    polishScanIssue,
    textTargets,
  ]);

  const acknowledgePostScanChange = React.useCallback(() => {
    if (!postScanChange) return;
    clearPostScanWatchTimer();
    clearPolishFlowTimer();
    const acceptedSignature = canvasLayoutSignature ?? null;
    if (acceptedSignature) {
      updatePostScanBaselineSignature(acceptedSignature);
      onCaptureCleanLayoutRef.current?.();
    }
    postScanReturnStatusRef.current = postScanChange.returnStatus;
    setPostScanChange(null);
    setPolishScanIssue(null);
    polishScanStatusRef.current = "rescan-offer";
    setPolishScanStatus("rescan-offer");
  }, [
    canvasLayoutSignature,
    clearPolishFlowTimer,
    clearPostScanWatchTimer,
    postScanChange,
    updatePostScanBaselineSignature,
  ]);

  const continueAfterAcceptedPostScanChange = React.useCallback(() => {
    const returnStatus = postScanReturnStatusRef.current;
    clearPostScanWatchTimer();
    clearPolishFlowTimer();
    setPostScanChange(null);
    setPolishScanIssue(null);
    polishScanStatusRef.current = returnStatus;
    setPolishScanStatus(returnStatus);
  }, [clearPolishFlowTimer, clearPostScanWatchTimer]);

  const restorePostScanChange = React.useCallback(() => {
    if (!postScanChange) return;
    clearPostScanResumeTimer();
    clearPostScanWatchTimer();
    clearPolishFlowTimer();
    onRestoreCleanLayout?.(postScanChange.target);
    const returnStatus = postScanChange.returnStatus;

    polishScanStatusRef.current = "restored";
    setPolishScanStatus("restored");

    postScanResumeTimerRef.current = window.setTimeout(() => {
      postScanResumeTimerRef.current = null;
      setPostScanChange(null);
      polishScanStatusRef.current = returnStatus;
      setPolishScanStatus(returnStatus);
    }, COCO_POST_SCAN_RESTORE_HOLD_MS);
  }, [
    clearPolishFlowTimer,
    clearPostScanResumeTimer,
    clearPostScanWatchTimer,
    onRestoreCleanLayout,
    postScanChange,
  ]);

  const rescanPostScanChange = React.useCallback(() => {
    const returnStatus = postScanChange?.returnStatus ?? postScanReturnStatusRef.current;
    clearPostScanWatchTimer();
    clearPolishFlowTimer();
    setPolishScanIssue(null);
    polishScanStatusRef.current = "scanning";
    setPolishScanStatus("scanning");

    const startedAt = Date.now();
    const runId = polishScanRunIdRef.current + 1;
    polishScanRunIdRef.current = runId;
    let watchdogTimer = 0;

    const scanPromise = Promise.race<CocoPolishScanIssue | null>([
      getCurrentPolishScanIssue(),
      new Promise<CocoPolishScanIssue | null>((resolve) => {
        watchdogTimer = window.setTimeout(() => resolve(null), COCO_POST_SCAN_RESCAN_MAX_MS);
      }),
    ]);

    void scanPromise
      .then((issue) => {
        if (watchdogTimer) {
          window.clearTimeout(watchdogTimer);
          watchdogTimer = 0;
        }
        const elapsed = Date.now() - startedAt;
        const delay = Math.max(0, COCO_POST_SCAN_RESCAN_MIN_MS - elapsed);
        polishFlowTimerRef.current = window.setTimeout(() => {
          polishFlowTimerRef.current = null;
          if (polishScanRunIdRef.current !== runId) return;

          if (issue) {
            if (!postScanChange) {
              setPolishScanIssue(issue);
              polishScanStatusRef.current = "issue";
              setPolishScanStatus("issue");
              return;
            }

            const nextSignature = canvasLayoutSignature ?? null;
            const change: CocoPostScanChange = {
              issue,
              returnStatus,
              target: getChangedCanvasLayoutTarget(
                postScanBaselineSignatureRef.current,
                nextSignature,
                issue
              ),
            };
            setPostScanChange(change);
            setPolishScanIssue(issue);
            polishScanStatusRef.current = "post-change";
            setPolishScanStatus("post-change");
            return;
          }

          updatePostScanBaselineSignature(canvasLayoutSignature ?? null);
          setPostScanChange(null);
          setPolishScanIssue(null);
          onCaptureCleanLayoutRef.current?.();
          polishScanStatusRef.current = returnStatus;
          setPolishScanStatus(returnStatus);
        }, delay);
      })
      .catch(() => {
        if (watchdogTimer) {
          window.clearTimeout(watchdogTimer);
          watchdogTimer = 0;
        }
        const elapsed = Date.now() - startedAt;
        const delay = Math.max(0, COCO_POST_SCAN_RESCAN_MIN_MS - elapsed);
        polishFlowTimerRef.current = window.setTimeout(() => {
          polishFlowTimerRef.current = null;
          if (polishScanRunIdRef.current !== runId) return;

          updatePostScanBaselineSignature(canvasLayoutSignature ?? null);
          setPostScanChange(null);
          setPolishScanIssue(null);
          onCaptureCleanLayoutRef.current?.();
          polishScanStatusRef.current = returnStatus;
          setPolishScanStatus(returnStatus);
        }, delay);
      });
  }, [
    canvasLayoutSignature,
    clearPolishFlowTimer,
    clearPostScanWatchTimer,
    getCurrentPolishScanIssue,
    postScanChange,
    updatePostScanBaselineSignature,
  ]);

  const finalArtDirectorAction =
    cocoFinalArtDirectorResult.decision.status === "approved"
      ? null
      : cocoFinalArtDirectorResult.decision.action ?? cocoJudgment.actions[0] ?? null;
  const runFinalArtDirectorFix = React.useCallback(() => {
    if (!finalArtDirectorAction || !onRunAction) return;
    clearPolishFlowTimer();
    onRunAction(finalArtDirectorAction);
    postScanReturnStatusRef.current = "export";
    polishScanStatusRef.current = "rescan-needed";
    setPolishScanStatus("rescan-needed");
  }, [clearPolishFlowTimer, finalArtDirectorAction, onRunAction]);

  const canAdvanceCurrentField =
    tourActive && !cinematicPromptActive && (currentFieldSettled || currentLayoutFixed);
  const canKeepCurrentField = tourActive && !cinematicPromptActive && currentFieldCanKeep;
  const canFixCurrentOverlap =
    tourActive &&
    !cinematicPromptActive &&
    ((currentLayoutIssue === "overlap" && Boolean(currentOverlapRole)) ||
      currentLayoutIssue === "subject-overlap");
  const canContinueCleanScan = polishScanStatus === "clean";
  const canFixPolishScanIssue = polishScanStatus === "issue" && Boolean(polishScanIssue);
  const canCompleteGradeSelection =
    polishScanStatus === "grade" && gradePresetPreviewed && !gradePresetChosen;
  const postScanLayoutDirty = Boolean(
    postScanBaselineSignature &&
      canvasLayoutSignature &&
      canvasLayoutSignature !== postScanBaselineSignature
  );
  const canFixFinalArtDirectorIssue =
    polishScanStatus === "export" &&
    !postScanLayoutDirty &&
    Boolean(finalArtDirectorAction && onRunAction) &&
    cocoFinalArtDirectorResult.decision.status !== "approved";
  const canOpenFinalExport =
    polishScanStatus === "export" &&
    !postScanLayoutDirty &&
    Boolean(onOpenExport) &&
    !canFixFinalArtDirectorIssue;
  const canContinueCinematicPrompt = cinematicPromptStatus === "instructions";
  const showCinematicOfferControls = cinematicPromptStatus === "offer";
  const showOverlapControls = canFixCurrentOverlap;
  const showPostScanChangeControls = polishScanStatus === "post-change" && Boolean(postScanChange);
  const showPostScanRescanControl = polishScanStatus === "rescan-needed";
  const showPostScanRescanOfferControls = polishScanStatus === "rescan-offer";
  const showFormatControls = formatPromptActive && !styleReadActive && !pendingFormatChoice;
  const showLayoutKeepControl = layoutPromptActive && (layoutPreviewSeen || layoutKeepReady);
  const showPaletteKeepControl = palettePromptActive && (palettePreviewSeen || paletteKeepReady);
  const judgmentAction =
    cocoJudgment.actions.find((action) => action.id === "make-nightlife-impact") ??
    cocoJudgment.actions[0] ??
    null;
  const showSubjectKeepControl =
    subjectPromptActive &&
    (subjectIssue.type === "hero-combo" ||
      subjectTextOverlapCanKeep ||
      (!subjectIssue.type && (subjectPreviewSeen || subjectIssueSeen || subjectKeepReady)));
  const showCocoFieldControls =
    showLayoutKeepControl ||
    showPaletteKeepControl ||
    showSubjectKeepControl ||
    canFixPolishScanIssue ||
    canFixFinalArtDirectorIssue ||
    canContinueCleanScan ||
    canCompleteGradeSelection ||
    canOpenFinalExport ||
    canContinueCinematicPrompt ||
    canAdvanceCurrentField ||
    canKeepCurrentField;
  const showJudgmentActionControl =
    Boolean(judgmentAction && onRunAction) &&
    !introActive &&
    !styleReadActive &&
    !formatPromptActive &&
    !layoutPromptActive &&
    !palettePromptActive &&
    !subjectPromptActive &&
    !polishScanActive &&
    cinematicPromptStatus === "idle" &&
    !showOverlapControls &&
    !showPostScanChangeControls &&
    !showPostScanRescanControl &&
    !showPostScanRescanOfferControls &&
    !showCocoFieldControls;
  const controlsRightOffset = showFormatControls
    ? 118
    : showCinematicOfferControls
      ? 92
      : showPostScanChangeControls
        ? 148
        : showPostScanRescanOfferControls
          ? 132
        : showPostScanRescanControl
          ? 84
          : showOverlapControls
            ? 96
            : canFixPolishScanIssue
            ? 58
            : canFixFinalArtDirectorIssue
            ? 58
            : showJudgmentActionControl
              ? 74
            : showCocoFieldControls
              ? 58
              : 0;
  const cocoFieldActionLabel = showLayoutKeepControl
    ? layoutPreviewSeen
      ? "Use this layout"
      : "Keep this layout"
    : showPaletteKeepControl
      ? palettePreviewSeen
        ? "Use this color mood"
        : "Keep this color mood"
    : showSubjectKeepControl
      ? subjectIssue.type === "hero-combo"
        ? "Keep hero combo"
        : subjectTextOverlapCanKeep
        ? "Keep this subject placement"
        : subjectPreviewSeen
        ? "Use this subject"
        : "Keep this subject"
    : canFixPolishScanIssue
      ? "Fix scan issue"
    : canFixFinalArtDirectorIssue
      ? "Fix final pass"
    : canContinueCleanScan
      ? "Continue to polish"
    : canCompleteGradeSelection
      ? "Done"
    : canOpenFinalExport
      ? "Export final flyer"
    : canContinueCinematicPrompt
      ? "Continue editing"
    : canAdvanceCurrentField
      ? isLastTextField
        ? "Finish Coco text tour"
        : "Go to next text field"
      : "Keep this text";
  const cocoFieldActionTitle = showLayoutKeepControl
    ? layoutPreviewSeen
      ? "Use layout"
      : "Keep layout"
    : showPaletteKeepControl
      ? palettePreviewSeen
        ? "Use colors"
        : "Keep colors"
    : showSubjectKeepControl
      ? subjectIssue.type === "hero-combo"
        ? "Keep hero combo"
        : subjectTextOverlapCanKeep
        ? "Keep placement"
        : "Keep subject"
    : canFixPolishScanIssue
      ? "Fix"
    : canFixFinalArtDirectorIssue
      ? "Fix"
    : canContinueCleanScan
      ? "Continue"
    : canCompleteGradeSelection
      ? "Done"
    : canOpenFinalExport
      ? "Export"
    : canContinueCinematicPrompt
      ? "Continue"
    : canAdvanceCurrentField
      ? isLastTextField
        ? "Finish"
        : "Next"
      : "Keep";
  const cocoFieldActionType = showLayoutKeepControl
    ? "keep-layout"
    : showPaletteKeepControl
      ? "keep-palette"
    : showSubjectKeepControl
      ? "keep-subject"
    : canFixPolishScanIssue
      ? "fix-polish-scan-issue"
    : canFixFinalArtDirectorIssue
      ? "fix-final-pass"
    : canContinueCleanScan
      ? "continue-polish"
    : canCompleteGradeSelection
      ? "finish-grade"
    : canOpenFinalExport
      ? "export-final"
    : canContinueCinematicPrompt
      ? "continue-cinematic"
    : canAdvanceCurrentField
      ? "next"
      : "keep";
  const cocoFieldActionHandler = showLayoutKeepControl
    ? completeLayoutPrompt
    : showPaletteKeepControl
      ? completePalettePrompt
    : showSubjectKeepControl
      ? completeSubjectPrompt
    : canFixPolishScanIssue
      ? focusPolishScanIssue
    : canFixFinalArtDirectorIssue
      ? runFinalArtDirectorFix
    : canContinueCleanScan
      ? continuePolishAfterCleanScan
    : canCompleteGradeSelection
      ? completeGradeSelection
    : canOpenFinalExport
      ? openFinalExport
    : canContinueCinematicPrompt
      ? advanceAfterCinematicPrompt
    : completeCurrentField;
  const runJudgmentAction = React.useCallback(() => {
    if (!judgmentAction || !onRunAction) return;
    onRunAction(judgmentAction);
  }, [judgmentAction, onRunAction]);

  if (!mounted || !active) return null;

  if (dismissed) {
    return createPortal(
      <>
        <CocoMotionStyle />
        <button
          aria-label="Open Coco creative director"
          className="pointer-events-auto fixed bottom-[calc(env(safe-area-inset-bottom,0px)+18px)] right-4 z-[7000] grid h-12 w-12 place-items-center rounded-full bg-transparent text-white transition hover:scale-105"
          data-nonexport="true"
          onClick={openCoco}
          type="button"
        >
          <CocoAvatar compact />
        </button>
      </>,
      document.body
    );
  }

  if (!isMobile && !artboardRect) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[7000]" data-nonexport="true">
      <CocoMotionStyle />

      <AnimatePresence initial={false}>
        {polishScanStatus === "scanning" ? (
          <motion.div
            animate={{
              backdropFilter: "blur(8px) saturate(0.84) brightness(0.62)",
              opacity: 1,
            }}
            className="pointer-events-none fixed inset-0"
            data-coco-app-scan-scrim="true"
            exit={{
              backdropFilter: "blur(0px) saturate(1) brightness(1)",
              opacity: 0,
            }}
            initial={{
              backdropFilter: "blur(0px) saturate(1) brightness(1)",
              opacity: 0,
            }}
            style={{
              background: "rgba(2,4,10,0.56)",
              boxShadow: "inset 0 0 180px rgba(0,0,0,0.38)",
              WebkitBackdropFilter: "blur(8px) saturate(0.84) brightness(0.62)",
            }}
            transition={{
              backdropFilter: { duration: 0.72, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.52, ease: [0.16, 1, 0.3, 1] },
            }}
          />
        ) : null}
      </AnimatePresence>

      {targetZone && !reviewMode && !isMobile && !subjectPromptActive ? (
        <motion.div
          animate={{
            height: targetZone.height,
            left: targetZone.left,
            opacity: 1,
            top: targetZone.top,
            width: targetZone.width,
          }}
          className="pointer-events-none fixed overflow-hidden"
          data-coco-shimmer="true"
          data-coco-target-role={
            layoutPromptActive
              ? "layout"
              : palettePromptActive
                ? "palette"
              : subjectPromptActive
                ? "subject"
                : postScanReviewActive
                  ? "post-scan-change"
                  : polishScanStatus === "grade"
                    ? "grade-preset"
                    : tourTextTarget?.role
          }
          initial={false}
          style={{
            animation: "cocoTargetBreath 2.8s ease-in-out infinite",
            background:
              "radial-gradient(circle at 18% 12%, rgba(103,232,249,0.16), transparent 38%), radial-gradient(circle at 80% 82%, rgba(217,70,239,0.14), transparent 44%), linear-gradient(135deg, rgba(255,255,255,0.035), rgba(103,232,249,0.045), rgba(217,70,239,0.035))",
            borderRadius: targetZone.radius,
            boxShadow:
              "inset 0 0 26px rgba(103,232,249,0.16), inset 0 0 54px rgba(217,70,239,0.08), 0 0 28px rgba(34,211,238,0.08)",
            mixBlendMode: "screen",
          }}
          transition={{ damping: 30, mass: 0.8, stiffness: 95, type: "spring" }}
        >
          <span
            className="absolute -top-1/4 h-[150%] w-[42%] rounded-full blur-[10px]"
            style={{
              animation: "cocoTargetSweep 2.25s cubic-bezier(.16,1,.3,1) infinite",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(103,232,249,0.18) 28%, rgba(255,255,255,0.38) 52%, rgba(217,70,239,0.2) 72%, transparent 100%)",
            }}
          />
          <span
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, transparent, rgba(255,255,255,0.055), transparent)",
            }}
          />
        </motion.div>
      ) : null}

      <motion.div
        animate={{
          filter: "blur(0px)",
          opacity: 1,
          scale: 1,
          height: cocoStageHeight,
          width: cocoStageWidth,
          x: cocoDisplayLeft,
          y: cocoDisplayTop,
        }}
        aria-live="polite"
        className="pointer-events-none fixed text-white"
        data-coco-director="true"
        id="coco-director-root"
        ref={directorRootRef}
        initial={{
          filter: "blur(8px)",
          height: cocoStageHeight,
          opacity: 0,
          scale: 0.985,
          width: cocoStageWidth,
          x: cocoDisplayLeft,
          y: cocoDisplayTop + 16,
        }}
        style={{
          background: "transparent",
          border: 0,
          borderRadius: 0,
          boxShadow: "none",
          height: cocoStageHeight,
          left: 0,
          outline: 0,
          top: 0,
          width: cocoStageWidth,
          willChange: "transform, opacity, width, height",
        }}
        transition={{
          filter: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
          height: { damping: 32, mass: 0.75, stiffness: 105, type: "spring" },
          opacity: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
          width: { damping: 32, mass: 0.75, stiffness: 105, type: "spring" },
          x: { damping: 34, mass: 0.9, stiffness: 92, type: "spring" },
          y: { damping: 34, mass: 0.9, stiffness: 92, type: "spring" },
        }}
      >
        <span className="absolute left-0 top-1/2 z-10 block h-[52px] w-[52px] -translate-y-1/2 drop-shadow-[0_10px_28px_rgba(0,0,0,0.48)]">
          <CocoAvatar className={tone.glow} />
        </span>

        <div
          className="absolute top-1/2 z-0 -translate-y-1/2 overflow-hidden rounded-full py-2 pl-5 pr-11"
          style={{
            background:
              "linear-gradient(90deg, rgba(1,2,5,0.9) 0%, rgba(1,2,5,0.8) 58%, rgba(1,2,5,0.48) 100%)",
            backdropFilter: "blur(14px) saturate(1.1)",
            boxShadow: "0 10px 28px rgba(0,0,0,0.46)",
            height: cocoBubbleHeight,
            left: 40,
            right: 0,
            WebkitBackdropFilter: "blur(14px) saturate(1.1)",
          }}
        >
          <button
            aria-label="Hide Coco"
            className="pointer-events-auto absolute right-4 top-[10px] z-10 grid h-5 w-5 place-items-center p-0 text-white/58 transition-colors hover:text-white"
            onClick={hideCoco}
            style={{
              WebkitAppearance: "none",
              appearance: "none",
              background: "transparent",
              border: 0,
              borderRadius: 0,
              boxShadow: "none",
              outline: 0,
            }}
            type="button"
          >
            <span aria-hidden="true" className="block text-[15px] font-medium leading-none">
              ×
            </span>
          </button>
          {polishScanStatus === "scanning" ? (
            <span
              aria-hidden="true"
              className="absolute bottom-[7px] left-6 right-11 h-[2px] overflow-hidden bg-white/[0.055]"
              style={{
                borderRadius: 999,
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.025)",
              }}
            >
              <span
                className="absolute inset-y-0 left-0 w-[46%]"
                style={{
                  animation: "cocoScanMeter 1.9s cubic-bezier(.16,1,.3,1) infinite",
                  background:
                    "linear-gradient(90deg, transparent, rgba(103,232,249,0.86), rgba(255,255,255,0.9), rgba(217,70,239,0.56), transparent)",
                  borderRadius: 999,
                  boxShadow: "0 0 14px rgba(103,232,249,0.22)",
                  transformOrigin: "center",
                }}
              />
            </span>
          ) : null}

          {introActive ? (
            <div className="relative h-full pr-6">
              <AnimatePresence initial={false}>
                <motion.div
                  animate={{ filter: "blur(0px)", opacity: 1, scale: 1, y: 0 }}
                  className="absolute inset-x-0 top-0 flex h-full flex-col justify-center whitespace-nowrap text-white"
                  data-coco-message="true"
                  exit={{ filter: "blur(6px)", opacity: 0, scale: 0.985, y: -8 }}
                  initial={{ filter: "blur(6px)", opacity: 0, scale: 0.985, y: 8 }}
                  key={`intro-${currentIntroStep.id}`}
                  transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
                >
                  {currentIntroStep.id === "begin" ? (
                    <>
                      <span className="block text-[17px] font-normal leading-[19px] text-white/92">
                        {"Let's begin."}
                      </span>
                    </>
                  ) : currentIntroStep.id === "hello" ? (
                    <>
                      <span className="block text-[20px] font-normal leading-[20px] text-white/94">
                        HI!
                      </span>
                      <span className="mt-[3px] block text-[15px] leading-[16px] text-white/92">
                        {"I'm Coco"}
                      </span>
                    </>
                  ) : currentIntroStep.id === "assistant" ? (
                    <>
                      <span className="block text-[16px] font-normal leading-[18px] text-white/92">
                        {"I'm your design assistant"}
                      </span>
                    </>
                  ) : currentIntroStep.id === "plan" ? (
                    <>
                      <span className="block text-[13px] font-normal leading-[15px] text-white/88">
                        {"We'll update text, colors,"}
                      </span>
                      <span className="mt-[3px] block text-[15px] font-normal leading-[16px] text-white/92">
                        images, and polish.
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="block text-[15px] font-normal leading-[16px] text-white/88">
                        {"Now, let's make this"}
                      </span>
                      <span className="mt-[2px] block text-[16px] font-normal leading-[18px] text-white/92">
                        flyer yours.
                      </span>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <>
              <div className="flex h-[14px] items-center">
                <AnimatePresence initial={false}>
                  {staticLabelReady ? (
                    <motion.p
                      animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                      className="text-[17px] font-semibold leading-none text-white"
                      data-coco-static-label="true"
                      exit={{ filter: "blur(5px)", opacity: 0, y: -4 }}
                      initial={{ filter: "blur(5px)", opacity: 0, y: 4 }}
                      key="coco-static-label"
                      onAnimationComplete={() =>
                        scheduleInstruction(COCO_INSTRUCTION_AFTER_LABEL_MS)
                      }
                      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                    >
                      Coco
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>
              <div
                className="relative mt-[5px] overflow-hidden"
                style={{ height: cocoMessageHeight }}
              >
                <AnimatePresence initial={false} mode="wait">
                  {instructionReady ? (
                    <motion.div
                      animate={{ filter: "blur(0px)", opacity: 1, scale: 1, y: 0 }}
                      className="absolute inset-x-0 top-0 flex flex-col justify-center overflow-hidden text-[12px] font-medium leading-[15px] text-white/82"
                      data-coco-message="true"
                      exit={{ filter: "blur(6px)", opacity: 0, scale: 0.99, y: -8 }}
                      initial={{ filter: "blur(6px)", opacity: 0, scale: 0.99, y: 8 }}
                      key={`${
                        formatPromptActive
                          ? "format"
                        : layoutPromptActive
                          ? "layout"
                          : palettePromptActive
                            ? "palette"
                            : subjectPromptActive
                              ? "subject"
                              : polishScanActive
                                ? "polish"
                              : activeTextRole ?? step.id
                      }-${primaryText}`}
                      style={{ height: cocoMessageHeight, right: controlsRightOffset }}
                      transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {primaryLines.map((line, index) => (
                        <span
                          className="block overflow-hidden text-ellipsis whitespace-nowrap"
                          key={`${line}-${index}`}
                        >
                          {line}
                        </span>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <AnimatePresence initial={false}>
                  {showFormatControls ? (
                    <motion.div
                      animate={{ filter: "blur(0px)", opacity: 1, scale: 1, y: "-50%" }}
                      className="absolute right-0 top-1/2 flex items-center gap-1"
                      exit={{ filter: "blur(5px)", opacity: 0, scale: 0.96, y: "-50%" }}
                      initial={{ filter: "blur(5px)", opacity: 0, scale: 0.96, y: "-50%" }}
                      key="format-controls"
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {(["square", "story"] as const).map((choice) => {
                        const activeChoice = format === choice;
                        return (
                          <button
                            aria-label={`Choose ${choice === "square" ? "Square" : "Story"} format`}
                            className="pointer-events-auto"
                            data-coco-format-active={activeChoice ? "true" : "false"}
                            data-coco-format-choice={choice}
                            key={choice}
                            onClick={() => chooseFormat(choice)}
                            type="button"
                          >
                            {choice === "square" ? "Square" : "Story"}
                          </button>
                        );
                      })}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <AnimatePresence initial={false}>
                  {showCinematicOfferControls ? (
                    <motion.div
                      animate={{ filter: "blur(0px)", opacity: 1, scale: 1, y: "-50%" }}
                      className="absolute right-0 top-1/2 flex items-center gap-1"
                      exit={{ filter: "blur(5px)", opacity: 0, scale: 0.96, y: "-50%" }}
                      initial={{ filter: "blur(5px)", opacity: 0, scale: 0.96, y: "-50%" }}
                      key="cinematic-controls"
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <button
                        aria-label="Open Cinematic 3D"
                        className="pointer-events-auto h-[20px] rounded-full border border-cyan-300/35 bg-cyan-300/[0.14] px-2 text-[10px] font-semibold leading-none text-cyan-50 transition hover:border-cyan-200/60 hover:bg-cyan-200/[0.2] hover:text-white"
                        data-coco-action="open-cinematic-3d"
                        onClick={acceptCinematicPrompt}
                        type="button"
                      >
                        OK
                      </button>
                      <button
                        aria-label="Skip Cinematic 3D"
                        className="pointer-events-auto h-[20px] rounded-full border border-white/12 bg-white/[0.07] px-2 text-[10px] font-medium leading-none text-white/72 transition hover:border-white/28 hover:bg-white/[0.14] hover:text-white"
                        data-coco-action="skip-cinematic-3d"
                        onClick={advanceAfterCinematicPrompt}
                        type="button"
                      >
                        Skip
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <AnimatePresence initial={false}>
                  {showOverlapControls ? (
                    <motion.div
                      animate={{ filter: "blur(0px)", opacity: 1, scale: 1, y: "-50%" }}
                      className="absolute right-0 top-1/2 flex items-center gap-1"
                      exit={{ filter: "blur(5px)", opacity: 0, scale: 0.96, y: "-50%" }}
                      initial={{ filter: "blur(5px)", opacity: 0, scale: 0.96, y: "-50%" }}
                      key="overlap-controls"
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <button
                        aria-label="Edit overlapping text"
                        className="pointer-events-auto grid h-[20px] w-[20px] place-items-center rounded-full border border-white/15 bg-white/[0.08] text-white/78 transition hover:border-white/30 hover:bg-white/[0.16] hover:text-white"
                        data-coco-action="fix-overlap"
                        onClick={focusCurrentTextField}
                        title="Edit"
                        type="button"
                      >
                        <Pencil aria-hidden="true" size={11} strokeWidth={2.4} />
                      </button>
                      <button
                        aria-label="Keep this overlap"
                        className="pointer-events-auto grid h-[20px] w-[20px] place-items-center rounded-full border border-cyan-300/35 bg-cyan-300/[0.13] text-cyan-50 transition hover:border-cyan-200/60 hover:bg-cyan-200/[0.2] hover:text-white"
                        data-coco-action="keep-overlap"
                        onClick={keepCurrentOverlap}
                        title="Keep"
                        type="button"
                      >
                        <Check aria-hidden="true" size={11} strokeWidth={2.5} />
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <AnimatePresence initial={false}>
                  {showPostScanChangeControls ? (
                    <motion.div
                      animate={{ filter: "blur(0px)", opacity: 1, scale: 1, y: "-50%" }}
                      className="absolute right-0 top-1/2 flex items-center gap-1"
                      exit={{ filter: "blur(5px)", opacity: 0, scale: 0.96, y: "-50%" }}
                      initial={{ filter: "blur(5px)", opacity: 0, scale: 0.96, y: "-50%" }}
                      key="post-scan-change-controls"
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <button
                        aria-label="Confirm this post-scan change"
                        className="pointer-events-auto h-[20px] rounded-full border border-cyan-300/35 bg-cyan-300/[0.14] px-2 text-[10px] font-semibold leading-none text-cyan-50 transition hover:border-cyan-200/60 hover:bg-cyan-200/[0.2] hover:text-white"
                        data-coco-action="confirm-post-scan-change"
                        onClick={acknowledgePostScanChange}
                        type="button"
                      >
                        Yes
                      </button>
                      <button
                        aria-label="Put the changed object back"
                        className="pointer-events-auto h-[20px] rounded-full border border-white/12 bg-white/[0.07] px-2 text-[10px] font-medium leading-none text-white/76 transition hover:border-white/28 hover:bg-white/[0.14] hover:text-white"
                        data-coco-action="restore-post-scan-change"
                        onClick={restorePostScanChange}
                        type="button"
                      >
                        Put it back
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <AnimatePresence initial={false}>
                  {showPostScanRescanControl || showPostScanRescanOfferControls ? (
                    <motion.div
                      animate={{ filter: "blur(0px)", opacity: 1, scale: 1, y: "-50%" }}
                      className="absolute right-0 top-1/2 flex items-center gap-1"
                      exit={{ filter: "blur(5px)", opacity: 0, scale: 0.96, y: "-50%" }}
                      initial={{ filter: "blur(5px)", opacity: 0, scale: 0.96, y: "-50%" }}
                      key={
                        showPostScanRescanOfferControls
                          ? "post-scan-rescan-offer-controls"
                          : "post-scan-rescan-control"
                      }
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <button
                        aria-label="Rescan the flyer"
                        className="pointer-events-auto h-[20px] rounded-full border border-cyan-300/35 bg-cyan-300/[0.14] px-2.5 text-[10px] font-semibold leading-none text-cyan-50 transition hover:border-cyan-200/60 hover:bg-cyan-200/[0.2] hover:text-white"
                        data-coco-action="rescan-post-scan-change"
                        onClick={rescanPostScanChange}
                        type="button"
                      >
                        Rescan
                      </button>
                      {showPostScanRescanOfferControls ? (
                        <button
                          aria-label="Continue without rescanning"
                          className="pointer-events-auto h-[20px] rounded-full border border-white/12 bg-white/[0.07] px-2.5 text-[10px] font-medium leading-none text-white/76 transition hover:border-white/28 hover:bg-white/[0.14] hover:text-white"
                          data-coco-action="continue-after-post-scan-change"
                          onClick={continueAfterAcceptedPostScanChange}
                          type="button"
                        >
                          Continue
                        </button>
                      ) : null}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <AnimatePresence initial={false}>
                  {showJudgmentActionControl && judgmentAction ? (
                    <motion.div
                      animate={{ filter: "blur(0px)", opacity: 1, scale: 1, y: "-50%" }}
                      className="absolute right-0 top-1/2 flex items-center gap-1"
                      exit={{ filter: "blur(5px)", opacity: 0, scale: 0.96, y: "-50%" }}
                      initial={{ filter: "blur(5px)", opacity: 0, scale: 0.96, y: "-50%" }}
                      key={`judgment-${judgmentAction.id}`}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <button
                        aria-label={judgmentAction.label}
                        className="pointer-events-auto h-[20px] rounded-full border border-cyan-300/35 bg-cyan-300/[0.14] px-2.5 text-[10px] font-semibold leading-none text-cyan-50 transition hover:border-cyan-200/60 hover:bg-cyan-200/[0.2] hover:text-white"
                        data-coco-action={judgmentAction.id}
                        onClick={runJudgmentAction}
                        type="button"
                      >
                        Do it
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <AnimatePresence initial={false}>
                  {showCocoFieldControls ? (
                    <motion.div
                      animate={{ filter: "blur(0px)", opacity: 1, scale: 1, y: "-50%" }}
                      className="absolute right-0 top-1/2 flex items-center gap-1"
                      exit={{ filter: "blur(5px)", opacity: 0, scale: 0.96, y: "-50%" }}
                      initial={{ filter: "blur(5px)", opacity: 0, scale: 0.96, y: "-50%" }}
                      key={`field-${cocoFieldActionType}`}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <button
                        aria-label={cocoFieldActionLabel}
                        className="pointer-events-auto grid h-[18px] w-[18px] place-items-center rounded-full border border-white/15 bg-white/[0.08] text-white/82 transition hover:border-white/30 hover:bg-white/[0.16] hover:text-white"
                        data-coco-action={cocoFieldActionType}
                        onClick={cocoFieldActionHandler}
                        title={cocoFieldActionTitle}
                        type="button"
                      >
                        {canFixPolishScanIssue ? (
                          <Pencil aria-hidden="true" size={11} strokeWidth={2.4} />
                        ) : canAdvanceCurrentField && !isLastTextField ? (
                          <ArrowRight aria-hidden="true" size={11} strokeWidth={2.4} />
                        ) : (
                          <Check aria-hidden="true" size={11} strokeWidth={2.5} />
                        )}
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
