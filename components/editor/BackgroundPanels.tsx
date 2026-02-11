'use client';
/* eslint-disable @next/next/no-img-element */

import * as React from 'react';
import { Collapsible, Chip, Stepper } from './controls';

type Props = {
  selectedPanel: string | null;
  setSelectedPanel: (v: string | null) => void;
  triggerUpload: () => void;
  fitBackground: () => void;
  clearBackground: () => void;
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
  genProvider: 'auto' | 'nano' | 'openai' | 'venice';
  setGenProvider: (v: 'auto' | 'nano' | 'openai' | 'venice') => void;
  onBackgroundPreviewClick?: (p: {
    nx: number;
    ny: number;
    iw: number;
    ih: number;
    clientX: number;
    clientY: number;
  }) => void;
};

function BackgroundPanels({
  selectedPanel,
  setSelectedPanel,
  triggerUpload,
  fitBackground,
  clearBackground,
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
  genProvider,
  setGenProvider,
  onBackgroundPreviewClick,
}: Props) {
  const [previewDims, setPreviewDims] = React.useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const previewRef = React.useRef<HTMLImageElement | null>(null);

  const handlePreviewClick = React.useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (!onBackgroundPreviewClick) return;
      const img = e.currentTarget;
      const rect = img.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const iw = img.naturalWidth || previewDims.w || 1;
      const ih = img.naturalHeight || previewDims.h || 1;
      onBackgroundPreviewClick({
        nx: Math.max(0, Math.min(1, nx)),
        ny: Math.max(0, Math.min(1, ny)),
        iw,
        ih,
        clientX: e.clientX,
        clientY: e.clientY,
      });
    },
    [onBackgroundPreviewClick, previewDims.w, previewDims.h]
  );

  return (
    <>
      <div
        id="background-panel"
        className="relative rounded-xl transition"
      >
        <Collapsible
          title="Background"
          storageKey="p:bg"
          isOpen={selectedPanel === 'background'}
          onToggle={() =>
            setSelectedPanel(selectedPanel === 'background' ? null : 'background')
          }
          panelClassName={
            selectedPanel === 'background'
              ? 'ring-1 ring-inset ring-[#00FFF0]/70'
              : undefined
          }
          titleClassName={
            selectedPanel === 'background'
              ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]'
              : ''
          }
          right={
            <div className="flex items-center gap-2 text-[11px]">
              <Chip small onClick={triggerUpload}>
                Upload
              </Chip>
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
                  <Chip small onClick={clearBackground}>
                    Clear
                  </Chip>
                </>
              )}
            </div>
          }
        >
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

          {bgUploadUrl || bgUrl ? (
            <div className="space-y-2">
              <div className="aspect-square w-full overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900/60 relative">
                <img
                  ref={previewRef}
                  src={bgUploadUrl || bgUrl!}
                  alt="Background preview"
                  className={`w-full h-full ${bgFitMode ? "object-contain" : "object-cover"}`}
                  draggable={false}
                  onLoad={(e) =>
                    setPreviewDims({
                      w: e.currentTarget.naturalWidth,
                      h: e.currentTarget.naturalHeight,
                    })
                  }
                  onClick={handlePreviewClick}
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

              <div className="text-[11px] text-neutral-400">
                Tip: In <b>Move</b> → <b>background</b> mode, drag to pan and
                <span className="inline-block px-1 mx-1 rounded bg-neutral-800/70 border border-neutral-700">
                  Ctrl
                </span>
                + scroll to zoom.
              </div>

              {/* Provider quick-pick (mirrors AI Background panel) — placed right above subject creation */}
              <div className="flex items-center gap-2 text-[11px] mt-3">
                <span>Provider</span>
                <Chip small active={genProvider === 'auto'} onClick={() => setGenProvider('auto')}>
                  Auto
                </Chip>
                <Chip small active={genProvider === 'nano'} onClick={() => setGenProvider('nano')}>
                  Nano
                </Chip>
                <Chip small active={genProvider === 'openai'} onClick={() => setGenProvider('openai')}>
                  OpenAI
                </Chip>
                <Chip small active={genProvider === 'venice'} onClick={() => setGenProvider('venice')}>
                  Imagine
                </Chip>
              </div>

              <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-950/40 p-2">
                <div className="text-[11px] text-neutral-300 mb-2">
                  Need a subject for this background? Generate one from your AI presets.
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
                  <Chip small onClick={onGenerateSubject} disabled={isGeneratingSubject}>
                    {isGeneratingSubject ? "Generating…" : "Generate subject"}
                  </Chip>
                  {hasSubject && <span className="text-neutral-500">Subject already on canvas</span>}
                </div>
                {subjectError && (
                  <div className="mt-2 text-[11px] text-red-400 break-words">
                    {subjectError}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="text-[12px] text-neutral-300">
              No background yet. Click <b>Upload</b> to add an image, or use <b>AI Background</b> below to generate one.
              <div className="mt-2">
                <Chip small onClick={triggerUpload}>
                  Upload background
                </Chip>
              </div>
            </div>
          )}

          {genError && <div className="text-xs text-red-400 break-words mt-2">{genError}</div>}
        </Collapsible>
      </div>

      <div
        className="relative rounded-xl transition"
      >
        <Collapsible
          title="Background Effects"
          storageKey="p:bgfx"
          defaultOpen={false}
          isOpen={selectedPanel === 'background' || selectedPanel === 'bgfx'}
          panelClassName={
            selectedPanel === 'background' || selectedPanel === 'bgfx'
              ? 'ring-1 ring-inset ring-[#00FFF0]/70'
              : undefined
          }
          titleClassName={
            selectedPanel === 'bgfx'
              ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]'
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
          <div className="grid grid-cols-3 gap-3">
            <Stepper label="Scale" value={bgScale} setValue={setBgScale} min={0.5} max={5} step={0.1} digits={2} />
            <Stepper label="Hue" value={hue} setValue={setHue} min={-180} max={180} step={1} />
            <Stepper label="Vignette" value={vignetteStrength} setValue={setVignetteStrength} min={0} max={0.9} step={0.02} digits={2} />
          </div>

          <div className="mt-2 grid grid-cols-2 gap-3">
            <Stepper label="Gaussian Blur (px)" value={bgBlur} setValue={setBgBlur} min={0} max={20} step={0.5} digits={1} />
            <Stepper label="Rotation (°)" value={bgRotate} setValue={setBgRotate} min={-180} max={180} step={1} />
          </div>
        </Collapsible>
      </div>
    </>
  );
}

export default React.memo(BackgroundPanels);
