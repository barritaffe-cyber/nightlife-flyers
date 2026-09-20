import { chromium, type Browser } from 'playwright';
import sharp from 'sharp';
import { previewDocument, validateCssDraft } from './cssStudio.ts';
import type { ReferenceBlock } from './cssReferenceLayout.ts';

type Rect={x:number;y:number;width:number;height:number};
export type CssStudioRender={screenshot:Buffer;html:string;measurements:{id:string;sourceId?:string;pass:boolean;problem:string;target?:Rect;actual?:Rect;fontFamily?:string;fontSize?:number;css?:Record<string,string>;ink?:Rect|null;suggestedUniformScale?:number}[]};

// Local-development authoring only. Never execute generated HTML scripts or
// permit its resource requests to reach localhost, private services or the web.
export async function renderCssStudio(source: string, width: number, height: number) {
  return (await measureAndFitCssStudio(source,width,height)).screenshot;
}

export async function measureAndFitCssStudio(source:string,width:number,height:number,blocks:ReferenceBlock[] = [], enforceGeometry = false, fitRecognizedText = false, releaseAutoFits = false):Promise<CssStudioRender> {
  source=source.trim().replace(/^```(?:html)?\s*/i,'').replace(/\s*```$/,'');
  // Generated CSS can be valid artwork while omitting our editor-only marker.
  // Supply the structural wrapper ourselves instead of failing generation.
  if(!/<[a-z][^>]*\bdata-coco-canvas(?:\s|=|>)/i.test(source)) {
    source=`<main data-coco-canvas style="position:relative;width:${width}px;height:${height}px">${source}</main>`;
  }
  const problems = validateCssDraft(source).filter(problem=>!(blocks.length&&problem==='Missing editable semantic text roles.'));
  if (problems.length) throw new Error(`Use a valid CSS draft before refinement: ${problems.join(' ')}`);
  if (![width,height].every(n=>Number.isInteger(n)&&n>=100&&n<=4096)) throw new Error('Use canvas dimensions between 100 and 4096.');
  let browser: Browser | undefined;
  let operation = 'starting Chromium';
  try {
    browser = await chromium.launch({headless:true});
    operation = 'opening the browser page';
    const context = await browser.newContext({viewport:{width,height},deviceScaleFactor:1,javaScriptEnabled:false,serviceWorkers:'block'});
    await context.route('**/*',route=>route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    operation = 'loading draft HTML';
    await page.setContent(previewDocument(source,'https://invalid.local'),{waitUntil:'load',timeout:15_000});
    operation = 'decoding draft images and loading fonts';
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode()));});
    // A model may redundantly annotate a child as a canvas. If there is one
    // unambiguous outer canvas, normalize its descendants rather than fail.
    await page.evaluate(()=>{
      const roots=[...document.querySelectorAll('[data-coco-canvas]')].filter(el=>!el.parentElement?.closest('[data-coco-canvas]'));
      if(roots.length===1)roots[0].querySelectorAll('[data-coco-canvas]').forEach(el=>el.removeAttribute('data-coco-canvas'));
    });
    const canvasCount=await page.locator('[data-coco-canvas]').count();
    if (canvasCount !== 1) throw new Error(`Use exactly one data-coco-canvas container (found ${canvasCount}).`);
    if(fitRecognizedText||releaseAutoFits){
      await page.evaluate(()=>{
        for(const el of document.querySelectorAll<HTMLElement>('[data-coco-fit-original],[data-coco-ocr-fit],[data-coco-overflow-fit],[data-coco-gradient-fit]')){
          const saved:Record<string,{value:string;priority:string}>=JSON.parse(el.dataset.cocoFitOriginal||'{}');
          // Compatibility for drafts fitted before original inline values were
          // recorded. Only release properties marked as tool-generated.
          if(!el.dataset.cocoFitOriginal){
            const keys=[...(el.dataset.cocoOcrFit?['transform','transform-origin']:[]),...(el.dataset.cocoOverflowFit?['font-size','line-height']:[]),...(el.dataset.cocoGradientFit?['line-height','top']:[])];
            keys.forEach(key=>el.style.removeProperty(key));
          }
          for(const [key,original] of Object.entries(saved)){
            if(original.value)el.style.setProperty(key,original.value,original.priority);else el.style.removeProperty(key);
          }
          delete el.dataset.cocoFitOriginal;delete el.dataset.cocoOcrFit;delete el.dataset.cocoOverflowFit;delete el.dataset.cocoGradientFit;
        }
      });
    }
    if(fitRecognizedText){
      operation='fitting overflowing single-line text';
      await page.evaluate(({blocks})=>{
        const remember=(el:HTMLElement,keys:string[])=>{
          const saved=JSON.parse(el.dataset.cocoFitOriginal||'{}');
          for(const key of keys)if(!(key in saved))saved[key]={value:el.style.getPropertyValue(key),priority:el.style.getPropertyPriority(key)};
          el.dataset.cocoFitOriginal=JSON.stringify(saved);
        };
        for(const el of document.querySelectorAll<HTMLElement>('[data-coco-kind="text"]')){
          const clean=(text:string)=>text.replace(/\s+/g,' ').trim();
          const block=blocks.find(b=>b.kind==='text'&&(b.id===el.dataset.region||clean(b.text)===clean(el.innerText||el.textContent||'')));
          if(block){
            remember(el,['white-space','text-wrap-mode','word-break','overflow-wrap']);
            el.style.setProperty('white-space',block.text.trim().includes('\n')?'pre-line':'nowrap','important');
            el.style.setProperty('text-wrap-mode','nowrap','important');
            el.style.setProperty('word-break','normal','important');
            el.style.setProperty('overflow-wrap','normal','important');
          }
          for(let attempt=0;attempt<3;attempt++){
            const style=getComputedStyle(el);
            if(style.textWrapMode!=='nowrap'||el.clientWidth<=0||el.scrollWidth<=el.clientWidth+1)break;
            const factor=el.clientWidth/el.scrollWidth*.985;
            const size=parseFloat(style.fontSize);
            remember(el,['font-size','line-height']);
            el.style.setProperty('font-size',`${size*factor}px`,'important');
            if(style.lineHeight!=='normal')el.style.setProperty('line-height',`${parseFloat(style.lineHeight)*factor}px`,'important');
            el.dataset.cocoOverflowFit='true';
          }
          const style=getComputedStyle(el);
          if(style.backgroundClip==='text'&&style.lineHeight!=='normal'&&parseFloat(style.lineHeight)<parseFloat(style.fontSize)*1.3){
            const oldHeight=parseFloat(style.lineHeight),newHeight=parseFloat(style.fontSize)*1.3;
            const top=parseFloat(style.top);
            remember(el,['line-height','top']);
            el.style.setProperty('line-height',`${newHeight}px`,'important');
            if(style.position==='absolute'&&Number.isFinite(top))el.style.setProperty('top',`${top-(newHeight-oldHeight)/2}px`,'important');
            el.dataset.cocoGradientFit='true';
          }
        }
      },{blocks});
    }
    operation = 'measuring text and shapes';
    const measurements = await page.evaluate(({blocks,width,height,enforceGeometry})=>{
      const canvas=document.querySelector<HTMLElement>('[data-coco-canvas]')!;
      const set=(el:HTMLElement,key:string,value:string)=>el.style.setProperty(key,value,'important');
      const matched=new Set<Element>();
      if(blocks.length&&enforceGeometry){set(canvas,'width',width+'px');set(canvas,'height',height+'px');set(canvas,'position','relative');set(canvas,'transform','none');set(canvas,'margin','0');set(canvas,'padding','0');}
      const results=blocks.map(block=>{
        const all=[...canvas.querySelectorAll<HTMLElement>('[data-region]')];
        let nodes=all.filter(el=>el.dataset.region===block.id&&!matched.has(el));
        if(!nodes.length){
          const root=canvas.getBoundingClientRect();
          const clean=(value:string)=>value.replace(/\s+/g,' ').trim();
          const candidates=all.filter(el=>!matched.has(el)&&(block.kind==='text'
            ? clean(el.innerText||el.textContent||'')===clean(block.text)
            : el.dataset.cocoKind==='shape'));
          const distance=(el:HTMLElement)=>{const r=el.getBoundingClientRect();return Math.hypot((r.x-root.x+r.width/2)/width-(block.x+block.width/2)/100,(r.y-root.y+r.height/2)/height-(block.y+block.height/2)/100);};
          candidates.sort((a,b)=>distance(a)-distance(b));
          if(candidates[0]&&(block.kind==='text'||distance(candidates[0])<.08))nodes=[candidates[0]];
        }
        if(nodes.length!==1)return {id:block.id,pass:false,problem:nodes.length?'Duplicate object':'Missing object'};
        const el=nodes[0];
        if (!(el instanceof HTMLElement)) return {id:block.id,pass:false,problem:'Object must use an HTML element, not SVG'};
        matched.add(el);el.dataset.cocoReferenceId=block.id;
        el.dataset.cocoObject=block.id;el.dataset.cocoKind=block.kind;el.dataset.cocoRole=block.role;el.dataset.cocoEditable='true';
        if (!enforceGeometry) {
          // Reference measurements are estimates, not commands. Audit actual
          // ink without destroying spans, line breaks, gradients or transforms.
          const root=canvas.getBoundingClientRect();
          const range=document.createRange();range.selectNodeContents(el);
          const rect=block.kind==='text'?range.getBoundingClientRect():el.getBoundingClientRect();
          const style=getComputedStyle(el);
          const actual={x:rect.x-root.x,y:rect.y-root.y,width:rect.width,height:rect.height};
          const target={x:block.x*width/100,y:block.y*height/100,width:block.width*width/100,height:block.height*height/100};
          const visible=rect.width>0&&rect.height>0&&style.visibility!=='hidden'&&style.display!=='none'&&Number(style.opacity)>0;
          const copyMatches=block.kind!=='text'||(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim()===block.text.replace(/\s+/g,' ').trim();
          const lineCenters:number[]=[];
          if(block.kind==='text'){
            const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
            while(walker.nextNode()){
              if(!walker.currentNode.textContent?.trim())continue;
              const words=document.createRange();words.selectNodeContents(walker.currentNode);
              for(const line of words.getClientRects()){
                if(line.width<1||line.height<1)continue;
                const center=line.y+line.height/2;
                if(!lineCenters.some(y=>Math.abs(y-center)<line.height*.55))lineCenters.push(center);
              }
            }
          }
          const expectedLines=block.text.split('\n').filter(line=>line.trim()).length;
          const lineGroupingMatches=block.kind!=='text'||lineCenters.length===expectedLines;
          const inside=actual.x>=-2&&actual.y>=-2&&actual.x+actual.width<=width+2&&actual.y+actual.height<=height+2;
          return {id:block.id,sourceId:el.dataset.region,pass:visible&&copyMatches&&lineGroupingMatches&&inside,target,actual,fontFamily:style.fontFamily,fontSize:parseFloat(style.fontSize),css:{left:style.left,top:style.top,width:style.width,height:style.height,transform:style.transform,transformOrigin:style.transformOrigin,fontWeight:style.fontWeight,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing,color:style.color,backgroundImage:style.backgroundImage,backgroundColor:style.backgroundColor,borderTop:style.borderTop,borderRight:style.borderRight,borderBottom:style.borderBottom,borderLeft:style.borderLeft,opacity:style.opacity},problem:!visible?'Object is not visible':!copyMatches?'Copy differs from reference':!lineGroupingMatches?`Line grouping differs from reference: expected ${expectedLines}, rendered ${lineCenters.length}`:!inside?'Object extends outside canvas':''};
        }
        // A single canvas coordinate system eliminates nested percentage and
        // inherited flex/grid placement errors. Preserve computed font/paint.
        const computed=getComputedStyle(el);
        const inherited={fontFamily:computed.fontFamily,color:computed.color,letterSpacing:computed.letterSpacing};
        if(el.parentElement!==canvas){canvas.appendChild(el);el.style.fontFamily=inherited.fontFamily;el.style.color=inherited.color;el.style.letterSpacing=inherited.letterSpacing;}
        const x=block.x*width/100,y=block.y*height/100,w=block.width*width/100,h=block.height*height/100;
        for(const [key,value] of Object.entries({position:'absolute',left:x+'px',top:y+'px',right:'auto',bottom:'auto',width:w+'px',height:h+'px','min-width':'0','min-height':'0','max-width':'none','max-height':'none',margin:'0',padding:'0',transform:'none',translate:'none',rotate:'none',scale:'none','box-sizing':'border-box',display:'block',visibility:'visible'}))set(el,key,value);
        if(block.kind==='text'){
          // The inventory separates differently styled facts into independent
          // objects; no heading defaults or nested spans can override them.
          el.textContent=block.text;
          set(el,'white-space','pre');set(el,'text-align',block.align);set(el,'font-weight',String(block.weight));set(el,'line-height','1.1');set(el,'text-transform','none');set(el,'overflow','visible');
          let size=block.fontSize*width/100;
          set(el,'font-size',size+'px');
          const measure=()=>{const range=document.createRange();range.selectNodeContents(el);return range.getBoundingClientRect();};
          // Fit measured browser text line bounds, not guessed container size.
          // Grow or shrink conservatively towards the reference rectangle.
          for(let i=0;i<4;i++){const r=measure();const ratio=Math.min(w/Math.max(1,r.width),h/Math.max(1,r.height));if(Math.abs(1-ratio)<.015)break;size=Math.max(1,Math.min(size*ratio,block.fontSize*width/100*1.25));set(el,'font-size',size+'px');}
          const rect=measure(),root=canvas.getBoundingClientRect();
          const fits=rect.width<=w+2&&rect.height<=h+2&&rect.left>=root.left+x-2&&rect.right<=root.left+x+w+2&&rect.top>=root.top+y-2&&rect.bottom<=root.top+y+h+2;
          const fills=rect.width>=w*.7||rect.height>=h*.7;
          return {id:block.id,pass:fits&&fills,target:{x,y,width:w,height:h},actual:{x:rect.x-root.x,y:rect.y-root.y,width:rect.width,height:rect.height},fontSize:size,problem:!fits?'Text exceeds reference box':!fills?'Text is too small for reference box; correct font size or tracking':''};
        }
        const paint=getComputedStyle(el);
        const visible=paint.backgroundImage!=='none'||!['transparent','rgba(0, 0, 0, 0)'].includes(paint.backgroundColor)||[paint.borderTopWidth,paint.borderRightWidth,paint.borderBottomWidth,paint.borderLeftWidth].some(value=>parseFloat(value)>0);
        return {id:block.id,pass:visible,target:{x,y,width:w,height:h},problem:visible?'':'Shape has no visible fill or border'};
      });
      // Additional IDs may restore copy missed by the initial inventory. The
      // visual reviewer checks them against the image; do not reject them here.
      return results;
    },{blocks,width,height,enforceGeometry});
    // Font line boxes include ascenders/descenders and empty space (especially
    // in brush fonts). Measure rasterized ink separately; never scale a script
    // using its line-box height as if that were visible glyph height.
    const inkBounds:Record<string,{x:number;y:number;width:number;height:number}|null>={};
    operation = 'measuring visible text ink';
    for(const block of blocks){
      const found=await page.evaluate(id=>{
        const el=[...document.querySelectorAll<HTMLElement>('[data-region]')].find(el=>el.dataset.cocoReferenceId===id);
        if(!el)return false;
        el.setAttribute('data-ink-probe','');return true;
      },block.id);
      if(!found)continue;
      await page.evaluate(()=>{
        const style=document.createElement('style');style.id='coco-ink-probe-style';
        style.textContent='html,body{background:transparent!important} [data-coco-canvas],[data-coco-canvas] *{visibility:hidden!important} [data-ink-probe],[data-ink-probe] *{visibility:visible!important}';
        document.head.appendChild(style);
      });
      try{
        const mask=await page.screenshot({clip:{x:0,y:0,width,height},omitBackground:true,animations:'disabled'});
        const {data,info}=await sharp(mask).ensureAlpha().raw().toBuffer({resolveWithObject:true});
        let minX=width,minY=height,maxX=-1,maxY=-1;
        for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*info.channels+info.channels-1]>32){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
        inkBounds[block.id]=maxX<0?null:{x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1};
      }finally{
        await page.evaluate(()=>document.getElementById('coco-ink-probe-style')?.remove());
        await page.evaluate(()=>document.querySelector('[data-ink-probe]')?.removeAttribute('data-ink-probe'));
      }
    }
    if(fitRecognizedText){
      operation='fitting OCR-recognized text ink';
      await page.evaluate(({blocks,inkBounds,width,height})=>{
        const canvas=document.querySelector('[data-coco-canvas]');
        for(const block of blocks){
          if(block.measurementSource!=='on-device-ocr')continue;
          const ink=inkBounds[block.id];
          const el=[...document.querySelectorAll<HTMLElement>('[data-region]')].find(el=>el.dataset.cocoReferenceId===block.id);
          // Nested/transformed parents need a different coordinate conversion;
          // leave those to visual repair rather than silently misplacing them.
          if(!ink||!el||el.parentElement!==canvas)continue;
          const style=getComputedStyle(el);
          if(style.position!=='absolute'||style.translate!=='none'||style.scale!=='none'||style.rotate!=='none')continue;
          const left=parseFloat(style.left),top=parseFloat(style.top);
          if(!Number.isFinite(left)||!Number.isFinite(top))continue;
          const target={x:block.x/100*width,y:block.y/100*height,width:block.width/100*width,height:block.height/100*height};
          const scale=Math.sqrt(target.width/ink.width*target.height/ink.height);
          if(!Number.isFinite(scale)||scale<.25||scale>4)continue;
          const [ox,oy]=style.transformOrigin.split(' ').map(parseFloat);
          const matrix=new DOMMatrix(style.transform==='none'?undefined:style.transform);
          if(!matrix.is2D)continue;
          const effective=new DOMMatrix().translate(ox,oy).multiply(matrix).translate(-ox,-oy);
          const targetX=target.x+(block.align==='center'?(target.width-ink.width*scale)/2:block.align==='right'?target.width-ink.width*scale:0);
          const dx=targetX-left-scale*(ink.x-left),dy=target.y-top-scale*(ink.y-top);
          const next=new DOMMatrix().translate(dx,dy).scale(scale).multiply(effective);
          const saved=JSON.parse(el.dataset.cocoFitOriginal||'{}');
          for(const key of ['transform','transform-origin'])if(!(key in saved))saved[key]={value:el.style.getPropertyValue(key),priority:el.style.getPropertyPriority(key)};
          el.dataset.cocoFitOriginal=JSON.stringify(saved);
          el.style.setProperty('transform-origin','0px 0px','important');
          el.style.setProperty('transform',next.toString(),'important');
          el.dataset.cocoOcrFit='true';
        }
      },{blocks,inkBounds,width,height});
      const fitted=await page.evaluate(()=>[...document.querySelectorAll('style')].map(el=>el.outerHTML).join('\n')+'\n'+document.querySelector('[data-coco-canvas]')!.outerHTML);
      await browser.close();browser=undefined;
      // A fit is never accepted on calculation alone: measure the new pixels.
      return await measureAndFitCssStudio(fitted,width,height,blocks,false,false);
    }
    operation = 'serializing fitted HTML';
    const html = await page.evaluate(()=>[...document.querySelectorAll('style')].map(el=>el.outerHTML).join('\n')+'\n'+document.querySelector('[data-coco-canvas]')!.outerHTML);
    operation = 'capturing the draft screenshot';
    return {screenshot:await page.screenshot({clip:{x:0,y:0,width,height},animations:'disabled',timeout:15_000}),html,measurements:measurements.map(block=>{
      const ink=inkBounds[block.id];
      const target='target' in block?block.target:undefined;
      return {...block,ink,suggestedUniformScale:ink&&target?Math.sqrt((target.width/ink.width)*(target.height/ink.height)):undefined};
    })};
  } catch (error) {
    // Report the operation and a bounded error category, never generated source
    // or Playwright's full call log (which can contain embedded image data).
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('Use ')) throw error;
    const kind = /Timeout|timed out/i.test(message) ? 'timeout'
      : /EncodingError|decode/i.test(message) ? 'image decode failure'
      : /ReferenceError/.test(message) ? 'browser ReferenceError'
      : /TypeError/.test(message) ? 'browser TypeError'
      : /Target.*closed|browser.*closed/i.test(message) ? 'browser closed'
      : 'browser operation error';
    throw new Error(`CSS renderer failed while ${operation}: ${kind}.`, {cause:error});
  } finally {await browser?.close().catch(()=>{});}
}
