'use client';
/* eslint-disable @next/next/no-img-element */

import * as React from 'react';

type Props = {
  sourceLabel: string;
  originalSrc: string | null;
  generatedSrc: string | null;
  canRestoreOriginal: boolean;
  isOriginalActive: boolean;
  isGeneratedActive: boolean;
  onUseOriginal: () => void;
  onUseGenerated: () => void;
};

function BackgroundVersionReview({
  sourceLabel,
  originalSrc,
  generatedSrc,
  canRestoreOriginal,
  isOriginalActive,
  isGeneratedActive,
  onUseOriginal,
  onUseGenerated,
}: Props) {
  const [isComparing, setIsComparing] = React.useState(false);
  const compareRestoreRef = React.useRef<'original' | 'generated' | null>(null);

  const activeVersion = isOriginalActive
    ? 'original'
    : isGeneratedActive
    ? 'generated'
    : null;

  const stopCompare = React.useCallback(() => {
    const restore = compareRestoreRef.current;
    if (!restore) return;
    compareRestoreRef.current = null;
    setIsComparing(false);
    if (restore === 'original') {
      onUseOriginal();
      return;
    }
    onUseGenerated();
  }, [onUseGenerated, onUseOriginal]);

  const startCompare = React.useCallback(() => {
    if (!activeVersion || compareRestoreRef.current) return;
    compareRestoreRef.current = activeVersion;
    setIsComparing(true);
    if (activeVersion === 'generated' && canRestoreOriginal) {
      onUseOriginal();
      return;
    }
    onUseGenerated();
  }, [activeVersion, canRestoreOriginal, onUseGenerated, onUseOriginal]);

  React.useEffect(() => {
    if (!isComparing) return;
    const handleStop = () => stopCompare();
    window.addEventListener('pointerup', handleStop);
    window.addEventListener('pointercancel', handleStop);
    window.addEventListener('blur', handleStop);
    return () => {
      window.removeEventListener('pointerup', handleStop);
      window.removeEventListener('pointercancel', handleStop);
      window.removeEventListener('blur', handleStop);
    };
  }, [isComparing, stopCompare]);

  React.useEffect(() => () => {
    compareRestoreRef.current = null;
  }, []);

  const statusText = isOriginalActive
    ? 'Viewing Before on canvas'
    : isGeneratedActive
    ? 'Viewing After on canvas'
    : 'Before and After versions are ready';

  return (
    <div className="space-y-3 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Before / After
          </div>
          <div className="mt-1 text-[11px] leading-relaxed text-neutral-300">
            Latest {sourceLabel.toLowerCase()} result. Tap <span className="text-white">Before</span> to revert or <span className="text-white">After</span> to keep the AI version.
          </div>
        </div>
        <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-neutral-200">
          {statusText}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onUseOriginal}
          disabled={!canRestoreOriginal}
          className={[
            'overflow-hidden rounded-lg border text-left transition',
            isOriginalActive
              ? 'border-cyan-400 bg-cyan-400/15'
              : 'border-neutral-700 bg-neutral-900/50 hover:border-neutral-500 hover:text-white',
            !canRestoreOriginal ? 'cursor-not-allowed opacity-50' : '',
          ].join(' ')}
        >
          <div className="aspect-[4/3] overflow-hidden bg-black/40">
            {originalSrc ? (
              <img src={originalSrc} alt="Original background preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center px-3 text-center text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                Original unavailable
              </div>
            )}
          </div>
          <div className="space-y-0.5 px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300">Before</div>
            <div className="text-[11px] font-semibold text-white">Original</div>
            <div className="text-[10px] text-neutral-400">
              {isOriginalActive
                ? 'Live on canvas'
                : canRestoreOriginal
                ? 'Tap to revert'
                : 'No original saved'}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onUseGenerated}
          className={[
            'overflow-hidden rounded-lg border text-left transition',
            isGeneratedActive
              ? 'border-cyan-400 bg-cyan-400/15'
              : 'border-neutral-700 bg-neutral-900/50 hover:border-neutral-500 hover:text-white',
          ].join(' ')}
        >
          <div className="aspect-[4/3] overflow-hidden bg-black/40">
            {generatedSrc ? (
              <img src={generatedSrc} alt="Generated background preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center px-3 text-center text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                Generated preview
              </div>
            )}
          </div>
          <div className="space-y-0.5 px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300">After</div>
            <div className="text-[11px] font-semibold text-white">Generated</div>
            <div className="text-[10px] text-neutral-400">
              {isGeneratedActive ? 'Live on canvas' : 'Tap to keep this version'}
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
        <div className="text-[10px] leading-relaxed text-neutral-400">
          Hold compare to preview the other version, then release to snap back.
        </div>
        <button
          type="button"
          onPointerDown={startCompare}
          onPointerCancel={stopCompare}
          onBlur={stopCompare}
          disabled={!activeVersion || (activeVersion === 'generated' && !canRestoreOriginal)}
          className="shrink-0 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isComparing ? 'Comparing...' : 'Hold to Compare'}
        </button>
      </div>
    </div>
  );
}

export default React.memo(BackgroundVersionReview);
