'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import CocoOrb from './CocoOrb';
import CocoPaletteMaterialControls from './CocoPaletteMaterialControls';
import type { PaletteBlend } from '../../lib/coco/paletteBindings';
import { cocoQuestions, COCO_CONVERSATION_GRADES, cocoQuestionError } from '../../lib/coco/conversation';
import { COCO_TEXT_PALETTES } from '../../lib/coco/conversationPalette';
import type { CocoEventBriefInput } from '../../lib/coco/eventBriefFields';
import type { CocoRecipeFormCapabilities } from '../../lib/coco/formRecipeMapping';

type Phase = 'review' | 'questions' | 'headline' | 'photos' | 'palette' | 'ready' | 'grade';
export default function CocoConversation({ capabilities, brief, eventName, format, preview, renderAnswer, renderHeadline, request, busy, onFormat, onScene, onPortrait, canChangeImages = true, canPortrait, replacing, onExport, onSave, canSave = true, onEditor, scope, onScope, onEnlarge, onUndo, canUndo, grade, onGrade, renderGradePreview, palette, onPalette, paletteMaterial, onPaletteMaterialChange, onResetPalette, paletteError }: {
  capabilities: CocoRecipeFormCapabilities; brief: CocoEventBriefInput; eventName: string; format: 'square' | 'story';
  preview: ReactNode; renderAnswer: (fields: string[]) => ReactNode; renderHeadline: () => ReactNode;
  request: { field: string; serial: number } | null; busy: boolean; onFormat: (f: 'square' | 'story') => void;
  onScene: () => void; onPortrait: () => void; canChangeImages?: boolean; canPortrait: boolean; replacing: boolean;
  canSave?: boolean;
  onExport: () => void; onSave: () => void; onEditor: () => void;
  scope: 'current' | 'both'; onScope: (s: 'current' | 'both') => void; onEnlarge: (section: 'headline' | 'details') => void; onUndo: () => void; canUndo: boolean;
  grade: string; onGrade: (id: string) => void; renderGradePreview: (id: string) => ReactNode;
  palette?: string; onPalette: (id: string) => void;
  paletteMaterial?: {mode:PaletteBlend;strength:number}; onPaletteMaterialChange:(patch:{mode?:PaletteBlend;strength?:number})=>void;
  onResetPalette:()=>void; paletteError?:string;
}) {
  const [phase, setPhase] = useState<Phase>('review'), [index, setIndex] = useState(0), [error, setError] = useState('');
  const handledRequest = useRef<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const questions = cocoQuestions(capabilities), question = questions[index];
  useEffect(() => {
    if (!request || handledRequest.current === request.serial) return;
    handledRequest.current = request.serial;
    if (request.field === 'eventName') setPhase('headline');
    else if (request.field === 'photos') setPhase(canChangeImages ? 'photos' : 'review');
    else if (request.field === 'finish') setPhase('ready');
    else { const i = cocoQuestions(capabilities).findIndex(q => q.fields.includes(request.field)); if (i >= 0) { setIndex(i); setPhase('questions'); } }
    setError('');
  }, [request, capabilities, canChangeImages]);
  useEffect(() => { root.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }); }, [phase, index]);
  const move = (next: Phase) => { setError(''); setPhase(next); };
  const title = phase === 'review' ? 'Anything you’d like to adjust?' : phase === 'headline' ? 'Let’s make your headline feel right.' : phase === 'photos' ? 'Which image would you like to change?' : phase === 'palette' ? 'Find your colors.' : phase === 'ready' ? 'Ready to export?' : phase === 'grade' ? 'One last touch. Choose your finish.' : question?.prompt ?? 'Anything else?';
  const valid = () => { const issue = cocoQuestionError(brief, capabilities, phase === 'questions' ? question?.fields ?? [] : []); setError(issue ?? ''); return !issue; };
  return <div ref={root} role="dialog" aria-modal="true" onKeyDown={e => {
    if(e.key !== "Tab") return;
    const nodes = [...(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary') ?? [])].filter(node => node.getClientRects().length);
    if(e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes.at(-1)?.focus(); }
    else if(!e.shiftKey && document.activeElement === nodes.at(-1)) { e.preventDefault(); nodes[0]?.focus(); }
  }} className="coco-conversation fixed inset-0 z-[1000] flex flex-col" data-testid="coco-conversation" aria-label="Create with Coco">
    <header className="flex shrink-0 items-center justify-between px-5 py-4 md:px-10">
      {canSave && <button type="button" onClick={onSave} disabled={busy} className="text-xs text-white/45 hover:text-white">Save project</button>}
      <span className="min-w-0 flex-1 truncate px-3 text-center text-[10px] uppercase tracking-[.3em] text-white/35">Coco · {eventName}</span>
      <span aria-hidden="true" className="w-[68px]"/>
    </header>
    <div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 grid-rows-[minmax(140px,32vh)_1fr] gap-3 px-5 pb-5 md:grid-cols-2 md:grid-rows-1 md:gap-16 md:px-10 md:pb-10">
      <section className="order-1 flex min-h-0 flex-col items-center justify-center md:order-2" aria-label="Your live flyer">
        <div className="min-h-0 max-w-full shadow-[0_24px_100px_#0009]" style={{ height: '100%', maxHeight: format === 'square' ? 'min(65vh, 520px)' : '74vh', aspectRatio: format === 'square' ? '1' : '9 / 16' }}>{preview}</div>
        <div className="mt-3 flex shrink-0 gap-5" aria-label="Flyer format">{(['square','story'] as const).map(f => <button key={f} type="button" disabled={busy} aria-pressed={format === f} onClick={() => onFormat(f)} data-testid={`coco-conversation-format-${f}`} className={`text-[11px] tracking-wider ${format === f ? 'text-cyan-100' : 'text-white/35'}`}>{f === 'square' ? 'Square' : 'Story'}</button>)}</div>
      </section>
      <section className="order-2 flex min-h-0 flex-col justify-center md:order-1">
        <div className="min-h-0 overflow-y-auto py-3">
          <CocoOrb busy={busy || replacing}/>
          <div className="coco-question-enter mx-auto max-w-sm" key={`${phase}:${phase === 'questions' ? question?.id : ''}`}>
            <h1 className="mb-2 text-center text-lg font-normal tracking-tight md:text-[22px]" tabIndex={-1}>{title}</h1>
            {phase === 'review' && <><p className="mb-5 text-center text-xs leading-5 text-white/45">A final touch, or you’re ready to go.</p><div className="mx-auto grid max-w-[300px] grid-cols-2 gap-2">
              <button type="button" className="coco-response" onClick={() => move('headline')}>The headline</button>
              {!!questions.length && <button type="button" className="coco-response" onClick={() => move('questions')}>Event details</button>}
              {canChangeImages && <button type="button" className="coco-response" onClick={() => move('photos')}>The photos</button>}
              <button type="button" className="coco-response" onClick={() => move('palette')}>Color palette</button>
            </div><div className="mt-4 flex flex-col items-center gap-1">
              <button type="button" onClick={onEditor} disabled={busy} data-testid="coco-conversation-open-editor" className="min-h-10 px-4 text-xs text-white/55 hover:text-white">Open editor ↗</button>
              <button type="button" className="coco-response coco-response-primary min-w-36" onClick={() => move('ready')}>Looks good →</button>
            </div></>}
            {phase === 'palette' && <>
              <p className="mb-5 text-center text-xs leading-5 text-white/45">Connected colors for your design. Image colors blend with the original lighting and texture.</p>
              <div className="grid grid-cols-2 gap-2">{COCO_TEXT_PALETTES.map(option => <button type="button" key={option.id} disabled={busy} aria-pressed={palette === option.id} data-testid={`coco-conversation-palette-${option.id}`} onClick={() => onPalette(option.id)} className="coco-response flex items-center justify-between gap-3">
                <span>{option.label}</span><span className="flex -space-x-1" aria-hidden="true">{[option.background, option.backgroundSecondary, option.headline, option.accent, option.details].map((color, i) => <span key={i} className="h-4 w-4 rounded-full ring-1 ring-black/20" style={{ backgroundColor: color }}/>)}</span>
              </button>)}</div>
              {paletteMaterial && <><CocoPaletteMaterialControls {...paletteMaterial} busy={busy} onChange={onPaletteMaterialChange}/><button type="button" disabled={busy} onClick={onResetPalette} className="mt-3 text-xs text-white/55 hover:text-white">Original colors</button></>}
              {paletteError && <p role="alert" className="mt-3 text-xs text-amber-100">{paletteError}</p>}
              <div className="mt-5 text-center"><button type="button" className="coco-response coco-response-primary" onClick={() => move('review')}>Done</button></div>
            </>}
            {phase === 'questions' && question && <>
              <div className="mb-4 text-center"><select aria-label="Review answers" disabled={busy} value={index} onChange={e => { setIndex(Number(e.target.value)); setError(''); }} className="max-w-full bg-transparent text-xs text-white/45">{questions.map((q,i) => <option className="bg-neutral-950" key={q.id} value={i}>{capabilities.bindings[q.id]?.label ?? 'Social icons'}</option>)}</select></div>
              <div className="coco-answer">{renderAnswer(question.fields)}</div>
              <div className="mt-6 flex flex-wrap justify-center gap-3"><button type="button" className="coco-response" disabled={busy} onClick={() => { if (valid()) setIndex((index + 1) % questions.length); }}>Next detail →</button><button type="button" className="coco-response coco-response-primary" disabled={busy} onClick={() => { if (valid()) move('review'); }}>Done</button></div>
            </>}
            {phase === 'headline' && <><div className="coco-answer mt-6">{renderHeadline()}</div>
              <div className="mt-5 flex flex-wrap justify-center gap-3"><button type="button" disabled={busy} className="coco-response" onClick={() => onEnlarge('headline')}>A little bigger</button><button type="button" className="coco-response coco-response-primary" onClick={() => move('review')}>That’s it</button></div>
            </>}
            {(phase === 'headline' || phase === 'questions' || phase === 'palette') && <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-white/45"><label>{phase === 'palette' ? 'Apply to: ' : 'Size & color: '}<select aria-label="Apply adjustments to" value={scope} onChange={e => onScope(e.target.value as 'current'|'both')} className="bg-transparent text-cyan-100"><option className="bg-neutral-950" value="current">{format === 'square' ? 'Square' : 'Story'} only</option><option className="bg-neutral-950" value="both">Both formats</option></select></label>{canUndo && <button type="button" onClick={onUndo} disabled={busy} className="underline underline-offset-4">Undo adjustment</button>}</div>}
            {phase === 'photos' && canChangeImages && <><p className="mb-6 text-center text-sm text-white/45">I’ll keep the rest of your design in place.</p><div className="flex flex-wrap justify-center gap-3"><button type="button" disabled={busy || replacing} className="coco-response" onClick={onScene}>Change scene</button>{canPortrait && <button type="button" disabled={busy || replacing} className="coco-response" onClick={onPortrait}>Change portrait</button>}<button type="button" className="coco-response coco-response-primary" disabled={replacing} onClick={() => move('review')}>Done</button></div></>}
            {phase === 'ready' && <><p className="mb-7 text-center text-sm leading-6 text-white/45">Let’s choose the final color grade, then I’ll prepare Square and Story.</p><div className="flex flex-wrap justify-center gap-3"><button type="button" className="coco-response" onClick={() => move('review')}>One more change</button><button type="button" className="coco-response coco-response-primary" data-testid="coco-conversation-ready" onClick={() => move('grade')}>Yes, let’s finish →</button></div></>}
            {phase === 'grade' && <><p className="mb-6 text-center text-sm text-white/45">Try a look. Original keeps your design’s finish.</p><div className="grid grid-cols-4 gap-3">{COCO_CONVERSATION_GRADES.map(g => <button type="button" key={g.id} aria-pressed={grade === g.id} disabled={busy} data-testid={`coco-conversation-grade-${g.id}`} onClick={() => onGrade(g.id)} className={`overflow-hidden rounded-2xl border text-xs transition ${grade === g.id ? 'border-cyan-100 bg-cyan-200/10 text-cyan-100' : 'border-white/10 text-white/60'}`}><div className="pointer-events-none aspect-square overflow-hidden">{renderGradePreview(g.id)}</div><span className="block py-3">{g.label}</span></button>)}</div><p className="mt-3 text-center text-[11px] text-white/35">Applied to Square + Story</p><div className="mt-6 flex justify-center"><button type="button" className="coco-response coco-response-primary" disabled={busy} data-testid="coco-conversation-export" onClick={onExport}>Download Square + Story ↓</button></div></>}
            {error && <p role="alert" className="mt-3 text-center text-sm text-amber-100">{error}</p>}
            {phase !== 'review' && <div className="mt-6 text-center"><button type="button" disabled={busy} onClick={() => { if (valid()) move(phase === 'grade' ? 'ready' : 'review'); }} className="min-h-10 px-4 text-xs text-white/35">← Back</button></div>}
          </div>
        </div>
      </section>
    </div>
  </div>;
}
