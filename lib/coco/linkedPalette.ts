import { withCompiledEditorText } from './compiledTextSelection.ts';
import { compiledObjectValue, compiledPreviewFields } from './compiledPreview.ts';
import { isPngGlyphFamily } from '../pngGlyphCollections.ts';
import { compiledPaletteRole, paletteRoleColor, paletteRoleTargets, parsePaletteColor, colorHue, mapImagePalette, recolorPaletteCss, recolorPaletteSvg, type LinkedPalette, type PaletteBlend } from './paletteBindings.ts';

const imageCache = new Map<string, Promise<string>>();
async function paletteImage(src: string, colors: string[], mode: PaletteBlend, strength: number): Promise<string> {
  if(strength<=0) return src;
  const key=JSON.stringify([src,colors,mode,strength]);
  const cached=imageCache.get(key); if(cached) return cached;
  const promise=(async()=>{
    const img=new Image();img.crossOrigin='anonymous';img.src=src;await img.decode();
    const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Could not prepare palette colors.');
    ctx.drawImage(img,0,0);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
    const targets=colors.map(parsePaletteColor).filter((c):c is [number,number,number]=>!!c && Math.max(...c)-Math.min(...c)>.025);
    mapImagePalette(pixels.data,targets,mode,strength);
    ctx.putImageData(pixels,0,0);
    return canvas.toDataURL('image/png');
  })();
  imageCache.set(key,promise);
  if(imageCache.size>24)imageCache.delete(imageCache.keys().next().value!);
  try{return await promise;}catch(error){imageCache.delete(key);throw error;}
}

const paletteKeys=['color','palettePaint','paletteFilter','paletteImageSrc','paletteImageSource','paletteSvgMarkup'] as const;

export function resetCocoLinkedPalette(variant: Record<string,any>): Record<string,any> {
  const system=variant.cocoCompositionSystem, state=system?.linkedPalette;
  if(!state?.bindings)return variant;
  const overrides={...system.compiledObjectOverrides};
  for(const [id,binding] of Object.entries<any>(state.bindings)) {
    const next={...overrides[id]};
    for(const key of paletteKeys) if(JSON.stringify(next[key])===JSON.stringify(binding.applied?.[key])) {
      if(binding.original?.[key]===undefined)delete next[key];else next[key]=binding.original[key];
    }
    overrides[id]=next;
  }
  const nextSystem={...system,compiledObjectOverrides:overrides};delete nextSystem.linkedPalette;
  return {...variant,palette:state.originalPalette??variant.palette,cocoTextPaletteId:undefined,cocoCompositionSystem:nextSystem};
}

/** All objects bind to roles; raster colors are sampled and selectively replaced. */
export async function prepareCocoLinkedPalette(variant: Record<string,any>, palette: LinkedPalette, options: {id?:string;mode?:PaletteBlend;strength?:number}={}): Promise<Record<string,any>> {
  const system=variant.cocoCompositionSystem;if(!system?.compiledDocument)return variant;
  const previous=system.linkedPalette;
  const mode:PaletteBlend=(options.mode??previous?.mode)==='soft-light'?'soft-light':'hue';
  const strength=Math.max(0,Math.min(1,Number(options.strength??previous?.strength??.3)));
  const bindings:Record<string,any>={}, overrides={...system.compiledObjectOverrides};
  const fields=compiledPreviewFields(variant), assets=[...(variant.portraits??[]),...(variant.emojiList??[])];
  for(const object of withCompiledEditorText(system)) {
    const role=compiledPaletteRole(object), target=paletteRoleColor(palette,role), rasterTargets=paletteRoleTargets(palette,role), asset=assets.find(a=>a.cocoCompiledObjectId===object.id);
    const original=previous?.bindings?.[object.id]?.original??Object.fromEntries(paletteKeys.map(k=>[k,overrides[object.id]?.[k]]));
    const applied:Record<string,any>={};
    const family=compiledObjectValue(overrides,fields,object,'family',object.typography?.fontFamily);
    const material=object.paint?.backgroundImage && object.paint.backgroundImage!=='none';
    if(object.kind==='text'&&!isPngGlyphFamily(family)&&!material&&!object.paint?.textEffect) {
      const color=String(original.color??object.paint?.color??'');
      if(color!=='transparent'&&!/rgba\([^)]*,\s*0(?:\.0+)?\s*\)/.test(color))applied.color=target;
    }
    if(isPngGlyphFamily(family)||object.paint?.textEffect) {
      const sourceColor=parsePaletteColor(variant.palette?.accent??'#DAB570')!, dest=parsePaletteColor(target);
      const base=previous?.bindings?.[object.id]?.sourceHue??colorHue(sourceColor);
      if(dest)applied.paletteFilter=`hue-rotate(${(((colorHue(dest)-base+540)%360)-180)*strength}deg)`;
      bindings[object.id]={sourceHue:base};
    }
    if(object.paint) {
      const paint:Record<string,any>={};
      for(const key of ['backgroundColor','borderColor','strokeColor','backgroundImage','textShadow','boxShadow']) {
        const value=object.paint[key];
        if(typeof value==='string'&&!value.includes('url('))paint[key]=recolorPaletteCss(value,target,mode,strength,['backgroundColor','borderColor','strokeColor'].includes(key));
      }
      const texture=/^url\(["']?(.*?)["']?\)$/.exec(object.paint.backgroundImage??'');
      if(texture)paint.backgroundImage=`url("${await paletteImage(texture[1],rasterTargets,mode,strength)}")`;
      applied.palettePaint=paint;
    }
    if(object.kind==='svg'&&object.svg?.markup)applied.paletteSvgMarkup=recolorPaletteSvg(object.svg.markup,target,mode,strength);
    const src=asset?.url||object.image?.src;
    if((object.kind==='image'||object.kind==='texture')&&src) {
      applied.paletteImageSource=src;
      applied.paletteImageSrc=await paletteImage(src,rasterTargets,mode,strength);
    }
    bindings[object.id]={...bindings[object.id],role,original,applied};
    const next={...overrides[object.id]};
    for(const key of paletteKeys) {
      if(applied[key]===undefined) {if(original[key]===undefined)delete next[key];else next[key]=original[key];}
      else next[key]=applied[key];
    }
    overrides[object.id]=next;
  }
  const nativeSrc=variant.bgUploadUrl||variant.bgUrl;
  const hasVisibleBackground=withCompiledEditorText(system).some(o=>compiledPaletteRole(o)==='background'&&!overrides[o.id]?.removed);
  const nativeBackground=!hasVisibleBackground&&nativeSrc?{source:nativeSrc,output:await paletteImage(nativeSrc,paletteRoleTargets(palette,'background'),mode,strength)}:undefined;
  return {...variant,palette,cocoTextPaletteId:options.id??variant.cocoTextPaletteId,cocoCompositionSystem:{...system,compiledObjectOverrides:overrides,
    linkedPalette:{id:options.id??previous?.id,colors:palette,mode,strength,bindings,nativeBackground,originalPalette:previous?.originalPalette??variant.palette}}};
}

export function linkedPaletteNativeSource(system: any, source: string | null | undefined): string | null | undefined {
  const image=system?.linkedPalette?.nativeBackground;
  return image && image.source===source?image.output:source;
}

/** Apply prepared color-only properties without overwriting concurrent text/layout edits. */
export function mergeCocoLinkedPalette(current: Record<string,any>, prepared: Record<string,any>): Record<string,any> {
  const system=current.cocoCompositionSystem, ready=prepared.cocoCompositionSystem;
  const overrides={...system?.compiledObjectOverrides};
  for(const [id,binding] of Object.entries<any>(ready.linkedPalette?.bindings??{})) {
    overrides[id]={...overrides[id]};
    for(const key of paletteKeys) {
      if(binding.applied[key]===undefined) {if(binding.original?.[key]===undefined)delete overrides[id][key];else overrides[id][key]=binding.original[key];}
      else overrides[id][key]=binding.applied[key];
    }
  }
  return {...current,palette:prepared.palette,cocoTextPaletteId:prepared.cocoTextPaletteId,cocoCompositionSystem:{...system,compiledObjectOverrides:overrides,linkedPalette:ready.linkedPalette}};
}
