import type { CompositionCandidate, CompositionDirectorInput, CompositionSystem, CompositionScore } from "./types.ts";
import { analyzeBalance } from "./mass.ts";
import { buildEyeFlow, scoreEyeFlow } from "./eyeFlow.ts";
import { evaluateProtection } from "./protection.ts";
import { gapY, contains, safeRect, overlapRatio, clamp } from "./geometry.ts";

export function scoreComposition(system:CompositionSystem,input:CompositionDirectorInput):CompositionCandidate{
  const balance=analyzeBalance(system,input);system.visualBalance=balance;system.eyeFlow=buildEyeFlow(system,input);
  const protection=evaluateProtection(system,input);
  const blockOverlap=scoreBlockOverlap(system);
  const hasCriticalProtectionViolation=protection.violations.some(v=>v.severity==="critical");
  const hierarchy=scoreHierarchy(system,input),negativeSpace=scoreNegativeSpace(system,input),eyeFlow=scoreEyeFlow(system.eyeFlow),rhythm=scoreRhythm(system),alignment=scoreAlignment(system),sceneFit=scoreSceneFit(system,input),storyFit=scoreStoryFit(system,input),premium=scorePremium(system,input),originality=scoreOriginality(system,input),implementationConfidence=scoreImplementation(system,input,protection.violations.length);
  // Was passing protection.violations.length (ANY severity) here, while
  // passesHardGate (director.ts) only rejects on hasCriticalProtectionViolation
  // (critical severity only) - a candidate with just a low/medium violation
  // could pass the selection gate, get picked as the winner, then fail this
  // stricter check and throw, crashing the whole composition director. Same
  // threshold in both places now, so a winner that already cleared the gate
  // can never subsequently fail for a reason the gate didn't care about.
  const hardViolations=countHardViolations(system,input,hasCriticalProtectionViolation,blockOverlap.hasOverlap);
  const total=weighted([[hierarchy,.14],[balance.score,.12],[protection.score,.16],[negativeSpace,.1],[eyeFlow,.09],[rhythm,.09],[alignment,.07],[sceneFit,.09],[storyFit,.05],[premium,.05],[originality,.02],[implementationConfidence,.02],[blockOverlap.score,.1]])-hardViolations*18;
  const score:CompositionScore={hierarchy:r(hierarchy),balance:r(balance.score),subjectProtection:r(protection.score),negativeSpace:r(negativeSpace),eyeFlow:r(eyeFlow),rhythm:r(rhythm),alignment:r(alignment),sceneFit:r(sceneFit),storyFit:r(storyFit),premium:r(premium),originality:r(originality),implementationConfidence:r(implementationConfidence),hardViolations,hasCriticalProtectionViolation,hasBlockOverlap:blockOverlap.hasOverlap,total:r(clamp(total,0,100))};
  return{...system,score};
}

function scoreHierarchy(s:CompositionSystem,i:CompositionDirectorInput){const id=s.blocks.find(b=>b.role==="identity"&&!b.hidden),ac=s.blocks.find(b=>b.role==="accent"&&!b.hidden),meta=s.blocks.find(b=>b.role==="primaryMeta"&&!b.hidden);if(!id)return 0;let sc=94;if(ac&&ac.rect.height>id.rect.height*.55)sc-=18;if(meta&&meta.rect.height>id.rect.height*.45)sc-=14;if(ac&&gapY(id.rect,ac.rect)>6)sc-=12;return clamp(sc)}
function scoreNegativeSpace(s:CompositionSystem,i:CompositionDirectorInput){let sc=80;const best=(i.negativeSpace??[]).find(n=>overlapRatio(s.textColumn,n.rect,"a")>.45);if(best)sc+=best.score*18;if((i.busyZones??[]).some(z=>overlapRatio(s.textColumn,z,"a")>.3))sc-=22;if(!contains(safeRect(i.format),s.textColumn))sc-=18;return clamp(sc)}
function scoreRhythm(s:CompositionSystem){const visible=s.blocks.filter(b=>!b.hidden).sort((a,b)=>a.order-b.order);if(visible.length<2)return 60;const gaps=[];for(let x=1;x<visible.length;x++)gaps.push(gapY(visible[x-1].rect,visible[x].rect));const mean=gaps.reduce((a,b)=>a+b,0)/gaps.length;const variance=gaps.reduce((a,b)=>a+(b-mean)**2,0)/gaps.length;return clamp(96-Math.sqrt(variance)*7)}
function scoreAlignment(s:CompositionSystem){let sc=96;for(const b of s.blocks.filter(x=>!x.hidden)){if(b.align!==s.alignment)sc-=6;const expected=s.alignment==="left"?s.textColumn.x:s.alignment==="right"?s.textColumn.x+s.textColumn.width-b.rect.width:s.textColumn.x+(s.textColumn.width-b.rect.width)/2;if(Math.abs(b.rect.x-expected)>3.5)sc-=5}return clamp(sc)}
function scoreSceneFit(s:CompositionSystem,i:CompositionDirectorInput){let sc=82;if(s.typeField===i.creativeDirection.composition.typeField)sc+=10;else sc-=18;if(s.family===i.creativeDirection.composition.family)sc+=18;else sc-=14;if(s.alignment===i.creativeDirection.composition.alignment)sc+=4;else sc-=6;return clamp(sc)}
function scoreStoryFit(s:CompositionSystem,i:CompositionDirectorInput){const story=i.scene.creativeDecisions.story;let sc=80;if(story==="luxury-tropical-brunch"&&["left-premium-stack","right-premium-stack","corner-editorial"].includes(s.family))sc+=14;if(story==="premium-ladies-night"&&s.family==="fashion-club-vertical")sc+=8;if(story==="techno-underground"&&["diagonal-energy","full-bleed-type","split-editorial"].includes(s.family))sc+=14;if(story==="hiphop-showcase"&&["type-around-subject","full-bleed-type","fashion-club-vertical"].includes(s.family))sc+=14;return clamp(sc)}
function scorePremium(s:CompositionSystem,i:CompositionDirectorInput){let sc=78;if(["left-premium-stack","right-premium-stack","split-editorial","corner-editorial","fashion-club-vertical","golden-hero-editorial"].includes(s.family))sc+=12;if(s.rhythm.compression<.9)sc+=5;if(i.creativeDirection.informationDensity==="minimal"||i.creativeDirection.informationDensity==="low")sc+=5;return clamp(sc)}
function scoreOriginality(s:CompositionSystem,i:CompositionDirectorInput){const m:Record<string,number>={"left-premium-stack":70,"right-premium-stack":70,"center-poster-stack":62,"bottom-lockup":58,"split-editorial":84,"diagonal-energy":90,"full-bleed-type":94,"type-around-subject":96,"top-lockup":60,"corner-editorial":82,"fashion-club-vertical":98,"golden-hero-editorial":96};let sc=m[s.family]??65;if(s.signatureMove!=="none")sc+=4;return clamp(sc)}
function scoreImplementation(s:CompositionSystem,i:CompositionDirectorInput,v:number){let sc=i.scene.confidence*100;if(v)sc-=v*8;if(!contains(safeRect(i.format),s.textColumn))sc-=12;return clamp(sc)}
// Protection scoring only ever checked blocks against the subject/photo -
// nothing checked blocks against EACH OTHER, so two text groups (e.g.
// metadata and presenter) could be scored highly while sitting on top of
// each other. This finds the worst pairwise overlap among visible blocks.
function scoreBlockOverlap(s:CompositionSystem):{score:number;hasOverlap:boolean}{
  const visible=s.blocks.filter(b=>!b.hidden);
  let worst=0;
  for(let x=0;x<visible.length;x++){
    for(let y=x+1;y<visible.length;y++){
      worst=Math.max(worst,overlapRatio(visible[x].rect,visible[y].rect,"min"));
    }
  }
  return{score:clamp(100-worst*260),hasOverlap:worst>0.08};
}
function countHardViolations(s:CompositionSystem,i:CompositionDirectorInput,hasCriticalProtectionViolation:boolean,hasBlockOverlap:boolean){let n=0;if(hasCriticalProtectionViolation)n++;if(hasBlockOverlap)n++;if(!s.blocks.some(b=>b.role==="identity"&&!b.hidden))n++;if(i.creativeDirection.composition.oneColumn&&!s.owns.length)n++;return n}
function weighted(e:Array<[number,number]>){const w=e.reduce((s,x)=>s+x[1],0);return e.reduce((s,x)=>s+x[0]*x[1],0)/w}
function r(v:number){return Math.round(v*10)/10}
