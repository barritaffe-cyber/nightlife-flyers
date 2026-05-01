'use client';
/* eslint-disable @next/next/no-img-element */

import * as React from 'react';
import clsx from 'clsx';
import {
  Collapsible,
  Chip,
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

type Props = {
  presetBackgrounds?: ReadonlyArray<{
    id: string;
    name: string;
    src: string;
  }>;
  presetBackgroundLabel?: string;
  onPresetBackgroundSelect?: (src: string) => void;
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
  onPlaceExtractedLayer?: (src: string) => void;
};

function BackgroundPanels({
  presetBackgrounds = [],
  presetBackgroundLabel = 'Background Picks',
  onPresetBackgroundSelect,
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
  onPlaceExtractedLayer,
}: Props) {
  const MAX_EXTRACT_SLOTS = 4;
  const MIN_LASSO_POINTS = 6;
  const MAX_EXTRACT_PAN = 0.35;
  const EXTRACT_PADDING_RATIO = 0.14;
  const previewRef = React.useRef<HTMLImageElement | null>(null);
  const selectionViewportRef = React.useRef<HTMLDivElement | null>(null);
  const currentBackgroundSrc = bgUploadUrl || bgUrl;
  const [extractSlots, setExtractSlots] = React.useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('nf:sceneExtractSlots');
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.from({ length: MAX_EXTRACT_SLOTS }, (_, i) => parsed?.[i] ?? '');
      }
    } catch {}
    return Array(MAX_EXTRACT_SLOTS).fill('');
  });
  const [extractMode, setExtractMode] = React.useState(false);
  const [extracting, setExtracting] = React.useState(false);
  const [extractError, setExtractError] = React.useState<string | null>(null);
  const [extractPreviewUrl, setExtractPreviewUrl] = React.useState<string | null>(null);
  const [extractPath, setExtractPath] = React.useState<Array<{ x: number; y: number }>>([]);
  const dragStartRef = React.useRef<Array<{ x: number; y: number }> | null>(null);
  const panStartRef = React.useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [extractZoom, setExtractZoom] = React.useState(1);
  const [extractPan, setExtractPan] = React.useState({ x: 0, y: 0 });

  const persistExtractSlots = React.useCallback((next: string[]) => {
    const normalized = Array.from({ length: MAX_EXTRACT_SLOTS }, (_, i) => next[i] ?? '');
    setExtractSlots(normalized);
    try {
      localStorage.setItem('nf:sceneExtractSlots', JSON.stringify(normalized));
    } catch {}
  }, []);

  const loadImage = React.useCallback((src: string) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load source image.'));
      img.src = src;
    });
  }, []);

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
    return {
      x: Math.max(0, Math.min(1, adjustedX / rect.width)),
      y: Math.max(0, Math.min(1, adjustedY / rect.height)),
    };
  }, [extractPan.x, extractPan.y, extractZoom]);

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
      const removed = await removeBackgroundLocal(cropUrl);
      setExtractPreviewUrl(removed);
    } catch (err: any) {
      setExtractPreviewUrl(null);
      setExtractError(err?.message || 'Extraction failed.');
    } finally {
      setExtracting(false);
    }
  }, [currentBackgroundSrc, extractPath, loadImage]);

  const createExtractedLayer = React.useCallback(() => {
    if (!extractPreviewUrl) return;
    const slotIndex = extractSlots.findIndex((slot) => !slot);
    if (slotIndex === -1) {
      setExtractError('Clear one of the 4 subject slots first.');
      return;
    }
    const next = [...extractSlots];
    next[slotIndex] = extractPreviewUrl;
    persistExtractSlots(next);
    onPlaceExtractedLayer?.(extractPreviewUrl);
    setExtractMode(false);
    setExtractPath([]);
    setExtractPreviewUrl(null);
    setExtractZoom(1);
    setExtractPan({ x: 0, y: 0 });
  }, [extractPreviewUrl, extractSlots, onPlaceExtractedLayer, persistExtractSlots]);

  const clearExtractedLayer = React.useCallback((idx: number) => {
    const next = [...extractSlots];
    next[idx] = '';
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

          {presetBackgrounds.length > 0 && (
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
                  <div className="flex items-center gap-2">
                      <div className="min-w-[48px] text-[11px] font-medium text-neutral-300">
                        Zoom
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.05}
                        value={extractZoom}
                        onChange={(e) => setExtractZoom(Number(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
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
                            points={extractPath.map((point) => `${point.x * 100},${point.y * 100}`).join(' ')}
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
                  {extractSlots.map((src, i) => (
                    <div key={`extract-slot-${i}`} className={editorUploadHolderClass}>
                      <div className="text-[12px] font-medium text-white">Layer {i + 1}</div>
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
                          disabled={!src}
                          onClick={() => src && onPlaceExtractedLayer?.(src)}
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
                  ))}
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
