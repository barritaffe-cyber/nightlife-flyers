'use client';
/* eslint-disable @next/next/no-img-element */

import * as React from 'react';
import clsx from 'clsx';
import {
  Collapsible,
  Chip,
  InlineSliderInput,
  Stepper,
  editorEmptyStateBodyClass,
  editorEmptyStateClass,
  editorEmptyStateTitleClass,
  editorHelperTextClass,
  editorItemCardActiveClass,
  editorItemCardClass,
  editorPanelActiveClass,
  editorPanelTitleActiveClass,
  editorPrimaryButtonClass,
  editorSectionCardClass,
  editorSectionEyebrowClass,
  editorSectionMetaClass,
  editorSectionTitleClass,
  editorThumbClass,
  editorUploadActionClass,
  editorUploadClearClass,
  editorUploadHolderClass,
  editorUploadPlaceClass,
  editorUploadPreviewClass,
} from './controls';
import { removeBackgroundLocal } from '../../lib/removeBgLocal';
import { EXTRACT_SUBJECT_CLEANUP } from '../../lib/cleanupCutoutUrl';
import type { ScenePack } from '../../lib/scenePacks';

type ExtractedLayerPlacement = {
  sourceRect: {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  canvas: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  };
  cropSize: {
    width: number;
    height: number;
  };
  background: {
    scale: number;
    posX: number;
    posY: number;
    fitMode: boolean;
  };
};

type ExtractedLayerSlot = {
  src: string;
  placement?: ExtractedLayerPlacement;
  createdAt?: number;
};

type ExtractedLayerPayload = {
  src: string;
  x: number;
  y: number;
  scale: number;
  placement: ExtractedLayerPlacement;
};

type SceneBuilderPalette = {
  bgFrom: string;
  bgTo: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  neutral?: string;
};

type ExtractedPortraitLayer = {
  id: string;
  url: string;
  x?: number;
  y?: number;
  scale?: number;
  extraction?: ExtractedLayerPlacement;
};

type Props = {
  format?: 'square' | 'story';
  scenePacks?: ReadonlyArray<ScenePack>;
  activeScenePackId?: string | null;
  onScenePackSelect?: (pack: ScenePack) => void;
  onSubjectUploadClick?: () => void;
  onEditHeadlineClick?: () => void;
  presetBackgrounds?: ReadonlyArray<{
    id: string;
    name: string;
    src: string;
  }>;
  presetBackgroundLabel?: string;
  onPresetBackgroundSelect?: (src: string) => void;
  currentPalette?: SceneBuilderPalette;
  originalPalette?: SceneBuilderPalette | null;
  onPaletteChange?: (palette: SceneBuilderPalette) => void;
  onOriginalPaletteReset?: () => void;
  onGeneratedPaletteApply?: () => void;
  layoutOptions?: ReadonlyArray<{
    id: string;
    label: string;
  }>;
  activeLayoutId?: string | null;
  onLayoutSelect?: (id: string) => void;
  allowUploads?: boolean;
  selectedPanel: string | null;
  setSelectedPanel: (v: string | null) => void;
  triggerUpload: () => void;
  fitBackground: () => void;
  setBgScale: React.Dispatch<React.SetStateAction<number>>;
  bgFitMode: boolean;
  setBgFitMode: React.Dispatch<React.SetStateAction<boolean>>;
  setBgPosX: React.Dispatch<React.SetStateAction<number>>;
  setBgPosY: React.Dispatch<React.SetStateAction<number>>;
  bgUploadUrl: string | null;
  bgUrl: string | null;
  genError?: string | null;
  bgRightRef: React.RefObject<HTMLInputElement | null>;
  onRightBgFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  logoPickerRef: React.RefObject<HTMLInputElement | null>;
  onLogoFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  logoSlotPickerRef: React.RefObject<HTMLInputElement | null>;
  onLogoSlotFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  portraitSlotPickerRef: React.RefObject<HTMLInputElement | null>;
  onPortraitSlotFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  vibeUploadInputRef: React.RefObject<HTMLInputElement | null>;
  handleUploadDesignFromVibe: (file: File) => Promise<void>;
  bgScale: number;
  bgPosX?: number;
  bgPosY?: number;
  bgBlur: number;
  setHue: (v: number) => void;
  setVignette: (v: boolean) => void;
  setVignetteStrength: (v: number) => void;
  setBgBlur: (v: number) => void;
  setBgRotate: (v: number) => void;
  hue: number;
  vignetteStrength: number;
  bgRotate: number;
  hasSubject?: boolean;
  onGenerateSubject?: () => void;
  isGeneratingSubject?: boolean;
  subjectError?: string | null;
  subjectGender?: string;
  setSubjectGender?: (v: string) => void;
  subjectEthnicity?: string;
  setSubjectEthnicity?: (v: string) => void;
  subjectAttire?: string;
  setSubjectAttire?: (v: string) => void;
  subjectShot?: string;
  setSubjectShot?: (v: string) => void;
  subjectEnergy?: string;
  setSubjectEnergy?: (v: string) => void;
  subjectPose?: string;
  setSubjectPose?: (v: string) => void;
  showAiTools?: boolean;
  enableExtractSubject?: boolean;
  extractedPortraitLayers?: ReadonlyArray<ExtractedPortraitLayer>;
  onSelectExtractedPortrait?: (id: string) => void;
  onRemoveExtractedPortrait?: (id: string) => void;
  onPlaceExtractedLayer?: (payload: ExtractedLayerPayload) => void;
};

function BackgroundPanels({
  format = 'square',
  scenePacks = [],
  activeScenePackId = null,
  onScenePackSelect,
  onSubjectUploadClick,
  onEditHeadlineClick,
  presetBackgrounds = [],
  presetBackgroundLabel = 'Background Picks',
  onPresetBackgroundSelect,
  currentPalette,
  originalPalette,
  onPaletteChange,
  onOriginalPaletteReset,
  onGeneratedPaletteApply,
  layoutOptions = [],
  activeLayoutId = null,
  onLayoutSelect,
  allowUploads = true,
  selectedPanel,
  setSelectedPanel,
  triggerUpload,
  fitBackground,
  setBgScale,
  setBgPosX,
  setBgPosY,
  bgUploadUrl,
  bgUrl,
  genError,
  bgRightRef,
  onRightBgFile,
  logoPickerRef,
  onLogoFiles,
  logoSlotPickerRef,
  onLogoSlotFile,
  portraitSlotPickerRef,
  onPortraitSlotFile,
  vibeUploadInputRef,
  handleUploadDesignFromVibe,
  bgScale,
  bgPosX = 50,
  bgPosY = 50,
  bgFitMode,
  setBgFitMode,
  bgBlur,
  setBgBlur,
  setHue,
  setVignette,
  setVignetteStrength,
  hue,
  vignetteStrength,
  bgRotate,
  setBgRotate,
  hasSubject = false,
  onGenerateSubject,
  isGeneratingSubject = false,
  subjectError,
  subjectGender = 'any',
  setSubjectGender,
  subjectEthnicity = 'any',
  setSubjectEthnicity,
  subjectAttire = 'club-glam',
  setSubjectAttire,
  subjectShot = 'three-quarter',
  setSubjectShot,
  subjectEnergy = 'vibe',
  setSubjectEnergy,
  subjectPose = 'hands-up',
  setSubjectPose,
  showAiTools = true,
  enableExtractSubject = false,
  extractedPortraitLayers = [],
  onSelectExtractedPortrait,
  onRemoveExtractedPortrait,
  onPlaceExtractedLayer,
}: Props) {
  const MAX_EXTRACT_SLOTS = 4;
  const MIN_LASSO_POINTS = 6;
  const MAX_EXTRACT_PAN = 0.35;
  const EXTRACT_PADDING_RATIO = 0.14;
  const previewRef = React.useRef<HTMLImageElement | null>(null);
  const selectionViewportRef = React.useRef<HTMLDivElement | null>(null);
  const currentBackgroundSrc = bgUploadUrl || bgUrl;
  const showScenePresets = false;
  const isHexColor = React.useCallback((value: string) => /^#[0-9a-f]{6}$/i.test(value), []);
  const normalizeHex = React.useCallback((value: string, fallback: string) => {
    const raw = String(value || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toUpperCase();
    if (/^#[0-9a-f]{3}$/i.test(raw)) {
      return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toUpperCase();
    }
    return fallback;
  }, []);
  const mixHex = React.useCallback(
    (a: string, b: string, amount: number) => {
      const left = normalizeHex(a, '#111111').slice(1);
      const right = normalizeHex(b, '#FFFFFF').slice(1);
      const t = Math.max(0, Math.min(1, amount));
      const la = [0, 2, 4].map((i) => parseInt(left.slice(i, i + 2), 16));
      const rb = [0, 2, 4].map((i) => parseInt(right.slice(i, i + 2), 16));
      return `#${la
        .map((v, i) => Math.round(v + (rb[i] - v) * t).toString(16).padStart(2, '0'))
        .join('')}`.toUpperCase();
    },
    [normalizeHex]
  );
  const hexToHsl = React.useCallback(
    (hex: string) => {
      const clean = normalizeHex(hex, '#111111').slice(1);
      const r = parseInt(clean.slice(0, 2), 16) / 255;
      const g = parseInt(clean.slice(2, 4), 16) / 255;
      const b = parseInt(clean.slice(4, 6), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;
      let h = 0;
      const l = (max + min) / 2;
      let s = 0;

      if (diff) {
        s = diff / (1 - Math.abs(2 * l - 1));
        if (max === r) h = ((g - b) / diff) % 6;
        else if (max === g) h = (b - r) / diff + 2;
        else h = (r - g) / diff + 4;
        h *= 60;
        if (h < 0) h += 360;
      }

      return { h, s: Math.max(0, Math.min(100, s * 100)), l: Math.max(0, Math.min(100, l * 100)) };
    },
    [normalizeHex]
  );
  const hslToHex = React.useCallback((h: number, s: number, l: number) => {
    const hue = ((h % 360) + 360) % 360;
    const sat = Math.max(0, Math.min(100, s)) / 100;
    const light = Math.max(0, Math.min(100, l)) / 100;
    const c = (1 - Math.abs(2 * light - 1)) * sat;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = light - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;

    if (hue < 60) [r, g, b] = [c, x, 0];
    else if (hue < 120) [r, g, b] = [x, c, 0];
    else if (hue < 180) [r, g, b] = [0, c, x];
    else if (hue < 240) [r, g, b] = [0, x, c];
    else if (hue < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    return `#${[r, g, b]
      .map((value) => Math.round((value + m) * 255).toString(16).padStart(2, '0'))
      .join('')}`.toUpperCase();
  }, []);
  const hueDistance = React.useCallback((a: number, b: number) => {
    const diff = Math.abs((((a - b) % 360) + 540) % 360 - 180);
    return Math.min(180, diff);
  }, []);
  const pickSeparatedHue = React.useCallback(
    (avoid: number[], candidates: number[]) => {
      return candidates
        .map((hue) => ({
          hue: ((hue % 360) + 360) % 360,
          score: avoid.reduce((sum, current) => sum + hueDistance(hue, current), 0),
        }))
        .sort((a, b) => b.score - a.score)[0]?.hue ?? candidates[0] ?? 250;
    },
    [hueDistance]
  );
  const scenePalette = React.useMemo(() => {
    const base = normalizeHex(
      currentPalette?.secondary || currentPalette?.bgFrom || '#101015',
      '#101015'
    );
    const primary = normalizeHex(
      currentPalette?.primary || currentPalette?.bgTo || '#F3DFC1',
      '#F3DFC1'
    );
    const accent = normalizeHex(currentPalette?.accent || '#D21F3C', '#D21F3C');
    return {
      bgFrom: base,
      bgTo: normalizeHex(currentPalette?.bgTo || mixHex(base, '#000000', 0.35), mixHex(base, '#000000', 0.35)),
      secondary: base,
      primary,
      accent,
      neutral: normalizeHex(currentPalette?.neutral || mixHex(primary, '#FFFFFF', 0.45), mixHex(primary, '#FFFFFF', 0.45)),
    };
  }, [currentPalette, mixHex, normalizeHex]);
  const originalScenePalette = React.useMemo(() => {
    if (!originalPalette) return null;
    const base = normalizeHex(
      originalPalette.secondary || originalPalette.bgFrom || '#101015',
      '#101015'
    );
    const primary = normalizeHex(
      originalPalette.primary || originalPalette.bgTo || '#F3DFC1',
      '#F3DFC1'
    );
    const accent = normalizeHex(originalPalette.accent || '#D21F3C', '#D21F3C');
    return {
      bgFrom: base,
      bgTo: normalizeHex(originalPalette.bgTo || mixHex(base, '#000000', 0.35), mixHex(base, '#000000', 0.35)),
      secondary: base,
      primary,
      accent,
      neutral: normalizeHex(originalPalette.neutral || mixHex(primary, '#FFFFFF', 0.45), mixHex(primary, '#FFFFFF', 0.45)),
    };
  }, [mixHex, normalizeHex, originalPalette]);
  const recommendedPalettes = React.useMemo(
    () => {
      const baseHsl = hexToHsl(scenePalette.secondary);
      const primaryHsl = hexToHsl(scenePalette.primary);
      const warmHue = baseHsl.s < 12 ? 330 : baseHsl.h;
      const luxuryHue = primaryHsl.s > 18 ? primaryHsl.h : 43;
      const coolHue = (warmHue + 190) % 360;
      const warmEnergyHue = pickSeparatedHue(
        [warmHue, luxuryHue],
        [(warmHue + 165) % 360, 250, 196, 344]
      );
      const coolEnergyHue = pickSeparatedHue(
        [coolHue, warmEnergyHue, luxuryHue],
        [344, 196, 250, 31]
      );

      const warmBase = hslToHex(warmHue, Math.max(baseHsl.s + 16, 42), 8);
      const warmShadow = hslToHex(warmHue, Math.max(baseHsl.s + 20, 48), 4);
      const warmLuxury = hslToHex(luxuryHue, Math.max(primaryHsl.s + 20, 68), 70);
      const coolBase = hslToHex(coolHue, 58, 7);
      const coolShadow = hslToHex(coolHue, 64, 3);

      return [
        {
          id: 'warm-luxury-energy',
          label: 'Warm Luxury',
          palette: {
            ...scenePalette,
            bgFrom: warmBase,
            bgTo: warmShadow,
            secondary: warmBase,
            primary: warmLuxury,
            neutral: hslToHex(luxuryHue, 34, 93),
            accent: hslToHex(warmEnergyHue, 92, 58),
          },
        },
        {
          id: 'cool-electric-contrast',
          label: 'Cool Electric',
          palette: {
            ...scenePalette,
            bgFrom: coolBase,
            bgTo: coolShadow,
            secondary: coolBase,
            primary: hslToHex(coolHue, 20, 94),
            neutral: hslToHex(coolHue, 18, 88),
            accent: hslToHex(coolEnergyHue, 94, 60),
          },
        },
      ];
    },
    [hexToHsl, hslToHex, pickSeparatedHue, scenePalette]
  );
  const applyScenePalette = React.useCallback(
    (patch: Partial<SceneBuilderPalette>) => {
      const nextBase = normalizeHex(
        patch.secondary || patch.bgFrom || scenePalette.secondary,
        scenePalette.secondary
      );
      const nextPrimary = normalizeHex(patch.primary || scenePalette.primary, scenePalette.primary);
      const nextAccent = normalizeHex(patch.accent || scenePalette.accent, scenePalette.accent);
      const next: SceneBuilderPalette = {
        bgFrom: nextBase,
        bgTo: normalizeHex(patch.bgTo || mixHex(nextBase, '#000000', 0.35), mixHex(nextBase, '#000000', 0.35)),
        secondary: nextBase,
        primary: nextPrimary,
        accent: nextAccent,
        neutral: normalizeHex(patch.neutral || mixHex(nextPrimary, '#FFFFFF', 0.45), mixHex(nextPrimary, '#FFFFFF', 0.45)),
      };
      onPaletteChange?.(next);
    },
    [mixHex, normalizeHex, onPaletteChange, scenePalette]
  );
  const resetToOriginalPalette = React.useCallback(() => {
    if (onOriginalPaletteReset) {
      onOriginalPaletteReset();
      return;
    }
    if (originalScenePalette) applyScenePalette(originalScenePalette);
  }, [applyScenePalette, onOriginalPaletteReset, originalScenePalette]);
  const emptyExtractSlots = React.useCallback(
    () => Array.from({ length: MAX_EXTRACT_SLOTS }, () => ({ src: '' })),
    []
  );
  const normalizeExtractSlot = React.useCallback((slot: any): ExtractedLayerSlot => {
    if (typeof slot === 'string') return { src: slot };
    if (slot && typeof slot === 'object' && typeof slot.src === 'string') {
      return {
        src: slot.src,
        placement: slot.placement && typeof slot.placement === 'object' ? slot.placement : undefined,
        createdAt: typeof slot.createdAt === 'number' ? slot.createdAt : undefined,
      };
    }
    return { src: '' };
  }, []);
  const normalizeExtractSlots = React.useCallback(
    (raw: any): ExtractedLayerSlot[] =>
      Array.from({ length: MAX_EXTRACT_SLOTS }, (_, i) => normalizeExtractSlot(raw?.[i])),
    [normalizeExtractSlot]
  );
  const [extractSlots, setExtractSlots] = React.useState<ExtractedLayerSlot[]>(() => {
    try {
      const raw = localStorage.getItem('nf:sceneExtractSlots');
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.from({ length: MAX_EXTRACT_SLOTS }, (_, i) => {
          const slot = parsed?.[i];
          if (typeof slot === 'string') return { src: slot };
          if (slot && typeof slot === 'object' && typeof slot.src === 'string') {
            return {
              src: slot.src,
              placement: slot.placement && typeof slot.placement === 'object' ? slot.placement : undefined,
              createdAt: typeof slot.createdAt === 'number' ? slot.createdAt : undefined,
            };
          }
          return { src: '' };
        });
      }
    } catch {}
    return emptyExtractSlots();
  });
  const [extractMode, setExtractMode] = React.useState(false);
  const [extracting, setExtracting] = React.useState(false);
  const [extractError, setExtractError] = React.useState<string | null>(null);
  const [extractPreviewUrl, setExtractPreviewUrl] = React.useState<string | null>(null);
  const [extractPreviewPlacement, setExtractPreviewPlacement] =
    React.useState<ExtractedLayerPlacement | null>(null);
  const portraitExtractLayers = React.useMemo(
    () => extractedPortraitLayers.slice(0, MAX_EXTRACT_SLOTS),
    [extractedPortraitLayers]
  );
  const extractSlotCount = onPlaceExtractedLayer
    ? portraitExtractLayers.length
    : extractSlots.filter((slot) => !!slot.src).length;
  const [extractPath, setExtractPath] = React.useState<Array<{ x: number; y: number }>>([]);
  const dragStartRef = React.useRef<Array<{ x: number; y: number }> | null>(null);
  const panStartRef = React.useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [extractZoom, setExtractZoom] = React.useState(1);
  const [extractPan, setExtractPan] = React.useState({ x: 0, y: 0 });

  const persistExtractSlots = React.useCallback((next: ExtractedLayerSlot[]) => {
    const normalized = normalizeExtractSlots(next);
    setExtractSlots(normalized);
    try {
      localStorage.setItem('nf:sceneExtractSlots', JSON.stringify(normalized));
    } catch {}
  }, [normalizeExtractSlots]);

  const loadImage = React.useCallback((src: string) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load source image.'));
      img.src = src;
    });
  }, []);

  const clampNumber = React.useCallback((value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
  }, []);

  const getPreviewImageRect = React.useCallback((rect: DOMRect) => {
    const img = previewRef.current;
    const iw = img?.naturalWidth || img?.width || 0;
    const ih = img?.naturalHeight || img?.height || 0;
    if (!iw || !ih || !rect.width || !rect.height) {
      return { left: 0, top: 0, width: rect.width, height: rect.height };
    }
    const imageRatio = iw / ih;
    const viewportRatio = rect.width / rect.height;
    if (imageRatio >= viewportRatio) {
      const width = rect.width;
      const height = width / imageRatio;
      return { left: 0, top: (rect.height - height) / 2, width, height };
    }
    const height = rect.height;
    const width = height * imageRatio;
    return { left: (rect.width - width) / 2, top: 0, width, height };
  }, []);

  const sourcePointToViewportPoint = React.useCallback(
    (point: { x: number; y: number }) => {
      const viewport = selectionViewportRef.current;
      const rect = viewport?.getBoundingClientRect();
      if (!rect) return point;
      const imageRect = getPreviewImageRect(rect);
      return {
        x: clampNumber((imageRect.left + point.x * imageRect.width) / Math.max(1, rect.width), 0, 1),
        y: clampNumber((imageRect.top + point.y * imageRect.height) / Math.max(1, rect.height), 0, 1),
      };
    },
    [clampNumber, getPreviewImageRect]
  );

  const buildExtractionPlacement = React.useCallback(
    (args: {
      iw: number;
      ih: number;
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
      cropW: number;
      cropH: number;
    }): ExtractedLayerPlacement => {
      const canvas = format === 'story' ? { width: 540, height: 960 } : { width: 540, height: 540 };
      const baseScale = bgFitMode
        ? Math.min(canvas.width / args.iw, canvas.height / args.ih)
        : Math.max(canvas.width / args.iw, canvas.height / args.ih);
      const scaleFactor = baseScale * Math.max(0.01, Number.isFinite(bgScale) ? bgScale : 1);
      const displayW = args.iw * scaleFactor;
      const displayH = args.ih * scaleFactor;
      const offsetX = (canvas.width - displayW) * (clampNumber(bgPosX, 0, 100) / 100);
      const offsetY = (canvas.height - displayH) * (clampNumber(bgPosY, 0, 100) / 100);
      const centerSourceX = ((args.minX + args.maxX) / 2) * args.iw;
      const centerSourceY = ((args.minY + args.maxY) / 2) * args.ih;
      const canvasX = ((offsetX + centerSourceX * scaleFactor) / canvas.width) * 100;
      const canvasY = ((offsetY + centerSourceY * scaleFactor) / canvas.height) * 100;
      const canvasW = ((args.maxX - args.minX) * args.iw * scaleFactor / canvas.width) * 100;
      const canvasH = ((args.maxY - args.minY) * args.ih * scaleFactor / canvas.height) * 100;

      return {
        sourceRect: {
          x: Number((args.minX * 100).toFixed(2)),
          y: Number((args.minY * 100).toFixed(2)),
          width: Number(((args.maxX - args.minX) * 100).toFixed(2)),
          height: Number(((args.maxY - args.minY) * 100).toFixed(2)),
          centerX: Number((((args.minX + args.maxX) / 2) * 100).toFixed(2)),
          centerY: Number((((args.minY + args.maxY) / 2) * 100).toFixed(2)),
        },
        canvas: {
          x: Number(clampNumber(canvasX, 0, 100).toFixed(2)),
          y: Number(clampNumber(canvasY, 0, 100).toFixed(2)),
          width: Number(Math.max(0.1, canvasW).toFixed(2)),
          height: Number(Math.max(0.1, canvasH).toFixed(2)),
          scale: Number(clampNumber(scaleFactor, 0.05, 4).toFixed(3)),
        },
        cropSize: {
          width: args.cropW,
          height: args.cropH,
        },
        background: {
          scale: Number((Number.isFinite(bgScale) ? bgScale : 1).toFixed(3)),
          posX: Number(clampNumber(bgPosX, 0, 100).toFixed(2)),
          posY: Number(clampNumber(bgPosY, 0, 100).toFixed(2)),
          fitMode: !!bgFitMode,
        },
      };
    },
    [bgFitMode, bgPosX, bgPosY, bgScale, clampNumber, format]
  );

  React.useEffect(() => {
    if (!extractMode) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [extractMode]);

  const normalizePointerPoint = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const adjustedX =
      (localX - rect.width / 2 - extractPan.x * rect.width) / extractZoom + rect.width / 2;
    const adjustedY =
      (localY - rect.height / 2 - extractPan.y * rect.height) / extractZoom + rect.height / 2;
    const imageRect = getPreviewImageRect(rect);
    return {
      x: clampNumber((adjustedX - imageRect.left) / Math.max(1, imageRect.width), 0, 1),
      y: clampNumber((adjustedY - imageRect.top) / Math.max(1, imageRect.height), 0, 1),
    };
  }, [clampNumber, extractPan.x, extractPan.y, extractZoom, getPreviewImageRect]);

  const extractCropFromCurrentBackground = React.useCallback(async () => {
    if (!currentBackgroundSrc || extractPath.length < MIN_LASSO_POINTS) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const img = await loadImage(currentBackgroundSrc);
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const xs = extractPath.map((point) => point.x);
      const ys = extractPath.map((point) => point.y);
      const rawMinX = Math.max(0, Math.min(...xs));
      const rawMaxX = Math.min(1, Math.max(...xs));
      const rawMinY = Math.max(0, Math.min(...ys));
      const rawMaxY = Math.min(1, Math.max(...ys));
      const padX = Math.max(0.04, (rawMaxX - rawMinX) * EXTRACT_PADDING_RATIO);
      const padY = Math.max(0.04, (rawMaxY - rawMinY) * EXTRACT_PADDING_RATIO);
      const minX = Math.max(0, rawMinX - padX);
      const maxX = Math.min(1, rawMaxX + padX);
      const minY = Math.max(0, rawMinY - padY);
      const maxY = Math.min(1, rawMaxY + padY);
      const cropX = Math.max(0, Math.floor(minX * iw));
      const cropY = Math.max(0, Math.floor(minY * ih));
      const cropW = Math.max(24, Math.floor((maxX - minX) * iw));
      const cropH = Math.max(24, Math.floor((maxY - minY) * ih));
      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create crop preview.');
      ctx.clearRect(0, 0, cropW, cropH);
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      const cropUrl = canvas.toDataURL('image/png');
      const removed = await removeBackgroundLocal(cropUrl, {
        cleanup: EXTRACT_SUBJECT_CLEANUP,
      });
      const placement = buildExtractionPlacement({
        iw,
        ih,
        minX,
        maxX,
        minY,
        maxY,
        cropW,
        cropH,
      });
      setExtractPreviewUrl(removed);
      setExtractPreviewPlacement(placement);
    } catch (err: any) {
      setExtractPreviewUrl(null);
      setExtractPreviewPlacement(null);
      setExtractError(err?.message || 'Extraction failed.');
    } finally {
      setExtracting(false);
    }
  }, [buildExtractionPlacement, currentBackgroundSrc, extractPath, loadImage]);

  const createExtractedLayer = React.useCallback(() => {
    if (!extractPreviewUrl) return;
    if (!extractPreviewPlacement) {
      setExtractError('Preview the cutout again so placement coordinates can be created.');
      return;
    }
    const usesPortraitStore = extractedPortraitLayers.length > 0 || !!onPlaceExtractedLayer;
    const slotIndex = usesPortraitStore
      ? extractSlotCount
      : extractSlots.findIndex((slot) => !slot.src);
    if (slotIndex < 0 || slotIndex >= MAX_EXTRACT_SLOTS) {
      setExtractError('Remove one of the 4 portrait cutouts first.');
      return;
    }
    if (!usesPortraitStore) {
      const next = [...extractSlots];
      next[slotIndex] = {
        src: extractPreviewUrl,
        placement: extractPreviewPlacement,
        createdAt: Date.now(),
      };
      persistExtractSlots(next);
    }
    onPlaceExtractedLayer?.({
      src: extractPreviewUrl,
      x: extractPreviewPlacement.canvas.x,
      y: extractPreviewPlacement.canvas.y,
      scale: extractPreviewPlacement.canvas.scale,
      placement: extractPreviewPlacement,
    });
    setExtractMode(false);
    setExtractPath([]);
    setExtractPreviewUrl(null);
    setExtractPreviewPlacement(null);
    setExtractZoom(1);
    setExtractPan({ x: 0, y: 0 });
  }, [
    extractPreviewPlacement,
    extractPreviewUrl,
    extractSlotCount,
    extractSlots,
    extractedPortraitLayers.length,
    onPlaceExtractedLayer,
    persistExtractSlots,
  ]);

  const clearExtractedLayer = React.useCallback((idx: number) => {
    const next = [...extractSlots];
    next[idx] = { src: '' };
    persistExtractSlots(next);
  }, [extractSlots, persistExtractSlots]);

  const beginExtractionDraw = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!currentBackgroundSrc || extracting) return;
    event.preventDefault();
    event.stopPropagation();
    const startPoint = normalizePointerPoint(event);
    dragStartRef.current = [startPoint];
    setExtractPath([startPoint]);
    setExtractPreviewUrl(null);
    setExtractPreviewPlacement(null);
    setExtractError(null);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
  }, [currentBackgroundSrc, extracting, normalizePointerPoint]);

  const updateExtractionDraw = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const points = dragStartRef.current;
    if (!points) return;
    event.preventDefault();
    event.stopPropagation();
    const nextPoint = normalizePointerPoint(event);
    const lastPoint = points[points.length - 1];
    const distance = Math.hypot(nextPoint.x - lastPoint.x, nextPoint.y - lastPoint.y);
    if (distance < 0.008) return;
    const nextPoints = [...points, nextPoint];
    dragStartRef.current = nextPoints;
    setExtractPath(nextPoints);
  }, [normalizePointerPoint]);

  const endExtractionDraw = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const points = dragStartRef.current;
    if (!points) return;
    event.preventDefault();
    event.stopPropagation();
    dragStartRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
    setExtractMode(false);
    setExtractPath(points.length >= MIN_LASSO_POINTS ? points : []);
    if (points.length < MIN_LASSO_POINTS) {
      setExtractError('Draw a fuller outline around the subject.');
    }
  }, []);

  const beginPreviewPan = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (extractMode || extractZoom <= 1) return;
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: extractPan.x,
      panY: extractPan.y,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
  }, [extractMode, extractPan.x, extractPan.y, extractZoom]);

  const updatePreviewPan = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const start = panStartRef.current;
    if (!start) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = (event.clientX - start.x) / Math.max(1, rect.width);
    const dy = (event.clientY - start.y) / Math.max(1, rect.height);
    setExtractPan({
      x: Math.max(-MAX_EXTRACT_PAN, Math.min(MAX_EXTRACT_PAN, start.panX + dx)),
      y: Math.max(-MAX_EXTRACT_PAN, Math.min(MAX_EXTRACT_PAN, start.panY + dy)),
    });
  }, []);

  const endPreviewPan = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!panStartRef.current) return;
    panStartRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
  }, []);

  return (
    <div className="space-y-3">
      <div
        id="background-panel"
        className="relative rounded-xl transition"
      >
        <Collapsible
          title="Scene Builder"
          storageKey="p:bg"
          isOpen={selectedPanel === 'background'}
          onToggle={() =>
            setSelectedPanel(selectedPanel === 'background' ? null : 'background')
          }
          panelClassName={
            selectedPanel === 'background'
              ? editorPanelActiveClass
              : undefined
          }
          titleClassName={
            selectedPanel === 'background'
              ? editorPanelTitleActiveClass
              : ''
          }
          right={
            <div className="flex items-center gap-2 text-[11px]">
              {allowUploads && (
                <Chip small onClick={triggerUpload}>
                  Upload Scene
                </Chip>
              )}
              {(bgUploadUrl || bgUrl) && (
                <>
                  <Chip
                    small
                    active={bgFitMode}
                    onClick={() => {
                      setBgFitMode(true);
                      fitBackground();
                    }}
                    title="Show full image"
                  >
                    Fit
                  </Chip>
                  <Chip
                    small
                    onClick={() => {
                      setBgFitMode(false);
                      setBgScale(1.3);
                      setBgPosX(50);
                      setBgPosY(50);
                    }}
                    title="Slight zoom"
                  >
                    Fill
                  </Chip>
                </>
              )}
            </div>
          }
        >
          <div className={`mb-3 ${editorHelperTextClass}`}>
            Use this when you already have a scene or want to upload one. Anything you choose here lands directly on the canvas.
          </div>

          <input
            ref={bgRightRef}
            type="file"
            accept="image/*"
            onChange={onRightBgFile}
            className="hidden"
          />
          <input
            ref={logoPickerRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onLogoFiles}
            className="hidden"
          />
          <input
            ref={logoSlotPickerRef}
            type="file"
            accept="image/*"
            onChange={onLogoSlotFile}
            style={{
              position: 'fixed',
              left: '-9999px',
              width: 0,
              height: 0,
              opacity: 0,
            }}
          />
          <input
            ref={portraitSlotPickerRef}
            type="file"
            accept="image/*"
            onChange={onPortraitSlotFile}
            className="hidden"
          />
          <input
            ref={vibeUploadInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              await handleUploadDesignFromVibe(file);
            }}
          />

          <div className={`${editorSectionCardClass} mb-3`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={editorSectionTitleClass}>Color Palette</div>
              </div>
              <div
                className="mt-0.5 flex h-7 w-28 overflow-hidden rounded-md border border-white/10"
                aria-hidden="true"
              >
                {[
                  { key: 'secondary', color: scenePalette.secondary },
                  { key: 'bgTo', color: scenePalette.bgTo },
                  { key: 'primary', color: scenePalette.primary },
                  { key: 'neutral', color: scenePalette.neutral },
                  { key: 'accent', color: scenePalette.accent },
                ].map((swatch) => (
                  <span key={swatch.key} className="flex-1" style={{ backgroundColor: swatch.color }} />
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-2">
              {[
                { key: 'secondary' as const, label: 'Base', value: scenePalette.secondary },
                { key: 'bgTo' as const, label: 'Shadow', value: scenePalette.bgTo },
                { key: 'primary' as const, label: 'Main', value: scenePalette.primary },
                { key: 'neutral' as const, label: 'Meta', value: scenePalette.neutral },
                { key: 'accent' as const, label: 'Accent', value: scenePalette.accent },
              ].map((item) => (
                <label key={item.key} className="min-w-0 space-y-1">
                  <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500">
                    {item.label}
                  </span>
                  <input
                    type="color"
                    value={isHexColor(item.value) ? item.value : '#ffffff'}
                    onChange={(event) => applyScenePalette({ [item.key]: event.target.value })}
                    className="h-9 w-full cursor-pointer rounded-md border border-white/10 bg-neutral-950 p-1"
                    aria-label={`${item.label} color`}
                  />
                  <input
                    value={item.value}
                    onChange={(event) => {
                      const value = event.target.value.trim();
                      if (isHexColor(value)) applyScenePalette({ [item.key]: value });
                    }}
                    className="h-7 w-full rounded-md border border-white/10 bg-black/30 px-2 text-[10px] uppercase text-neutral-300 outline-none focus:border-cyan-400/70"
                    aria-label={`${item.label} hex`}
                  />
                </label>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {originalScenePalette ? (
                <button
                  key="original-template-palette"
                  type="button"
                  className="rounded-lg border border-white/10 bg-black/24 p-2 text-left transition hover:border-white/25 hover:bg-white/[0.04]"
                  onClick={resetToOriginalPalette}
                >
                  <div className="mb-2 flex h-5 overflow-hidden rounded border border-white/10">
                    {[
                      { key: 'secondary', color: originalScenePalette.secondary },
                      { key: 'bgTo', color: originalScenePalette.bgTo },
                      { key: 'primary', color: originalScenePalette.primary },
                      { key: 'neutral', color: originalScenePalette.neutral },
                      { key: 'accent', color: originalScenePalette.accent },
                    ].map((swatch) => (
                      <span key={swatch.key} className="flex-1" style={{ backgroundColor: swatch.color }} />
                    ))}
                  </div>
                  <div className="text-[11px] font-medium text-neutral-200">Original</div>
                </button>
              ) : null}
              {onGeneratedPaletteApply ? (
                <button
                  key="generated-template-palette"
                  type="button"
                  className="rounded-lg border border-white/10 bg-black/24 p-2 text-left transition hover:border-white/25 hover:bg-white/[0.04]"
                  onClick={onGeneratedPaletteApply}
                >
                  <div className="mb-2 flex h-5 overflow-hidden rounded border border-white/10">
                    {[
                      { key: 'secondary', color: scenePalette.secondary },
                      { key: 'bgTo', color: scenePalette.bgTo },
                      { key: 'primary', color: scenePalette.primary },
                      { key: 'neutral', color: scenePalette.neutral },
                      { key: 'accent', color: scenePalette.accent },
                    ].map((swatch) => (
                      <span key={swatch.key} className="flex-1" style={{ backgroundColor: swatch.color }} />
                    ))}
                  </div>
                  <div className="text-[11px] font-medium text-neutral-200">Generated</div>
                </button>
              ) : null}
              {recommendedPalettes.map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  className="rounded-lg border border-white/10 bg-black/24 p-2 text-left transition hover:border-white/25 hover:bg-white/[0.04]"
                  onClick={() => applyScenePalette(rec.palette)}
                >
                  <div className="mb-2 flex h-5 overflow-hidden rounded border border-white/10">
                    {[
                      { key: 'secondary', color: rec.palette.secondary },
                      { key: 'bgTo', color: rec.palette.bgTo },
                      { key: 'primary', color: rec.palette.primary },
                      { key: 'neutral', color: rec.palette.neutral },
                      { key: 'accent', color: rec.palette.accent },
                    ].map((swatch) => (
                      <span key={swatch.key} className="flex-1" style={{ backgroundColor: swatch.color }} />
                    ))}
                  </div>
                  <div className="text-[11px] font-medium text-neutral-200">{rec.label}</div>
                </button>
              ))}
            </div>

            {layoutOptions.length > 0 && (
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className={editorSectionTitleClass}>Layout</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {layoutOptions.map((option) => {
                    const isActive = activeLayoutId === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={clsx(
                          "h-10 rounded-lg border px-3 text-[12px] font-semibold uppercase tracking-[0.14em] transition",
                          isActive
                            ? "border-cyan-300/80 bg-cyan-300 text-black shadow-[0_0_18px_rgba(34,211,238,0.22)]"
                            : "border-white/10 bg-black/24 text-neutral-300 hover:border-white/25 hover:bg-white/[0.04]"
                        )}
                        onClick={() => onLayoutSelect?.(option.id)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {showScenePresets && scenePacks.length > 0 && (
            <div className="mb-3 border-b border-white/10 pb-3">
              <div className={editorSectionEyebrowClass}>Scene Packs</div>
              <div className={editorSectionMetaClass}>Build with movable graphics, flares, textures, and emoji accents.</div>
              <div className="grid grid-cols-2 gap-2">
                {scenePacks.map((pack, index) => {
                  const isActive = activeScenePackId === pack.id || currentBackgroundSrc === pack.background;
                  const isFeatured = index === 0;
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      className={clsx(
                        isActive ? editorItemCardActiveClass : editorItemCardClass,
                        "group overflow-hidden text-left",
                        isFeatured && "col-span-2"
                      )}
                      onClick={() => onScenePackSelect?.(pack)}
                    >
                      <div className={clsx("relative bg-black", editorThumbClass, isFeatured ? "aspect-[1.9/1]" : "aspect-square")}>
                        <img
                          src={pack.preview}
                          alt={pack.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          draggable={false}
                          loading={isFeatured ? "eager" : "lazy"}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/82 via-black/14 to-transparent" />
                        <div
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-1"
                          style={{ background: `linear-gradient(90deg, ${pack.defaultTextColor}, ${pack.accentColor})` }}
                        />
                        <div className="absolute bottom-2 left-2 right-2 min-w-0">
                          <div className="truncate text-[12px] font-semibold text-white">{pack.name}</div>
                          <div className="truncate text-[10px] text-neutral-300">{pack.mood}</div>
                        </div>
                        {isFeatured && (
                          <div className="absolute right-2 top-2 rounded-full border border-white/20 bg-black/55 px-2 py-1 text-[10px] font-medium text-white">
                            Start here
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 px-1 py-2 text-[10px] text-neutral-400">
                        <span>{isActive ? "Editable scene loaded" : "Build editable scene"}</span>
                        <span style={{ color: pack.accentColor }}>{isActive ? "Next below" : "Tap"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {(() => {
                const activePack = scenePacks.find((pack) => activeScenePackId === pack.id || currentBackgroundSrc === pack.background);
                if (!activePack) return null;
                return (
                  <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="text-[12px] font-semibold text-white">
                      {activePack.name} scene loaded
                    </div>
                    <div className="mt-1 text-[11px] leading-4 text-neutral-400">
                      This pack added separate movable layers. Click any prop, flare, texture, or emoji on the canvas to adjust it.
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        className={editorPrimaryButtonClass}
                        onClick={onSubjectUploadClick}
                      >
                        Add Subject
                      </button>
                      {showAiTools && onGenerateSubject ? (
                        <button
                          type="button"
                          className={editorUploadActionClass}
                          onClick={onGenerateSubject}
                          disabled={isGeneratingSubject}
                        >
                          {isGeneratingSubject ? "Generating..." : "Generate Subject"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={editorUploadActionClass}
                        onClick={onEditHeadlineClick}
                      >
                        Edit Event Name
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {showScenePresets && presetBackgrounds.length > 0 && (
            <div className="mb-3 border-b border-white/10 pb-3">
              <div className={editorSectionEyebrowClass}>{presetBackgroundLabel}</div>
              <div className={editorSectionMetaClass}>Use a ready-made scene and keep moving.</div>
              <div className="grid grid-cols-2 gap-2">
                {presetBackgrounds.map((background) => {
                  const isActive = currentBackgroundSrc === background.src;
                  return (
                    <button
                      key={background.id}
                      type="button"
                      className={`${isActive ? editorItemCardActiveClass : editorItemCardClass} overflow-hidden text-left`}
                      onClick={() => onPresetBackgroundSelect?.(background.src)}
                    >
                      <div className={`aspect-square ${editorThumbClass} bg-black`}>
                        <img
                          src={background.src}
                          alt={background.name}
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                      </div>
                      <div className="px-1 py-2 text-[11px] font-medium text-neutral-200">
                        {background.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {bgUploadUrl || bgUrl ? (
            <div className="space-y-2">
              <div className={`aspect-square w-full relative ${editorThumbClass}`}>
                <img
                  ref={previewRef}
                  src={bgUploadUrl || bgUrl!}
                  alt="Background preview"
                  className={`w-full h-full ${bgFitMode ? "object-contain" : "object-cover"}`}
                  draggable={false}
                />
              </div>

              <div className="flex gap-2 text-[11px]">
                <Chip
                  small
                  onClick={() => {
                    setBgFitMode(true);
                    fitBackground();
                  }}
                >
                  Fit (Full)
                </Chip>
                <Chip small onClick={() => setBgScale((s) => Math.min(3, s * 1.1))}>
                  Zoom +
                </Chip>
                <Chip small onClick={() => setBgScale((s) => Math.max(0.5, s / 1.1))}>
                  Zoom −
                </Chip>
                <Chip small onClick={() => { setBgPosX(50); setBgPosY(50); }}>
                  Re-center
                </Chip>
              </div>

              <div className={editorHelperTextClass}>
                Tip: In <b>Move</b> → <b>background</b> mode, drag to pan and
                <span className="inline-block px-1 mx-1 rounded bg-neutral-800/70 border border-neutral-700">
                  Ctrl
                </span>
                + scroll to zoom.
              </div>

              {showAiTools && (
                <>
                  <div className={`${editorSectionCardClass} mt-3`}>
                    <div className={editorSectionTitleClass}>
                      AI Subject
                    </div>
                    <div className={`${editorHelperTextClass} mb-3`}>
                      Use this when your scene is already set and you need a subject placed over it.
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                      <label className="space-y-1">
                        <span className="text-neutral-400">Identity</span>
                        <select
                          className="w-full rounded-md border border-neutral-700 bg-neutral-900/60 px-2 py-1"
                          value={subjectGender}
                          onChange={(e) => setSubjectGender?.(e.target.value)}
                        >
                          {[
                            { v: 'any', label: 'Any' },
                            { v: 'woman', label: 'Female / femme-presenting' },
                            { v: 'man', label: 'Male / masc-presenting' },
                            { v: 'nonbinary', label: 'Non-binary / androgynous' },
                          ].map((opt) => (
                            <option key={opt.v} value={opt.v}>{opt.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-neutral-400">Ethnicity</span>
                        <select
                          className="w-full rounded-md border border-neutral-700 bg-neutral-900/60 px-2 py-1"
                          value={subjectEthnicity}
                          onChange={(e) => setSubjectEthnicity?.(e.target.value)}
                        >
                          {[
                            { v: 'any', label: 'Any' },
                            { v: 'black', label: 'Black' },
                            { v: 'white', label: 'Caucasian' },
                            { v: 'latino', label: 'Latina / Latino' },
                            { v: 'east-asian', label: 'East Asian' },
                            { v: 'indian', label: 'Indian' },
                            { v: 'middle-eastern', label: 'Middle Eastern' },
                            { v: 'mixed', label: 'Mixed' },
                          ].map((opt) => (
                            <option key={opt.v} value={opt.v}>{opt.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-neutral-400">Attire</span>
                        <select
                          className="w-full rounded-md border border-neutral-700 bg-neutral-900/60 px-2 py-1"
                          value={subjectAttire}
                          onChange={(e) => setSubjectAttire?.(e.target.value)}
                        >
                          {['club-glam', 'luxury', 'festival', 'all-white', 'streetwear', 'cyberpunk'].map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </label>
                    <label className="space-y-1">
                      <span className="text-neutral-400">Framing</span>
                      <select
                        className="w-full rounded-md border border-neutral-700 bg-neutral-900/60 px-2 py-1"
                        value={subjectShot}
                        onChange={(e) => setSubjectShot?.(e.target.value)}
                      >
                        {['full-body', 'three-quarter', 'waist-up', 'chest-up', 'close-up'].map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-neutral-400">Energy</span>
                      <select
                        className="w-full rounded-md border border-neutral-700 bg-neutral-900/60 px-2 py-1"
                        value={subjectEnergy}
                        onChange={(e) => setSubjectEnergy?.(e.target.value)}
                      >
                        {['calm', 'vibe', 'wild'].map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-neutral-400">Pose</span>
                      <select
                        className="w-full rounded-md border border-neutral-700 bg-neutral-900/60 px-2 py-1"
                        value={subjectPose}
                        onChange={(e) => setSubjectPose?.(e.target.value)}
                      >
                        {['dancing', 'hands-up', 'performance', 'dj'].map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </label>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        className={`w-full ${editorPrimaryButtonClass}`}
                        onClick={onGenerateSubject}
                        disabled={isGeneratingSubject}
                      >
                        {isGeneratingSubject ? "Generating…" : "Generate Subject"}
                      </button>
                      {hasSubject && <span className="text-neutral-500">Subject already on canvas</span>}
                    </div>
                    {subjectError && (
                      <div className="mt-2 text-[11px] text-red-400 break-words">
                        {subjectError}
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>
          ) : (
            <div className={editorEmptyStateClass}>
              <div className={editorEmptyStateTitleClass}>No scene on the canvas yet</div>
              <div className={editorEmptyStateBodyClass}>
              {allowUploads ? (
                <>
                  No background yet. Upload one
                  {showAiTools ? <> or use AI Scene.</> : <>.</>}
                </>
              ) : (
                <>
                  Pick one of the DJ backgrounds above to load the canvas.
                </>
              )}
              </div>
              {allowUploads && (
                <div className="mt-3">
                  <button type="button" className={`w-full ${editorPrimaryButtonClass}`} onClick={triggerUpload}>
                    Upload Scene
                  </button>
                </div>
              )}
            </div>
          )}

          {genError && <div className="text-xs text-red-400 break-words mt-2">{genError}</div>}
        </Collapsible>
      </div>

      {!allowUploads || !enableExtractSubject ? null : (
        <div className="relative rounded-xl transition">
          <Collapsible
            title="Extract Subject"
            storageKey="p:extract-subject"
            defaultOpen={false}
          >
            <div className={`mb-3 ${editorHelperTextClass}`}>
              Draw around a subject, let the cutout snap to the edges, preview it, then create a reusable layer.
            </div>
            {!currentBackgroundSrc ? (
              <div className={editorEmptyStateClass}>
                <div className={editorEmptyStateTitleClass}>No scene loaded</div>
                <div className={editorEmptyStateBodyClass}>
                  Load a scene first, then extract a subject from it.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`${editorUploadHolderClass}`}>
                  <div className="text-[12px] font-medium text-white">Selection</div>
                  <div className="flex items-end gap-2">
                      <div className="min-w-0 flex-1">
                        <InlineSliderInput
                          label="Zoom"
                          min={1}
                          max={3}
                          step={0.05}
                          value={extractZoom}
                          precision={2}
                          onChange={setExtractZoom}
                          rangeClassName="flex-1 accent-cyan-400"
                        />
                      </div>
                      <button
                        type="button"
                        className="min-h-[32px] shrink-0 border border-neutral-700 bg-transparent px-2 py-1 text-[10px] font-medium text-neutral-300 transition hover:bg-neutral-900/60"
                        onClick={() => {
                          setExtractZoom(1);
                          setExtractPan({ x: 0, y: 0 });
                        }}
                      >
                        Reset View
                      </button>
                  </div>
                  <div
                    ref={selectionViewportRef}
                    className={`${editorUploadPreviewClass} relative min-h-[260px] sm:min-h-[360px] overflow-hidden`}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        transform: `translate(${extractPan.x * 100}%, ${extractPan.y * 100}%) scale(${extractZoom})`,
                        transformOrigin: 'center center',
                      }}
                    >
                      <img
                        ref={previewRef}
                        src={currentBackgroundSrc}
                        alt="Extraction source"
                        className="h-full w-full object-contain bg-white/5"
                        draggable={false}
                      />
                    <div
                        className={clsx(
                          "pointer-events-none absolute inset-0"
                        )}
                      />
                      {extractPath.length > 1 ? (
                        <svg
                          className="pointer-events-none absolute inset-0 h-full w-full"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          <polygon
                            points={extractPath
                              .map((point) => sourcePointToViewportPoint(point))
                              .map((point) => `${point.x * 100},${point.y * 100}`)
                              .join(' ')}
                            fill="rgba(34,211,238,0.16)"
                            stroke="rgba(103,232,249,0.9)"
                            strokeWidth="0.6"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </div>
                    <div
                      className={clsx(
                        "absolute inset-0",
                        extractMode ? "cursor-crosshair" : extractZoom > 1 ? "cursor-grab" : "cursor-default"
                      )}
                      style={{ touchAction: 'none' }}
                      onPointerDown={extractMode ? beginExtractionDraw : beginPreviewPan}
                      onPointerMove={extractMode ? updateExtractionDraw : updatePreviewPan}
                      onPointerUp={extractMode ? endExtractionDraw : endPreviewPan}
                      onPointerCancel={extractMode ? endExtractionDraw : endPreviewPan}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={editorUploadActionClass}
                      onClick={() => {
                        setExtractMode(true);
                        setExtractPreviewUrl(null);
                        setExtractPreviewPlacement(null);
                        setExtractError(null);
                      }}
                    >
                      Draw Around Subject
                    </button>
                    <button
                      type="button"
                      className={editorUploadPlaceClass}
                      disabled={extractPath.length < MIN_LASSO_POINTS || extracting}
                      onClick={() => void extractCropFromCurrentBackground()}
                    >
                      {extracting ? 'Previewing...' : 'Preview'}
                    </button>
                  </div>
                  <button
                    type="button"
                    className={`${editorUploadClearClass} w-full`}
                    disabled={extractPath.length === 0 && !extractPreviewUrl}
                    onClick={() => {
                      setExtractMode(false);
                      setExtractPath([]);
                      setExtractPreviewUrl(null);
                      setExtractPreviewPlacement(null);
                      setExtractError(null);
                    }}
                  >
                    Refine Selection
                  </button>
                </div>

                {extractPreviewUrl ? (
                  <div className={`${editorUploadHolderClass}`}>
                    <div className="text-[12px] font-medium text-white">Preview</div>
                    <div className={`${editorUploadPreviewClass} h-32`}>
                      <img
                        src={extractPreviewUrl}
                        alt="Extracted subject preview"
                        className="h-full w-full object-contain bg-white/5"
                        draggable={false}
                      />
                    </div>
                    <button
                      type="button"
                      className={editorPrimaryButtonClass}
                      disabled={extractSlotCount >= MAX_EXTRACT_SLOTS}
                      onClick={createExtractedLayer}
                    >
                      Create Layer
                    </button>
                  </div>
                ) : null}

                {extractError ? (
                  <div className="text-xs text-red-400 break-words">{extractError}</div>
                ) : null}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {onPlaceExtractedLayer
                    ? Array.from({ length: MAX_EXTRACT_SLOTS }, (_, i) => portraitExtractLayers[i] || null).map(
	                        (layer, i) => {
	                          const src = layer?.url || "";
	                          const placement = layer?.extraction;
	                          const displayX = Number(layer?.x ?? placement?.canvas.x);
	                          const displayY = Number(layer?.y ?? placement?.canvas.y);
	                          return (
	                            <div key={`extract-portrait-${layer?.id || i}`} className={editorUploadHolderClass}>
	                              <div className="flex items-center justify-between gap-2">
	                                <div className="text-[12px] font-medium text-white">Portrait Cutout {i + 1}</div>
	                                {src ? (
	                                  <div className="text-[10px] text-neutral-500">
	                                    {Number.isFinite(displayX) ? Math.round(displayX) : "--"}%,{" "}
	                                    {Number.isFinite(displayY) ? Math.round(displayY) : "--"}%
	                                  </div>
	                                ) : null}
	                              </div>
                              <div className={clsx(editorUploadPreviewClass, "h-28")}>
                                {src ? (
                                  <img
                                    src={src}
                                    alt={`Portrait cutout ${i + 1}`}
                                    className="h-full w-full object-contain bg-white/5"
                                    draggable={false}
                                  />
                                ) : (
                                  <div className="text-[11px] leading-6 text-neutral-400">No portrait cutout stored.</div>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  className={editorUploadPlaceClass}
                                  disabled={!layer?.id}
                                  onClick={() => layer?.id && onSelectExtractedPortrait?.(layer.id)}
                                >
                                  Select
                                </button>
                                <button
                                  type="button"
                                  className={editorUploadClearClass}
                                  disabled={!layer?.id}
                                  onClick={() => layer?.id && onRemoveExtractedPortrait?.(layer.id)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        }
                      )
                    : extractSlots.map((slot, i) => {
                        const src = slot.src;
                        return (
                      <div key={`extract-slot-${i}`} className={editorUploadHolderClass}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[12px] font-medium text-white">Layer {i + 1}</div>
                          {src && slot.placement ? (
                            <div className="text-[10px] text-neutral-500">
                              {Math.round(slot.placement.canvas.x)}%, {Math.round(slot.placement.canvas.y)}%
                            </div>
                          ) : null}
                        </div>
                        <div className={clsx(editorUploadPreviewClass, "h-28")}>
                          {src ? (
                            <img
                              src={src}
                              alt={`Extracted layer ${i + 1}`}
                              className="h-full w-full object-contain bg-white/5"
                              draggable={false}
                            />
                          ) : (
                            <div className="text-[11px] leading-6 text-neutral-400">No layer stored.</div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            className={editorUploadPlaceClass}
                            disabled
                            onClick={() => {}}
                          >
                            Place
                          </button>
                          <button
                            type="button"
                            className={editorUploadClearClass}
                            disabled={!src}
                            onClick={() => clearExtractedLayer(i)}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                        );
                      })}
                </div>
              </div>
            )}
          </Collapsible>
        </div>
      )}

      <div
        className="relative rounded-xl transition"
      >
        <Collapsible
          title="Scene Effects"
          storageKey="p:bgfx"
          defaultOpen={false}
          isOpen={selectedPanel === 'background' || selectedPanel === 'bgfx'}
          panelClassName={
            selectedPanel === 'background' || selectedPanel === 'bgfx'
              ? editorPanelActiveClass
              : undefined
          }
          titleClassName={
            selectedPanel === 'bgfx'
              ? editorPanelTitleActiveClass
              : ''
          }
          onToggle={() =>
            setSelectedPanel(selectedPanel === 'bgfx' ? null : 'bgfx')
          }
          right={
            <Chip
              small
            onClick={() => {
              setHue(0);
              setVignette(true);
              setVignetteStrength(0.55);
              setBgScale(1);
              setBgBlur(0);
              setBgRotate(0);
            }}
            >
              Reset
            </Chip>
          }
        >
          <div className={`mb-3 ${editorHelperTextClass}`}>
            Use this after your scene is already in place. These controls change the mood without replacing the background.
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Stepper label="Scale" value={bgScale} setValue={setBgScale} min={0.5} max={5} step={0.1} digits={2} />
            <Stepper label="Blur (px)" value={bgBlur} setValue={setBgBlur} min={0} max={20} step={0.5} digits={1} />
            <Stepper label="Vignette" value={vignetteStrength} setValue={setVignetteStrength} min={0} max={0.9} step={0.02} digits={2} />
          </div>

          <div className="mt-2 grid grid-cols-3 gap-3">
            <Stepper
              label="Hue"
              value={hue}
              setValue={setHue}
              min={-180}
              max={180}
              step={1}
              className="col-span-2"
            />
            <Stepper label="Rotation (°)" value={bgRotate} setValue={setBgRotate} min={-180} max={180} step={1} />
          </div>
        </Collapsible>
      </div>
    </div>
  );
}

export default React.memo(BackgroundPanels);
