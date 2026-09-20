'use client';
import { useEffect, useRef, useState } from 'react';
import { previewDocument, validateCssDraft } from '../../../lib/coco/cssStudio';
import styles from './studio.module.css';
import type { VisualReview } from '../../../lib/coco/cssReviewLoop';

export default function FlyerCssStudio() {
  const [reference,setReference]=useState<File|null>(null);
  const [referenceUrl,setReferenceUrl]=useState('');
  const [assets,setAssets]=useState<File[]>([]);
  const [source,setSource]=useState('');
  const [previousSource,setPreviousSource]=useState('');
  const [rendered,setRendered]=useState('');
  const [instructions,setInstructions]=useState('');
  const [notes,setNotes]=useState('');
  const [changes,setChanges]=useState<string[]>([]);
  const [unresolved,setUnresolved]=useState<string[]>([]);
  const [measurements,setMeasurements]=useState<{id:string;pass:boolean;problem?:string;fontSize?:number}[]>([]);
  const [review,setReview]=useState<{source:string;reference:File;instructions:string;width:number;height:number;passed:boolean;checks:VisualReview['checks'];history:{iteration:number;checks:VisualReview['checks']}[];selectedIteration:number;model:string}|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [approved,setApproved]=useState(false);
  const [size,setSize]=useState({width:1024,height:1536});
  const [origin,setOrigin]=useState('');
  const [panelWidth,setPanelWidth]=useState(400);
  const panel=useRef<HTMLDivElement>(null);
  useEffect(()=>{setOrigin(window.location.origin);const observer=new ResizeObserver(entries=>setPanelWidth(entries[0].contentRect.width));if(panel.current)observer.observe(panel.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{if(!reference){setReferenceUrl('');return;}const url=URL.createObjectURL(reference);setReferenceUrl(url);return()=>URL.revokeObjectURL(url);},[reference]);
  const warnings=validateCssDraft(source);
  function edit(value:string){setSource(value);setApproved(false);}
  async function generate(mode: 'generate' | 'typography' | 'composition' = 'generate'){
    if(!reference)return;
    setBusy(true);setError('');setApproved(false);
    try{const form=new FormData();form.append('reference',reference);assets.forEach(file=>form.append('assets',file));form.append('instructions',instructions);form.append('mode',mode);form.append('width',String(size.width));form.append('height',String(size.height));if(mode!=='generate')form.append('source',source);
      const response=await fetch('/api/flyer-css',{method:'POST',body:form});const data=await response.json();if(!response.ok)throw new Error(data.error||'Generation failed.');
      setPreviousSource(source);setSource(data.html);setRendered(data.html);setSize({width:data.width,height:data.height});setMeasurements(data.measurements||[]);setNotes(data.notes);setChanges(data.changes||[]);setUnresolved(data.unresolved||[]);setReview(data.visualReview?{...data.visualReview,source:data.html,reference,instructions,width:data.width,height:data.height}:null);
    }catch(e){setError(e instanceof Error?e.message:'Generation failed.');}finally{setBusy(false);}
  }
  function download(){const html=source.replaceAll('url("/fonts/',`url("${origin}/fonts/`).replaceAll("url('/fonts/",`url('${origin}/fonts/`);const blob=new Blob([previewDocument(html,origin)],{type:'text/html'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='flyer-css-master.html';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const scale=panelWidth/size.width;
  const currentReview=review&&review.source===source&&review.reference===reference&&review.instructions===instructions&&review.width===size.width&&review.height===size.height?review:null;
  const preview=previewDocument(rendered.replaceAll('/fonts/',`${origin}/fonts/`),origin);
  return <main className={styles.studio}>
    <header><span className={styles.eyebrow}>COCO AUTHORING · STEP 1 OF 2</span><h1>Flyer → CSS</h1><p>Recreate. Render. Compare. Approve the CSS before moving to the compiler.</p></header>
    <section className={styles.inputs} aria-label="Source files">
      <label>1. Finished flyer<input disabled={busy} type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{setReference(e.target.files?.[0]||null);setApproved(false);}}/></label>
      <label>2. Background / cutouts (up to 6)<input disabled={busy} type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={e=>{setAssets(Array.from(e.target.files||[]));setApproved(false);}}/><small>{assets.map(f=>f.name).join(', ')||'Reference is never used as a flattened background.'}</small></label>
      <label className={styles.full}>3. Instructions / font choices<textarea disabled={busy} value={instructions} onChange={e=>{setInstructions(e.target.value);setApproved(false);}} placeholder="Use Georgia Brush for Vibes. Asset 0 is the background. Preserve all visible wording."/></label>
      <div className={styles.full}><button disabled={!reference||busy||assets.length>6} onClick={()=>generate()}>{busy?'Measuring, rendering & repairing…':'Generate CSS draft'}</button><small> Measures reference text (on-device OCR where available), fits recognized supporting text, then renders and compares full images and same-scale detail crops. Up to nine AI calls plus connection retries; several minutes. Sends images, instructions and renders to OpenAI. Keeps the reference aspect ratio and reports unresolved issues. Manual approval remains required.</small></div>
    </section>
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    {currentReview&&!currentReview.passed&&<p role="alert" className={styles.error}>This generation failed visual review. The image below is an unfinished draft, not a verified match. {currentReview.checks.filter(check=>!check.pass).map(check=>check.category).join(', ')} still need repair.</p>}
    <section className={styles.comparison} aria-label="Visual comparison">
      <article><h2>Original reference</h2>{referenceUrl?<img className={styles.reference} src={referenceUrl} alt="Original flyer for comparison"/>:<div className={styles.empty}>Drop or select your finished flyer above.</div>}</article>
      <article><h2>CSS render <span>{source!==rendered?'Edits not rendered':'Draft — review required'}</span></h2><div ref={panel}>{rendered?<div style={{height:size.height*scale,overflow:'hidden',position:'relative'}}><iframe title="Isolated CSS preview" sandbox="" referrerPolicy="no-referrer" srcDoc={preview} style={{border:0,width:size.width,height:size.height,transform:`scale(${scale})`,transformOrigin:'top left'}}/></div>:<div className={styles.empty}>Your editable CSS preview will appear here.</div>}</div></article>
    </section>
    <section><h2>HTML + CSS source</h2><p>Paste an existing master or edit the generated draft. Preview is scriptless; images must be embedded. Local fonts load from this app.</p>
      <div className={styles.toolbar}><label>Width <input aria-label="Canvas width" type="number" min="100" max="4096" value={size.width} onChange={e=>{setSize({...size,width:Math.max(100,Math.min(4096,Number(e.target.value)||100))});setApproved(false);}}/></label><label>Height <input aria-label="Canvas height" type="number" min="100" max="4096" value={size.height} onChange={e=>{setSize({...size,height:Math.max(100,Math.min(4096,Number(e.target.value)||100))});setApproved(false);}}/></label><button disabled={!source||busy} onClick={()=>{setRendered(source);setApproved(false);}}>Render edits</button></div>
      <div className={styles.toolbar}><button disabled={!reference||!source||busy||assets.length>6||warnings.length>0} onClick={()=>generate('composition')}>Compare &amp; improve composition</button><button disabled={!reference||!source||busy||assets.length>6} onClick={()=>generate('typography')}>Refine typography</button><button disabled={!previousSource||busy} onClick={()=>{setSource(previousSource);setRendered(previousSource);setPreviousSource(source);setApproved(false);setChanges([]);setUnresolved([]);setNotes('Previous source restored. Review before approving.');}}>Restore previous source</button></div>
      <p>Compare &amp; improve renders your current source and sends that screenshot with the reference to identify missing lines, frames, shapes, text clipping and hierarchy problems. The goal is close enough and readable—not pixel-perfect. Review the proposed result; approval remains manual.</p>
      <p>Typography refinement targets regular/bold weights, text size and proportions, and reference gradients. It requests unchanged positions and imagery; compare the result before approving.</p>
      <textarea aria-label="HTML and CSS source" className={styles.code} spellCheck={false} value={source} disabled={busy} onChange={e=>edit(e.target.value)}/>
      {notes&&<aside><h3>Generation notes</h3><p>{notes}</p></aside>}
      {currentReview&&measurements.length>0&&<aside><h3>Per-object browser checks</h3><p>These checks cover visibility, copy, and canvas clipping—not similarity to the original. Placement, scale, typography, and decoration are assessed in the separate visual review.</p><ul>{measurements.map((block,index)=><li key={index}>{block.id}: {block.pass?'Basic browser checks passed':block.problem}{block.fontSize?` · ${block.fontSize.toFixed(1)}px`:''}</li>)}</ul></aside>}
      {currentReview&&<aside><h3>{currentReview.passed?'AI visual checks passed — confirm below':'Visual review: needs attention'}</h3><p>{currentReview.history.length} renders reviewed. Showing iteration {currentReview.selectedIteration}. Reviewer: {currentReview.model}.</p><ul>{currentReview.checks.map(check=><li key={check.category}><strong>{check.pass?'Pass':'Needs repair'} · {check.category}</strong>: {check.evidence}{!check.pass&&` Suggested repair: ${check.repair}`}</li>)}</ul><details><summary>Review history</summary>{currentReview.history.map(entry=><p key={entry.iteration}>Iteration {entry.iteration}: {entry.checks.filter(check=>check.pass).length}/6 checks passed.</p>)}</details></aside>}
      {changes.length>0&&<aside><h3>Proposed repairs — verify in preview</h3><ul>{changes.map((item,index)=><li key={index}>{item}</li>)}</ul></aside>}
      {unresolved.length>0&&<aside><h3>Remaining compromises</h3><ul>{unresolved.map((item,index)=><li key={index}>{item}</li>)}</ul></aside>}
      {source&&warnings.length>0&&<aside className={styles.error}><h3>Resolve before approval</h3><ul>{warnings.map(w=><li key={w}>{w}</li>)}</ul></aside>}
      <label className={styles.approval}><input type="checkbox" checked={approved} disabled={!reference||!source||source!==rendered||warnings.length>0||busy} onChange={e=>setApproved(e.target.checked)}/> I compared text, fonts, crop, positioning, and assets against the original and approve this CSS.</label>
      <button disabled={!approved||busy} onClick={download}>Export approved HTML/CSS</button><p className={styles.muted}>No Coco recipe or .nflyer is created here. Generated drafts embed supplied images and used local font files. System fonts such as Didot may still require installation; check the notes. Keep this page open while reviewing—drafts are not auto-saved.</p>
    </section>
  </main>;
}
