'use client';
import { useEffect, useRef } from 'react';
import type { CocoGuideSection, CocoFinishIssue } from '../../lib/coco/guidedQuickEdit';
const button = 'min-h-10 rounded-lg border border-white/15 px-3 py-2 text-xs text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:opacity-40';
export function CocoGuide({ section, format, scope, onScope, onSelect, onAdjust, onReset, onUndo, canUndo, canReset, hasHeadline, hasDetails, hasSocials, disabled, message }: {
  section: CocoGuideSection; format: string; scope: 'current' | 'both'; onScope: (v: 'current' | 'both') => void;
  onSelect: (v: CocoGuideSection) => void; onAdjust: () => void; onReset: () => void; onUndo: () => void;
  canUndo: boolean; canReset: boolean; hasHeadline: boolean; hasDetails: boolean; hasSocials: boolean; disabled: boolean; message: string;
}) {
  const labels: Record<CocoGuideSection, string> = { headline: 'Headline', details: 'Event details', socials: 'Social icons', photos: 'Photos', finish: 'Finish & download' };
  return <div className="space-y-3 rounded-xl border border-cyan-200/25 bg-cyan-200/5 p-3" data-testid="coco-guide">
    <p className="text-sm font-semibold">What would you like to adjust?</p>
    <div className="flex flex-wrap gap-2">{(Object.keys(labels) as CocoGuideSection[]).filter(key => key !== 'socials' || hasSocials).map(key => <button key={key} type="button" className={`${button} ${section === key ? 'border-cyan-200/70 bg-cyan-200/15 text-cyan-100' : ''}`} disabled={disabled} aria-pressed={section === key} onClick={() => onSelect(key)} data-testid={`coco-guide-${key}`}>{labels[key]}</button>)}</div>
    <p className="text-xs leading-5 text-cyan-100" role="status">{message || ({headline:'Select a headline on your flyer, or edit its wording and size below.', details:'Edit your event details below. Coco updates the preview as you go.', socials:'Choose the platforms you want on your flyer.', photos:'Change the scene or replace an available portrait.', finish:'Let’s check your flyer before downloading.'}[section])}</p>
    <label className="block text-xs text-white/70">Apply size and color changes to
      <select aria-label="Apply adjustments to" data-testid="coco-guide-scope" value={scope} onChange={e => onScope(e.target.value as 'current' | 'both')} disabled={disabled} className="mt-1 min-h-10 w-full rounded border border-white/20 bg-neutral-900 px-2 text-white">
        <option value="current">{format === 'square' ? 'Square' : 'Story'} only</option><option value="both">Square + Story</option>
      </select>
    </label>
    {(section === 'headline' || section === 'details') && <div className="flex flex-wrap gap-2">
      <button type="button" className={button} disabled={disabled || (section === 'headline' ? !hasHeadline : !hasDetails)} onClick={onAdjust} data-testid="coco-guide-adjust">{section === 'headline' ? 'Make headline bigger' : 'Make details easier to read'}</button>
      <button type="button" className={button} disabled={disabled || !canReset} onClick={onReset} data-testid="coco-guide-reset">Reset this section’s adjustments</button>
    </div>}
    {canUndo && <button type="button" className={button} disabled={disabled} onClick={onUndo} data-testid="coco-guide-undo">Undo last adjustment</button>}
  </div>;
}
export function CocoFinishReview({ issues, accepted, onAccept, onFix, onClose, onContinue }: {
  issues: CocoFinishIssue[]; accepted: string[]; onAccept: (id: string) => void; onFix: (issue: CocoFinishIssue) => void; onClose: () => void; onContinue: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => previous?.focus();
  }, []);
  return <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/80 p-4" onKeyDown={e => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    if (e.key === 'Tab') {
      const buttons = [...(dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
      const first = buttons[0], last = buttons.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  }}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-label="Check your flyer" data-testid="coco-finish-review" className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/20 bg-neutral-950 p-5 text-white">
      <h2 className="text-lg font-semibold">A quick check before download</h2><p className="mt-2 text-sm text-white/65">Fix these details, or tell Coco to keep them as they are.</p>
      <div className="my-4 space-y-3">{issues.map(issue => <div key={issue.id} className="rounded border border-white/15 p-3">
        <p className="text-sm"><strong>{issue.format === 'square' ? 'Square' : 'Story'}:</strong> {issue.message}</p>
        <div className="mt-2 flex gap-2"><button type="button" className={button} onClick={() => onFix(issue)}>Fix it</button><button type="button" className={button} aria-pressed={accepted.includes(issue.id)} onClick={() => onAccept(issue.id)}>{accepted.includes(issue.id) ? '✓ ' : ''}{issue.kind === 'date' ? 'Leave blank' : 'Keep as is'}</button></div>
      </div>)}</div>
      <div className="flex flex-wrap justify-end gap-2"><button type="button" autoFocus className={button} onClick={onClose}>Back to Quick Edit</button><button type="button" className={button} disabled={issues.some(i => !accepted.includes(i.id))} onClick={onContinue}>Download Square + Story</button></div>
    </section>
  </div>;
}
