'use client';
/* eslint-disable @next/next/no-img-element */

import * as React from 'react';
import { Chip, Collapsible } from './controls';
import { FontPicker } from './FontPicker';
import {
  DJ_COLOR_PRESETS,
  DJ_FONT_PRESETS,
  type DJBrandKit,
  type SafeZone,
  normalizeDjHandle,
} from '../../lib/djBrandKit';

type Props = {
  selectedPanel: string | null;
  setSelectedPanel: (panel: string | null) => void;
  kit: DJBrandKit;
  onKitChange: (next: DJBrandKit) => void;
  onSaveCurrentBrand: () => void;
  onApplyMyBrand: () => void;
  onApplyHandle: () => void;
  onCaptureCurrentLogo: () => void;
  onCaptureCurrentFace: () => void;
  mainFaceOnCanvas: boolean;
  mainFaceScale: number;
  mainFaceOpacity: number;
  onMainFaceScaleChange: (value: number) => void;
  onMainFaceOpacityChange: (value: number) => void;
  onUseBrandLogo: (index: number) => void;
  onUseBrandFace: () => void;
  onSnapLogoSafeZone: (zone: SafeZone) => void;
  currentLogoUrl: string | null;
  currentPortraitUrl: string | null;
  headlineFonts: string[];
  bodyFonts: string[];
};

function dedupeFonts(list: string[]): string[] {
  return Array.from(new Set((Array.isArray(list) ? list : []).filter(Boolean)));
}

export default function DjBrandingPanel({
  selectedPanel,
  setSelectedPanel,
  kit,
  onKitChange,
  onSaveCurrentBrand,
  onApplyMyBrand,
  onApplyHandle,
  onCaptureCurrentLogo,
  onCaptureCurrentFace,
  mainFaceOnCanvas,
  mainFaceScale,
  mainFaceOpacity,
  onMainFaceScaleChange,
  onMainFaceOpacityChange,
  onUseBrandLogo,
  onUseBrandFace,
  onSnapLogoSafeZone,
  currentLogoUrl,
  currentPortraitUrl,
  headlineFonts,
  bodyFonts,
}: Props) {
  const logoInputs = React.useRef<Array<HTMLInputElement | null>>([]);
  const faceInput = React.useRef<HTMLInputElement | null>(null);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [faceError, setFaceError] = React.useState<string | null>(null);

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
    (file?: File | null) => {
      if (!file) return;
      const isPngType = file.type === 'image/png';
      const isPngName = /\.png$/i.test(file.name || '');
      if (!isPngType && !isPngName) {
        setFaceError('Main Face requires a PNG file.');
        return;
      }
      const r = new FileReader();
      r.onload = () => {
        setFaceError(null);
        onKitChange({ ...kit, primaryPortrait: String(r.result || '') });
      };
      r.readAsDataURL(file);
    },
    [kit, onKitChange]
  );

  const logoList = Array.isArray(kit.logos) ? kit.logos.slice(0, 4) : ['', '', '', ''];
  while (logoList.length < 4) logoList.push('');

  const normalizedHandle = normalizeDjHandle(kit.social?.handle || '');
  const displayFace = kit.primaryPortrait || currentPortraitUrl || '';
  const headlineOptions = dedupeFonts([kit.preferredFonts.headline, ...headlineFonts]);
  const bodyOptions = dedupeFonts([kit.preferredFonts.body, ...bodyFonts]);

  return (
    <div className="relative rounded-xl transition">
      <Collapsible
        title="DJ Branding"
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
            className="h-6 w-6 rounded-full border border-cyan-400/70 text-cyan-300 text-[11px] font-bold hover:bg-cyan-400/10"
          >
            ?
          </button>
        }
      >
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3.5 py-3 text-[12px] leading-relaxed text-neutral-300">
          Save logos, face, fonts, palette, and handle once. Apply your full DJ brand in one tap.
        </div>

        <section className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3.5 space-y-3.5">
          <div className="text-[11px] uppercase tracking-wide text-neutral-400">Brand Vault</div>
          <div className="grid grid-cols-2 gap-3">
            {logoList.map((src, idx) => (
              <div
                key={`kit-logo-${idx}`}
                className="rounded-lg border border-neutral-700/90 bg-neutral-900/60 p-3 space-y-2.5"
              >
                <div className="text-[10px] uppercase tracking-wide text-neutral-400">Logo {idx + 1}</div>
                <div className="h-20 rounded border border-neutral-700 bg-neutral-950 grid place-items-center overflow-hidden">
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

          <div className="rounded-lg border border-neutral-700/90 bg-neutral-900/60 p-3 space-y-2.5">
            <div className="text-[10px] uppercase tracking-wide text-neutral-400">Main Face</div>
            <div className="h-24 rounded border border-neutral-700 bg-neutral-950 grid place-items-center overflow-hidden">
              {displayFace ? (
                <img src={displayFace} alt="" className="h-full w-full object-contain" draggable={false} />
              ) : (
                <span className="text-[10px] text-neutral-500">No face saved</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Chip small onClick={() => faceInput.current?.click()}>Upload</Chip>
              <Chip small onClick={onUseBrandFace} disabled={!kit.primaryPortrait}>
                Use
              </Chip>
              <Chip
                small
                onClick={() => {
                  setFaceError(null);
                  onKitChange({ ...kit, primaryPortrait: null });
                }}
                disabled={!kit.primaryPortrait}
              >
                Clear
              </Chip>
            </div>
            {faceError && <div className="text-[11px] text-rose-300">{faceError}</div>}
            <div className="rounded-md border border-neutral-700 bg-neutral-950/60 px-2.5 py-2 space-y-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral-400">Canvas Main Face</div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px] text-neutral-400">
                  <span>Scale</span>
                  <span className="text-neutral-200">{mainFaceScale.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={5}
                  step={0.05}
                  value={mainFaceScale}
                  onChange={(e) => onMainFaceScaleChange(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                  disabled={!mainFaceOnCanvas}
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px] text-neutral-400">
                  <span>Opacity</span>
                  <span className="text-neutral-200">{Math.round(mainFaceOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={mainFaceOpacity}
                  onChange={(e) => onMainFaceOpacityChange(Number(e.target.value))}
                  className="w-full accent-sky-400"
                  disabled={!mainFaceOnCanvas}
                />
              </div>
              {!mainFaceOnCanvas && (
                <div className="text-[10px] text-neutral-500">Click Use to place Main Face on canvas.</div>
              )}
            </div>
            <input
              ref={faceInput}
              type="file"
              accept="image/png"
              className="hidden"
              onChange={(e) => {
                onFaceFile(e.target.files?.[0]);
                e.currentTarget.value = '';
              }}
            />
          </div>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3.5 space-y-3.5">
          <div className="text-[11px] uppercase tracking-wide text-neutral-400">Style Presets</div>
          <div className="flex flex-wrap gap-1.5">
            {DJ_FONT_PRESETS.map((p) => (
              <Chip
                key={p.id}
                small
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

          <div className="grid grid-cols-2 gap-3">
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
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DJ_COLOR_PRESETS.map((p) => (
              <Chip
                key={p.id}
                small
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

          <div className="grid grid-cols-3 gap-3 text-[11px]">
            <label className="flex items-center gap-2 rounded border border-neutral-700 bg-neutral-900/60 px-2.5 py-2">
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
                className="h-6 w-8 rounded border border-neutral-700 bg-transparent p-0"
              />
            </label>
            <label className="flex items-center gap-2 rounded border border-neutral-700 bg-neutral-900/60 px-2.5 py-2">
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
                className="h-6 w-8 rounded border border-neutral-700 bg-transparent p-0"
              />
            </label>
            <label className="flex items-center gap-2 rounded border border-neutral-700 bg-neutral-900/60 px-2.5 py-2">
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
                className="h-6 w-8 rounded border border-neutral-700 bg-transparent p-0"
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3.5 space-y-3.5">
          <div className="text-[11px] uppercase tracking-wide text-neutral-400">Social Handle</div>
          <div className="space-y-2.5">
            <input
              type="text"
              value={kit.social.handle}
              onChange={(e) =>
                onKitChange({
                  ...kit,
                  social: { ...kit.social, handle: e.target.value },
                })
              }
              placeholder="@DJNAME"
              className="w-full rounded bg-[#17171b] border border-neutral-700 px-2 py-2 text-white text-[12px]"
            />
            <div className="flex items-center gap-1.5 text-[11px]">
              <Chip
                small
                active={kit.social.alwaysShowBottomRight}
                onClick={() =>
                  onKitChange({
                    ...kit,
                    social: {
                      ...kit.social,
                      alwaysShowBottomRight: !kit.social.alwaysShowBottomRight,
                    },
                  })
                }
              >
                Always bottom-right
              </Chip>
              <Chip small onClick={onApplyHandle} disabled={!normalizedHandle}>
                Apply Handle
              </Chip>
            </div>
            <div className="text-[11px] text-neutral-400">Preview: {normalizedHandle || '@DJNAME'}</div>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3.5 space-y-3">
          <div className="text-[11px] uppercase tracking-wide text-neutral-400">Actions</div>
          <div className="flex flex-wrap gap-1.5">
            <Chip small onClick={onSaveCurrentBrand}>Save Current Brand</Chip>
            <Chip small onClick={onApplyMyBrand}>Apply My Brand</Chip>
            <Chip small onClick={onCaptureCurrentLogo} disabled={!currentLogoUrl}>
              Capture Current Logo
            </Chip>
            <Chip small onClick={onCaptureCurrentFace} disabled={!currentPortraitUrl}>
              Capture Current Face
            </Chip>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Chip small onClick={() => onSnapLogoSafeZone('top-left')}>Logo Safe TL</Chip>
            <Chip small onClick={() => onSnapLogoSafeZone('bottom-center')}>Logo Safe BC</Chip>
            <Chip small onClick={() => onSnapLogoSafeZone('bottom-right')}>Logo Safe BR</Chip>
          </div>
        </section>
      </Collapsible>

      {helpOpen && (
        <div className="fixed inset-0 z-[5100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-cyan-400/30 bg-[#0a0d12] shadow-[0_30px_80px_rgba(0,0,0,.6)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/10">
              <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">DJ Branding Guide</div>
              <div className="mt-1 text-lg font-semibold text-white">Build once. Apply everywhere.</div>
            </div>

            <div className="p-5 space-y-4 text-sm text-neutral-200 max-h-[70vh] overflow-y-auto">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-wide text-cyan-300 mb-1">What It Does</div>
                <div>Save your logo stack, main face, fonts, colors, and handle as one reusable DJ identity kit.</div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-wide text-cyan-300 mb-1">Setup Once</div>
                <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                  <li>Add up to 4 logos in Brand Vault.</li>
                  <li>Set your main face photo.</li>
                  <li>Choose signature headline/details fonts.</li>
                  <li>Pick your 3-color brand palette.</li>
                  <li>Set your social handle and bottom-right preference.</li>
                </ul>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-wide text-cyan-300 mb-1">Fast Workflow</div>
                <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                  <li>Pick or generate a fresh template/background.</li>
                  <li>Click <b>Apply My Brand</b>.</li>
                  <li>Your fonts, colors, logo, face, and handle snap in instantly.</li>
                </ul>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-wide text-cyan-300 mb-1">Safe Zones</div>
                <div className="text-neutral-300">
                  Use <b>Logo Safe TL / BC / BR</b> to place your logo in stable, export-safe positions.
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-wide text-cyan-300 mb-1">Why It Matters</div>
                <div className="text-neutral-300">
                  Keeps every flyer recognizable as your brand while still letting each event visual stay fresh.
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm"
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
