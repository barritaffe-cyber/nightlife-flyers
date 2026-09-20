'use client';
import {Check, ArrowUpRight} from 'lucide-react';
import {buildBillingCheckoutHref,getBillingCatalogItem,type BillingSelection} from '../../lib/billing/catalog';
const plans: {id:string; selection:BillingSelection; description:string; features:string[]; note:string}[] = [
 {id:'one-flyer',selection:{kind:'offer',offer:'one-flyer'},description:'I need a flyer.',features:['Flyers in Five with Coco','Full template library + cinematic headlines','Quick edits and logo upload','One flyer · Square + Story'],note:'Pay once. Seven days of corrections and repeat downloads after your first export.'},
 {id:'basic',selection:{kind:'plan',plan:'basic',billing:'monthly'},description:'I make flyers regularly.',features:['Everything in One Flyer','20 flyers each month · both sizes','Saved flyers + duplicate and reuse','Remember your logo and venue details','New designs added regularly'],note:'Quick editing with the background and subjects in your chosen template.'},
 {id:'full',selection:{kind:'plan',plan:'full',billing:'monthly'},description:'I want creative control.',features:['Everything in Coco · 20 flyers/month','Full Studio customization','Upload photos, subjects and backgrounds','Full asset library + multiple brands','Request designs for the shared library'],note:'Template requests help shape new designs; bespoke design work is not included.'},
];
export default function PricingPlans({embedded=false}:{embedded?:boolean}){
 if(embedded)return <div className="mx-auto w-full max-w-6xl px-6 pb-12 text-white">
  <div className="text-center"><p className="text-xs uppercase tracking-[.2em] text-cyan-100/60">Find your Coco</p><h2 className="mt-4 text-4xl tracking-tight">Your nights. Your way.</h2><p className="mt-4 text-sm text-white/55">The same great designs. Choose your creative freedom.</p></div>
  <div className="mt-9 grid gap-4 md:grid-cols-3">{(['basic','full','manager'] as const).map(id=>{
   const selection:BillingSelection={kind:'plan',plan:id==='manager'?'full':id,billing:'monthly'};
   const item=getBillingCatalogItem(selection);
   const name=id==='basic'?'Coco':id==='full'?'Coco Studio':'Coco Manager';
   return <section key={id} data-testid={`pricing-${id}`} className={`flex flex-col rounded-2xl border p-7 ${id==='full'?'border-cyan-100/40 bg-[#14202b]':'border-white/10 bg-[#10151d]'}`}>
    <div className="flex items-center justify-between gap-2"><h3 className="text-xl">{name}</h3>{id==='manager'&&<span className="rounded-full border border-white/20 px-2 py-1 text-[10px] text-white/65">Coming soon</span>}</div>
    <p className="mt-7"><span className="text-5xl tracking-tight">${id==='manager'?30:item.price}</span><span className="ml-2 text-xs text-white/50">/ month</span></p>
    <p className="mt-6 text-sm leading-6 text-white/80">{id==='basic'?'Flyers in Five + quick tweaks':id==='full'?'Flyers in Five + full creative control':'Manage multiple venues & brands'}</p>
    <p className="mb-8 mt-3 text-xs leading-6 text-white/50">{id==='manager'?'For the people behind more than one great night. Planned tier; not yet available.':'20 flyer projects each month. Square + Story included.'}</p>
    {id==='manager'?<span className="mt-auto flex min-h-12 items-center justify-center rounded-full border border-white/15 text-sm text-white/45">On the way</span>:<a href={buildBillingCheckoutHref(selection)} className="mt-auto flex min-h-12 items-center justify-center gap-2 rounded-full bg-cyan-100 text-sm text-slate-950">Choose {name}<ArrowUpRight size={15} aria-hidden/></a>}
   </section>;
  })}</div>
  <p data-testid="pricing-one-flyer" className="mt-6 text-center text-sm text-white/60">Just one event? <a className="text-cyan-100 underline underline-offset-4" href={buildBillingCheckoutHref({kind:'offer',offer:'one-flyer'})}>Get One Flyer for $5</a> · Both sizes included.</p>
  <p className="mt-4 text-center text-xs leading-6 text-white/45">Monthly allowances reset on your billing date. Saved flyers and business details stay on this device.</p>
 </div>;
 return <div className="mx-auto w-full max-w-6xl px-4 pb-12 text-white">
 <div className="mx-auto max-w-2xl text-center"><p className="text-xs uppercase tracking-[0.24em] text-cyan-100/65">Create with Coco</p>{embedded?<h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">One event or every weekend.</h2>:<h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Flyers in five minutes.</h1>}<p className="mt-4 text-base leading-7 text-white/65">{embedded?'The same templates. Choose how you create.':'One event or every weekend. The same great designs, your way.'}</p></div>
 <div className="mt-10 grid gap-5 lg:grid-cols-3">{plans.map(plan=>{const item=getBillingCatalogItem(plan.selection);const monthly=plan.selection.kind==='plan';return <section key={plan.id} data-testid={`pricing-${plan.id}`} className={`flex flex-col rounded-2xl border ${plan.id==='basic'?'border-cyan-100/35':'border-white/10'} bg-[#0d1119]/95 p-6`}>
 <h2 className="text-xl font-medium">{item.name}</h2><p className="mt-3 text-sm text-white/60">{plan.description}</p><p className="mt-6"><span className="text-5xl font-semibold tracking-tight">${item.price}</span><span className="ml-2 text-sm text-white/55">{monthly?'/ month':'once'}</span></p><p className="mt-2 text-xs text-white/45">{monthly?'Billed monthly':'No subscription'}</p>
 <ul className="my-7 space-y-4 text-sm leading-5 text-white/80">{plan.features.map(feature=><li key={feature} className="flex gap-3"><Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200"/><span>{feature}</span></li>)}</ul><p className="mb-6 text-xs leading-5 text-white/50">{plan.note}</p><a href={buildBillingCheckoutHref(plan.selection)} className="mt-auto flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-100 px-4 text-sm font-semibold text-slate-950 transition hover:bg-white">Choose {item.name}<ArrowUpRight aria-hidden className="h-4 w-4"/></a></section>})}</div>
 <p className="mt-7 text-center text-sm leading-6 text-white/55">Square + Story count as one flyer. Re-downloads and corrections to that project use no extra credit. Duplicate for your next event.</p><p className="mt-2 text-center text-xs leading-5 text-white/45">Monthly allowances reset on your billing date and do not roll over. Saved flyers and brand details stay on this device. Five minutes is the creation experience, not an editing timer.</p>
 </div>}
