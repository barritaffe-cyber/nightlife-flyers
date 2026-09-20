export type LinkedPalette = { primary?: string; secondary?: string; accent?: string; neutral?: string; bgFrom?: string; bgTo?: string };
export type PaletteBlend = 'hue' | 'soft-light';
export type PaletteRole = 'background' | 'primary' | 'secondary' | 'accent' | 'neutral';
export type RGB = [number, number, number];

export function compiledPaletteRole(object: any): PaletteRole {
  const roles: PaletteRole[] = ['background', 'primary', 'secondary', 'accent', 'neutral'];
  if (roles.includes(object.paletteRole)) return object.paletteRole;
  if ([object.id, object.semanticRole, object.assetRole, object.binding?.semanticRole].includes('background')) return 'background';
  if (object.semanticRole === 'headline') return 'primary';
  if (['headline2', 'date', 'day', 'month', 'price', 'decoration'].includes(object.semanticRole)) return 'accent';
  if (object.kind === 'text') return 'neutral';
  if (object.semanticRole === 'subject') return 'secondary';
  return 'accent';
}

export function paletteRoleColor(palette: LinkedPalette, role: PaletteRole): string {
  return (role === 'background' ? palette.bgFrom || palette.secondary : palette[role]) || palette.accent || '#DAB570';
}

/** Raster backgrounds use the two background swatches; artwork keeps its role plus accent. */
export function paletteRoleTargets(palette: LinkedPalette, role: PaletteRole): string[] {
  const primary = paletteRoleColor(palette, role);
  const secondary = role === 'background'
    ? palette.bgTo || palette.bgFrom || palette.secondary || primary
    : palette.accent || primary;
  return [...new Set([primary, secondary].filter(Boolean))];
}

export function parsePaletteColor(value: string): RGB | null {
  const hex = /^#([a-f\d]{3}|[a-f\d]{6})$/i.exec(value);
  if (hex) { const s = hex[1].length === 3 ? [...hex[1]].map(c => c + c).join('') : hex[1]; return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16) / 255) as RGB; }
  const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(value);
  return rgb ? rgb.slice(1, 4).map(v => Math.min(1, Number(v) / 255)) as RGB : null;
}

export function colorHue(c: RGB): number {
  const [r,g,b] = c, hi = Math.max(...c), lo = Math.min(...c), d = hi-lo;
  if (d < .00001) return 0;
  return (((hi === r ? (g-b)/d : hi === g ? (b-r)/d+2 : (r-g)/d+4)*60)%360+360)%360;
}
const lum = (c: RGB) => .3*c[0]+.59*c[1]+.11*c[2];
const sat = (c: RGB) => Math.max(...c)-Math.min(...c);
const hueDistance = (a: number,b: number) => Math.abs(((a-b+540)%360)-180);

/** Nonseparable Hue blending: preserve source luminosity and saturation. */
export function blendPalettePixel(source: RGB, target: RGB, mode: PaletteBlend, strength: number): RGB {
  if(mode==='hue' && sat(target)<.015) return [...source];
  let result: RGB;
  if (mode === 'soft-light') {
    result = source.map((b,i) => target[i] <= .5 ? b-(1-2*target[i])*b*(1-b)
      : b+(2*target[i]-1)*((b<=.25?((16*b-12)*b+4)*b:Math.sqrt(b))-b)) as RGB;
  } else {
    const lo = Math.min(...target), d = sat(target), s = sat(source);
    result = target.map(c => d > .00001 ? (c-lo)*s/d : 0) as RGB;
  }
  // Keep the original lighting even with Soft Light; correct out-of-gamut colors.
  const shift = lum(source)-lum(result);
  result = result.map(c => c+shift) as RGB;
  const l = lum(result), lo = Math.min(...result), hi = Math.max(...result);
  if (lo < 0) result = result.map(c => l+(c-l)*l/(l-lo)) as RGB;
  if (hi > 1) result = result.map(c => l+(c-l)*(1-l)/(hi-l)) as RGB;
  return source.map((c,i) => Math.max(0,Math.min(1,c+(result[i]-c)*strength))) as RGB;
}

/** Sample chromatic midtones. Whites, blacks and low-chroma detail aren't targets. */
export function mainImageHues(data: Uint8ClampedArray): number[] {
  const bins = new Float64Array(36), stride = Math.max(1,Math.floor(data.length/4/18000))*4;
  for(let i=0;i<data.length;i+=stride) {
    if(data[i+3]<180) continue;
    const c: RGB=[data[i]/255,data[i+1]/255,data[i+2]/255], s=sat(c), l=lum(c);
    if(s<.12||l<.07||l>.92) continue;
    bins[Math.floor(colorHue(c)/10)%36]+=s*(1-Math.abs(l-.5));
  }
  const peaks:number[]=[];
  for(const entry of [...bins].map((weight,i)=>({h:i*10+5,weight})).sort((a,b)=>b.weight-a.weight)) {
    if(entry.weight<=0) break;
    if(peaks.every(h=>hueDistance(h,entry.h)>55)) peaks.push(entry.h);
    if(peaks.length===2) break;
  }
  return peaks;
}

/** Swap only the automatically selected hue ranges, never flood the whole image. */
export function mapImagePalette(data: Uint8ClampedArray, targets: RGB[], mode: PaletteBlend, strength: number): void {
  const hues=mainImageHues(data);
  if(!hues.length||!targets.length||strength<=0) return;
  for(let i=0;i<data.length;i+=4) {
    if(!data[i+3]) continue;
    const c:RGB=[data[i]/255,data[i+1]/255,data[i+2]/255], s=sat(c);
    if(s<.08) continue;
    const h=colorHue(c), distances=hues.map(v=>hueDistance(h,v));
    const index=distances.indexOf(Math.min(...distances)), distance=distances[index];
    if(distance>=32) continue;
    const t=Math.min(1,(32-distance)/16), mask=t*t*(3-2*t)*Math.min(1,(s-.08)/.18);
    const next=blendPalettePixel(c,targets[index%targets.length],mode,Math.max(0,Math.min(1,strength))*mask);
    for(let k=0;k<3;k++)data[i+k]=Math.round(next[k]*255);
  }
}

export function recolorPaletteCss(css: string, target: string, mode: PaletteBlend, strength: number, solid = false): string {
  const color=parsePaletteColor(target); if(!color) return css;
  return css.replace(/url\([^)]*\)|#[a-f\d]{6}\b|#[a-f\d]{3}\b|rgba?\([^)]*\)/gi, token=>{
    const source=parsePaletteColor(token); if(!source) return token;
    const rgb=(solid && lum(source)>.04?color:blendPalettePixel(source,color,mode,strength)).map(v=>Math.round(v*255));
    const alpha=/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/i.exec(token)?.[1];
    return alpha!==undefined?`rgba(${rgb.join(',')},${alpha})`:`rgb(${rgb.join(',')})`;
  });
}

export function recolorPaletteSvg(markup: string, target: string, mode: PaletteBlend, strength: number): string {
  // Fills/strokes are palette colors; gradient stops retain their lighting range.
  return recolorPaletteCss(markup,target,mode,strength)
    .replace(/\b(fill|stroke)=(['"])(#[a-f\d]{3,6}|rgba?\([^)]*\))\2/gi,(_all,key,quote,color)=>`${key}=${quote}${recolorPaletteCss(color,target,mode,strength,true)}${quote}`)
    .replace(/\b(fill|stroke):\s*(#[a-f\d]{3,6}|rgba?\([^)]*\))/gi,(_all,key,color)=>`${key}:${recolorPaletteCss(color,target,mode,strength,true)}`);
}
