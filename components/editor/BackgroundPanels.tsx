'use client';
/* eslint-disable @next/next/no-img-element */

import * as React from 'react';
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
} from './controls';

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
  genProvider: 'auto' | 'nano' | 'openai' | 'venice';
  setGenProvider: (v: 'auto' | 'nano' | 'openai' | 'venice') => void;
  showAiTools?: boolean;
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
  genProvider,
  setGenProvider,
  showAiTools = true,
  onBackgroundPreviewClick,
}: Props) {
  const [previewDims, setPreviewDims] = React.useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const previewRef = React.useRef<HTMLImageElement | null>(null);
  const currentBackgroundSrc = bgUploadUrl || bgUrl;

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

              <div className={editorHelperTextClass}>
                Tip: In <b>Move</b> → <b>background</b> mode, drag to pan and
                <span className="inline-block px-1 mx-1 rounded bg-neutral-800/70 border border-neutral-700">
                  Ctrl
                </span>
                + scroll to zoom.
              </div>

              {showAiTools && (
                <>
                  <div className="flex items-center gap-2 text-[11px] mt-3">
                    <span>Provider</span>
                    <Chip small active={genProvider === 'auto'} onClick={() => setGenProvider('auto')}>
                      Auto
                    </Chip>
                    <Chip small active={genProvider === 'nano'} onClick={() => setGenProvider('nano')}>
                      FAL
                    </Chip>
                    <Chip small active={genProvider === 'openai'} onClick={() => setGenProvider('openai')}>
                      OpenAI
                    </Chip>
                    <Chip small active={genProvider === 'venice'} onClick={() => setGenProvider('venice')}>
                      Imagine
                    </Chip>
                  </div>

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
