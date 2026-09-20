import React from 'react';
import { PNG_GLYPH_COLLECTIONS, resolvePngGlyphFamily } from '../../lib/pngGlyphCollections';

export function PngGlyphPicker({selected,onSelect,disabled=false}:{selected:string;onSelect:(family:string)=>void;disabled?:boolean}){
  return <details className="my-3 rounded-lg border border-neutral-700 p-2" data-png-glyph-picker>
    <summary className="cursor-pointer text-xs font-semibold">PNG Lettering</summary>
    {PNG_GLYPH_COLLECTIONS.map(item=><button key={item.family} type="button" disabled={disabled} aria-pressed={resolvePngGlyphFamily(selected)===item.family} onClick={()=>onSelect(item.family)}
      className="mt-2 w-full rounded-md border border-neutral-600 bg-neutral-950 p-3 disabled:opacity-40" aria-label={`Use ${item.family} lettering`}>
      <span aria-hidden="true" style={{fontFamily:JSON.stringify(item.family),fontSize:30,lineHeight:1.2}}>{item.sample}</span>
      <span className="block text-xs text-neutral-300">{item.label} · Editable lettering{resolvePngGlyphFamily(selected)===item.family?' · Selected':''}</span>
    </button>)}
    <p className="mt-2 text-[11px] text-neutral-400">Type your text below. Size, spacing, line breaks and leading still apply. Choose another font to switch back. Includes A–Z and 0–9; Rose Chrome Serif, Calligraphy Gold, Whimsical Gold, Rose Fur, Distressed Ink, Circuit Lines and Liquid Chrome also include lowercase a–z; punctuation uses a fallback font.</p>
  </details>;
}
