'use client';

import * as React from 'react';
import { Collapsible } from './controls';

type BlendStyle = 'club' | 'tropical' | 'jazz_bar' | 'outdoor_summer';
type BlendPriority = 'upload' | 'canvas';

type Props = {
  selectedPanel: string | null;
  onToggle: () => void;
  blendStyle: BlendStyle;
  setBlendStyle: (v: BlendStyle) => void;
  blendBackgroundPriority: BlendPriority;
  setBlendBackgroundPriority: (v: BlendPriority) => void;
  isCuttingOut: boolean;
  blendSubject: string | null;
  blendBackground: string | null;
  handleBlendUpload: (kind: 'subject' | 'bg', file: File) => void;
  pushCanvasBgToBlend: () => void;
  handleMagicBlend: () => void;
  isBlending: boolean;
};

function MagicBlendPanel({
  selectedPanel,
  onToggle,
  blendStyle,
  setBlendStyle,
  blendBackgroundPriority,
  setBlendBackgroundPriority,
  isCuttingOut,
  blendSubject,
  blendBackground,
  handleBlendUpload,
  pushCanvasBgToBlend,
  handleMagicBlend,
  isBlending,
}: Props) {
  return (
    <div className="mt-3" id="magic-blend-panel">
      <div
        className={
          selectedPanel === 'magic_blend'
            ? 'relative rounded-xl border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all'
            : 'relative rounded-xl border border-neutral-700 transition-all'
        }
      >
        <Collapsible
          title="Magic Blend"
          storageKey="p:magic_blend"
          isOpen={selectedPanel === 'magic_blend'}
          onToggle={onToggle}
          titleClassName={selectedPanel === 'magic_blend' ? 'text-amber-400' : ''}
        >
          <div className="text-[11px] text-neutral-400 mb-4 leading-relaxed">
            Select a cinematic <b>Style</b>, upload your assets, and let AI fuse them into a unified photo.
          </div>
          <div className="mb-4 rounded-lg border border-amber-400/30 bg-amber-500/5 px-3 py-2 text-[10px] text-amber-200/90">
            If Magic Blend is blocked for sensitive content, try a different subject/background, crop tighter, or use less revealing imagery.
          </div>

          <div className="mb-4">
            <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-2 block">
              Cinematic Style
            </label>
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

          <div className="mb-4">
            <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-2 block">
              Background Priority
            </label>
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
              <label className="block aspect-[3/4] rounded-lg border border-dashed border-neutral-700 bg-neutral-900/30 hover:bg-neutral-800 hover:border-neutral-500 transition-all cursor-pointer overflow-hidden relative group">
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
              <label className="block aspect-[3/4] rounded-lg border border-dashed border-neutral-700 bg-neutral-900/30 hover:bg-neutral-800 hover:border-neutral-500 transition-all cursor-pointer overflow-hidden relative group">
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
              className="w-full h-9 flex items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-800/30 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400 text-neutral-400 transition-all text-[10px] font-bold uppercase tracking-wider group"
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
              <span>Capture Canvas Background</span>
            </button>
          </div>

          <div className="pt-2 border-t border-white/5">
            <button
              onClick={handleMagicBlend}
              disabled={isBlending || isCuttingOut || !blendSubject}
              className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 ${
                isBlending
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-amber-900/20 hover:shadow-amber-900/40'
              }`}
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
                  Generate Blend
                </>
              )}
            </button>
          </div>
        </Collapsible>
      </div>
    </div>
  );
}

export default React.memo(MagicBlendPanel);
