'use client';
/* eslint-disable @next/next/no-img-element */

import * as React from 'react';
import {
  Collapsible,
  editorEmptyStateBodyClass,
  editorHelperTextClass,
  editorPanelActiveClass,
  editorPanelTitleActiveClass,
  editorPrimaryButtonClass,
  editorSectionCardClass,
  editorSectionEyebrowClass,
  editorSecondaryButtonClass,
  editorThumbClass,
} from './controls';
import BackgroundVersionReview from './BackgroundVersionReview';

type BlendStyle = 'club' | 'tropical' | 'jazz_bar' | 'outdoor_summer';
type BlendPriority = 'upload' | 'canvas';

type Props = {
  selectedPanel: string | null;
  onToggle: () => void;
  blendStyle: BlendStyle;
  setBlendStyle: (v: BlendStyle) => void;
  blendAttireColor: string;
  setBlendAttireColor: (v: string) => void;
  blendLighting: string;
  setBlendLighting: (v: string) => void;
  blendCameraZoom: string;
  setBlendCameraZoom: (v: string) => void;
  blendExpressionPose: string;
  setBlendExpressionPose: (v: string) => void;
  blendSubjectAction: string;
  setBlendSubjectAction: (v: string) => void;
  blendBackgroundPriority: BlendPriority;
  setBlendBackgroundPriority: (v: BlendPriority) => void;
  isCuttingOut: boolean;
  blendSubject: string | null;
  blendBackground: string | null;
  handleBlendUpload: (kind: 'subject' | 'bg', file: File) => void;
  pushCanvasBgToBlend: () => void;
  handleMagicBlend: () => void;
  isBlending: boolean;
  isCapturingBackground: boolean;
  hasSharedGeneratedBackground: boolean;
  sharedGeneratedBackgroundSource: string;
  originalBackgroundSrc: string | null;
  generatedBackgroundSrc: string | null;
  canRestoreOriginalBackground: boolean;
  isOriginalBackgroundActive: boolean;
  isGeneratedBackgroundActive: boolean;
  onUseOriginalBackground: () => void;
  onUseGeneratedBackground: () => void;
};

function MagicBlendPanel({
  selectedPanel,
  onToggle,
  blendStyle,
  setBlendStyle,
  blendAttireColor,
  setBlendAttireColor,
  blendLighting,
  setBlendLighting,
  blendCameraZoom,
  setBlendCameraZoom,
  blendExpressionPose,
  setBlendExpressionPose,
  blendSubjectAction,
  setBlendSubjectAction,
  blendBackgroundPriority,
  setBlendBackgroundPriority,
  isCuttingOut,
  blendSubject,
  blendBackground,
  handleBlendUpload,
  pushCanvasBgToBlend,
  handleMagicBlend,
  isBlending,
  isCapturingBackground,
  hasSharedGeneratedBackground,
  sharedGeneratedBackgroundSource,
  originalBackgroundSrc,
  generatedBackgroundSrc,
  canRestoreOriginalBackground,
  isOriginalBackgroundActive,
  isGeneratedBackgroundActive,
  onUseOriginalBackground,
  onUseGeneratedBackground,
}: Props) {
  const [optionsOpen, setOptionsOpen] = React.useState(false);

  return (
    <div className="mt-3" id="magic-blend-panel" data-tour="magic-blend">
      <div
        className="relative rounded-xl transition-all"
      >
        <Collapsible
          title="Portrait Blend"
          storageKey="p:magic_blend"
          isOpen={selectedPanel === 'magic_blend'}
          onToggle={onToggle}
          panelClassName={
            selectedPanel === 'magic_blend'
              ? editorPanelActiveClass
              : undefined
          }
          titleClassName={selectedPanel === 'magic_blend' ? editorPanelTitleActiveClass : ''}
        >
          <div className={`${editorHelperTextClass} mb-4`}>
            Fuse the portrait and scene into one finished image.
          </div>
          <div className="mb-4 rounded-lg border border-amber-400/30 bg-amber-500/5 px-3 py-2 text-[10px] text-amber-200/90">
            If Portrait Blend is blocked for sensitive content, try a different subject/background, crop tighter, or use less revealing imagery.
          </div>

          {hasSharedGeneratedBackground && (
            <div className="mb-4">
              <BackgroundVersionReview
                sourceLabel={sharedGeneratedBackgroundSource}
                originalSrc={originalBackgroundSrc}
                generatedSrc={generatedBackgroundSrc}
                canRestoreOriginal={canRestoreOriginalBackground}
                isOriginalActive={isOriginalBackgroundActive}
                isGeneratedActive={isGeneratedBackgroundActive}
                onUseOriginal={onUseOriginalBackground}
                onUseGenerated={onUseGeneratedBackground}
              />
            </div>
          )}

          <div className={`${editorSectionCardClass} mb-4`}>
            <div className={editorSectionEyebrowClass}>Cinematic Style</div>
            <div className={`${editorEmptyStateBodyClass} mb-3 mt-1`}>
              Pick the visual lane before you blend.
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'club', label: 'Club' },
                { key: 'tropical', label: 'Tropical' },
                { key: 'jazz_bar', label: 'Jazz Bar' },
                { key: 'outdoor_summer', label: 'Daytime' },
              ] as const).map((s) => {
                const active = blendStyle === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setBlendStyle(s.key)}
                    className={[
                      'rounded-md px-3 py-2 text-[10px] font-bold border transition-all uppercase tracking-wide',
                      active
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                        : 'border-neutral-700 bg-neutral-900/40 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200',
                    ].join(' ')}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`${editorSectionCardClass} mb-4`}>
            <div className={editorSectionEyebrowClass}>Background Priority</div>
            <div className={`${editorEmptyStateBodyClass} mb-3 mt-1`}>
              Choose whether the blend should respect the uploaded scene or the current canvas.
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'upload', label: 'Uploaded BG' },
                { key: 'canvas', label: 'Canvas BG' },
              ] as const).map((s) => {
                const active = blendBackgroundPriority === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setBlendBackgroundPriority(s.key)}
                    className={[
                      'rounded-md px-3 py-2 text-[10px] font-bold border transition-all uppercase tracking-wide',
                      active
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                        : 'border-neutral-700 bg-neutral-900/40 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200',
                    ].join(' ')}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 ml-1">
                Subject
              </label>
              <label className={`block aspect-[3/4] ${editorThumbClass} border-dashed hover:bg-neutral-800 hover:border-neutral-500 transition-all cursor-pointer relative group`}>
                {isCuttingOut ? (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-neutral-300">
                    <div className="w-5 h-5 border-2 border-white/10 border-t-amber-500 rounded-full animate-spin mb-2" />
                    <span className="text-[8px] uppercase font-bold tracking-widest text-amber-500 animate-pulse">
                      Cutting...
                    </span>
                  </div>
                ) : blendSubject ? (
                  <>
                    <img src={blendSubject} className="w-full h-full object-contain p-1" alt="Subject" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                      <span className="text-[9px] font-bold text-white uppercase tracking-wider">Change</span>
                    </div>
                  </>
                ) : (
                  <div className={`flex h-full flex-col items-center justify-center transition-colors group-hover:text-neutral-400 ${blendSubject ? "" : "text-neutral-600"}`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mb-2 opacity-60"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="text-[9px] font-medium uppercase tracking-wider">Portrait</span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleBlendUpload('subject', e.target.files[0])}
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 ml-1">
                Environment
              </label>
              <label className={`block aspect-[3/4] ${editorThumbClass} border-dashed hover:bg-neutral-800 hover:border-neutral-500 transition-all cursor-pointer relative group`}>
                {blendBackground ? (
                  <>
                    <img src={blendBackground} className="w-full h-full object-cover" alt="Background" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                      <span className="text-[9px] font-bold text-white uppercase tracking-wider">Change</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-600 group-hover:text-neutral-400 transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mb-2 opacity-60"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                    <span className="text-[9px] font-medium uppercase tracking-wider">Upload</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleBlendUpload('bg', e.target.files[0])}
                />
              </label>
            </div>
          </div>

          <div className="mb-3">
            <button
              type="button"
              onClick={pushCanvasBgToBlend}
              disabled={isCapturingBackground}
              className={`${editorSecondaryButtonClass} flex h-9 w-full items-center justify-center gap-2 text-[10px] uppercase tracking-wider group`}
              title="Capture the current background from your canvas"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:-translate-x-0.5 transition-transform"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              <span>{isCapturingBackground ? 'Capturing...' : 'Capture Canvas Background'}</span>
            </button>
          </div>

          <div className="pt-2 border-t border-white/5">
            <button
              onClick={() => setOptionsOpen(true)}
              disabled={isBlending || isCuttingOut || !blendSubject}
              className={`w-full ${editorPrimaryButtonClass} flex items-center justify-center gap-2 py-3 text-xs`}
            >
              {isBlending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 12 7-7 7 7" />
                    <path d="M12 19V5" />
                  </svg>
                  Generate Portrait Blend
                </>
              )}
            </button>
          </div>
        </Collapsible>
      </div>

      {optionsOpen && (
        <div className="fixed inset-0 z-[2100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-4 shadow-2xl">
            <div className="text-sm font-semibold text-white mb-1">Blend Options</div>
            <div className={`${editorHelperTextClass} mb-4`}>
              Set quick directives before blending. These guide the AI without changing your assets.
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <label className="space-y-1">
                <span className="text-neutral-400">Attire Color</span>
                <select
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900/60 px-2 py-1"
                  value={blendAttireColor}
                  onChange={(e) => setBlendAttireColor(e.target.value)}
                >
                  {[
                    'auto',
                    'all white',
                    'all black',
                    'red',
                    'gold',
                    'silver',
                    'emerald',
                    'violet',
                    'neon pink',
                    'neon blue',
                  ].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-neutral-400">Lighting</span>
                <select
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900/60 px-2 py-1"
                  value={blendLighting}
                  onChange={(e) => setBlendLighting(e.target.value)}
                >
                  {[
                    'match scene',
                    'rim light',
                    'back light',
                    'neon glow',
                    'warm cinematic',
                    'cool cinematic',
                  ].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-neutral-400">Camera Zoom</span>
                <select
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900/60 px-2 py-1"
                  value={blendCameraZoom}
                  onChange={(e) => setBlendCameraZoom(e.target.value)}
                >
                  {[
                    'auto',
                    'full body',
                    'three-quarter',
                    'waist-up',
                    'chest-up',
                  ].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-neutral-400">Expression / Pose</span>
                <select
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900/60 px-2 py-1"
                  value={blendExpressionPose}
                  onChange={(e) => setBlendExpressionPose(e.target.value)}
                >
                  {[
                    'confident',
                    'joyful',
                    'dance energy',
                    'soft smile',
                    'serious',
                    'seductive',
                  ].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 col-span-2">
                <span className="text-neutral-400">Subject Action</span>
                <textarea
                  rows={2}
                  value={blendSubjectAction}
                  onChange={(e) => setBlendSubjectAction(e.target.value)}
                  placeholder="e.g. raising champagne, leaning on DJ booth, pointing at crowd"
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900/60 px-2 py-1.5 text-white placeholder:text-neutral-500"
                />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className={editorSecondaryButtonClass}
                onClick={() => setOptionsOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={editorPrimaryButtonClass}
                onClick={() => {
                  setOptionsOpen(false);
                  handleMagicBlend();
                }}
                disabled={isBlending || isCuttingOut || !blendSubject}
              >
                Blend Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default React.memo(MagicBlendPanel);
