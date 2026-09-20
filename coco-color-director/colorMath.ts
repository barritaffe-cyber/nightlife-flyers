import type{Hex,HSL,RGB}from"./types.ts";
export const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
export function normalizeHex(input:string):Hex{let h=String(input??"").trim().replace(/^#/,"");if(/^[0-9a-f]{3}$/i.test(h))h=h.split("").map(c=>c+c).join("");if(!/^[0-9a-f]{6}$/i.test(h))return"#000000";return(`#${h.toUpperCase()}`)as Hex}
export function hexToRgb(hex:string):RGB{const h=normalizeHex(hex).slice(1);return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)}}
export function rgbToHex(rgb:RGB):Hex{const c=(v:number)=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0");return(`#${c(rgb.r)}${c(rgb.g)}${c(rgb.b)}`.toUpperCase())as Hex}
export function rgbToHsl({r,g,b}:RGB):HSL{r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h=0,s=0;const l=(max+min)/2;if(max!==min){const d=max-min;s=l>.5?d/(2-max-min):d/(max+min);if(max===r)h=(g-b)/d+(g<b?6:0);else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6}return{h:h*360,s,l}}
export function hslToRgb({h,s,l}:HSL):RGB{h=((h%360)+360)%360/360;s=clamp01(s);l=clamp01(l);if(s===0){const v=l*255;return{r:v,g:v,b:v}}const f=(p:number,q:number,t:number)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p};const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return{r:f(p,q,h+1/3)*255,g:f(p,q,h)*255,b:f(p,q,h-1/3)*255}}
export const hexToHsl=(h:string)=>rgbToHsl(hexToRgb(h));export const hslToHex=(h:HSL)=>rgbToHex(hslToRgb(h));
export function relativeLuminance(hex:string){const v=Object.values(hexToRgb(hex)).map(x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*v[0]+.7152*v[1]+.0722*v[2]}
export function contrastRatio(a:string,b:string){const x=relativeLuminance(a),y=relativeLuminance(b),hi=Math.max(x,y),lo=Math.min(x,y);return(hi+.05)/(lo+.05)}
export function mixColors(a:string,b:string,t:number):Hex{const x=hexToRgb(a),y=hexToRgb(b);t=clamp01(t);return rgbToHex({r:x.r*(1-t)+y.r*t,g:x.g*(1-t)+y.g*t,b:x.b*(1-t)+y.b*t})}
export function lighten(h:string,a:number):Hex{const x=hexToHsl(h);return hslToHex({...x,l:clamp01(x.l+a)})}export function darken(h:string,a:number):Hex{return lighten(h,-a)}
export function saturate(h:string,a:number):Hex{const x=hexToHsl(h);return hslToHex({...x,s:clamp01(x.s+a)})}export function desaturate(h:string,a:number):Hex{return saturate(h,-a)}
export function rotateHue(h:string,d:number):Hex{const x=hexToHsl(h);return hslToHex({...x,h:(x.h+d+360)%360})}
const ad=(a:number,b:number)=>{const d=Math.abs(a-b)%360;return d>180?360-d:d};
export function colorDistance(a:string,b:string){const x=hexToHsl(a),y=hexToHsl(b),h=ad(x.h,y.h)/180,s=Math.abs(x.s-y.s),l=Math.abs(x.l-y.l);return Math.sqrt(h*h*.5+s*s*.25+l*l*.25)}
export function warmthScore(h:string){const x=hexToHsl(h),d=Math.min(ad(x.h,35),ad(x.h,10),ad(x.h,55));return clamp01((1-d/180)*(.45+x.s*.55))}
export function bestTextColor(bg:string,white="#F4EBDD",black="#111111"):Hex{return contrastRatio(white,bg)>=contrastRatio(black,bg)?normalizeHex(white):normalizeHex(black)}
export function ensureContrast(fg:string,bg:string,min=4.5):Hex{let x=normalizeHex(fg);if(contrastRatio(x,bg)>=min)return x;const dark=relativeLuminance(bg)<.5;for(let i=0;i<24;i++){x=dark?lighten(x,.035):darken(x,.035);if(contrastRatio(x,bg)>=min)return x}return bestTextColor(bg)}
