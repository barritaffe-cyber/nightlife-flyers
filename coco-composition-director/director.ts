import type { CompositionDirectorInput, CompositionDirectorResult, CompositionFamily, CompositionCandidate, CompositionSystem } from "./types.ts";
import { buildBaseComposition } from "./blockBuilder.ts";
import { generateVariations } from "./variations.ts";
import { scoreComposition } from "./scoring.ts";
import { refineCandidate } from "./refine.ts";
import { validateCompositionInput, validateCompositionCandidate } from "./validate.ts";
import { safeRect } from "./geometry.ts";

export function directCocoComposition(input:CompositionDirectorInput):CompositionDirectorResult{
  const errors=validateCompositionInput(input);if(errors.length)throw new Error(`Invalid composition input:\n${errors.join("\n")}`);
  // selectFamilies alone can propose a family on the SAME side as the real
  // face (e.g. "left-premium-stack" when the face is also on the left) -
  // it only knows the upstream typeField guess, not the actual detected
  // face position, so buildBaseComposition's column-width fix has nothing
  // to work with (the column starts where the face already is; no width
  // adjustment fixes being on the wrong side entirely). This uses the real
  // face position directly to decide which side text goes on, the same
  // rule as compositionDirector.ts's faceDirectedPattern - two composition
  // engines, now the same face-directed selection in both, not just the
  // same column math.
  // TEMPORARY - forces center-hero-event-poster to visually verify Stage
  // A/B/C rendering, bypassing the tournament entirely. Remove this line
  // once confirmed; real selection is restored below either way.
  const preferred=input.preferredFamily??input.creativeDirection.composition.family;
  const faceDirected=faceDirectedFamilies(input)??selectFamilies(input);
  // A selected split-editorial direction is also a crop contract: the
  // subject will be fitted to the image side after this grammar is chosen.
  // Keep that preferred family in the tournament instead of allowing the
  // current (possibly pre-fit) face position to erase it entirely.
  const preservePreferred=preferred==="split-editorial"||preferred==="fashion-club-vertical"||preferred==="golden-hero-editorial";
  const families:CompositionFamily[]=preferred==="golden-hero-editorial"
    ?[preferred]
    :preservePreferred
    ?[preferred,...faceDirected.filter(family=>family!==preferred)]
    :centerHeroEventPosterEligible(input)
      ?["center-hero-event-poster"]
      :faceDirected;
  const systems:CompositionSystem[]=[];
  if(typeof window!=="undefined")console.warn("[coco-diagnostic] directCocoComposition families tried:",families);
  families.forEach((family,index)=>systems.push(...generateVariations(buildBaseComposition(input,family,`composition-${family}-${index+1}`),input)));
  const scored=systems.map(s=>scoreComposition(s,input)).sort(compare);
  // Protection/overlap used to be soft-weighted score inputs only, so a
  // candidate that badly violated subject protection (e.g. text over a
  // face) or overlapped another text block could still win on other
  // dimensions. Gate them out first, falling back to the unfiltered pool
  // only if literally nothing clears the bar (never return zero candidates).
  const gated=scored.filter(passesHardGate);
  const pool=gated.length?gated:scored;
  const top=pool.slice(0,5);const refined=top.map(c=>refineCandidate(c,input)).sort(compare);
  const gatedRefined=refined.filter(passesHardGate);
  const finalists=(gatedRefined.length?gatedRefined:refined).slice(0,3);const winner=chooseHeadToHead(finalists)??pool[0];
  if(!winner)throw new Error("No composition candidates generated.");
  if(typeof window!=="undefined")console.warn("[coco-diagnostic] winner family:",winner.family,"textColumn:",winner.textColumn);
  // TEMPORARY DIAGNOSTIC - remove once confirmed.
  if(typeof window!=="undefined"){const tc=winner.textColumn;const sr=safeRect(input.format);console.warn("[coco-diagnostic] textColumn x="+tc.x+" y="+tc.y+" width="+tc.width+" height="+tc.height+" right="+(tc.x+tc.width)+" bottom="+(tc.y+tc.height)+" | safeRect x="+sr.x+" y="+sr.y+" right="+(sr.x+sr.width)+" bottom="+(sr.y+sr.height));}
  // TEMPORARY DIAGNOSTIC - remove once confirmed.
  if(typeof window!=="undefined")console.warn("[coco-diagnostic] winner.blocks:",winner.blocks.map(b=>b.role+"/"+(Array.isArray(b.source)?b.source.join("+"):b.source)+(b.hidden?"(hidden)":"")+(b.pinned?"[pinned]":"")).join(" | "));
  // TEMPORARY DIAGNOSTIC - remove once confirmed.
  if(typeof window!=="undefined")console.warn("[coco-diagnostic] winner.blocks rects:",winner.blocks.filter(b=>!b.hidden).map(b=>b.role+" x="+b.rect.x.toFixed(1)+" y="+b.rect.y.toFixed(1)+" w="+b.rect.width.toFixed(1)+" h="+b.rect.height.toFixed(1)+" right="+(b.rect.x+b.rect.width).toFixed(1)+" bottom="+(b.rect.y+b.rect.height).toFixed(1)).join(" | "));
  // TEMPORARY DIAGNOSTIC - remove once confirmed.
  if(typeof window!=="undefined")console.warn("[coco-diagnostic] hasCriticalProtectionViolation="+winner.score.hasCriticalProtectionViolation+" hasBlockOverlap="+winner.score.hasBlockOverlap+" hardViolations="+winner.score.hardViolations+" hasIdentity="+winner.blocks.some(b=>b.role==="identity"&&!b.hidden)+" oneColumn="+input.creativeDirection.composition.oneColumn+" ownsLength="+winner.owns.length+" pinnedCount="+winner.blocks.filter(b=>b.pinned).length);
  const winnerErrors=validateCompositionCandidate(winner,input);if(winnerErrors.length)throw new Error(`Invalid winning composition:\n${winnerErrors.join("\n")}`);
  const rejected=scored.filter(c=>!finalists.some(f=>f.id===c.id)).slice(0,30).map(c=>({id:c.id,reason:rejection(c,winner)}));
  return{winner,finalists,candidates:[...refined,...scored].sort(compare),rejected,authority:{compositionId:winner.id,owns:winner.owns,hardRules:["renderer-obedience","single-typography-system","protect-scene","preview-export-parity","headline-first"],rendererMustObey:["winner.textColumn","winner.blocks","winner.rhythm","winner.owns","winner.signatureMove","scene protection zones"]},trace:[
    {stage:"family",decision:`Compared ${families.join(", ")}.`,score:100,evidence:[input.creativeDirection.composition.reason]},
    {stage:"generation",decision:`Generated ${systems.length} complete systems.`,score:systems.length,evidence:["Each candidate includes subject, type column, blocks, rhythm, and eye flow."]},
    {stage:"refinement",decision:`Refined top ${top.length} candidates.`,score:refined[0]?.score.total??0,evidence:["Tried lift, inward, compression, headline, accent, and metadata refinements."]},
    {stage:"winner",decision:`Selected ${winner.id}.`,score:winner.score.total,evidence:[winner.explanation]},
  ]};
}

// Same rule as compositionDirector.ts's faceDirectedPattern: if the face is
// clearly to one side, text goes to the other - forced, not scored, so
// there's no risk of a wrong-side candidate winning on some other
// dimension. If the face is roughly centered, no side has guaranteed room,
// so the vertically-separated layout (never sharing a row with the face)
// is used instead.
function faceDirectedFamilies(input:CompositionDirectorInput):CompositionFamily[]|null{
  const face=input.subject?.faceRect;
  // TEMPORARY DIAGNOSTIC - remove once confirmed. Shows up in the browser
  // console every time a fresh composition is generated.
  if(typeof window!=="undefined")console.warn("[coco-diagnostic] faceDirectedFamilies received faceRect:",face,"hasSubject:",Boolean(input.subject));
  // A subject exists but there's no real face box - side-stack families
  // need real coordinates to safely avoid the face; without them, falling
  // through to selectFamilies could still propose a side-stack family with
  // no face awareness. bottom-lockup never shares a row with the subject
  // regardless of exactly where the face is, so it's the forced fallback
  // instead of ever building a layout with no face data behind it.
  if(input.subject&&(!face||face.width<=1||face.height<=1))return["bottom-lockup"];
  if(!face||face.width<=1||face.height<=1)return null;
  const centerX=face.x+face.width/2;
  if(centerX>=58)return["left-premium-stack"];
  if(centerX<=42)return["right-premium-stack"];
  return["bottom-lockup"];
}
// Needs a centered subject with real body-silhouette evidence (not just a
// face-box substitute - same signal wingRegionsForFace uses, since neither
// function can safely judge clearance/coverage from a face box alone),
// enough coverage that there's a real torso to cross under the hero title,
// and enough content density to fill five zones instead of leaving most of
// them empty.
function centerHeroEventPosterEligible(input:CompositionDirectorInput):boolean{
  const face=input.subject?.faceRect;
  const bodyRect=input.subject?.visibleRect??input.subject?.rect;
  if(!input.subject||!face||!bodyRect)return false;
  const hasRealBody=bodyRect.width>face.width*1.15||bodyRect.height>face.height*1.15;
  if(!hasRealBody)return false;
  const centerX=face.x+face.width/2;
  if(centerX<35||centerX>65)return false;
  const coverage=(bodyRect.width*bodyRect.height)/10000;
  if(coverage<.3||coverage>.8)return false;
  return input.creativeDirection.informationDensity!=="minimal";
}
function selectFamilies(input:CompositionDirectorInput):CompositionFamily[]{
  const preferred=input.preferredFamily??input.creativeDirection.composition.family;const f:Set<CompositionFamily>=new Set([preferred]);const field=input.creativeDirection.composition.typeField;
  if(field==="left")f.add("left-premium-stack");if(field==="right")f.add("right-premium-stack");if(field==="center")f.add("center-poster-stack");if(field==="bottom")f.add("bottom-lockup");if(field==="top")f.add("top-lockup");if(field==="split")f.add("split-editorial");
  const dna=input.creativeDirection.posterDNA;if(dna==="urban-culture")f.add("type-around-subject");if(dna==="music-festival"||dna==="underground-rave")f.add("diagonal-energy");if(dna==="editorial-fashion"||dna==="minimal-swiss")f.add("split-editorial");if(dna==="tropical-lifestyle")f.add("corner-editorial");
  f.add("center-poster-stack");return Array.from(f).slice(0,6);
}
function passesHardGate(c:CompositionCandidate){return !c.score.hasCriticalProtectionViolation&&!c.score.hasBlockOverlap}
function compare(a:CompositionCandidate,b:CompositionCandidate){return b.score.total-a.score.total||b.score.subjectProtection-a.score.subjectProtection||b.score.hierarchy-a.score.hierarchy||b.score.premium-a.score.premium}
function chooseHeadToHead(c:CompositionCandidate[]){if(!c.length)return null;return c.slice(1).reduce((w,x)=>{const keys:[keyof CompositionCandidate["score"]][]=[] as any;const arr:(keyof CompositionCandidate["score"])[]=["hierarchy","balance","subjectProtection","negativeSpace","eyeFlow","rhythm","premium","total"];let a=0,b=0;for(const k of arr){if(w.score[k]>x.score[k])a++;if(x.score[k]>w.score[k])b++;}return b>a?x:w},c[0])}
function rejection(c:CompositionCandidate,w:CompositionCandidate){const diffs:[[string,number]]=[] as any;for(const k of ["hierarchy","balance","subjectProtection","negativeSpace","eyeFlow","rhythm","premium"] as const)diffs.push([k,w.score[k]-c.score[k]]);const d=diffs.sort((a,b)=>b[1]-a[1])[0];return `${c.family} lost mainly on ${d[0]} by ${d[1].toFixed(1)} points.`}
