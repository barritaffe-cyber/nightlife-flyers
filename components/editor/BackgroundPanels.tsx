'use client';
/* eslint-disable @next/next/no-img-element */

import * as React from 'react';
import { Collapsible, Chip, Stepper, ColorDot } from './controls';

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
  bgPosX: number;
  bgPosY: number;
  bgBlur: number;
  bgFog?: number;
  setBgFog?: (v: number) => void;
  bgWarmGlow?: number;
  setBgWarmGlow?: (v: number) => void;
  bgNeonHaze?: number;
  setBgNeonHaze?: (v: number) => void;
  bgTint?: string;
  setBgTint?: (v: string) => void;
  bgTintStrength?: number;
  setBgTintStrength?: (v: number) => void;
  setHue: (v: number) => void;
  setHaze: (v: number) => void;
  setVignette: (v: boolean) => void;
  setVignetteStrength: (v: number) => void;
  setBgBlur: (v: number) => void;
  hue: number;
  haze: number;
  vignetteStrength: number;
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
  bgPosX,
  bgPosY,
  bgBlur,
  bgFog = 0,
  setBgFog,
  bgWarmGlow = 0,
  setBgWarmGlow,
  bgNeonHaze = 0,
  setBgNeonHaze,
  bgTint = '#000000',
  setBgTint,
  bgTintStrength = 0,
  setBgTintStrength,
  setBgBlur,
  setHue,
  setHaze,
  setVignette,
  setVignetteStrength,
  hue,
  haze,
  vignetteStrength,
}: Props) {
  return (
    <>
      <div
        id="background-panel"
        className={
          selectedPanel === 'background'
            ? 'relative rounded-xl border border-blue-400'
            : 'relative rounded-xl border border-neutral-700 transition'
        }
      >
        <Collapsible
          title="Background"
          storageKey="p:bg"
          isOpen={selectedPanel === 'background'}
          onToggle={() =>
            setSelectedPanel(selectedPanel === 'background' ? null : 'background')
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

              <div className="text-[11px] text-neutral-400">
                Tip: In <b>Move</b> → <b>background</b> mode, drag to pan and
                <span className="inline-block px-1 mx-1 rounded bg-neutral-800/70 border border-neutral-700">
                  Ctrl
                </span>
                + scroll to zoom.
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
        className={
          selectedPanel === 'background' || selectedPanel === 'bgfx'
            ? 'relative rounded-xl border border-blue-400 transition'
            : 'relative rounded-xl border border-neutral-700 transition'
        }
      >
        <Collapsible
          title="Background Effects"
          storageKey="p:bgfx"
          defaultOpen={false}
          isOpen={selectedPanel === 'background' || selectedPanel === 'bgfx'}
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
                setHaze(0.5);
                setVignette(true);
                setVignetteStrength(0.55);
                setBgPosX(50);
                setBgPosY(50);
                setBgScale(1);
                setBgBlur(0);
                setBgFog?.(0);
                setBgWarmGlow?.(0);
                setBgNeonHaze?.(0);
                setBgTintStrength?.(0);
              }}
            >
              Reset
            </Chip>
          }
        >
          <div className="mb-3 rounded-lg border border-neutral-700 bg-neutral-900/40 p-2">
            <div className="text-[11px] text-neutral-300 mb-2">Overlay Presets</div>
            <div className="flex flex-wrap gap-2">
              <Chip
                small
                onClick={() => {
                  setBgFog?.(0);
                  setBgWarmGlow?.(0);
                  setBgNeonHaze?.(0);
                  setBgTintStrength?.(0);
                }}
              >
                None
              </Chip>
              <Chip
                small
                onClick={() => {
                  setBgFog?.(0.35);
                  setBgWarmGlow?.(0.12);
                  setBgNeonHaze?.(0);
                  setBgTintStrength?.(0);
                }}
              >
                Add Fog
              </Chip>
              <Chip
                small
                onClick={() => {
                  setBgFog?.(0.12);
                  setBgWarmGlow?.(0.35);
                  setBgNeonHaze?.(0);
                  setBgTintStrength?.(0);
                }}
              >
                Warm Glow
              </Chip>
              <Chip
                small
                onClick={() => {
                  setBgFog?.(0.15);
                  setBgWarmGlow?.(0);
                  setBgNeonHaze?.(0.35);
                  setBgTintStrength?.(0);
                }}
              >
                Neon Haze
              </Chip>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-2">
            <Stepper
              label="Fog"
              value={bgFog}
              setValue={setBgFog ?? (() => {})}
              min={0}
              max={1}
              step={0.05}
              digits={2}
            />
            <Stepper
              label="Warm Glow"
              value={bgWarmGlow}
              setValue={setBgWarmGlow ?? (() => {})}
              min={0}
              max={1}
              step={0.05}
              digits={2}
            />
            <Stepper
              label="Neon Haze"
              value={bgNeonHaze}
              setValue={setBgNeonHaze ?? (() => {})}
              min={0}
              max={1}
              step={0.05}
              digits={2}
            />
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 text-[11px] text-neutral-300">
              <span>Tint</span>
              <ColorDot value={bgTint} onChange={(v) => setBgTint?.(v)} />
            </div>
            <div className="flex-1">
              <Stepper
                label="Tint Strength"
                value={bgTintStrength}
                setValue={setBgTintStrength ?? (() => {})}
                min={0}
                max={1}
                step={0.05}
                digits={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Stepper label="Haze" value={haze} setValue={setHaze} min={0} max={1} step={0.02} digits={2} />
            <Stepper label="Hue" value={hue} setValue={setHue} min={-180} max={180} step={1} />
            <Stepper label="Vignette" value={vignetteStrength} setValue={setVignetteStrength} min={0} max={0.9} step={0.02} digits={2} />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-2">
            <Stepper label="Scale" value={bgScale} setValue={setBgScale} min={0.5} max={5} step={0.1} digits={2} />
            <Stepper label="BG X %" value={bgPosX} setValue={setBgPosX} min={0} max={100} step={1} />
            <Stepper label="BG Y %" value={bgPosY} setValue={setBgPosY} min={0} max={100} step={1} />
          </div>

          <div className="mt-2 pt-2 border-t border-white/5">
            <Stepper label="Gaussian Blur (px)" value={bgBlur} setValue={setBgBlur} min={0} max={20} step={0.5} digits={1} />
          </div>
        </Collapsible>
      </div>
    </>
  );
}

export default React.memo(BackgroundPanels);
