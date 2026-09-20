import React from 'react';
import { GLOW_GLYPH_LAYOUT } from '../../lib/glowGlyphLayout';

/** Separate bitmap paints, with the font's pair advances restored between spans. */
export function PngGlyphShadowText({text,filter,textShadow,shadowStrength,glyphLayout,glints=false,fitReferenceText,renderGlyph}:{text:string;fitReferenceText?:string;glints?:boolean;glyphLayout?:"glow-offset-v1";shadowStrength?:number;filter?:React.CSSProperties['filter'];textShadow?:React.CSSProperties['textShadow'];renderGlyph?:(glyph:string,index:number)=>React.ReactNode}) {
  const shadowId = `png-shadow-${React.useId().replace(/:/g, '')}`;
  const [paintFontSize, setPaintFontSize] = React.useState(16);
  const strength = Math.max(0, Math.min(8, Number(shadowStrength) || 0));
  // Intensity changes opacity only. Geometry stays anchored to each letter.
  const shadowOpacity = .8 * Math.sqrt(strength / 8);
  const glyphFilter = shadowStrength === undefined ? filter : strength > 0 ? `url(#${shadowId})` : 'none';
  const root=React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(()=>{
    const el=root.current;if(!el)return;
    let cancelled=false;
    const measure=()=>{
      if(cancelled)return;
      const style=getComputedStyle(el);
      const nextFontSize=parseFloat(style.fontSize)||16;
      setPaintFontSize(previous=>previous===nextFontSize?previous:nextFontSize);
      const ctx=document.createElement('canvas').getContext('2d');if(!ctx)return;
      ctx.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.fontKerning='normal';
      const spacing=parseFloat(style.letterSpacing)||0;
      // Opt-in recipe fitting keeps edited words inside the authored title lane.
      // Measure with the loaded font and its kerning, not character counts.
      if (fitReferenceText) {
        const width=(value:string)=>Math.max(1,...value.split('\n').map(line=>ctx.measureText(line).width+Math.max(0,Array.from(line).length-1)*spacing));
        const scale=Math.min(1,width(fitReferenceText)/width(text));
        el.style.transform=`scaleX(${scale})`;
        el.dataset.pngFitScale=String(scale);
      } else {
        el.style.removeProperty('transform');
        delete el.dataset.pngFitScale;
      }
      const children=Array.from(el.children).filter(child=>child.tagName.toLowerCase()!=='svg') as HTMLElement[];
      children.forEach((child,index)=>{
        const a=child.dataset.glyph ?? child.textContent ?? '';const b=children[index+1]?.dataset.glyph ?? children[index+1]?.textContent ?? '';
        const layout=glyphLayout==='glow-offset-v1' && a.trim() ? GLOW_GLYPH_LAYOUT[index % 4] : undefined;
        const kern=b?ctx.measureText(a+b).width-ctx.measureText(a).width-ctx.measureText(b).width:0;
        const pair=kern+(layout ? child.offsetWidth*(layout.scale-1) : 0);
        child.style.marginRight=`${spacing+pair}px`;
        if(glints && (index===0 || index===2)){
          const metrics=ctx.measureText(a);
          const canvas=document.createElement('canvas');
          canvas.width=Math.ceil(metrics.actualBoundingBoxLeft+metrics.actualBoundingBoxRight)+8;
          canvas.height=Math.ceil(metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent)+8;
          const paint=canvas.getContext('2d',{willReadFrequently:true});
          if(paint){
            paint.font=ctx.font;
            paint.fillText(a,4+metrics.actualBoundingBoxLeft,4+metrics.actualBoundingBoxAscent);
            const pixels=paint.getImageData(0,0,canvas.width,canvas.height).data;
            let firstInk=canvas.height;
            for(let y=0;y<canvas.height && firstInk===canvas.height;y++)for(let x=0;x<canvas.width;x++){
              if(pixels[(y*canvas.width+x)*4+3]>180){firstInk=y;break;}
            }
            let best=-1,point={x:4,y:firstInk};
            for(let y=firstInk;y<Math.min(canvas.height,firstInk+nextFontSize*.09);y++)for(let x=3;x<canvas.width-3;x++){
              const offset=(y*canvas.width+x)*4;
              const light=pixels[offset]+pixels[offset+1]+pixels[offset+2];
              const score=light-y*1.8-Math.abs(x-canvas.width*.3)*.2;
              if(pixels[offset+3]>180 && score>best){best=score;point={x,y};}
            }
            const lineHeight=parseFloat(style.lineHeight)||nextFontSize;
            const ascent=metrics.fontBoundingBoxAscent,descent=metrics.fontBoundingBoxDescent;
            child.style.setProperty('--glint-x',`${point.x-4-metrics.actualBoundingBoxLeft}px`);
            child.style.setProperty('--glint-y',`${(lineHeight-ascent-descent)/2+ascent-metrics.actualBoundingBoxAscent+point.y-4}px`);
          }
        }
      });
    };
    measure();const observer=new ResizeObserver(measure);observer.observe(el);
    void document.fonts.ready.then(measure);
    document.fonts.addEventListener('loadingdone',measure);
    return()=>{cancelled=true;observer.disconnect();document.fonts.removeEventListener('loadingdone',measure);};
  });
  return <span ref={root} data-png-glyph-run style={{textShadow:'none',fontKerning:'normal',display:fitReferenceText?'inline-block':undefined,transformOrigin:fitReferenceText?'left center':undefined}}>
    {strength > 0 && <svg width="0" height="0" aria-hidden="true" style={{position:'absolute',pointerEvents:'none'}}>
      <defs>
        <filter id={shadowId} data-png-shadow-filter="true" x="-100%" y="-100%" width="400%" height="400%" colorInterpolationFilters="sRGB">
          {/* Suppress faint source glow without turning antialiasing into a hard silhouette. */}
          <feComponentTransfer in="SourceAlpha" result="letterCore">
            <feFuncA type="gamma" amplitude="1" exponent="1.6" offset="0" />
          </feComponentTransfer>
          <feGaussianBlur in="letterCore" stdDeviation={paintFontSize * .012} result="edge" />
          <feOffset in="edge" dx={paintFontSize * .012} dy={paintFontSize * .028} result="offset" />
          <feFlood floodColor="#000000" floodOpacity={shadowOpacity} result="shadowColor" />
          <feComposite in="shadowColor" in2="offset" operator="in" result="shadow" />
          <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
    </svg>}
    {Array.from(text||'\u00a0').map((glyph,i)=>{
      if(glyph==='\n')return <br key={i}/>;
      const layout=glyphLayout==='glow-offset-v1' && glyph.trim() ? GLOW_GLYPH_LAYOUT[i % 4] : undefined;
      return <span key={i} data-glyph={glyph} data-headline-shadow-glyph={i} data-png-glyph-layout={layout ? 'glow-offset-v1' : undefined} style={{position:glints?'relative':undefined,display:'inline-block',whiteSpace:'pre',letterSpacing:0,textShadow,filter:glyphFilter,
        marginLeft:layout ? `${layout.overlapEm}em` : undefined,
        transform:layout ? `translateY(${layout.yEm}em) rotate(${layout.rotation}deg) scale(${layout.scale})` : undefined,
        transformOrigin:'left bottom',
      }}>{renderGlyph ? renderGlyph(glyph,i) : glyph}{glints && (i===0 || i===2) && <svg data-png-specular-glint="true" aria-hidden="true" viewBox="-50 -25 100 50" style={{position:'absolute',left:'var(--glint-x)',top:'var(--glint-y)',width:'.7em',height:'.35em',transform:'translate(-50%,-50%)',overflow:'visible',pointerEvents:'none',filter:'none'}}><defs><radialGradient id={`${shadowId}-glint-${i}`}><stop stopColor="#fffef5"/><stop offset=".09" stopColor="#fff5dc"/><stop offset=".3" stopColor="#ffcba5" stopOpacity=".7"/><stop offset="1" stopColor="#ffa897" stopOpacity="0"/></radialGradient></defs><ellipse rx="50" ry="3" fill={`url(#${shadowId}-glint-${i})`}/><ellipse rx="3" ry="16" fill={`url(#${shadowId}-glint-${i})`}/><circle r="17" fill={`url(#${shadowId}-glint-${i})`} opacity=".55"/><circle r="1.15" fill="#fffef9"/></svg>}</span>;
    })}
  </span>;
}
