'use client';
import { useEffect, useRef, useState } from 'react';
import { parsePresenterLogo } from '../../lib/coco/presenterLogo';

export default function CocoPresenterLogo({ value, onChange, upload, disabled = false, onBusyChange, description, uploadLabel }: {
  description?: string;
  uploadLabel?: string;
  value?: string;
  onChange: (value: string) => void;
  upload: (file: File) => Promise<string | null>;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const picker = useRef<HTMLInputElement>(null), logo = parsePresenterLogo(value);
  const latestLogo = useRef(logo); latestLogo.current = logo;
  const [busy, setBusy] = useState<'upload' | 'cleanup' | null>(null);
  const [error, setError] = useState('');
  const [editingBackground, setEditingBackground] = useState(false);
  const [clearGaps, setClearGaps] = useState(logo?.clearEnclosedGaps ?? false);
  const [tolerance, setTolerance] = useState(logo?.backgroundTolerance ?? 20);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const cancelPending = () => { if (pending.current) clearTimeout(pending.current); pending.current = null; generation.current++; };
  useEffect(() => () => { if (pending.current) clearTimeout(pending.current); generation.current++; }, []);
  useEffect(() => {
    setTolerance(logo?.backgroundTolerance ?? 20);
    setClearGaps(logo?.clearEnclosedGaps ?? false);
    setEditingBackground(Boolean(logo?.originalUrl));
    setError('');
  }, [logo?.originalUrl, logo?.backgroundTolerance, logo?.clearEnclosedGaps]);

  const cleanBackground = async (amount: number, clearEnclosedGaps = latestLogo.current?.clearEnclosedGaps ?? false) => {
    cancelPending();
    const source = latestLogo.current;
    if (!source) return;
    const request = generation.current;
    setClearGaps(clearEnclosedGaps);
    setBusy('cleanup'); onBusyChange?.(true); setError(''); setEditingBackground(true);
    try {
      // Yield for the busy state to paint; no remote service or model download.
      await new Promise(resolve => setTimeout(resolve, 20));
      const { removeLogoBackground } = await import('../../lib/removeLogoBackground');
      const originalUrl = source.originalUrl ?? source.url;
      const url = await removeLogoBackground(originalUrl, amount, { clearEnclosedGaps });
      if (request !== generation.current) return;
      onChange(JSON.stringify({ ...latestLogo.current, url, originalUrl, backgroundTolerance: amount, clearEnclosedGaps }));
    } catch (err) {
      if (request === generation.current) { setClearGaps(latestLogo.current?.clearEnclosedGaps ?? false); setError(err instanceof Error ? err.message : 'Background cleanup failed. Your original is unchanged.'); }
    } finally {
      if (request === generation.current) { setBusy(null); onBusyChange?.(false); }
    }
  };

  return <div className="mt-4 space-y-3" data-testid="coco-presenter-logo-controls">
    <p className="text-xs leading-5 text-white/50">{description ?? "Have a logo? Add it beside the presenter name, or use it on its own."}</p>
    <input ref={picker} type="file" accept="image/*" aria-label={uploadLabel ?? "Upload presenter logo"} className="sr-only" disabled={disabled || Boolean(busy)} onChange={async e => {
      const file = e.currentTarget.files?.[0]; e.currentTarget.value = ''; if (!file) return;
      cancelPending(); setBusy('upload'); onBusyChange?.(true); setError('');
      try {
        const url = await upload(file); if (!url) return;
        const image = new Image(); image.src = url; await image.decode();
        onChange(JSON.stringify({ url, anchor: logo?.anchor, aspect: image.naturalWidth / image.naturalHeight, scale: logo?.scale ?? 1 }));
        setEditingBackground(false); setTolerance(20); setClearGaps(false);
      } catch { setError('That image could not be loaded. Please try another logo.'); }
      finally { setBusy(null); onBusyChange?.(false); }
    }}/>
    <div className="flex items-center gap-3">
      {logo && <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10" style={{ backgroundColor: '#47505a', backgroundImage: 'conic-gradient(#66717c 25%, transparent 0 50%, #66717c 0 75%, transparent 0)', backgroundSize: '12px 12px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo.url} alt="Logo transparency preview" className="max-h-full max-w-full object-contain"/>
      </div>}
      <button type="button" disabled={disabled || Boolean(busy)} className="coco-response" onClick={() => { cancelPending(); picker.current?.click(); }}>{busy === 'upload' ? 'Uploading…' : logo ? 'Replace logo' : 'Upload logo'}</button>
      {logo && <button type="button" disabled={disabled || Boolean(busy)} onClick={() => { cancelPending(); onChange(''); setEditingBackground(false); setError(''); }} className="text-xs text-white/50">Remove</button>}
    </div>
    {logo && <>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" disabled={disabled || Boolean(busy)} onClick={() => void cleanBackground(tolerance)} className="text-xs text-cyan-100 hover:text-white">{busy === 'cleanup' ? 'Removing background…' : 'Remove background'}</button>
        {logo.originalUrl && <button type="button" disabled={disabled || Boolean(busy)} onClick={() => {
          cancelPending(); onChange(JSON.stringify({ url: logo.originalUrl, anchor: logo.anchor, aspect: logo.aspect, scale: logo.scale }));
          setEditingBackground(false); setError(''); setTolerance(20);
        }} className="text-xs text-white/50">Restore original</button>}
      </div>
      <p className="text-[11px] text-white/40">Best for logos on a plain background.</p>
      {editingBackground && <label className="flex items-start gap-2 text-xs text-white/65">
        <input type="checkbox" aria-label="Clear enclosed gaps" checked={clearGaps} disabled={disabled || Boolean(busy)} className="mt-0.5 accent-cyan-200" onChange={e => void cleanBackground(tolerance, e.target.checked)}/>
        <span>Clear enclosed gaps<span className="mt-1 block text-[11px] text-white/40">Also removes enclosed areas matching the background color.</span></span>
      </label>}
      {editingBackground && <label className="block space-y-2 text-xs text-white/65">
        <span className="flex justify-between"><span>Background tolerance</span><output>{tolerance}%</output></span>
        <input type="range" aria-label="Background tolerance" min="0" max="100" step="1" value={tolerance} disabled={disabled || Boolean(busy)} className="w-full accent-cyan-200" onChange={e => {
          const amount = Number(e.target.value); setTolerance(amount); cancelPending();
          pending.current = setTimeout(() => void cleanBackground(amount), 250);
        }}/>
        <span className="block text-[11px] text-white/40">Lower preserves more detail. Higher removes more background.</span>
      </label>}
      <label className="block space-y-2 text-xs text-white/65">
        <span className="flex justify-between"><span>Logo size</span><output>{Math.round(logo.scale * 100)}%</output></span>
        <input type="range" aria-label="Logo size" min="20" max="200" step="1" value={Math.round(logo.scale * 100)} disabled={disabled || Boolean(busy)} className="w-full accent-cyan-200" onChange={e => onChange(JSON.stringify({ ...logo, scale: Number(e.target.value) / 100 }))}/>
        <span className="block text-[11px] text-white/40">Resizes from the center. Its position stays fixed.</span>
      </label>
    </>}
    {error && <p role="alert" className="text-xs text-amber-100">{error}</p>}
  </div>;
}
