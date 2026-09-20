'use client';
import { useEffect, useState } from 'react';
import type { PaletteBlend } from '../../lib/coco/paletteBindings';

export default function CocoPaletteMaterialControls({mode,strength,busy,onChange}: {
  mode: PaletteBlend; strength: number; busy?: boolean;
  onChange: (patch: {mode?:PaletteBlend;strength?:number})=>void;
}) {
  const [value,setValue]=useState(Math.round(strength*100));
  useEffect(()=>setValue(Math.round(strength*100)),[strength]);
  const commit=()=>{if(value!==Math.round(strength*100))onChange({strength:value/100});};
  return <div className="mt-4 space-y-3 border-t border-white/10 pt-3 text-xs text-white/55" data-testid="coco-palette-material-controls">
    <label className="flex items-center justify-between gap-3">Image color blend
      <select aria-label="Image color blend" disabled={busy} value={mode} onChange={e=>onChange({mode:e.target.value as PaletteBlend})} className="rounded border border-white/15 bg-neutral-950 px-2 py-2 text-white/80">
        <option value="hue">Hue</option><option value="soft-light">Soft light</option>
      </select>
    </label>
    <label className="block"><span className="mb-2 flex justify-between"><span>Image color strength</span><output>{value}%</output></span>
      <input aria-label="Image color strength" type="range" min={0} max={100} step={1} value={value} disabled={busy} className="w-full accent-cyan-200"
        onChange={e=>setValue(Number(e.target.value))} onPointerUp={commit} onKeyUp={commit} onBlur={commit}/>
    </label>
  </div>;
}
