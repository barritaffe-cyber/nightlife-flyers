'use client';
import React from 'react';
import CocoPresenterLogo from './CocoPresenterLogo';
import type { CocoRecipeFormCapabilities } from '../../lib/coco/formRecipeMapping';
import { cocoQrCode } from '../../lib/coco/qrCode';
import { cocoFormDisplayLabel, cocoFormFieldGuidance } from '../../lib/coco/formFieldGuidance';
import { cocoFieldLines, cocoInputValue, cocoPaintInputLine } from '../../lib/coco/formFieldLayout';
import { authoredFormText } from '../../lib/coco/authoredFormText';
import { COCO_EVENT_FIELD_GROUPS, COCO_FEATURE_LABELS, COCO_EXPERIENCE_FEATURES, COCO_SOCIAL_PLATFORMS, type CocoEventBriefInput, type CocoEventTextField } from '../../lib/coco/eventBriefFields';
export default function CocoEventBriefFields({ values, onChange, onArrayChange, disabled = false, prefix = 'coco-event', unplaced = [], needsMoreRoom = false, layoutError, capabilities, renderSizeControls, conversation = false, uploadLogo, onLogoBusyChange }: {
    uploadLogo?: (file:File)=>Promise<string|null>;
    onLogoBusyChange?: (busy:boolean)=>void;
    conversation?: boolean;
    values: CocoEventBriefInput;
    onChange: (field: CocoEventTextField, value: string) => void;
    onArrayChange: (field: 'experienceFeatures' | 'socialPlatforms', value: string[]) => void;
    disabled?: boolean;
    prefix?: string;
    unplaced?: string[];
    needsMoreRoom?: boolean;
    layoutError?: string;
    capabilities?: CocoRecipeFormCapabilities;
    renderSizeControls?: (field: string) => React.ReactNode;
}) {
    const id = React.useId();
    const allowed = (field: string) => !capabilities || capabilities.fields.includes(field);
    const socialField = capabilities?.fieldFormats.socialPlatforms?.length ? 'socialPlatforms' : 'socials';
    const arrayAllowed = (field: string) => field === 'socialPlatforms' ? Boolean(capabilities?.fieldFormats.socialPlatforms?.length) || allowed('socials') : allowed(field);
    const groups: { label: string; fields: (readonly [CocoEventTextField, string])[] }[] = capabilities
        ? [...new Set(Object.values(capabilities.bindings).map(binding => binding.group))].map(label => ({ label, fields: capabilities.fields.filter(key => capabilities.bindings[key].group === label).map(key => [key as CocoEventTextField, capabilities.bindings[key].label] as const) }))
        : COCO_EVENT_FIELD_GROUPS.map(group => ({ ...group, fields: [...group.fields] }));
    const scopeFor = (field: string) => {
        const targets = capabilities?.fieldFormats[field];
        return targets?.length === 1 ? targets[0] : 'shared';
    };
    const sections = (capabilities ? ['shared', 'story', 'square'] : ['shared']).map(scope => ({
        scope,
        label: scope === 'story' ? 'Story only' : scope === 'square' ? 'Square only' : 'Square + Story',
        groups: groups.map(group => ({ ...group, fields: group.fields.filter(([field]) => scopeFor(field) === scope) })).filter(group => group.fields.length),
    })).filter(section => section.groups.length);
    const qr = allowed('qrDestination') ? cocoQrCode(values) : null;
    return <div className="space-y-4" data-testid={`${prefix}-fields`}>
  {layoutError && <p role="alert" className="text-xs text-amber-200">{layoutError}</p>}
  {needsMoreRoom && <p role="status" className="text-xs leading-5 text-amber-200">Some text is very small in this design. Shorten the wording or give it more room in Fine Tune before exporting.</p>}
  {unplaced.length > 0 && <div role="status" className="border border-amber-200/25 bg-amber-200/10 p-3 text-xs leading-5 text-amber-100">Saved, but not shown in this layout: {unplaced.join(', ')}. Choose a different design or add these details in Fine Tune.</div>}
  {capabilities && !conversation && <p className="text-xs leading-5 text-white/60">Fill in the boxes you need. Coco keeps the design’s letters and colors. Capital or small letters are both fine. Leave a whole field blank to leave it off your flyer.</p>}
  {sections.map(section => <section key={section.scope} data-coco-field-scope={section.scope} className="space-y-3">
   {capabilities && !conversation && <div><h3 className="text-sm font-semibold text-cyan-200">{section.label}</h3>
    <p className="mt-1 text-xs text-white/50">{section.scope === 'shared' ? 'These details appear in both formats.' : `These details appear only on ${section.scope === 'story' ? 'Story' : 'Square'}.`}</p></div>}
   {section.groups.map((group, index) => <BriefGroup key={group.label} label={cocoFormDisplayLabel(group.label)} open={index === 0} conversation={conversation}>
   <div className={conversation ? "grid grid-cols-1 gap-4" : "mt-3 grid grid-cols-2 gap-3"}>{group.fields.map(([field, label]) => {
                const displayLabel = cocoFormDisplayLabel(label);
                const limit = capabilities?.limits[field];
                const guidance = cocoFormFieldGuidance(field, capabilities?.bindings[field], limit?.maxLines);
                const linePlan = cocoFieldLines(capabilities?.bindings[field], limit?.maxLines);
                const editableLines = linePlan.filter(line => !line.fixed);
                const structured = linePlan.length > 1 || linePlan.some(line => line.prefix || line.suffix);
                const currentLines = String(values[field] ?? '').split('\n');
                const helpId = `${id}-${field}-help`;
                const multiline = limit ? limit.maxLines > 1 : ['address', 'djs', 'hosts', 'performers', 'additionalActs', 'musicPolicy', 'eventDetails', 'additionalOffers', 'entryRestrictions'].includes(field);
                const common = { id: `${id}-${field}`, value: String(values[field] ?? ''), maxLength: limit?.maxLength, disabled, 'aria-label': displayLabel, 'aria-describedby': helpId, 'data-testid': `${prefix}-${field}`, 'data-coco-field-formats': capabilities?.fieldFormats[field]?.join(' '), 'data-coco-target-objects': JSON.stringify(capabilities?.bindings[field]?.targets), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { if (!limit || e.target.value.split('\n').length <= limit.maxLines) onChange(field, e.target.value); }, className: 'w-full min-w-0 rounded border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-cyan-200/60' };
                return <div key={field} className={`min-w-0 ${!conversation && (structured || multiline || ['subtitle', 'venueName', 'address', 'ticketLink', 'qrDestination'].includes(field)) ? 'col-span-2' : ''}`}>
     <span className="mb-1 block text-xs text-white/65">{displayLabel}{conversation && scopeFor(field) !== "shared" ? ` · ${scopeFor(field) === "story" ? "Story" : "Square"} only` : ""}</span>
     <span id={helpId} className="mb-2 block text-xs leading-5 text-white/55">{guidance}</span>
     {structured ? <div className="space-y-2" data-testid={`${prefix}-${field}-lines`}>
       {editableLines.length > 1 && <p className="text-xs text-cyan-100">This design uses {editableLines.length} lines. Fill in one box for each line.</p>}
       {linePlan.some(line => line.fixed) && <p className="text-xs text-white/60">Coco adds: {linePlan.filter(line => line.fixed).map(line => line.reference).join(' · ')}</p>}
       {linePlan.map((line, index) => line.fixed ? null : <label key={index} className="block text-xs text-white/65">
         {editableLines.length > 1 && `Line ${linePlan.slice(0, index + 1).filter(item => !item.fixed).length}`}
         <span className="mt-1 flex items-center gap-2">
           {line.prefix && <span className="shrink-0 text-cyan-200">{line.prefix}</span>}
           <input {...common} id={`${common.id}-line-${index}`} aria-label={editableLines.length > 1 ? `${displayLabel} — line ${linePlan.slice(0, index + 1).filter(item => !item.fixed).length}` : displayLabel}
             data-testid={`${prefix}-${field}-line-${index + 1}`} value={cocoInputValue(line, currentLines[index] ?? '', true)}
             placeholder={label === 'Dress code' ? 'e.g. casual or white + neon' : (line.prefix || line.suffix) && /\d/.test(line.reference) ? 'Enter number' : `Write line ${index + 1}`}
             maxLength={Math.max(0, (limit?.maxLength ?? 160) - String(values[field] ?? '').length + (currentLines[index]?.length ?? 0) - line.prefix.length - line.suffix.length)}
             onChange={event => {
               const next = linePlan.map((item, i) => item.fixed ? item.reference : cocoPaintInputLine(item, i === index ? event.target.value : currentLines[i] ?? '', true));
               const value = next.some((part, i) => !linePlan[i].fixed && part.trim()) ? next.join('\n') : '';
               if (!limit || value.length <= limit.maxLength) onChange(field, value);
             }}/>
           {line.suffix && <span className="shrink-0 text-cyan-200">{line.suffix}</span>}
         </span>
       </label>)}
     </div> : multiline ? <textarea {...common} placeholder="Type here" rows={2}/> : <input {...common} placeholder={field === 'date' ? 'Month / day / year' : 'Type here'}/>}
     {!conversation && structured && values[field] && <p className="mt-2 whitespace-pre-line rounded bg-white/5 p-2 text-xs text-white/75" data-testid={`${prefix}-${field}-preview`}>On your flyer:{'\n'}{authoredFormText(linePlan.map(line => line.reference).join('\n'), String(values[field]))}</p>}
     {limit && <span className="mt-1 block text-[10px] text-white/45">{String(values[field] ?? '').length}/{limit.maxLength} characters{structured && editableLines.length > 1 ? ` · ${editableLines.length} lines` : ''}</span>}
     {renderSizeControls?.(field)}
     {field==='presenterName'&&uploadLogo&&<CocoPresenterLogo value={values.presenterLogo} onChange={value=>onChange('presenterLogo',value)} upload={uploadLogo} disabled={disabled} onBusyChange={onLogoBusyChange}/>}
    </div>;
            })}</div>
  </BriefGroup>)}
  </section>)}
  {([['experienceFeatures', 'Experience features', COCO_EXPERIENCE_FEATURES], ['socialPlatforms', 'Social icons', COCO_SOCIAL_PLATFORMS]] as const).filter(([field]) => arrayAllowed(field)).map(([field, label, choices]) => <fieldset key={field} tabIndex={-1} data-testid={`${prefix}-${field}`} disabled={disabled} className="space-y-2"><legend className="text-xs text-white/65">{cocoFormDisplayLabel(label)}{capabilities && <span className="ml-2 text-cyan-200">{scopeFor(field === 'socialPlatforms' ? socialField : field) === 'shared' ? 'Square + Story' : scopeFor(field === 'socialPlatforms' ? socialField : field) === 'story' ? 'Story only' : 'Square only'}</span>}</legend><div className="flex flex-wrap gap-2">{choices.map(choice => {
                const selected = values[field]?.includes(choice) ?? false;
                return <button key={choice} type="button" aria-pressed={selected} onClick={() => onArrayChange(field, selected ? (values[field] ?? []).filter(v => v !== choice) : [...(values[field] ?? []), choice])} className={`rounded px-2 py-1 text-xs ${selected ? 'bg-cyan-200 text-black' : 'bg-white/10 text-white'}`}>{field === 'experienceFeatures' ? COCO_FEATURE_LABELS[choice] : choice.replaceAll('-', ' ')}</button>;
            })}</div></fieldset>)}
  {values.experienceFeatures?.length ? <p className="text-xs leading-5 text-white/60" data-testid={`${prefix}-feature-preview`}>On your flyer: {values.experienceFeatures.map(f => COCO_FEATURE_LABELS[f] ?? f).join(' • ')}</p> : null}
  {qr && ('error' in qr ? <p role="alert" className="text-xs text-amber-200">{qr.error}</p> : <div className="flex items-center gap-3 rounded border border-white/10 p-3" data-testid={`${prefix}-qr-preview`}>
    {/* Local SVG with an opaque white quiet zone. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={qr.url} width={80} height={80} alt="QR code preview"/>
    <p className="min-w-0 break-all text-xs leading-5 text-white/70">{values.qrLabel || 'Scan for details'}<br/>{qr.destination}</p>
  </div>)}
 </div>;
}

function BriefGroup({ conversation, label, open, children }: { conversation: boolean; label: string; open: boolean; children: React.ReactNode }) {
  return conversation ? <div>{children}</div> : <details open={open} className="rounded border border-white/10 p-3"><summary className="cursor-pointer text-sm font-semibold text-white">{label}</summary>{children}</details>;
}
