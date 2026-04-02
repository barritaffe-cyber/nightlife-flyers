'use client';
/* eslint-disable @next/next/no-img-element */

import * as React from 'react';
import { Chip, Collapsible, InlineSliderInput } from './controls';
import { FontPicker } from './FontPicker';
import { removeBackgroundLocal } from '../../lib/removeBgLocal';
import type { PortraitLighting } from '../../app/state/flyerState';
import {
  DJ_COLOR_PRESETS,
  DJ_FONT_PRESETS,
  type DJBrandKit,
} from '../../lib/djBrandKit';

type Props = {
  selectedPanel: string | null;
  setSelectedPanel: (panel: string | null) => void;
  requestedWorkflowStep?: { step: WorkflowStep; nonce: number } | null;
  hasBackground: boolean;
  kit: DJBrandKit;
  brandProfiles: Array<{ id: string; label: string }>;
  activeBrandId: string;
  studioEnabled: boolean;
  onKitChange: (next: DJBrandKit) => void;
  onSelectBrandProfile: (id: string) => void;
  onCreateBrandProfile: () => void;
  onDuplicateBrandProfile: () => void;
  onDeleteBrandProfile: () => void;
  onSaveCurrentBrand: () => void;
  onRenameBrandProfile: (label: string) => void;
  onApplyMyBrand: () => void;
  onCaptureCurrentFace: () => void;
  mainFaceOnCanvas: boolean;
  mainFaceLocked: boolean;
  mainFaceScale: number;
  mainFaceOpacity: number;
  mainFaceLightingEnabled: boolean;
  mainFaceLightingAutoMatch: boolean;
  mainFaceLightingAnalyzed: boolean;
  mainFaceLightingSide: "left" | "right";
  mainFaceLightingColor: string;
  mainFaceLightingAmbient: number;
  mainFaceLightingKey: number;
  mainFaceLightingFill: number;
  mainFaceLightingRim: number;
  mainFaceLightingShadow: number;
  mainFaceLightingWarmth: number;
  mainFaceLightingContrast: number;
  mainFaceFilterPreset: "none" | "mono" | "contrast" | "halftone" | "poster" | "pop";
  mainFaceFilterStrength: number;
  onMainFaceLockToggle: () => void;
  onMainFaceScaleChange: (value: number) => void;
  onMainFaceOpacityChange: (value: number) => void;
  onAnalyzeMainFaceLighting: () => void;
  onResetMainFaceLighting: () => void;
  onMainFaceLightingToggle: () => void;
  onMainFaceLightingAutoMatchToggle: () => void;
  onMainFaceLightingChange: (patch: Partial<PortraitLighting>) => void;
  onMainFaceFilterPresetChange: (preset: "none" | "mono" | "contrast" | "halftone" | "poster" | "pop") => void;
  onMainFaceFilterStrengthChange: (value: number) => void;
  onUseBrandLogo: (index: number) => void;
  onUseBrandFace: () => void;
  onRemoveMainFace: () => void;
  currentPortraitUrl: string | null;
  headlineFonts: string[];
  bodyFonts: string[];
};

type WorkflowStep = 'background' | 'mainface' | 'lighting' | 'design';

const djSectionClass = 'border border-neutral-800 bg-neutral-950/40 p-3 space-y-3';
const djCardClass = 'border border-neutral-700/90 bg-neutral-900/60 p-3 space-y-3';
const djActionClass = 'w-full border border-neutral-700 bg-neutral-900/60 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-neutral-200 transition hover:bg-neutral-900';
const djPrimaryActionClass = 'w-full border border-cyan-400/70 bg-cyan-500/10 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-cyan-100 transition hover:bg-cyan-500/16';
const djSubCardClass = 'border border-neutral-700/90 bg-neutral-900/60 p-3 space-y-2.5';
const djStatusCellClass = 'border border-neutral-700 bg-neutral-950/70 px-2.5 py-2 text-[10px] uppercase tracking-[0.12em] text-neutral-300';
const djMetaNoteClass = 'border border-neutral-800 bg-neutral-950/60 px-2.5 py-2 text-[10px] text-neutral-400';

function dedupeFonts(list: string[]): string[] {
  return Array.from(new Set((Array.isArray(list) ? list : []).filter(Boolean)));
}

export default function DjBrandingPanel({
  selectedPanel,
  setSelectedPanel,
  requestedWorkflowStep = null,
  hasBackground,
  kit,
  brandProfiles,
  activeBrandId,
  studioEnabled,
  onKitChange,
  onSelectBrandProfile,
  onCreateBrandProfile,
  onDuplicateBrandProfile,
  onDeleteBrandProfile,
  onSaveCurrentBrand,
  onRenameBrandProfile,
  onApplyMyBrand,
  onCaptureCurrentFace,
  mainFaceOnCanvas,
  mainFaceLocked,
  mainFaceScale,
  mainFaceOpacity,
  mainFaceLightingEnabled,
  mainFaceLightingAutoMatch,
  mainFaceLightingAnalyzed,
  mainFaceLightingColor,
  mainFaceLightingAmbient,
  mainFaceLightingKey,
  mainFaceLightingFill,
  mainFaceLightingRim,
  mainFaceLightingShadow,
  mainFaceLightingWarmth,
  mainFaceLightingContrast,
  mainFaceFilterPreset,
  mainFaceFilterStrength,
  onMainFaceLockToggle,
  onMainFaceScaleChange,
  onMainFaceOpacityChange,
  onAnalyzeMainFaceLighting,
  onResetMainFaceLighting,
  onMainFaceLightingToggle,
  onMainFaceLightingAutoMatchToggle,
  onMainFaceLightingChange,
  onMainFaceFilterPresetChange,
  onMainFaceFilterStrengthChange,
  onUseBrandLogo,
  onUseBrandFace,
  onRemoveMainFace,
  currentPortraitUrl,
  headlineFonts,
  bodyFonts,
}: Props) {
  const logoInputs = React.useRef<Array<HTMLInputElement | null>>([]);
  const faceInput = React.useRef<HTMLInputElement | null>(null);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [faceError, setFaceError] = React.useState<string | null>(null);
  const [faceBusy, setFaceBusy] = React.useState(false);
  const [profileName, setProfileName] = React.useState(kit.label || "Brand 1");
  const [vaultOpen, setVaultOpen] = React.useState(false);
  const [advancedLightingOpen, setAdvancedLightingOpen] = React.useState(false);
  const [workflowStep, setWorkflowStep] = React.useState<WorkflowStep>('background');
  const [vaultFeedback, setVaultFeedback] = React.useState<string | null>(null);
  const wasDjBrandingOpen = React.useRef(false);

  React.useEffect(() => {
    setProfileName(kit.label || "Brand 1");
  }, [kit.id, kit.label]);

  React.useEffect(() => {
    if (!helpOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHelpOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [helpOpen]);

  const setLogoAt = React.useCallback(
    (idx: number, value: string) => {
      const nextLogos = [...(kit.logos || ['', '', '', ''])];
      while (nextLogos.length < 4) nextLogos.push('');
      nextLogos[idx] = value;
      onKitChange({ ...kit, logos: nextLogos.slice(0, 4) });
    },
    [kit, onKitChange]
  );

  const onLogoFile = React.useCallback(
    (idx: number, file?: File | null) => {
      if (!file) return;
      const r = new FileReader();
      r.onload = () => setLogoAt(idx, String(r.result || ''));
      r.readAsDataURL(file);
    },
    [setLogoAt]
  );

  const onFaceFile = React.useCallback(
    async (file?: File | null) => {
      if (!file) return;
      try {
        setFaceBusy(true);
        setFaceError(null);
        const rawDataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ''));
          r.onerror = () => reject(new Error('Failed to read Main Face upload.'));
          r.readAsDataURL(file);
        });
        const cutout = await removeBackgroundLocal(rawDataUrl);
        onKitChange({ ...kit, primaryPortrait: String(cutout || '') });
      } catch (err: any) {
        setFaceError(err?.message || 'Main Face background removal failed.');
      } finally {
        setFaceBusy(false);
      }
    },
    [kit, onKitChange]
  );

  const logoList = Array.isArray(kit.logos) ? kit.logos.slice(0, 4) : ['', '', '', ''];
  while (logoList.length < 4) logoList.push('');
  const savedLogoCount = logoList.filter((src) => !!String(src || '').trim()).length;
  const hasSavedFonts = !!(String(kit.preferredFonts.headline || '').trim() && String(kit.preferredFonts.body || '').trim());
  const hasSavedPalette = !!(
    String(kit.brandPalette.main || '').trim() &&
    String(kit.brandPalette.accent || '').trim() &&
    String(kit.brandPalette.glow || '').trim()
  );

  const savedFace = kit.primaryPortrait || '';
  const displayFace = savedFace || currentPortraitUrl || '';
  const hasSavedMainFace = !!savedFace;
  const recommendedStep: WorkflowStep = !hasBackground
    ? 'background'
    : !mainFaceOnCanvas || !hasSavedMainFace
    ? 'mainface'
    : !mainFaceLightingAnalyzed
    ? 'lighting'
    : 'design';
  const designUnlocked = hasBackground && mainFaceOnCanvas;
  const workflowSteps: Array<[WorkflowStep, string]> = React.useMemo(
    () => [
      ['background', 'Background'],
      ['mainface', 'Main Face'],
      ['lighting', 'Lighting'],
      ['design', 'Design'],
    ],
    []
  );
  const currentStepIndex = workflowSteps.findIndex(([id]) => id === workflowStep);
  const recommendedStepIndex = workflowSteps.findIndex(([id]) => id === recommendedStep);
  const recommendedStepLabel = workflowSteps[recommendedStepIndex]?.[1] ?? 'Background';
  const stepEnabled = React.useMemo<Record<WorkflowStep, boolean>>(
    () => ({
      background: true,
      mainface: hasBackground,
      lighting: hasBackground && mainFaceOnCanvas,
      design: designUnlocked,
    }),
    [designUnlocked, hasBackground, mainFaceOnCanvas]
  );

  React.useEffect(() => {
    if (!stepEnabled[workflowStep]) {
      setWorkflowStep(recommendedStep);
      return;
    }
  }, [recommendedStep, selectedPanel, stepEnabled, workflowStep]);

  React.useEffect(() => {
    const isOpen = selectedPanel === 'dj_branding';
    if (isOpen && !wasDjBrandingOpen.current) {
      setWorkflowStep(recommendedStep);
    }
    wasDjBrandingOpen.current = isOpen;
  }, [recommendedStep, selectedPanel]);
  React.useEffect(() => {
    if (selectedPanel !== 'dj_branding') return;
    if (!requestedWorkflowStep) return;
    if (!stepEnabled[requestedWorkflowStep.step]) return;
    setWorkflowStep(requestedWorkflowStep.step);
  }, [requestedWorkflowStep, selectedPanel, stepEnabled]);
  React.useEffect(() => {
    if (!vaultFeedback) return;
    const timer = window.setTimeout(() => setVaultFeedback(null), 2400);
    return () => window.clearTimeout(timer);
  }, [vaultFeedback]);
  const headlineOptions = dedupeFonts([kit.preferredFonts.headline, ...headlineFonts]);
  const bodyOptions = dedupeFonts([kit.preferredFonts.body, ...bodyFonts]);
  const lightingPresets: Array<{
    id: string;
    label: string;
    patch: Partial<PortraitLighting>;
  }> = [
    {
      id: 'balanced',
      label: 'Balanced',
      patch: { ambient: 0.12, keyLight: 0.34, fillLight: 0.14, rimLight: 0.18, shadowDepth: 0.14, warmth: 0.06, contrast: 0.08 },
    },
    {
      id: 'club',
      label: 'Club',
      patch: { ambient: 0.1, keyLight: 0.42, fillLight: 0.08, rimLight: 0.26, shadowDepth: 0.2, warmth: -0.02, contrast: 0.16 },
    },
    {
      id: 'rim',
      label: 'Hard Rim',
      patch: { ambient: 0.08, keyLight: 0.28, fillLight: 0.06, rimLight: 0.4, shadowDepth: 0.22, warmth: 0.02, contrast: 0.18 },
    },
  ];
  const stepSummaries: Record<WorkflowStep, string> = {
    background: hasBackground ? 'Scene is set.' : 'Pick the scene first.',
    mainface: mainFaceOnCanvas ? 'Place and size Main Face.' : 'Upload and place Main Face.',
    lighting: mainFaceLightingAnalyzed ? 'Refine the subject light.' : 'Analyze and match the light.',
    design: 'Add text and finish the flyer.',
  };
  const stepActionLabel: Record<WorkflowStep, string> = {
    background: hasBackground ? 'Background Ready' : 'Choose Background',
    mainface: mainFaceOnCanvas ? 'Main Face Ready' : 'Set Main Face',
    lighting: mainFaceLightingAnalyzed ? 'Lighting Ready' : 'Match Lighting',
    design: 'Start Design',
  };
  const activeStepLabel = workflowSteps[currentStepIndex]?.[1] ?? 'Background';
  const canvasFaceUnsaved = !!(currentPortraitUrl && (!savedFace || currentPortraitUrl !== savedFace));
  const closedVaultSummary = [
    hasSavedMainFace ? 'Main Face' : null,
    savedLogoCount ? `${savedLogoCount} Logos` : null,
    hasSavedFonts ? 'Fonts' : null,
    hasSavedPalette ? 'Palette' : null,
  ]
    .filter(Boolean)
    .join(' • ');
  const mainFacePrimaryAction = !savedFace
    ? {
        label: faceBusy ? 'Processing Main Face' : 'Upload Main Face',
        onClick: () => faceInput.current?.click(),
        disabled: faceBusy,
      }
    : !mainFaceOnCanvas
    ? {
        label: 'Place Main Face On Canvas',
        onClick: onUseBrandFace,
        disabled: !kit.primaryPortrait || faceBusy,
      }
    : null;

  return (
    <div className="relative transition">
      <Collapsible
        title="DJ / Artiste"
        storageKey="p:dj-branding"
        isOpen={selectedPanel === 'dj_branding'}
        onToggle={() => setSelectedPanel(selectedPanel === 'dj_branding' ? null : 'dj_branding')}
        panelClassName={
          selectedPanel === 'dj_branding' ? 'ring-1 ring-inset ring-[#00FFF0]/70' : undefined
        }
        right={
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-label="DJ Branding help"
            title="How DJ Branding works"
            className="h-6 w-6 border border-cyan-400/70 text-cyan-300 text-[11px] font-bold hover:bg-cyan-400/10"
          >
            ?
          </button>
        }
      >
        <section className={djSectionClass}>
          <div className="border border-neutral-800 bg-neutral-950/60 px-3 py-2.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                  Step {Math.max(1, currentStepIndex + 1)} of {workflowSteps.length}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="border border-cyan-400/50 bg-cyan-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-cyan-100">
                    {activeStepLabel}
                  </span>
                  <span className="text-[12px] text-neutral-200">{stepActionLabel[workflowStep]}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Recommended</div>
                <div className="mt-1 text-[11px] text-neutral-300">{recommendedStepLabel}</div>
              </div>
            </div>
            <div className="mt-2 h-[2px] w-full bg-neutral-800">
              <div
                className="h-full bg-cyan-400 transition-[width]"
                style={{
                  width: `${((Math.max(0, currentStepIndex) + 1) / workflowSteps.length) * 100}%`,
                }}
              />
            </div>
            <div className="mt-2 text-[11px] text-neutral-500">{stepSummaries[workflowStep]}</div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {workflowSteps.map(([id, label], index) => {
              const isActive = workflowStep === id;
              const isDone = index < recommendedStepIndex;
              const statusLabel = isDone ? 'Done' : isActive ? 'Active' : stepEnabled[id] ? 'Ready' : 'Locked';
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (!stepEnabled[id]) return;
                    setWorkflowStep(id);
                  }}
                  disabled={!stepEnabled[id]}
                  className={`min-h-[58px] min-w-0 border px-2 py-2 text-left transition sm:px-2.5 ${
                    isActive
                      ? 'border-cyan-400/70 bg-cyan-500/10 text-cyan-100'
                      : stepEnabled[id]
                      ? 'border-neutral-700 bg-neutral-900/50 text-neutral-300 hover:bg-neutral-900/80'
                      : 'border-neutral-800 bg-neutral-950/40 text-neutral-600'
                  }`}
                >
                  <div className="grid grid-cols-[18px_minmax(0,1fr)] gap-x-2 gap-y-0 items-start sm:grid-cols-[20px_minmax(0,1fr)]">
                    <span
                      className={`inline-flex h-5 min-w-[18px] items-center justify-center border px-1 text-[9px] uppercase tracking-[0.12em] sm:min-w-[20px] ${
                        isDone
                          ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-200'
                          : isActive
                          ? 'border-cyan-400/70 bg-cyan-500/10 text-cyan-100'
                          : 'border-neutral-700 text-neutral-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex flex-col items-start gap-0">
                      <span className="truncate text-[9px] uppercase tracking-[0.12em] leading-none sm:text-[10px]">{label}</span>
                      <span
                        className={`mt-[2px] text-[8px] uppercase tracking-[0.14em] leading-none ${
                          isActive ? 'text-cyan-200' : isDone ? 'text-emerald-300' : 'text-neutral-500'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {workflowStep === 'background' && (
            <div className={djCardClass}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-wide text-neutral-400">Step 1 · Background</div>
                <div className={`text-[10px] ${hasBackground ? 'text-emerald-300' : 'text-neutral-500'}`}>
                  {hasBackground ? 'Ready' : 'Needed'}
                </div>
              </div>
              <div className="text-[11px] text-neutral-300">
                Start by setting the scene. Pick or upload a background before working on Main Face.
              </div>
              <div className="space-y-2">
                {hasBackground && (
                  <button
                    type="button"
                    onClick={() => setWorkflowStep('mainface')}
                    className={djPrimaryActionClass}
                  >
                    Continue To Main Face
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedPanel('background')}
                  className={hasBackground ? djActionClass : djPrimaryActionClass}
                >
                  {hasBackground ? 'Edit Background' : 'Choose Background'}
                </button>
              </div>
            </div>
          )}

          {workflowStep === 'mainface' && (
            <>
          <div className={djSubCardClass}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral-400">Main Face</div>
              {hasSavedMainFace ? (
                <div className="text-[10px] text-emerald-300">Saved</div>
              ) : (
                <div className="text-[10px] text-neutral-500">Not saved</div>
              )}
            </div>
            <div className="h-24 border border-neutral-700 bg-neutral-950 grid place-items-center overflow-hidden">
              {faceBusy ? (
                <div className="flex flex-col items-center gap-2 text-[10px] text-cyan-300">
                  <div className="h-5 w-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                  <span>Removing background...</span>
                </div>
              ) : displayFace ? (
                <img src={displayFace} alt="" className="h-full w-full object-contain" draggable={false} />
              ) : (
                <span className="text-[10px] text-neutral-500">Upload a portrait to start</span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className={djStatusCellClass}>
                <div className="text-neutral-500">Saved</div>
                <div className="mt-1 text-white">{hasSavedMainFace ? 'Ready' : 'Needed'}</div>
              </div>
              <div className={djStatusCellClass}>
                <div className="text-neutral-500">Canvas</div>
                <div className="mt-1 text-white">{mainFaceOnCanvas ? 'Placed' : 'Pending'}</div>
              </div>
              <div className={djStatusCellClass}>
                <div className="text-neutral-500">Lock</div>
                <div className="mt-1 text-white">{mainFaceLocked ? 'Locked' : 'Open'}</div>
              </div>
            </div>
            {canvasFaceUnsaved && (
              <div className={djMetaNoteClass}>
                Canvas Main Face is newer than the saved brand. Save Flyer To Brand if you want this face to reapply later.
              </div>
            )}
            {mainFacePrimaryAction && (
              <button
                type="button"
                onClick={mainFacePrimaryAction.onClick}
                disabled={mainFacePrimaryAction.disabled}
                className={djPrimaryActionClass}
              >
                {mainFacePrimaryAction.label}
              </button>
            )}
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              <Chip small className="!w-full !rounded-none" onClick={() => faceInput.current?.click()} disabled={faceBusy}>
                {savedFace ? 'Replace' : 'Upload'}
              </Chip>
              <Chip small className="!w-full !rounded-none" onClick={onUseBrandFace} disabled={!kit.primaryPortrait || faceBusy}>
                {mainFaceOnCanvas ? 'Use Again' : 'Place On Canvas'}
              </Chip>
              <Chip
                small
                className="!w-full !rounded-none"
                onClick={() => {
                  setFaceError(null);
                  if (mainFaceOnCanvas) {
                    onRemoveMainFace();
                    return;
                  }
                  onKitChange({ ...kit, primaryPortrait: null });
                }}
                disabled={(!kit.primaryPortrait && !mainFaceOnCanvas) || faceBusy}
              >
                {mainFaceOnCanvas ? 'Remove' : 'Clear'}
              </Chip>
            </div>
            {faceError && <div className="text-[11px] text-rose-300">{faceError}</div>}
            <div className="text-[10px] text-neutral-500">Background removal runs automatically on upload.</div>
          </div>

          <div className="border border-neutral-700 bg-neutral-950/60 px-3 py-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral-400">Canvas Main Face</div>
              <Chip small className="!rounded-none" onClick={onMainFaceLockToggle} disabled={!mainFaceOnCanvas}>
                {mainFaceLocked ? 'Unlock' : 'Lock'}
              </Chip>
            </div>
            <div>
              <InlineSliderInput
                label="Scale"
                value={mainFaceScale}
                min={0.01}
                max={5}
                step={0.01}
                onChange={onMainFaceScaleChange}
                displayScale={100}
                precision={0}
                suffix="%"
                rangeClassName="flex-1 accent-cyan-400"
                disabled={!mainFaceOnCanvas || mainFaceLocked}
              />
            </div>
            <div>
              <InlineSliderInput
                label="Opacity"
                value={mainFaceOpacity}
                min={0}
                max={1}
                step={0.05}
                onChange={onMainFaceOpacityChange}
                displayScale={100}
                precision={0}
                suffix="%"
                rangeClassName="flex-1 accent-sky-400"
                disabled={!mainFaceOnCanvas || mainFaceLocked}
              />
            </div>
            {!mainFaceOnCanvas && (
              <div className="text-[10px] text-neutral-500">Click Place On Canvas after saving Main Face.</div>
            )}
            {mainFaceOnCanvas && mainFaceLocked && (
              <div className="text-[10px] text-neutral-500">Main Face placement is locked on canvas.</div>
            )}
            {mainFaceOnCanvas && (
              <button
                type="button"
                onClick={() => {
                  if (!mainFaceLocked) onMainFaceLockToggle();
                  setWorkflowStep('lighting');
                }}
                className={djPrimaryActionClass}
              >
                Continue To Lighting
              </button>
            )}
          </div>
            </>
          )}

          {workflowStep === 'lighting' && (
          <div className="border border-neutral-700 bg-neutral-950/60 px-3 py-3 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-neutral-400">Lighting Studio</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-neutral-300">
                  <span className="text-neutral-500">Color</span>
                  <span className="h-3 w-3 border border-white/15" style={{ background: mainFaceLightingColor }} />
                  <span>{mainFaceLightingColor.toUpperCase()}</span>
                </div>
              </div>
              <Chip small className="!rounded-none" active={mainFaceLightingEnabled} onClick={onMainFaceLightingToggle} disabled={!mainFaceOnCanvas}>
                {mainFaceLightingEnabled ? 'On' : 'Off'}
              </Chip>
            </div>

            <div className="border border-neutral-800 bg-neutral-900/40 px-3 py-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-[0.12em] text-neutral-400">Easy Mode</div>
                <div className="text-[10px] text-neutral-500">
                  {mainFaceLightingAnalyzed ? 'Applied' : 'Ready'}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onAnalyzeMainFaceLighting}
                  disabled={!mainFaceOnCanvas}
                  className={djPrimaryActionClass}
                >
                  {mainFaceLightingAnalyzed ? 'Analyze + Reapply' : 'Analyze + Apply'}
                </button>
                <button
                  type="button"
                  onClick={onResetMainFaceLighting}
                  disabled={!mainFaceOnCanvas}
                  className={djActionClass}
                >
                  Reset Lighting
                </button>
              </div>
              <div className="text-[10px] text-neutral-500">
                Start here. Analyze applies a clean lighting baseline to the Main Face already on canvas.
              </div>
            </div>

            <div className="border border-neutral-800 bg-neutral-900/40 px-3 py-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-[0.12em] text-neutral-400">Filter</div>
                <div className="text-[10px] text-neutral-500">
                  {mainFaceFilterPreset === 'none'
                    ? 'Clean'
                    : mainFaceFilterPreset === 'mono'
                    ? 'Mono'
                    : mainFaceFilterPreset === 'contrast'
                    ? 'Punch'
                    : mainFaceFilterPreset === 'halftone'
                    ? 'Halftone'
                    : mainFaceFilterPreset === 'poster'
                    ? 'Poster'
                    : 'Pop'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  ['none', 'Clean'],
                  ['mono', 'Mono'],
                  ['contrast', 'Punch'],
                  ['halftone', 'Halftone'],
                  ['poster', 'Poster'],
                  ['pop', 'Pop'],
                ] as const).map(([preset, label]) => (
                  <Chip
                    key={preset}
                    small
                    className="!w-full !rounded-none"
                    active={mainFaceFilterPreset === preset}
                    onClick={() => onMainFaceFilterPresetChange(preset)}
                    disabled={!mainFaceOnCanvas}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
              {mainFaceFilterPreset !== 'none' && (
                <InlineSliderInput
                  label="Strength"
                  value={mainFaceFilterStrength}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={onMainFaceFilterStrengthChange}
                  displayScale={100}
                  precision={0}
                  suffix="%"
                  rangeClassName="flex-1 accent-fuchsia-400"
                  disabled={!mainFaceOnCanvas}
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <Chip small className="!w-full !rounded-none" active={mainFaceLightingAutoMatch} onClick={onMainFaceLightingAutoMatchToggle} disabled={!mainFaceOnCanvas}>
                  Auto Match
                </Chip>
                <Chip small className="!w-full !rounded-none" active={advancedLightingOpen} onClick={() => setAdvancedLightingOpen((open) => !open)} disabled={!mainFaceOnCanvas}>
                  Advanced
                </Chip>
              </div>

              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                {lightingPresets.map((preset) => (
                  <Chip
                    key={preset.id}
                    small
                    className="!w-full !rounded-none"
                    onClick={() => onMainFaceLightingChange(preset.patch)}
                    disabled={!mainFaceOnCanvas || !mainFaceLightingEnabled}
                  >
                    {preset.label}
                  </Chip>
                ))}
              </div>
            </div>

            {advancedLightingOpen && (
              <div className="space-y-2.5">
                <div className="space-y-2.5 border border-neutral-800 bg-neutral-900/40 p-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-neutral-500">Light</div>
                  {[
                    ['Ambient', mainFaceLightingAmbient, 0, 1, 0.01, 'ambient'],
                    ['Key Light', mainFaceLightingKey, 0, 1, 0.01, 'keyLight'],
                    ['Fill Light', mainFaceLightingFill, 0, 1, 0.01, 'fillLight'],
                  ].map(([label, value, min, max, step, key]) => (
                    <InlineSliderInput
                      key={String(key)}
                      label={String(label)}
                      value={Number(value)}
                      min={Number(min)}
                      max={Number(max)}
                      step={Number(step)}
                      onChange={(next) => onMainFaceLightingChange({ [String(key)]: next })}
                      displayScale={100}
                      precision={0}
                      suffix="%"
                      rangeClassName="flex-1 accent-cyan-400"
                      disabled={!mainFaceOnCanvas || !mainFaceLightingEnabled}
                    />
                  ))}
                </div>

                <div className="space-y-2.5 border border-neutral-800 bg-neutral-900/40 p-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-neutral-500">Finish</div>
                  {[
                    ['Rim Light', mainFaceLightingRim, 0, 1, 0.01, 'rimLight'],
                    ['Shadow Depth', mainFaceLightingShadow, 0, 1, 0.01, 'shadowDepth'],
                  ].map(([label, value, min, max, step, key]) => (
                    <InlineSliderInput
                      key={String(key)}
                      label={String(label)}
                      value={Number(value)}
                      min={Number(min)}
                      max={Number(max)}
                      step={Number(step)}
                      onChange={(next) => onMainFaceLightingChange({ [String(key)]: next })}
                      displayScale={100}
                      precision={0}
                      suffix="%"
                      rangeClassName="flex-1 accent-cyan-400"
                      disabled={!mainFaceOnCanvas || !mainFaceLightingEnabled}
                    />
                  ))}

                  {[
                    ['Warmth', mainFaceLightingWarmth, 'warmth'],
                    ['Contrast', mainFaceLightingContrast, 'contrast'],
                  ].map(([label, value, key]) => (
                    <InlineSliderInput
                      key={String(key)}
                      label={String(label)}
                      value={Number(value)}
                      min={-1}
                      max={1}
                      step={0.01}
                      onChange={(next) => onMainFaceLightingChange({ [String(key)]: next })}
                      displayScale={100}
                      precision={0}
                      rangeClassName="flex-1 accent-amber-400"
                      disabled={!mainFaceOnCanvas || !mainFaceLightingEnabled}
                    />
                  ))}
                </div>
              </div>
            )}

            {!mainFaceOnCanvas && (
              <div className="text-[10px] text-neutral-500">
                Place Main Face on the canvas first.
              </div>
            )}
            {designUnlocked && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setWorkflowStep('design')}
                  className={djActionClass}
                >
                  Continue To Design
                </button>
              </div>
            )}
          </div>
          )}

          {workflowStep === 'design' && (
          <div className={djCardClass}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral-400">Step 4 · Design</div>
              <div className="text-[10px] text-neutral-500">Text and finishing</div>
            </div>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setSelectedPanel('headline')}
                className={djPrimaryActionClass}
              >
                Headline
              </button>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedPanel('head2')}
                  className={djActionClass}
                >
                  Sub Headline
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPanel('details')}
                  className={djActionClass}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPanel('venue')}
                  className={djActionClass}
                >
                  Venue
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPanel('icons')}
                  className={djActionClass}
                >
                  Library
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  onApplyMyBrand();
                  setVaultFeedback('Applied saved brand to flyer');
                }}
                className={djActionClass}
              >
                Apply My Saved Brand
              </button>
              <div className="text-[10px] text-neutral-500">
                Applies the saved Main Face, logos, fonts, and palette from Brand Vault to this flyer.
              </div>
            </div>
          </div>
          )}

          <input
            ref={faceInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onFaceFile(e.target.files?.[0]);
              e.currentTarget.value = '';
            }}
          />
        </section>

        <section className={djSectionClass}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-neutral-400">Optional · Brand Vault</div>
              <div className="mt-1 text-[11px] text-neutral-500">
                Saved profiles, logos, fonts, palette, and capture tools.
              </div>
            </div>
            {studioEnabled ? (
              <div className="text-[10px] text-cyan-300">Studio</div>
            ) : (
              <div className="text-[10px] text-neutral-500">Studio upgrade</div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setVaultOpen((open) => !open)}
            className={djPrimaryActionClass}
          >
            {vaultOpen ? 'Hide Vault' : 'Open Vault'}
          </button>

          {!vaultOpen && (
            <div className={djMetaNoteClass}>
              {closedVaultSummary ? `Saved: ${closedVaultSummary}` : 'No saved brand assets yet.'}
            </div>
          )}

          {vaultOpen ? (
            <>
              <div className={djCardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-neutral-400">Active Brand Preset</div>
                    <div className="mt-1 text-[13px] text-white">{profileName || kit.label || 'Brand'}</div>
                  </div>
                  <div className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-cyan-200">Reusable</div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-[10px] uppercase tracking-[0.12em] sm:grid-cols-2">
                  <div className="border border-neutral-700 bg-neutral-950/70 px-2.5 py-2 text-neutral-300">
                    <div className="text-neutral-500">Main Face</div>
                    <div className="mt-1 text-white">{hasSavedMainFace ? 'Saved' : 'Missing'}</div>
                  </div>
                  <div className="border border-neutral-700 bg-neutral-950/70 px-2.5 py-2 text-neutral-300">
                    <div className="text-neutral-500">Logos</div>
                    <div className="mt-1 text-white">{savedLogoCount} Saved</div>
                  </div>
                  <div className="border border-neutral-700 bg-neutral-950/70 px-2.5 py-2 text-neutral-300">
                    <div className="text-neutral-500">Fonts</div>
                    <div className="mt-1 text-white">{hasSavedFonts ? 'Saved' : 'Missing'}</div>
                  </div>
                  <div className="border border-neutral-700 bg-neutral-950/70 px-2.5 py-2 text-neutral-300">
                    <div className="text-neutral-500">Palette</div>
                    <div className="mt-1 text-white">{hasSavedPalette ? 'Saved' : 'Missing'}</div>
                  </div>
                </div>
                {vaultFeedback && (
                  <div className="border border-cyan-400/30 bg-cyan-500/8 px-2.5 py-2 text-[10px] uppercase tracking-[0.12em] text-cyan-100">
                    {vaultFeedback}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      onApplyMyBrand();
                      setVaultFeedback('Applied active brand to flyer');
                    }}
                    className={djPrimaryActionClass}
                  >
                    Apply Active Brand
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSaveCurrentBrand();
                      setVaultFeedback('Saved current flyer to brand');
                    }}
                    className={djActionClass}
                  >
                    Save Flyer To Brand
                  </button>
                </div>

                <div className="text-[10px] text-neutral-500">
                  Apply replaces the flyer identity with this saved brand. Save writes the current Main Face, logos, fonts, and palette into this active brand.
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {brandProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => onSelectBrandProfile(profile.id)}
                    disabled={!studioEnabled && profile.id !== activeBrandId}
                    className={`border px-3 py-2 text-left text-[12px] transition ${
                      profile.id === activeBrandId
                        ? "border-cyan-400/70 bg-cyan-500/10 text-white"
                        : "border-neutral-700 bg-neutral-900/60 text-neutral-300 hover:bg-neutral-900"
                    } ${!studioEnabled && profile.id !== activeBrandId ? "cursor-not-allowed opacity-45" : ""}`}
                  >
                    {profile.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  onBlur={() => onRenameBrandProfile(profileName)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onRenameBrandProfile(profileName);
                    }
                  }}
                  placeholder="Brand name"
                  className="w-full bg-[#17171b] border border-neutral-700 px-2 py-1.5 text-white text-[11px]"
                  disabled={!studioEnabled}
                />
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={onCreateBrandProfile}
                    disabled={!studioEnabled}
                    className="border border-neutral-700 bg-neutral-900/60 px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-neutral-200 transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    New Brand
                  </button>
                  <button
                    type="button"
                    onClick={onDuplicateBrandProfile}
                    disabled={!studioEnabled}
                    className="border border-neutral-700 bg-neutral-900/60 px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-neutral-200 transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={onDeleteBrandProfile}
                    disabled={!studioEnabled || brandProfiles.length <= 1}
                    className="border border-neutral-700 bg-neutral-900/60 px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-neutral-200 transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {!studioEnabled && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-neutral-400">
                  Studio unlocks multiple reusable brand profiles for agencies, venue groups, and multi-brand operators.
                </div>
              )}
            </>
          ) : null}
        </section>

        {vaultOpen && (
        <section className={djSectionClass}>
          <div className="text-[11px] uppercase tracking-wide text-neutral-400">Saved Assets</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {logoList.map((src, idx) => (
              <div
                key={`kit-logo-${idx}`}
                className={djSubCardClass}
              >
                <div className="text-[10px] uppercase tracking-wide text-neutral-400">Logo {idx + 1}</div>
                <div className="h-20 border border-neutral-700 bg-neutral-950 grid place-items-center overflow-hidden">
                  {src ? (
                    <img src={src} alt="" className="h-full w-full object-contain" draggable={false} />
                  ) : (
                    <span className="text-[10px] text-neutral-500">Empty</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Chip small onClick={() => logoInputs.current[idx]?.click()}>Upload</Chip>
                  <Chip small onClick={() => onUseBrandLogo(idx)} disabled={!src}>Use</Chip>
                  <Chip small onClick={() => setLogoAt(idx, '')} disabled={!src}>Clear</Chip>
                </div>
                <input
                  ref={(el) => {
                    logoInputs.current[idx] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    onLogoFile(idx, e.target.files?.[0]);
                    e.currentTarget.value = '';
                  }}
                />
              </div>
            ))}
          </div>

          <div className={djSubCardClass}>
            <div className="text-[10px] uppercase tracking-wide text-neutral-400">Saved Main Face</div>
            <div className="h-24 border border-neutral-700 bg-neutral-950 grid place-items-center overflow-hidden">
              {savedFace ? (
                <img src={savedFace} alt="" className="h-full w-full object-contain" draggable={false} />
              ) : (
                <span className="text-[10px] text-neutral-500">No saved Main Face yet</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Chip small onClick={onCaptureCurrentFace} disabled={!currentPortraitUrl}>
                Capture Current Face
              </Chip>
              <Chip small onClick={onUseBrandFace} disabled={!kit.primaryPortrait}>
                Use Saved Face
              </Chip>
            </div>
            <div className="text-[10px] text-neutral-500">
              This is the Main Face stored in the active brand and used by Apply Active Brand.
              {savedFace
                ? ` Saved position: ${Math.round(kit.primaryPortraitPlacement.x)} / ${Math.round(kit.primaryPortraitPlacement.y)} · ${Math.round(kit.primaryPortraitPlacement.scale * 100)}%.`
                : ''}
            </div>
          </div>
        </section>
        )}

        {vaultOpen && (
        <section className={djSectionClass}>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-neutral-400">Brand Look</div>
            <div className="mt-1 text-[11px] text-neutral-500">
              Fonts and palette for the repeatable identity layer.
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DJ_FONT_PRESETS.map((p) => (
              <Chip
                key={p.id}
                small
                className="!rounded-none"
                onClick={() =>
                  onKitChange({
                    ...kit,
                    preferredFonts: { headline: p.headline, body: p.body },
                  })
                }
              >
                {p.label}
              </Chip>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="text-[11px]">
              <FontPicker
                label="Headline Font"
                value={kit.preferredFonts.headline}
                options={headlineOptions}
                onChange={(value) =>
                  onKitChange({
                    ...kit,
                    preferredFonts: { ...kit.preferredFonts, headline: value },
                  })
                }
                sample="DJ BRAND"
                buttonClassName="!rounded-none"
                menuClassName="!rounded-none"
              />
            </div>
            <div className="text-[11px]">
              <FontPicker
                label="Details Font"
                value={kit.preferredFonts.body}
                options={bodyOptions}
                onChange={(value) =>
                  onKitChange({
                    ...kit,
                    preferredFonts: { ...kit.preferredFonts, body: value },
                  })
                }
                sample="@DJNAME SAT 11PM"
                buttonClassName="!rounded-none"
                menuClassName="!rounded-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            {DJ_COLOR_PRESETS.map((p) => (
              <Chip
                key={p.id}
                small
                className="!w-full !rounded-none"
                onClick={() =>
                  onKitChange({
                    ...kit,
                    brandPalette: { main: p.main, accent: p.accent, glow: p.glow },
                  })
                }
              >
                {p.label}
              </Chip>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 text-[11px] sm:grid-cols-3">
            <label className="flex items-center gap-2 border border-neutral-700 bg-neutral-900/60 px-2.5 py-2">
              <span className="text-neutral-400">Main</span>
              <input
                type="color"
                value={kit.brandPalette.main}
                onChange={(e) =>
                  onKitChange({
                    ...kit,
                    brandPalette: { ...kit.brandPalette, main: e.target.value },
                  })
                }
                className="h-6 w-8 border border-neutral-700 bg-transparent p-0"
              />
            </label>
            <label className="flex items-center gap-2 border border-neutral-700 bg-neutral-900/60 px-2.5 py-2">
              <span className="text-neutral-400">Accent</span>
              <input
                type="color"
                value={kit.brandPalette.accent}
                onChange={(e) =>
                  onKitChange({
                    ...kit,
                    brandPalette: { ...kit.brandPalette, accent: e.target.value },
                  })
                }
                className="h-6 w-8 border border-neutral-700 bg-transparent p-0"
              />
            </label>
            <label className="flex items-center gap-2 border border-neutral-700 bg-neutral-900/60 px-2.5 py-2">
              <span className="text-neutral-400">Glow</span>
              <input
                type="color"
                value={kit.brandPalette.glow}
                onChange={(e) =>
                  onKitChange({
                    ...kit,
                    brandPalette: { ...kit.brandPalette, glow: e.target.value },
                  })
                }
                className="h-6 w-8 border border-neutral-700 bg-transparent p-0"
              />
            </label>
          </div>
        </section>
        )}

      </Collapsible>

      {helpOpen && (
        <div className="fixed inset-0 z-[5100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-2xl border border-cyan-400/30 bg-[#0a0d12] shadow-[0_30px_80px_rgba(0,0,0,.6)] overflow-hidden max-h-[86vh]">
            <div className="border-b border-white/10 bg-neutral-950/90 px-4 py-3 sm:px-5 sm:py-4">
              <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">DJ Branding Guide</div>
              <div className="mt-1 text-lg font-semibold text-white">Build once. Apply everywhere.</div>
            </div>

	            <div className="max-h-[72vh] space-y-4 overflow-y-auto p-4 text-sm text-neutral-200 sm:p-5">
	              <div className="border border-white/10 bg-white/[0.03] p-3">
	                <div className="mb-1 text-xs uppercase tracking-wide text-cyan-300">What It Does</div>
	                <div>Build a reusable DJ brand kit with Main Face, logos, fonts, colors, and saved assets that can be reapplied fast.</div>
	              </div>

	              <div className="border border-white/10 bg-white/[0.03] p-3">
	                <div className="mb-1 text-xs uppercase tracking-wide text-cyan-300">Quick Start</div>
	                <ul className="list-disc space-y-1 pl-5 text-neutral-300">
	                  <li>Choose a background first.</li>
	                  <li>Upload Main Face, place it, and set the scale you want.</li>
	                  <li>Use Lighting Studio to match the scene.</li>
	                  <li>Move into design for headline, logos, icons, shapes, and finishing.</li>
	                </ul>
	              </div>

	              <div className="border border-white/10 bg-white/[0.03] p-3">
	                <div className="mb-1 text-xs uppercase tracking-wide text-cyan-300">Brand Vault</div>
	                <ul className="list-disc space-y-1 pl-5 text-neutral-300">
	                  <li>Name your brand profile.</li>
	                  <li>Store logos, Main Face, fonts, and palette presets.</li>
	                  <li>Use saved assets when you want repeatable branding across flyers.</li>
	                </ul>
	              </div>

              <div className="border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-1 text-xs uppercase tracking-wide text-cyan-300">Why It Matters</div>
                <div className="text-neutral-300">
                  Keeps every flyer recognizable as your brand while still letting each event visual stay fresh.
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-white/10 px-4 py-3 sm:px-5 sm:py-4">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="border border-cyan-400 bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
