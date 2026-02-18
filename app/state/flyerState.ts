// app/state/flyerState.ts
import { create } from "zustand";
import type { Emoji } from "../types/emoji";
import type { TemplateBase } from "../../lib/templates";
import {
  HEADLINE_FONTS_LOCAL,
  HEADLINE2_FONTS_LOCAL,
  BODY_FONTS_LOCAL,
  BODY_FONTS2_LOCAL,
  VENUE_FONTS_LOCAL,
  SUBTAG_FONTS_LOCAL,
} from "../../lib/fonts"; // adjust path if needed

// ============================================
// SAVE/LOAD DESIGN (V1)
// ============================================

export type FlyerDesignV1 = {
  v: 1;
  savedAt: string;

  // core
  format: Format;

  // text styles (your true styling system)
  textStyles: TextStyleGroup;

  // legacy / misc styling bits you still use
  head2Color: string;

  // enable toggles (per format)
  detailsEnabled: Record<Format, boolean>;
  details2Enabled: Record<Format, boolean>;
  headline2Enabled: Record<Format, boolean>;
  subtagEnabled: Record<Format, boolean>;
  venueEnabled: Record<Format, boolean>;
  emojisEnabled: Record<Format, boolean>;

  // shadows
  headShadow: boolean;
  head2Shadow: boolean;
  detailsShadow: boolean;
  details2Shadow: boolean;
  venueShadow: boolean;
  subtagShadow: boolean;

  headShadowStrength: number;
  head2ShadowStrength: number;
  detailsShadowStrength: number;
  details2ShadowStrength: number;
  venueShadowStrength: number;
  subtagShadowStrength: number;

  // layers
  portraits: Record<Format, Portrait[]>;
  emojis: Record<Format, Emoji[]>;

  // template/session system
  currentTemplate: Record<Format, Partial<TemplateBase>>;
  session: { square: Partial<TemplateBase>; story: Partial<TemplateBase> };
  sessionDirty: { square: boolean; story: boolean };

  // ui-ish state
  selectedPanel: string | null;
  moveTarget: MoveTarget;
  selectedPortraitId: string | null;

  // ✅ NEW (so emoji selection can survive internal UI guards; ok if you don't persist it)
  selectedEmojiId?: string | null;
};

//
// ============================================
// TYPES
// ============================================
//
export type Format = "square" | "story";

// MOVE TARGET TYPE
export type MoveTarget =
  | "headline"
  | "headline2"
  | "details"
  | "details2"
  | "venue"
  | "subtag"
  | "background"
  | "portrait"
  | "logo"
  | "shape"
  | "icon"
  | null;

// TEXT STYLE STRUCTURES
export type TextStyle = {
  family: string;
  color: string;
  lineHeight: number;
  align: "left" | "center" | "right";
  size?: number;
  sizePx?: number;
  tracking?: number;
  uppercase?: boolean;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  alpha?: number;
  bgColor?: string;
  textColor?: string;
};

type FormatStyles = {
  square: TextStyle;
  story: TextStyle;
};

export type TextStyleGroup = {
  headline: FormatStyles;
  headline2: FormatStyles;
  details: FormatStyles;
  details2: FormatStyles;
  venue: FormatStyles;
  subtag: FormatStyles;
};

export type CleanupParams = {
  shrinkPx: number;
  featherPx: number;
  alphaBoost: number;
  decontaminate: number;
  alphaSmoothPx: number;
  edgeGamma: number;
  spillSuppress: number;
  alphaFill: number;
  edgeClamp: number;
};

// PORTRAIT STRUCTURE
type Portrait = {
  id: string;
  url: string;
  x: number;
  y: number;
  scale: number;
  locked: boolean;
  rotation?: number;
  opacity?: number;
  blendMode?: string;
  label?: string;
  showLabel?: boolean;
  labelBg?: boolean;
  labelSize?: number;
  labelColor?: string;
  isSticker?: boolean;
  isFlare?: boolean;
  isBrandFace?: boolean;
  tint?: number;          // hue-rotate degrees for tinting overlays/flares
  tintMode?: "hue" | "colorize";
  svgTemplate?: string;
  iconColor?: string;
  layerOffset?: number;
  cleanup?: CleanupParams;
  cleanupBaseUrl?: string;
  shadowBlur?: number;
  shadowAlpha?: number;
};

//
// ============================================
// FLYER STATE MAIN TYPE
// ============================================
//
type FlyerState = {
  format: Format;
  setFormat: (fmt: Format) => void;
  exportDesign: () => FlyerDesignV1;
  importDesign: (design: FlyerDesignV1) => void;

  fontOptions: {
    headline: string[];
    headline2: string[];
    details: string[];
    details2: string[];
    venue: string[];
    subtag: string[];
  };

  //
  // PORTRAITS (per format, emoji-style)
  //
  portraits: Record<Format, Portrait[]>;
  setPortraits: (fmt: Format, list: Portrait[]) => void;
  addPortrait: (fmt: Format, p: Portrait) => void;
  updatePortrait: (fmt: Format, id: string, patch: Partial<Portrait>) => void;
  removePortrait: (fmt: Format, id: string) => void;

  selectedPortraitId: string | null;
  setSelectedPortraitId: (id: string | null) => void;

  portraitLocked: Record<string, boolean>;
  togglePortraitLock: (id: string) => void;
  isPortraitLocked: (id: string) => boolean;

  onDeletePortrait: (fmt: Format, id: string) => void;
  onTogglePortraitLock: (id: string) => void;

  //
  // GLOBAL DRAG
  //
  isLiveDragging: boolean;
  setIsLiveDragging: (v: boolean) => void;

  moveTarget: MoveTarget;
  setMoveTarget: (t: MoveTarget) => void;

  dragging: MoveTarget | null;
  setDragging: (v: MoveTarget | null) => void;

  //
  // SETTINGS PANEL
  //
  selectedPanel: string | null;
  setSelectedPanel: (panel: string | null) => void;
  setFocus: (t: MoveTarget, panel: string | null) => void;

  // ✅ NEW: emoji selection in store (fixes TS + enables “panel stays open” guards)
  selectedEmojiId: string | null;
  setSelectedEmojiId: (id: string | null) => void;

  //
  // LEGACY HEADLINE2 COLOR
  //
  head2Color: string;
  setHead2Color: (v: string) => void;

  //
  // SHADOW FLAGS + STRENGTHS
  //
  headShadow: boolean;
  head2Shadow: boolean;
  detailsShadow: boolean;
  details2Shadow: boolean;
  venueShadow: boolean;
  subtagShadow: boolean;

  headShadowStrength: number;
  head2ShadowStrength: number;
  detailsShadowStrength: number;
  details2ShadowStrength: number;
  venueShadowStrength: number;
  subtagShadowStrength: number;

  setHeadShadow: (v: boolean) => void;
  setHead2Shadow: (v: boolean) => void;
  setDetailsShadow: (v: boolean) => void;
  setDetails2Shadow: (v: boolean) => void;
  setVenueShadow: (v: boolean) => void;
  setSubtagShadow: (v: boolean) => void;

  setHeadShadowStrength: (v: number) => void;
  setHead2ShadowStrength: (v: number) => void;
  setDetailsShadowStrength: (v: number) => void;
  setDetails2ShadowStrength: (v: number) => void;
  setVenueShadowStrength: (v: number) => void;
  setSubtagShadowStrength: (v: number) => void;

  //
  // ENABLE TOGGLES
  //
  detailsEnabled: Record<Format, boolean>;
  setDetailsEnabled: (fmt: Format, v: boolean) => void;

  details2Enabled: Record<Format, boolean>;
  setDetails2Enabled: (fmt: Format, v: boolean) => void;

  headline2Enabled: Record<Format, boolean>;
  setHeadline2Enabled: (fmt: Format, v: boolean) => void;

  subtagEnabled: Record<Format, boolean>;
  setSubtagEnabled: (fmt: Format, v: boolean) => void;

  venueEnabled: Record<Format, boolean>;
  setVenueEnabled: (fmt: Format, v: boolean) => void;

  //
  // EMOJIS
  //
  emojis: Record<Format, Emoji[]>;
  setEmojis: (fmt: Format, list: Emoji[]) => void;
  addEmoji: (fmt: Format, emoji: Emoji) => void;
  updateEmoji: (fmt: Format, id: string, patch: Partial<Emoji>) => void;
  removeEmoji: (fmt: Format, id: string) => void;
  moveEmoji: (fmt: Format, id: string, x: number, y: number) => void;

  emojisEnabled: Record<Format, boolean>;
  setEmojisEnabled: (fmt: Format, v: boolean) => void;

  //
  // CURRENT TEMPLATE
  //
  currentTemplate: Record<Format, Partial<TemplateBase>>;
  setCurrentTemplate: (fmt: Format, patch: Partial<TemplateBase>) => void;

  //
  // TEXT STYLES
  //
  textStyles: TextStyleGroup;
  setTextStyle: (
    key: keyof TextStyleGroup,
    fmt: Format,
    patch: Partial<TextStyle>
  ) => void;

  //
  // SESSION SYSTEM
  //
  session: {
    square: Partial<TemplateBase>;
    story: Partial<TemplateBase>;
  };

  sessionDirty: {
    square: boolean;
    story: boolean;
  };

  setSession: (
    next:
      | Partial<FlyerState["session"]>
      | ((prev: FlyerState["session"]) => FlyerState["session"])
  ) => void;

  setSessionDirty: (
    next:
      | Partial<FlyerState["sessionDirty"]>
      | ((prev: FlyerState["sessionDirty"]) => FlyerState["sessionDirty"])
  ) => void;

  setSessionValue: (fmt: Format, key: keyof TemplateBase, value: any) => void;
};

//
// ====================================================
// ZUSTAND STORE
// ====================================================
export const useFlyerState = create<FlyerState>((set, get) => ({



  format: "square",
  setFormat: (fmt) => set({ format: fmt }),

  //
  // PORTRAITS
  //
  portraits: { square: [], story: [] },

  setPortraits: (fmt, list) =>
    set((s) => ({ portraits: { ...s.portraits, [fmt]: list } })),

  addPortrait: (fmt, p) =>
    set((s) => ({
      portraits: {
        ...s.portraits,
        [fmt]: [...(s.portraits[fmt] || []), p],
      },
    })),

  updatePortrait: (fmt, id, patch) =>
    set((s) => ({
      portraits: {
        ...s.portraits,
        [fmt]: s.portraits[fmt].map((pt) => (pt.id === id ? { ...pt, ...patch } : pt)),
      },
    })),

  removePortrait: (fmt, id) =>
    set((s) => ({
      portraits: {
        ...s.portraits,
        [fmt]: s.portraits[fmt].filter((pt) => pt.id !== id),
      },
    })),

  selectedPortraitId: null,
  setSelectedPortraitId: (id) => set({ selectedPortraitId: id }),

  portraitLocked: {},

  togglePortraitLock: (id) =>
    set((s) => ({
      portraitLocked: {
        ...s.portraitLocked,
        [id]: !s.portraitLocked[id],
      },
    })),

  isPortraitLocked: (id) => !!get().portraitLocked[id],

  onDeletePortrait: (fmt, id) =>
    set((s) => ({
      portraits: {
        ...s.portraits,
        [fmt]: s.portraits[fmt].filter((pt) => pt.id !== id),
      },
    })),

  onTogglePortraitLock: (id) =>
    set((s) => ({
      portraitLocked: {
        ...s.portraitLocked,
        [id]: !s.portraitLocked[id],
      },
    })),

  //
  // DRAG SYSTEM
  //
  isLiveDragging: false,
  setIsLiveDragging: (v) => set({ isLiveDragging: v }),

  moveTarget: null,
  setMoveTarget: (t) => set({ moveTarget: t }),

  dragging: null,
  setDragging: (v) => set({ dragging: v }),

 //
// UI PANEL (PATCHED - UNLOCKABLE)
//
selectedPanel: null,

// ✅ emoji selection in store
selectedEmojiId: null as string | null,
setSelectedEmojiId: (id: string | null) => set({ selectedEmojiId: id }),

/**
 * ✅ DO NOT hard-lock the panel.
 * If the user opens a different panel, clear selectedEmojiId so switching works.
 */
setSelectedPanel: (panel: string | null) =>
  set((state: any) => {
    // 🧨 LOG ONLY WHEN SOMETHING TRIES TO CLOSE THE PANEL
    if (panel === null) {
      console.log("🧨 PANEL CLOSE requested", {
        from: state.selectedPanel,
        moveTarget: state.moveTarget,
        selectedPortraitId: state.selectedPortraitId,
        selectedEmojiId: state.selectedEmojiId,
        stack: new Error("panel close stack").stack,
      });
    }

    const next: any = { selectedPanel: panel };

    // ✅ If switching away from emoji panel, unlock by clearing selection
    if (panel !== "emoji" && state.selectedEmojiId) {
      next.selectedEmojiId = null;
    }

    // ✅ Flare/sticker guard (keep your existing behavior)
    const fmt = state.format || "square";
    const list = (state.portraits?.[fmt] || state.portraits?.square || []) as any[];
    const pid = state.selectedPortraitId as string | null;

    if (pid) {
      const sel = list.find((x: any) => x?.id === pid);
      const isFlare = !!sel?.isFlare;
      const isSticker = !!sel?.isSticker;

      if ((isFlare || isSticker) && panel === "portrait") {
        next.selectedPanel = "icons";
      }
    }

    // ✅ Optional: if emoji is selected and panel was set to null, keep emoji open
    if (panel === null && state.selectedEmojiId) {
      next.selectedPanel = "emoji";
    }

    return next;
  }),


/**
 * ✅ Focus should also be unlockable:
 * if focusing away from emoji, clear selectedEmojiId.
 */
setFocus: (t: any, panel: any) =>
  set((state: any) => {
    const next: any = { moveTarget: t, selectedPanel: panel };

    // ✅ If focusing away from emoji, unlock by clearing selection
    if (panel !== "emoji" && state.selectedEmojiId) {
      next.selectedEmojiId = null;
    }

    // ✅ If focusing away from portrait/logo/icon, clear portrait selection
    if (t !== "portrait" && t !== "logo" && t !== "icon" && state.selectedPortraitId) {
      next.selectedPortraitId = null;
    }

    // ✅ Flare/sticker wins (keep)
    const fmt = state.format || "square";
    const list = (state.portraits?.[fmt] || state.portraits?.square || []) as any[];
    const pid = state.selectedPortraitId as string | null;

    if (pid) {
      const sel = list.find((x: any) => x?.id === pid);
      const isFlare = !!sel?.isFlare;
      const isSticker = !!sel?.isSticker;

      if (isFlare || isSticker) {
        next.moveTarget = "icon";
        next.selectedPanel = "icons";
      }
    }

    return next;
  }),


  //
  // LEGACY COLOR
  //
  head2Color: "#ffffff",
  setHead2Color: (v) => set({ head2Color: v }),

  //
  // SHADOW FLAGS + STRENGTHS
  //
  headShadow: false,
  head2Shadow: false,
  detailsShadow: false,
  details2Shadow: false,
  venueShadow: false,
  subtagShadow: false,

  headShadowStrength: 1,
  head2ShadowStrength: 1,
  detailsShadowStrength: 1,
  details2ShadowStrength: 1,
  venueShadowStrength: 1,
  subtagShadowStrength: 1,

  setHeadShadow: (v) => set({ headShadow: v }),
  setHead2Shadow: (v) => set({ head2Shadow: v }),
  setDetailsShadow: (v) => set({ detailsShadow: v }),
  setDetails2Shadow: (v) => set({ details2Shadow: v }),
  setVenueShadow: (v) => set({ venueShadow: v }),
  setSubtagShadow: (v) => set({ subtagShadow: v }),

  setHeadShadowStrength: (v) => set({ headShadowStrength: v }),
  setHead2ShadowStrength: (v) => set({ head2ShadowStrength: v }),
  setDetailsShadowStrength: (v) => set({ detailsShadowStrength: v }),
  setDetails2ShadowStrength: (v) => set({ details2ShadowStrength: v }),
  setVenueShadowStrength: (v) => set({ venueShadowStrength: v }),
  setSubtagShadowStrength: (v) => set({ subtagShadowStrength: v }),

  //
  // ENABLE TOGGLES
  //
  detailsEnabled: { square: true, story: true },
  setDetailsEnabled: (fmt, v) =>
    set((s) => ({ detailsEnabled: { ...s.detailsEnabled, [fmt]: v } })),

  details2Enabled: { square: false, story: true },
  setDetails2Enabled: (fmt, v) =>
    set((s) => ({ details2Enabled: { ...s.details2Enabled, [fmt]: v } })),

  headline2Enabled: { square: true, story: true },
  setHeadline2Enabled: (fmt, v) =>
    set((s) => ({ headline2Enabled: { ...s.headline2Enabled, [fmt]: v } })),

  subtagEnabled: { square: true, story: true },
  setSubtagEnabled: (fmt, v) =>
    set((s) => ({ subtagEnabled: { ...s.subtagEnabled, [fmt]: v } })),

  venueEnabled: { square: true, story: true },
  setVenueEnabled: (fmt, v) =>
    set((s) => ({ venueEnabled: { ...s.venueEnabled, [fmt]: v } })),

  //
  // EMOJIS (HARDENED)
  //
  emojis: { square: [], story: [] },

  setEmojis: (fmt, list) =>
    set((s: any) => ({
      emojis: {
        ...(s.emojis && typeof s.emojis === "object" ? s.emojis : {}),
        [fmt]: Array.isArray(list) ? list : [],
      },
    })),

  addEmoji: (fmt, emoji) =>
    set((s: any) => {
      const emojis =
        s.emojis && typeof s.emojis === "object" && !Array.isArray(s.emojis)
          ? s.emojis
          : {};
      const bucket = Array.isArray(emojis[fmt]) ? emojis[fmt] : [];
      return { emojis: { ...emojis, [fmt]: [...bucket, emoji] } };
    }),

  updateEmoji: (fmt, id, patch) =>
    set((s: any) => {
      const emojis =
        s.emojis && typeof s.emojis === "object" && !Array.isArray(s.emojis)
          ? s.emojis
          : {};
      const bucket = Array.isArray(emojis[fmt]) ? emojis[fmt] : [];
      return {
        emojis: {
          ...emojis,
          [fmt]: bucket.map((e: any) => (e?.id === id ? { ...e, ...patch } : e)),
        },
      };
    }),

  removeEmoji: (fmt, id) =>
    set((s: any) => {
      const emojis =
        s.emojis && typeof s.emojis === "object" && !Array.isArray(s.emojis)
          ? s.emojis
          : {};
      const bucket = Array.isArray(emojis[fmt]) ? emojis[fmt] : [];
      return { emojis: { ...emojis, [fmt]: bucket.filter((e: any) => e?.id !== id) } };
    }),

  moveEmoji: (fmt, id, x, y) =>
    set((s: any) => {
      const emojis =
        s.emojis && typeof s.emojis === "object" && !Array.isArray(s.emojis)
          ? s.emojis
          : {};
      const bucket = Array.isArray(emojis[fmt]) ? emojis[fmt] : [];
      return {
        emojis: {
          ...emojis,
          [fmt]: bucket.map((e: any) => (e?.id === id ? { ...e, x, y } : e)),
        },
      };
    }),

  emojisEnabled: { square: false, story: false },
  setEmojisEnabled: (fmt, v) =>
    set((s: any) => ({
      emojisEnabled: {
        ...(s.emojisEnabled && typeof s.emojisEnabled === "object" ? s.emojisEnabled : {}),
        [fmt]: !!v,
      },
    })),

  //
  // CURRENT TEMPLATE
  //
  currentTemplate: { square: {}, story: {} },

  setCurrentTemplate: (fmt, patch) =>
    set((s) => ({
      currentTemplate: {
        ...s.currentTemplate,
        [fmt]: { ...s.currentTemplate[fmt], ...patch },
      },
    })),

  //
  // FONT OPTIONS (from fonts.ts)
  //
  fontOptions: {
    headline: HEADLINE_FONTS_LOCAL,
    headline2: HEADLINE2_FONTS_LOCAL,
    details: BODY_FONTS_LOCAL,
    details2: BODY_FONTS2_LOCAL,
    venue: VENUE_FONTS_LOCAL,
    subtag: SUBTAG_FONTS_LOCAL,
  },

  //
  // TEXT STYLE SYSTEM
  //
  textStyles: {
    headline: {
      square: { color: "#ffffff", sizePx: 100, lineHeight: 1, family: "Inter", align: "center" },
      story: { color: "#ffffff", sizePx: 100, lineHeight: 1, family: "Inter", align: "center" },
    },
    headline2: {
      square: { color: "#ffffff", sizePx: 80, lineHeight: 1, family: "Inter", align: "center" },
      story: { color: "#ffffff", sizePx: 80, lineHeight: 1, family: "Inter", align: "center" },
    },
    details: {
      square: { color: "#ffffff", sizePx: 28, lineHeight: 1.1, family: "Inter", align: "center" },
      story: { color: "#ffffff", sizePx: 28, lineHeight: 1.1, family: "Inter", align: "center" },
    },
    details2: {
      square: { color: "#ffffff", sizePx: 22, lineHeight: 1.1, family: "Inter", align: "center" },
      story: { color: "#ffffff", sizePx: 22, lineHeight: 1.1, family: "Inter", align: "center" },
    },
    venue: {
      square: { color: "#ffffff", sizePx: 32, lineHeight: 1, family: "Inter", align: "center" },
      story: { color: "#ffffff", sizePx: 32, lineHeight: 1, family: "Inter", align: "center" },
    },
    subtag: {
      square: { color: "#ffffff", sizePx: 20, lineHeight: 1, family: "Inter", align: "center" },
      story: { color: "#ffffff", sizePx: 20, lineHeight: 1, family: "Inter", align: "center" },
    },
  },

  setTextStyle: (key, fmt, patch) =>
    set((s) => ({
      textStyles: {
        ...s.textStyles,
        [key]: {
          ...s.textStyles[key],
          [fmt]: { ...s.textStyles[key][fmt], ...patch },
        },
      },
    })),

  //
  // SESSION
  //
  session: { square: {}, story: {} },

  sessionDirty: { square: false, story: false },

  setSession: (next) =>
    set((s) => {
      const n = typeof next === "function" ? next(s.session) : next;
      return {
        session: {
          square: n.square ?? s.session.square,
          story: n.story ?? s.session.story,
        },
      };
    }),

  setSessionDirty: (next) =>
    set((s) => {
      const n = typeof next === "function" ? next(s.sessionDirty) : next;
      return {
        sessionDirty: {
          square: n.square ?? s.sessionDirty.square,
          story: n.story ?? s.sessionDirty.story,
        },
      };
    }),

  // 🔥 PATCHED FUNCTION: Sanitizes input to prevent NaN crashes
setSessionValue: (fmt, key, value) =>
  set((s) => {
    let safeValue = value;

    if (key === "bgPosX" || key === "bgPosY" || key === "bgScale") {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        console.warn(
          `⚠️ Blocked corrupt data for ${fmt}.${String(key)}:`,
          value
        );
        safeValue = key === "bgScale" ? 1 : 50;
      }
    }

    return {
      session: {
        ...s.session,
        [fmt]: {
          ...s.session[fmt],
          [key]: safeValue,
        },
      },
      sessionDirty: {
        ...s.sessionDirty,
        [fmt]: true,
      },
    };
  }),

// ✅ MUST BE A SIBLING KEY (NOT NESTED)
exportDesign: () => {
  const s = get();
  return {
    v: 1,
    savedAt: new Date().toISOString(),

    format: s.format,

    textStyles: s.textStyles,
    head2Color: s.head2Color,

    detailsEnabled: s.detailsEnabled,
    details2Enabled: s.details2Enabled,
    headline2Enabled: s.headline2Enabled,
    subtagEnabled: s.subtagEnabled,
    venueEnabled: s.venueEnabled,
    emojisEnabled: s.emojisEnabled,

    headShadow: s.headShadow,
    head2Shadow: s.head2Shadow,
    detailsShadow: s.detailsShadow,
    details2Shadow: s.details2Shadow,
    venueShadow: s.venueShadow,
    subtagShadow: s.subtagShadow,

    headShadowStrength: s.headShadowStrength,
    head2ShadowStrength: s.head2ShadowStrength,
    detailsShadowStrength: s.detailsShadowStrength,
    details2ShadowStrength: s.details2ShadowStrength,
    venueShadowStrength: s.venueShadowStrength,
    subtagShadowStrength: s.subtagShadowStrength,

    portraits: s.portraits,
    emojis: s.emojis,

    currentTemplate: s.currentTemplate,
    session: s.session,
    sessionDirty: s.sessionDirty,

    selectedPanel: s.selectedPanel,
    moveTarget: s.moveTarget,
    selectedPortraitId: s.selectedPortraitId,
  };
},

// ✅ MUST BE A SIBLING KEY (NOT NESTED)
importDesign: (d) => {
  set(() => ({
    format: d.format ?? get().format,

    textStyles: d.textStyles ?? get().textStyles,
    head2Color: d.head2Color ?? get().head2Color,

    detailsEnabled: d.detailsEnabled ?? get().detailsEnabled,
    details2Enabled: d.details2Enabled ?? get().details2Enabled,
    headline2Enabled: d.headline2Enabled ?? get().headline2Enabled,
    subtagEnabled: d.subtagEnabled ?? get().subtagEnabled,
    venueEnabled: d.venueEnabled ?? get().venueEnabled,
    emojisEnabled: d.emojisEnabled ?? get().emojisEnabled,

    headShadow: d.headShadow ?? get().headShadow,
    head2Shadow: d.head2Shadow ?? get().head2Shadow,
    detailsShadow: d.detailsShadow ?? get().detailsShadow,
    details2Shadow: d.details2Shadow ?? get().details2Shadow,
    venueShadow: d.venueShadow ?? get().venueShadow,
    subtagShadow: d.subtagShadow ?? get().subtagShadow,

    headShadowStrength: d.headShadowStrength ?? get().headShadowStrength,
    head2ShadowStrength: d.head2ShadowStrength ?? get().head2ShadowStrength,
    detailsShadowStrength: d.detailsShadowStrength ?? get().detailsShadowStrength,
    details2ShadowStrength: d.details2ShadowStrength ?? get().details2ShadowStrength,
    venueShadowStrength: d.venueShadowStrength ?? get().venueShadowStrength,
    subtagShadowStrength: d.subtagShadowStrength ?? get().subtagShadowStrength,

    portraits: d.portraits ?? get().portraits,
    emojis: d.emojis ?? get().emojis,

    currentTemplate: d.currentTemplate ?? get().currentTemplate,
    session: d.session ?? get().session,
    sessionDirty: d.sessionDirty ?? get().sessionDirty,

    // reset selection on import
    selectedPanel: null,
    moveTarget: null,
    selectedPortraitId: null,
  }));
},

}));
