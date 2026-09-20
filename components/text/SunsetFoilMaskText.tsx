import React from 'react';

type Props = { text: string; family: string; fontSize: number; tracking: number; lineHeight: number; weight?: string | number; fontStyle?: string; shadowFilter?: string; solidColor?: string; materialImage?: string; materialOnly?: boolean };
type Metrics = { width: number; height: number; inkTop: number; inkHeight: number; glyphs: { text: string; x: number; y: number }[] };

/** Live font glyphs mask a continuous foil surface; each letter owns its depth and shadow. */
export function SunsetFoilMaskText({text,family,fontSize,tracking,lineHeight,weight=400,fontStyle='normal',shadowFilter,solidColor,materialImage,materialOnly=false}: Props) {
  const root=React.useRef<HTMLSpanElement>(null);
  const id=React.useId().replace(/[^a-zA-Z0-9_-]/g,'');
  const [metrics,setMetrics]=React.useState<Metrics|null>(null);
  React.useLayoutEffect(()=>{
    const el=root.current;if(!el)return;
    let cancelled=false;
    const measure=()=>{
      if(cancelled)return;
      const glyphs=Array.from(el.querySelectorAll<HTMLElement>('[data-foil-measure]')).map(g=>({text:g.dataset.foilMeasure||'',x:g.offsetLeft,y:g.offsetTop+(g.querySelector<HTMLElement>('[data-baseline]')?.offsetTop||0)}));
      const context=document.createElement('canvas').getContext('2d');
      if(!context)return;
      context.font=`${fontStyle} ${weight} ${fontSize}px ${family}`;
      const ink=glyphs.filter(g=>g.text.trim()).map(g=>{const m=context.measureText(g.text);return {top:g.y-m.actualBoundingBoxAscent,bottom:g.y+m.actualBoundingBoxDescent};});
      const inkTop=ink.length?Math.min(...ink.map(b=>b.top)):0;
      const inkBottom=ink.length?Math.max(...ink.map(b=>b.bottom)):el.offsetHeight;
      const next={width:Math.max(1,el.offsetWidth),height:Math.max(1,el.offsetHeight),inkTop,inkHeight:Math.max(1,inkBottom-inkTop),glyphs};
      setMetrics(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);
    };
    measure();const observer=new ResizeObserver(measure);observer.observe(el);
    void document.fonts.ready.then(measure);document.fonts.addEventListener('loadingdone',measure);
    return()=>{cancelled=true;observer.disconnect();document.fonts.removeEventListener('loadingdone',measure);};
  },[text,family,fontSize,tracking,lineHeight,weight,fontStyle]);
  const prefix=`foil-${id}`;
  return <span ref={root} data-sunset-foil-mask="true" style={{display:'inline-block',position:'relative',whiteSpace:'pre',letterSpacing:0,fontFamily:family,fontSize,fontWeight:weight,fontStyle,lineHeight}}>
    <span aria-hidden="true" style={{visibility:'hidden'}}>{Array.from(text).map((glyph,i)=><span key={i} data-foil-measure={glyph} style={{position:'relative',display:'inline-block',marginRight:`${tracking}em`}}>{glyph}<span data-baseline style={{display:'inline-block',width:0,height:0,verticalAlign:'baseline'}}/></span>)}</span>
    {metrics && <svg aria-hidden="true" width={metrics.width} height={metrics.height} viewBox={`0 0 ${metrics.width} ${metrics.height}`} style={{position:'absolute',inset:0,overflow:'visible',pointerEvents:'none'}}>
      <defs>
        <linearGradient id={`${prefix}-metalBase`} x1="0%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#FFDB52"/><stop offset="30%" stopColor="#FABB35"/><stop offset="62%" stopColor="#EB951E"/><stop offset="100%" stopColor="#D96E25"/>
        </linearGradient>
        <linearGradient id={`${prefix}-color`} x1="0%" y1="15%" x2="100%" y2="85%">
          <stop offset="0%" stopColor="#F6A70D"/><stop offset="18%" stopColor="#FFC82B"/><stop offset="42%" stopColor="#F7B21A"/><stop offset="68%" stopColor="#F29A13"/><stop offset="86%" stopColor="#F47E2B"/><stop offset="100%" stopColor="#E96834"/>
        </linearGradient>
        <linearGradient id={`${prefix}-sheen`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFF4B5" stopOpacity=".05"/><stop offset="22%" stopColor="#FFFFFF" stopOpacity=".22"/><stop offset="38%" stopColor="#FFE47E" stopOpacity=".05"/><stop offset="64%" stopColor="#FFFFFF" stopOpacity=".11"/><stop offset="100%" stopColor="#8A2D15" stopOpacity=".10"/>
        </linearGradient>
        <radialGradient id={`${prefix}-vignette`} cx="42%" cy="38%" r="78%"><stop offset="0%" stopColor="#FFFFFF" stopOpacity="0"/><stop offset="72%" stopColor="#7B2B15" stopOpacity=".03"/><stop offset="100%" stopColor="#5D1D12" stopOpacity=".15"/></radialGradient>
        <filter id={`${prefix}-coarse`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={`${.018*1600/metrics.width} ${.055*600/metrics.inkHeight}`} numOctaves="3" seed="19"/>
          <feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.24"/></feComponentTransfer>
        </filter>
        <filter id={`${prefix}-fine`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={.16*1600/metrics.width} numOctaves="2" seed="41"/>
          <feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.10"/></feComponentTransfer>
        </filter>
        <filter id={`${prefix}-diffuse`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={`${.018*1600/metrics.width} ${.055*600/metrics.inkHeight}`} numOctaves="3" seed="19"/>
          <feDiffuseLighting surfaceScale={1.4*fontSize/135} diffuseConstant="0.45" lightingColor="#FFD66A"><feDistantLight azimuth="225" elevation="55"/></feDiffuseLighting>
        </filter>
        <filter id={`${prefix}-bevel`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation={fontSize*.003} result="height"/>
          <feSpecularLighting in="height" surfaceScale={fontSize*(materialImage?.length ? .01 : .027)} specularConstant={materialImage?.length ? .16 : .35} specularExponent="18" lightingColor="#fff5b4" result="light"><feDistantLight azimuth="225" elevation="45"/></feSpecularLighting>
          <feComposite in="light" in2="SourceAlpha" operator="in" result="edge"/>
          <feComposite in="edge" in2="SourceGraphic" operator="arithmetic" k1="0" k2={materialImage?.length ? .3 : .45} k3="1" k4="0"/>
        </filter>
        {metrics.glyphs.map((g,i)=><mask key={i} id={`${prefix}-${i}`} maskUnits="userSpaceOnUse" x={-fontSize} y={-fontSize} width={metrics.width+2*fontSize} height={metrics.height+2*fontSize}><text x={g.x} y={g.y} fill="white" fontFamily={family} fontSize={fontSize} fontWeight={weight} fontStyle={fontStyle}>{g.text}</text></mask>)}
      </defs>
      {metrics.glyphs.map((g,i)=>/\s/u.test(g.text)?null:<g key={i} data-headline-shadow-glyph={i} style={{filter:shadowFilter}}>
        <text x={g.x+fontSize*(materialImage?.length ? .003 : .009)} y={g.y+fontSize*(materialImage?.length ? .005 : .012)} fill={materialOnly?'#29120a':'#883509'} fontFamily={family} fontSize={fontSize} fontWeight={weight} fontStyle={fontStyle}>{g.text}</text>
        <g filter={`url(#${prefix}-bevel)`}><g mask={`url(#${prefix}-${i})`}>
          <g style={{isolation:'isolate'}}>
            <rect y={metrics.inkTop} width={metrics.width} height={metrics.inkHeight} fill={solidColor||(materialOnly?'transparent':`url(#${prefix}-${materialImage ? "metalBase" : "color"})`)}/>
            {!solidColor && materialImage && <image data-cana-metallic-material={materialOnly?undefined:"true"} data-reggae-stucco-material={materialOnly?"true":undefined} href={materialImage} x="0" y={metrics.inkTop} width={metrics.width} height={metrics.inkHeight} preserveAspectRatio="none" opacity={materialOnly?1:.70}/>}
            {!solidColor && !materialImage && <>
              <rect y={metrics.inkTop} width={metrics.width} height={metrics.inkHeight} filter={`url(#${prefix}-coarse)`} style={{mixBlendMode:'soft-light'}}/>
              <rect y={metrics.inkTop} width={metrics.width} height={metrics.inkHeight} filter={`url(#${prefix}-fine)`} style={{mixBlendMode:'overlay'}}/>
              <rect y={metrics.inkTop} width={metrics.width} height={metrics.inkHeight} filter={`url(#${prefix}-diffuse)`} style={{mixBlendMode:'soft-light'}}/>
              <rect y={metrics.inkTop} width={metrics.width} height={metrics.inkHeight} fill={`url(#${prefix}-sheen)`}/>
              <rect y={metrics.inkTop} width={metrics.width} height={metrics.inkHeight} fill={`url(#${prefix}-vignette)`}/>
            </>}
          </g>
        </g></g>
      </g>)}
    </svg>}
  </span>;
}
