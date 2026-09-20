import type { CompositionCandidate, CompositionDirectorInput, CompositionSystem } from "./types.ts";
import { shift, scaleAroundCenter, gapY, normalizeRect } from "./geometry.ts";
import { scoreComposition } from "./scoring.ts";

export function refineCandidate(candidate:CompositionCandidate,input:CompositionDirectorInput):CompositionCandidate{
  const proposals:CompositionSystem[]=[candidate];
  proposals.push(moveColumn(candidate,0,-1.5,"lift"));
  proposals.push(moveColumn(candidate,inward(candidate),0,"inward"));
  proposals.push(tighten(candidate,.92,"tighten"));
  proposals.push(scaleHeadline(candidate,1.05,"headline-up"));
  proposals.push(shrinkAccent(candidate,.88,"accent-down"));
  proposals.push(attachMetadata(candidate,"attach-meta"));
  const scored=proposals.map(p=>scoreComposition({...p,generation:"refined"},input));
  // A refinement nudge (tighten, attach-meta, ...) can score higher overall
  // while introducing a NEW block overlap or protection violation that the
  // unrefined candidate didn't have - picking pure top score here can hand
  // back something worse than what came in. Since proposals[0] is always
  // the original candidate re-scored unchanged, it's a safe floor: prefer
  // any refinement that's at least as safe, and only fall back to the raw
  // top score if literally none of them are (never return nothing).
  const safe=scored.filter(s=>!s.score.hasCriticalProtectionViolation&&!s.score.hasBlockOverlap);
  const pool=safe.length?safe:scored;
  return pool.sort((a,b)=>b.score.total-a.score.total)[0];
}
function moveColumn(c:CompositionSystem,dx:number,dy:number,label:string):CompositionSystem{const col=shift(c.textColumn,dx,dy);return{...c,id:`${c.id}:refine:${label}`,textColumn:col,blocks:c.blocks.map(b=>b.pinned?b:{...b,rect:shift(b.rect,dx,dy)})}}
function inward(c:CompositionSystem){return c.typeField==="left"?1.5:c.typeField==="right"?-1.5:0}
// Pinned (wing) blocks are excluded from both the "top" anchor and the
// transform itself - they sit in a different vertical band than the column
// entirely, so including one as the anchor would tighten the whole stack
// relative to a block that isn't part of its rhythm.
function tighten(c:CompositionSystem,f:number,label:string){const visible=c.blocks.filter(b=>!b.hidden&&!b.pinned).sort((a,b)=>a.order-b.order);if(!visible.length)return c;const top=visible[0].rect.y;return{...c,id:`${c.id}:refine:${label}`,rhythm:{...c.rhythm,compression:c.rhythm.compression*f},blocks:c.blocks.map(b=>b.pinned?b:{...b,rect:{...b.rect,y:top+(b.rect.y-top)*f}})}}
function scaleHeadline(c:CompositionSystem,f:number,label:string){return{...c,id:`${c.id}:refine:${label}`,blocks:c.blocks.map(b=>b.role==="identity"?{...b,rect:scaleAroundCenter(b.rect,f,1.04)}:b)}}
function shrinkAccent(c:CompositionSystem,f:number,label:string){return{...c,id:`${c.id}:refine:${label}`,blocks:c.blocks.map(b=>b.role==="accent"?{...b,rect:scaleAroundCenter(b.rect,f,f)}:b)}}
function attachMetadata(c:CompositionSystem,label:string){const ac=c.blocks.find(b=>b.role==="accent"&&!b.hidden),m=c.blocks.find(b=>b.role==="primaryMeta"&&!b.hidden);if(!ac||!m)return c;const desired=ac.rect.y+ac.rect.height+c.rhythm.accentToMeta*.72;const dy=desired-m.rect.y;return{...c,id:`${c.id}:refine:${label}`,blocks:c.blocks.map(b=>b.role==="primaryMeta"||b.order>m.order?{...b,rect:shift(b.rect,0,dy)}:b)}}
