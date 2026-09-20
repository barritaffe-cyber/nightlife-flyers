'use client';
import {useState} from 'react';
import CocoPresenterLogo from './CocoPresenterLogo';
import {BUSINESS_TYPES,readBusinessProfile,saveBusinessProfile,type BusinessKind,type BusinessProfile} from '../../lib/coco/businessProfiles';
import type {CocoEventBriefInput} from '../../lib/coco/eventBriefFields';
export default function CocoBusinessSetup({owner,canRemember,uploadLogo,onContinue,onCancel,initialProfile,manage = false,cancelLabel}: {
 manage?:boolean; cancelLabel?:string; initialProfile?:BusinessProfile|null; owner:string;canRemember:boolean;uploadLogo?:(file:File)=>Promise<string|null>;
 onContinue:(profile:BusinessProfile,saved:boolean)=>void;onCancel:()=>void;
}) {
 const [active]=useState(()=>canRemember?readBusinessProfile(owner):null);
 const [draft,setDraft]=useState<BusinessProfile>(()=>initialProfile??active??{id:'',kind:'venue',name:'',details:{}});
 const [editing,setEditing]=useState(!initialProfile&&!active),[save,setSave]=useState(canRemember),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const details=(field:string,value:string)=>setDraft(p=>({...p,details:{...p.details,[field]:value}}));
 const submit=()=>{
  if(busy)return;
  if(manage&&!editing){onCancel();return;}
  const profile={...draft,id:owner,name:draft.kind==='personal'&&!draft.name.trim()?'Personal events':draft.name.trim()};
  if(!profile.name){setError('Add your business or stage name.');return;}
  try{if(save&&canRemember)saveBusinessProfile(owner,profile);onContinue(profile,save&&canRemember);}catch(e){setError(e instanceof Error?e.message:'Your business could not be saved.');}
 };
 const field=(id:string,label:string,type='text')=><label key={id} className="block text-sm text-white/65">{label}<input aria-label={label} type={type} maxLength={250} value={String(draft.details[id as keyof CocoEventBriefInput]??'')} disabled={busy} onChange={e=>details(id,e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-3 text-white outline-none focus:border-cyan-200"/></label>;
 return <section className="mx-auto w-full max-w-lg space-y-6" data-testid="coco-business-setup">
  <div><p className="mb-3 text-[10px] uppercase tracking-[.3em] text-cyan-100/65">Your Business</p><h2 id="coco-business-title" tabIndex={-1} className="text-2xl font-normal">{editing?'Tell Coco about your business':`Your business. Ready for your next event.`}</h2><p className="mt-3 text-sm leading-6 text-white/55">Set up your business profile so Coco can remember your brand and make your next flyer faster.</p></div>
  {editing?<form id="coco-business-form" className="space-y-5" onSubmit={e=>{e.preventDefault();submit();}}>
   <fieldset disabled={busy}><legend className="mb-3 text-sm text-white/75">What best describes your business?</legend><div className="grid gap-2">{BUSINESS_TYPES.map(t=><label key={t.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${draft.kind===t.id?'border-cyan-200/60 bg-cyan-100/5 text-cyan-100':'border-white/10 text-white/65'}`}><input type="radio" name="business-kind" value={t.id} checked={draft.kind===t.id} onChange={()=>{setDraft(p=>({...p,kind:t.id as BusinessKind}));setError('');}}/>{t.label}</label>)}</div></fieldset>
   <label className="block text-sm text-white/65">{draft.kind==='artist'?'Stage name':draft.kind==='personal'?'Profile name (optional)':'Business name'}<input aria-label={draft.kind==='artist'?'Stage name':draft.kind==='personal'?'Profile name (optional)':'Business name'} maxLength={100} disabled={busy} value={draft.name} onChange={e=>{setDraft(p=>({...p,name:e.target.value}));setError('');}} className="mt-2 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-3 text-white outline-none focus:border-cyan-200"/></label>
   {uploadLogo&&<CocoPresenterLogo value={draft.details.presenterLogo} onChange={v=>details('presenterLogo',v)} upload={uploadLogo} onBusyChange={setBusy} description="Add your business logo. You can adjust its size or remove its background." uploadLabel="Upload business logo"/>}
   {draft.kind==='venue'&&field('address','Business address')}
   {field('socials','Instagram / social handle')}{field('website','Website')}{field(draft.kind==='artist'?'bookingContact':'rsvpContact',draft.kind==='artist'?'Booking contact':'Contact / reservations')}
  </form>:<div className="rounded-xl border border-white/10 p-5"><h3 className="text-xl">{draft.name}</h3><p className="mt-2 text-sm text-white/50">{BUSINESS_TYPES.find(t=>t.id===draft.kind)?.label}</p><p className="mt-3 whitespace-pre-line text-sm text-white/65">{[draft.details.address,draft.details.socials,draft.details.website].filter(Boolean).join('\n')}</p>{draft.details.presenterLogo&&<p className="mt-3 text-xs text-cyan-100">Logo saved</p>}<button type="button" onClick={()=>setEditing(true)} className="mt-4 text-sm text-cyan-100">Edit business details</button></div>}
   {canRemember&&!manage&&<label className="flex gap-3 text-sm text-white/65"><input type="checkbox" checked={save} onChange={e=>setSave(e.target.checked)} disabled={busy}/>Save to Your Business for next time</label>}
  {error&&<p role="alert" className="text-sm text-amber-100">{error}</p>}
  <div className="flex flex-wrap items-center gap-4"><button type="button" disabled={busy} onClick={onCancel} className="min-h-11 text-sm text-white/55">{cancelLabel??(manage?'Cancel':editing?'Skip for now':'Continue without a business')}</button><button type="button" disabled={busy} onClick={submit} className="coco-response coco-response-primary">{busy?'Preparing logo…':manage?(editing?'Save business':'Done'):save&&canRemember&&editing?'Save and continue':'Use these details'}</button></div>
  <p className="text-xs leading-5 text-white/40">{canRemember?'One business profile per email account, saved on this device. You can change these details for each flyer.':'Use these details for this flyer. Monthly subscribers can save business profiles for next time.'}</p>
 </section>;
}
