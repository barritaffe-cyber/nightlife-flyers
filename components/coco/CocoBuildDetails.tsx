'use client';
import { useDeferredValue, useEffect, useRef, useState, type ReactNode } from 'react';
import CocoEventBriefFields from './CocoEventBriefFields';
import CocoBusinessSetup from './CocoBusinessSetup';
import {applyBusiness, saveBusinessProfile, updateBusinessFromFlyer, type BusinessProfile} from '../../lib/coco/businessProfiles';
import CocoOrb from './CocoOrb';
import type { CocoEventBriefInput } from '../../lib/coco/eventBriefFields';
import { cocoBriefForCapabilities, type CocoRecipeFormCapabilities } from '../../lib/coco/formRecipeMapping';
import { cocoQuestions, cocoQuestionCapabilities, cocoQuestionError } from '../../lib/coco/conversation';

export default function CocoBuildDetails({ eventName, initialBrief, capabilities, renderPreview, onBack, onComplete, uploadLogo, owner = '', canRemember = false }: {
  owner?: string; canRemember?: boolean;
  uploadLogo?: (file:File)=>Promise<string|null>;
  eventName: string; initialBrief: CocoEventBriefInput; capabilities: CocoRecipeFormCapabilities;
  renderPreview: (brief: CocoEventBriefInput, format: 'square' | 'story') => ReactNode;
  onBack: (brief: CocoEventBriefInput) => void; onComplete: (brief: CocoEventBriefInput) => Promise<void>;
}) {
  const [remember,setRemember] = useState(false);
  const [businessStep,setBusinessStep] = useState(true);
  const [business,setBusiness] = useState<BusinessProfile|null>(null);
  const [savedBusiness,setSavedBusiness] = useState(false);
  const [brief, setBrief] = useState(() => cocoBriefForCapabilities(initialBrief, capabilities));
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [logoBusy,setLogoBusy]=useState(false);
  const [index, setIndex] = useState(0), [previewFormat, setPreviewFormat] = useState<'square' | 'story'>('square');
  const questions = cocoQuestions(capabilities), question = questions[index];
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { root.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true }); }, [index,businessStep]);
  const deferredBrief = useDeferredValue(brief);
  const update = (field: string, value: string | string[]) => { setBrief(current => ({ ...current, [field]: value })); setError(''); };
  const advance = async (skip = false) => {
    if (busy || logoBusy) return;
    const nextBrief = skip && question ? { ...brief, ...Object.fromEntries(question.fields.map(f => [f, f === 'socialPlatforms' ? [] : ''])) } : brief;
    const issue = cocoQuestionError(nextBrief, capabilities, question?.fields ?? []);
    if (issue) { setError(issue); return; }
    setBrief(nextBrief); setError('');
    if (index < questions.length - 1) { setIndex(index + 1); return; }
    for (const [i, item] of questions.entries()) {
      const issue = cocoQuestionError(nextBrief, capabilities, item.fields);
      if (issue) { setIndex(i); setError(issue); return; }
    }
    setBusy(true);
    try { if(remember && business && savedBusiness && canRemember) saveBusinessProfile(owner,updateBusinessFromFlyer(business,nextBrief,capabilities.fields)); await onComplete(cocoBriefForCapabilities(nextBrief, capabilities)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'I couldn’t finish this design. Please try again.'); }
    finally { setBusy(false); }
  };
  return <div ref={root} className="coco-conversation fixed inset-0 z-[1110] flex flex-col" role="dialog" aria-modal="true" aria-labelledby={businessStep?'coco-business-title':'coco-build-details-title'} data-testid="coco-build-details" onKeyDown={e => {
    if (e.key !== 'Tab') return;
    const nodes = [...(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary') ?? [])].filter(node => node.getClientRects().length);
    if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes.at(-1)?.focus(); }
    else if (!e.shiftKey && document.activeElement === nodes.at(-1)) { e.preventDefault(); nodes[0]?.focus(); }
  }}>
    <header className="flex shrink-0 items-center justify-between px-5 py-4 md:px-10"><span className="text-[10px] uppercase tracking-[.3em] text-white/40">Creating with Coco</span>
      {!businessStep && <select aria-label="Review answers" value="" disabled={busy||logoBusy} onChange={e => { setIndex(Number(e.target.value)); setError(''); }} className="max-w-[120px] bg-transparent text-xs text-white/55"><option value="" disabled>Review answers</option>{questions.map((q, i) => <option className="bg-neutral-950" key={q.id} value={i}>{capabilities.bindings[q.id]?.label ?? 'Social icons'}</option>)}</select>}
    </header>
    <div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 grid-rows-[minmax(130px,30vh)_1fr] gap-3 px-5 pb-5 md:grid-cols-2 md:grid-rows-1 md:gap-16 md:px-10 md:pb-10">
      <section aria-label="Live flyer preview" className="order-1 flex min-h-0 flex-col items-center justify-center md:order-2">
        <div className="relative min-h-0 shadow-[0_24px_100px_#0008]" style={{ height: '100%', maxHeight: previewFormat === 'square' ? 'min(64vh, 500px)' : '70vh', aspectRatio: previewFormat === 'square' ? '1' : '9 / 16', maxWidth: '100%' }}>
          {renderPreview(deferredBrief, previewFormat)}
        </div>
        <div className="mt-3 flex shrink-0 gap-5" aria-label="Preview format">{(['square', 'story'] as const).map(f => <button type="button" key={f} disabled={busy||logoBusy} aria-pressed={previewFormat === f} onClick={() => setPreviewFormat(f)} className={`text-[11px] tracking-wider ${previewFormat === f ? 'text-cyan-100' : 'text-white/35'}`}>{f === 'square' ? 'Square' : 'Story'}</button>)}</div>
      </section>
      <section className="order-2 flex min-h-0 flex-col justify-center md:order-1">
        <div className="min-h-0 overflow-y-auto py-3">
          {businessStep ? <CocoBusinessSetup cancelLabel={business?'Back to flyer':undefined} initialProfile={business} owner={owner} canRemember={canRemember && Boolean(owner)} uploadLogo={uploadLogo}
            onCancel={()=>{setBusinessStep(false);setError('');}}
            onContinue={(profile,saved)=>{setBrief(current=>cocoBriefForCapabilities(applyBusiness(current,profile,business),capabilities));setBusiness(profile);setSavedBusiness(saved);setRemember(false);setBusinessStep(false);setError('');}}/> : <>
          <button type="button" disabled={busy||logoBusy} onClick={()=>setBusinessStep(true)} className="mb-4 text-xs text-cyan-100">{business?`Your Business · ${business.name}`:'Your Business · Add details'}</button>
          <CocoOrb busy={busy}/>
          <form key={question?.id ?? 'done'} className="coco-question-enter mx-auto max-w-md" onSubmit={e => { e.preventDefault(); void advance(); }}>
            <p className="mb-3 text-center text-[10px] uppercase tracking-[.24em] text-white/35">{Math.min(index + 1, questions.length)} / {questions.length} · {eventName}</p>
            <h2 id="coco-build-details-title" tabIndex={-1} className="mb-5 text-center text-lg font-normal tracking-tight md:text-[22px]">{busy ? 'Putting it all together…' : question?.prompt ?? 'Ready to bring this to life?'}</h2>
            {question && <div className="coco-answer"><CocoEventBriefFields conversation prefix="coco-build-brief" values={brief} capabilities={cocoQuestionCapabilities(capabilities, question.fields)} onChange={update} onArrayChange={update} disabled={busy||logoBusy} uploadLogo={uploadLogo} onLogoBusyChange={setLogoBusy}/></div>}
            {canRemember && savedBusiness && business && index === questions.length - 1 && <label className="mt-4 flex gap-2 text-xs text-white/50"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/>Also update Your Business with these details</label>}
            {error && <p role="alert" className="mt-3 text-sm text-amber-100">{error}</p>}
            <div className="mt-7 flex items-center justify-center gap-2 sm:gap-4"><button type="button" disabled={busy||logoBusy} onClick={() => { if (index) { setIndex(index - 1); setError(''); } else onBack(cocoBriefForCapabilities(brief, capabilities)); }} className="min-h-11 px-3 text-sm text-white/55 hover:text-white">← Back</button><button type="button" disabled={busy||logoBusy} onClick={() => void advance(true)} className="min-h-11 px-3 text-sm text-white/45">Skip</button><button type="submit" disabled={busy||logoBusy} data-testid={index >= questions.length - 1 ? 'coco-build-finish' : 'coco-question-next'} className="coco-response coco-response-primary">{busy ? 'Creating…' : index >= questions.length - 1 ? 'Create my flyer' : 'Continue →'}</button></div>
          </form></>}
        </div>
      </section>
    </div>
  </div>;
}
