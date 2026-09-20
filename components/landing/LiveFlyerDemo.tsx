'use client';
import {useCallback, useEffect, useRef, useState} from 'react';
import styles from './CocoLanding.module.css';

/** Render the authored master itself, including its reusable color glyph font. */
export default function LiveFlyerDemo({name,format}:{name:string;format:'square'|'story'}) {
  const frame=useRef<HTMLIFrameElement>(null);
  const container=useRef<HTMLDivElement>(null);
  const [width,setWidth]=useState(0);
  const current=useRef({name,format});
  current.current={name,format};
  const update=useCallback(()=>{
    const {name,format}=current.current;
    const doc=frame.current?.contentDocument;
    if(!doc)return;
    const canvas=doc.querySelector<HTMLElement>('.canvas');
    const background=doc.querySelector<HTMLImageElement>('.background');
    if(canvas)canvas.dataset.format=format;
    if(background)background.src=`/generated-flyers/assets/girl-code-${format}2.jpg`;
    const words=(name.trim()||'GIRL CODE').split(/\s+/);
    // Script capitals are ornamental: use the master's title case for readable lettering.
    const subtitle=words.slice(1).map(word=>word.charAt(0).toUpperCase()+word.slice(1).toLowerCase()).join(' ');
    const values=[words[0].toUpperCase(),subtitle];
    for(const [index,selector] of ['.headline','.subtitle'].entries()){
      const el=doc.querySelector<HTMLElement>(selector);
      if(!el)continue;
      el.textContent=values[index];
      if(index===1){
        // Script flourishes extend outside the line box. Background-clipped text
        // cuts those strokes off; a normal fill paints the complete glyphs.
        el.style.backgroundImage='none';
        el.style.webkitTextFillColor='#ffd1d7';
      }
      const base=index===0?(format==='story'?286:250):(format==='story'?240:165);
      el.style.fontSize=`${base}px`;
      const range=doc.createRange();range.selectNodeContents(el);
      const measured=range.getBoundingClientRect().width;
      const available=index===0?740:640;
      if(measured>available)el.style.fontSize=`${base*available/measured}px`;
    }
  },[]);
  useEffect(()=>{
    const el=container.current;if(!el)return;
    const observer=new ResizeObserver(entries=>setWidth(entries[0].contentRect.width));
    observer.observe(el);return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    update();
    void frame.current?.contentDocument?.fonts.ready.then(update);
  },[update,name,format]);
  return <div ref={container} className={styles.liveCanvas} style={{aspectRatio:format==='story'?'9 / 16':'1'}} aria-label={`Live ${format} flyer: ${name.trim()||'GIRL CODE'}`}>
    <iframe ref={frame} title="Live editable Girl Code Rose flyer" src="/generated-flyers/girl-code-rose-master.html" tabIndex={-1} style={{width:1080,height:format==='story'?1920:1080,transform:`scale(${width/1080})`}} onLoad={()=>{update();void frame.current?.contentDocument?.fonts.ready.then(update);}}/>
  </div>;
}
