import type { CompositionBlock, CompositionDirectorInput, CompositionSystem, CompositionRole, CompositionSource, PercentRect, Align } from "./types.ts";
import { normalizeRect, opticalShiftForAlignment, overlapRatio, expand } from "./geometry.ts";
import { FAMILY_PRESETS, columnForFamily } from "./families.ts";
import {
  FASHION_CLUB_VERTICAL_RECIPE,
  getFashionClubVerticalFormatRecipe,
} from "../lib/recipes/fashionClubVertical.ts";

export function buildBaseComposition(input:CompositionDirectorInput,family:CompositionSystem["family"],id:string):CompositionSystem{
  const preset=FAMILY_PRESETS[family];
  const authority=input.creativeDirection.composition;
  // A hard face-safety fallback may replace an explicitly right-side family
  // with the left-side counterpart (or vice versa). In that one contradictory
  // case, the replacement family must also replace the stale field/alignment;
  // otherwise columnAroundFace rebuilds a left family on the far-right edge
  // and validation rejects it as outside the safe rect. Centered selected
  // contracts keep their center field, preserving their existing behavior.
  const oppositeSideFallback=family==="left-premium-stack"&&authority.typeField==="right"
    ?"left"
    :family==="right-premium-stack"&&authority.typeField==="left"
      ?"right"
      :null;
  const typeField=oppositeSideFallback??(family==="fashion-club-vertical"
    ?"right"
    :family==="golden-hero-editorial"
      ?"left"
      :authority.typeField);
  // center-hero-event-poster is centered by design, always - authority.
  // alignment is creative-direction's own left/right/center decision made
  // for the OTHER families (which really do vary), and letting it override
  // this family's fixed "center" produced left-aligned text sitting in
  // zones that are still centered on the canvas, looking cramped/
  // overlapping against their own left edge instead of centered in them.
  const alignment=oppositeSideFallback??(family==="center-hero-event-poster"
    ?"center"
    :family==="fashion-club-vertical"
      ?"right"
      :family==="golden-hero-editorial"
        ?"left"
      :authority.alignment??preset.align);
  // Real face-avoidance, applied at layout-SELECTION time instead of only
  // later when the real headline gets built. Without this, candidate
  // layouts get scored and picked using a textColumn that's never actually
  // been checked against the real face position - a layout can look safe
  // here and still collide once real content is built into it later, since
  // by then the layout choice is already locked in.
  // center-hero-event-poster's column is hand-tuned to match a specific
  // reference layout (see families.ts), not a rough starting point meant
  // to be nudged toward the scene's generic stackRect the way every other
  // family's preset is - blending 36% toward an unrelated rect risks
  // pushing this one out of safe bounds for no benefit, since the other
  // five zones (built independently in buildCenterHeroEventPosterBlocks)
  // never move to compensate.
  const baseColumn=family==="center-hero-event-poster"||family==="fashion-club-vertical"||family==="golden-hero-editorial"
    ?columnForFamily(family,input.format)
    :blendColumns(columnForFamily(family,input.format),authority.stackRect,.36);
  const textColumn=family==="fashion-club-vertical"||family==="golden-hero-editorial"
    ?baseColumn
    :columnAroundFace(
      baseColumn,
      input.subject?.faceRect,
      alignment,
      input.format
    );
  const subjectRect=input.subject?.visibleRect??input.subject?.rect??inferSubjectRect(input);
  const rhythm={...preset.rhythm};
  // Wings only apply to bottom-lockup for now: it's the only family where the
  // subject sits in the upper frame with room on both sides at shoulder
  // height, matching a reference layout with independent DJ-lineup and
  // entry-price blocks beside the subject instead of stacked under it.
  const wings=family==="bottom-lockup"?wingRegionsForFace(input):null;
  // TEMPORARY DIAGNOSTIC - remove once confirmed.
  if(typeof window!=="undefined")console.warn("[coco-diagnostic] buildBaseComposition family:",family,"subjectRect:",input.subject?.visibleRect??input.subject?.rect,"wings:",wings,"presenterText:",input.text.presenter,"priceText:",input.text.price);
  const blocks=family==="fashion-club-vertical"
    ?buildFashionClubVerticalBlocks(input)
    :family==="golden-hero-editorial"
      ?buildGoldenHeroEditorialBlocks(input)
    :family==="center-hero-event-poster"
      ?buildCenterHeroEventPosterBlocks(input,textColumn,alignment)
      :buildBlocks(input,textColumn,alignment,rhythm,wings);
  const owns=Array.from(new Set(blocks.flatMap(b=>Array.isArray(b.source)?b.source:[b.source])));
  return{
    id,family,generation:"base",typeField,alignment,subjectRect,textColumn,blocks,rhythm,
    eyeFlow:[],owns,signatureMove:input.creativeDirection.signatureMove.move,
    explanation:family==="fashion-club-vertical"
      ?"A full-bleed fashion hero owns the left field while two oversized vertical headline rails and a structured footer anchor the right and bottom edges."
      :family==="golden-hero-editorial"
        ?"A warm photographic hero owns the right field while a stacked display title, script gesture, and structured footer build an editorial counterweight on the left."
      :`${family} uses one typography system in the ${authority.typeField} field to counterbalance the scene hero.`,warnings:[]
  };
}

function buildBlocks(input:CompositionDirectorInput,column:PercentRect,align:Align,rhythm:CompositionSystem["rhythm"],wings:{left:PercentRect|null;right:PercentRect|null}|null):CompositionBlock[]{
  const c=column;
  const density=input.creativeDirection.informationDensity;
  const identityH=density==="minimal"?22:density==="low"?24:26;
  const accentH=8,metaH=density==="minimal"?6.5:8,dateH=6.5,venueH=5.5,badgeH=8;
  let y=c.y;
  const result:CompositionBlock[]=[];
  // Sequential placement never checks the column's own bottom edge - a
  // full-density flyer (every optional field filled in) can need far more
  // height than a short family like bottom-lockup provides. Without this,
  // a block positioned past the column's bottom gets silently yanked back
  // onto the canvas by normalizeRect's 0-100 clamp, landing on top of the
  // block above it (the actual source of "block overlap" hard violations
  // that have nothing to do with variation/refinement passes). Once one
  // block overflows, every later one would too, so this only needs to
  // start hiding from the first one that doesn't fit and stay hidden.
  let overflowed=false;
  const add=(role:CompositionRole,source:CompositionSource|CompositionSource[],height:number,widthRatio:number,priority:1|2|3|4|5,attachTo?:CompositionRole,hidden=false)=>{
    const width=c.width*widthRatio;
    const x=alignedX(c,width,align)+opticalShiftForAlignment(align,role);
    if(role!=="identity"&&y+height>c.y+c.height+0.5)overflowed=true;
    const finalHidden=hidden||overflowed;
    const r=normalizeRect({x,y,width,height});
    result.push({id:`block-${role}`,role,source,rect:r,align,priority,parentRole:attachTo,attachTo,order:result.length+1,
      minVisualPower:role==="identity"?90:undefined,maxVisualPower:maxPower(role,input),allowOverlapWithSubject:allowOverlap(role,input),
      overlapPurpose:allowOverlap(role,input)?"signature":"none",maxProtectedOverlap:role==="accent"?.04:0,hidden:finalHidden});
    y+=height+spacingAfter(role,rhythm);
  };
  // A wing block sits in its own face-derived region beside the subject
  // instead of the vertical column, so it never consumes column y-space and
  // must stay untouched by variation/refinement passes that shift or scale
  // the column (see the `pinned` flag consumers in variations.ts/refine.ts).
  const addWing=(role:CompositionRole,source:CompositionSource|CompositionSource[],rect:PercentRect,priority:1|2|3|4|5,hidden=false)=>{
    result.push({id:`block-${role}`,role,source,rect,align:"center",priority,order:result.length+1,
      maxVisualPower:maxPower(role,input),allowOverlapWithSubject:allowOverlap(role,input),
      overlapPurpose:allowOverlap(role,input)?"signature":"none",maxProtectedOverlap:0,hidden,pinned:true});
  };
  add("identity","headline",identityH,1,1);
  add("accent","accent",accentH,.82,2,"identity",!has(input,"accent"));
  add("primaryMeta",["details","details2"],metaH,.86,3,"accent",!has(input,"details")&&!has(input,"details2"));
  add("dateTime",["date","time"],dateH,.58,3,"primaryMeta",!has(input,"date")&&!has(input,"time"));
  add("venue","venue",venueH,.78,4,"dateTime",!has(input,"venue"));
  const presenterHidden=!has(input,"presenter")||input.creativeDirection.informationDensity==="minimal";
  if(wings?.left)addWing("presenter","presenter",wings.left,5,presenterHidden);
  else add("presenter","presenter",4.5,.7,5,"venue",presenterHidden);
  const badgeHidden=!has(input,"price");
  if(wings?.right)addWing("badge","price",wings.right,4,badgeHidden);
  else add("badge","price",badgeH,.26,4,undefined,badgeHidden);
  return result;
}

// Fashion Club is not a one-column stack. It is an authored poster grammar:
// two co-authoritative pieces of the event headline read vertically on the
// right, while the brand, lineup, date, doors, venue and reservation copy each
// occupy their own fixed editorial zone. The rectangles below describe the
// final PAINTED extents of the 90-degree title rails, not short horizontal text
// boxes waiting for a generic fitter to rotate them. Keeping every block pinned
// preserves the reference relationship through normal composition variations.
//
// The renderer is responsible for splitting the headline into two balanced
// strings. Both rails therefore own `headline`; the second rail is not an
// accent/tagline pretending to be the second half of the event name.
function buildFashionClubVerticalBlocks(input:CompositionDirectorInput):CompositionBlock[]{
  const recipe=getFashionClubVerticalFormatRecipe(input.format);
  const hierarchy=FASHION_CLUB_VERTICAL_RECIPE.runtime.hierarchy;
  const geometry={
    presenter:recipe.zones.presenter,
    identityPrimary:recipe.zones.headlinePrimary,
    identitySecondary:recipe.zones.headlineSecondary,
    primaryMeta:recipe.zones.primaryMeta,
    secondaryMeta:recipe.zones.talentPolicy,
    dateTime:recipe.zones.date,
    doors:recipe.zones.doors,
    venue:recipe.zones.venue,
    badge:recipe.zones.optionalBadge,
    reservation:recipe.zones.reservation,
    compliance:recipe.zones.compliance,
  };
  const result:CompositionBlock[]=[];
  const supportPower=hierarchy.bodyPowerMaxRatio*100;
  const titleMayOverlap=allowOverlap("identity",input);
  const addPinned=(
    id:string,
    role:CompositionRole,
    source:CompositionSource|CompositionSource[],
    rect:PercentRect,
    align:Align,
    priority:1|2|3|4|5,
    hidden:boolean,
    options:{minVisualPower?:number;maxVisualPower?:number;allowSubjectOverlap?:boolean;maxProtectedOverlap?:number}={}
  )=>{
    const allowSubjectOverlap=options.allowSubjectOverlap??false;
    result.push({
      id,role,source,rect:normalizeRect(rect),align,priority,order:result.length+1,
      minVisualPower:options.minVisualPower,
      maxVisualPower:options.maxVisualPower??maxPower(role,input),
      allowOverlapWithSubject:allowSubjectOverlap,
      overlapPurpose:allowSubjectOverlap?"signature":"none",
      maxProtectedOverlap:options.maxProtectedOverlap??0,
      hidden,pinned:true,
    });
  };

  const headlineWords=String(input.text.headline??"").trim().split(/\s+/).filter(Boolean);
  const subtagText=String(input.text.subtag??"").replace(/\s+/g," ").trim().toLowerCase();
  const footerText=String(input.text.footer??"").replace(/\s+/g," ").trim().toLowerCase();
  const hasDistinctFooter=Boolean(footerText&&footerText!==subtagText);

  // Visual top-to-bottom insertion order keeps the shared rhythm evaluator
  // meaningful even though the two title rails overlap each other vertically.
  addPinned("block-presenter","presenter","presenter",geometry.presenter,"center",3,!has(input,"presenter"));
  addPinned("block-identity","identity","headline",geometry.identityPrimary,"center",1,false,{
    minVisualPower:hierarchy.headlinePowerMin,maxVisualPower:100,allowSubjectOverlap:titleMayOverlap,maxProtectedOverlap:.04,
  });
  addPinned("block-identity-secondary","identity","headline",geometry.identitySecondary,"center",1,headlineWords.length<2,{
    minVisualPower:Math.max(88,hierarchy.headlinePowerMin-4),maxVisualPower:100,allowSubjectOverlap:titleMayOverlap,maxProtectedOverlap:.04,
  });
  addPinned("block-primaryMeta","primaryMeta","details",geometry.primaryMeta,"left",3,!has(input,"details"));
  addPinned("block-secondaryMeta","secondaryMeta","details2",geometry.secondaryMeta,"left",3,!has(input,"details2"));
  addPinned("block-dateTime","dateTime",["date","time"],geometry.dateTime,"left",3,!has(input,"date")&&!has(input,"time"));
  addPinned("block-footer-doors","footer","subtag",geometry.doors,"center",4,!has(input,"subtag"),{maxVisualPower:supportPower});
  addPinned("block-venue","venue","venue",geometry.venue,"left",4,!has(input,"venue"));
  // The clean Fashion Club recipe intentionally suppresses generic entry
  // badges; price information belongs in authored footer copy, if supplied.
  addPinned(
    "block-badge",
    "badge",
    "price",
    geometry.badge,
    "right",
    4,
    !FASHION_CLUB_VERTICAL_RECIPE.runtime.assetPolicy.autoAddPriceBadge || !has(input,"price")
  );
  addPinned("block-footer-reservation","footer","footer",geometry.reservation,"center",5,!hasDistinctFooter,{maxVisualPower:supportPower});
  addPinned("block-footer-compliance","footer","compliance",geometry.compliance,"center",5,!has(input,"compliance"),{maxVisualPower:supportPower});

  return result;
}

// Golden Hero is a deliberately authored multi-zone poster grammar rather
// than a generic one-column stack. Every block remains an ordinary editable
// Coco text role; only their relationships are stored in the recipe.
function buildGoldenHeroEditorialBlocks(input:CompositionDirectorInput):CompositionBlock[]{
  const isStory=input.format==="story";
  const geometry=isStory
    ?{
      presenter:{x:70,y:3,width:24,height:7},
      identity:{x:6,y:6,width:42,height:29},
      accent:{x:6,y:36.5,width:36,height:11},
      date:{x:6,y:56.5,width:15,height:7},
      time:{x:6,y:64,width:15,height:2.5},
      primaryMeta:{x:25,y:57,width:67,height:7.5},
      optionalDetails:{x:25,y:67.5,width:67,height:5},
      venue:{x:6,y:85,width:34,height:8},
      music:{x:50,y:85,width:27,height:8},
      badge:{x:84,y:84,width:11,height:10},
      rsvp:{x:6,y:94,width:88,height:3},
    }
    :{
      presenter:{x:70,y:3,width:24,height:7},
      identity:{x:6,y:7,width:42,height:30},
      accent:{x:6,y:49,width:34,height:13},
      date:{x:6,y:66,width:15,height:7},
      time:{x:6,y:74,width:15,height:2.5},
      primaryMeta:{x:25,y:66,width:67,height:6},
      optionalDetails:{x:25,y:72.5,width:67,height:4},
      venue:{x:6,y:85,width:34,height:8},
      music:{x:50,y:85,width:27,height:8},
      badge:{x:84,y:84,width:11,height:10},
      rsvp:{x:6,y:94,width:88,height:3},
    };
  const result:CompositionBlock[]=[];
  const addPinned=(
    id:string,
    role:CompositionRole,
    source:CompositionSource|CompositionSource[],
    rect:PercentRect,
    align:Align,
    priority:1|2|3|4|5,
    hidden:boolean,
    minVisualPower?:number
  )=>{
    result.push({
      id,role,source,rect:normalizeRect(rect),align,priority,order:result.length+1,
      minVisualPower,maxVisualPower:maxPower(role,input),allowOverlapWithSubject:false,
      overlapPurpose:"none",maxProtectedOverlap:0,hidden,pinned:true,
    });
  };

  addPinned("block-presenter","presenter","presenter",geometry.presenter,"right",5,!has(input,"presenter"));
  addPinned("block-identity","identity","headline",geometry.identity,"left",1,false,96);
  addPinned("block-accent","accent","accent",geometry.accent,"left",2,!has(input,"accent"));
  addPinned("block-dateTime","dateTime","date",geometry.date,"left",3,!has(input,"date"));
  addPinned("block-time","footer","time",geometry.time,"left",3,!has(input,"time"));
  addPinned("block-primaryMeta","primaryMeta","details2",geometry.primaryMeta,"left",3,!has(input,"details2"));
  // Event-description prose informs the art direction. It is not printed as
  // flyer copy until the user explicitly turns this optional block on.
  addPinned("block-optionalDetails","secondaryMeta","details",geometry.optionalDetails,"left",4,true);
  addPinned("block-venue","venue","venue",geometry.venue,"left",4,!has(input,"venue"));
  addPinned("block-musicPolicy","footer","footer",geometry.music,"left",4,!has(input,"footer"));
  addPinned("block-badge","badge","price",geometry.badge,"center",5,!has(input,"price"));
  addPinned("block-rsvp","footer","compliance",geometry.rsvp,"left",5,!has(input,"compliance"));
  return result;
}


function buildCenterHeroEventPosterBlocks(input:CompositionDirectorInput,column:PercentRect,align:Align):CompositionBlock[]{
  const result:CompositionBlock[]=[];
  const addPinned=(role:CompositionRole,source:CompositionSource|CompositionSource[],rect:PercentRect,priority:1|2|3|4|5,hidden:boolean)=>{
    result.push({id:`block-${role}`,role,source,rect:normalizeRect(rect),align:"center",priority,order:result.length+1,
      maxVisualPower:maxPower(role,input),allowOverlapWithSubject:false,overlapPurpose:"none",maxProtectedOverlap:0,hidden,pinned:true});
  };

  // Fixed template positions, the same idea the hero-title column already
  // used successfully (a real, hand-tuned reference layout - see
  // families.ts), extended to every zone instead of just one.
  // negativeSpace-searched placement (findZoneRect) kept coming up empty
  // on real photos - too few real "open" regions detected, roles competing
  // for the same regions, coordinate drift once the photo is panned/zoomed
  // for display - and a designer laying out a poster like the reference
  // takeover flyer doesn't hunt pixel-by-pixel for open space either, they
  // use known-good conventional positions. Get every zone reliably placed
  // this way first; making placement adapt per-photo is a deliberately
  // separate, later step.
  const isStory=input.format==="story";
  // scene.protectionZones' face entry is built from the RAW, pre-zoom face
  // detection on the original upload - it never reflects the pan/scale
  // applied afterward to fit the photo into the canvas the user actually
  // sees. input.subject.faceRect is the one already corrected for that
  // (the same value the pink "Face target" debug box renders from, and
  // the same value columnAroundFace has been avoiding correctly all
  // night) - using scene.protectionZones here let a zone "avoid" a face
  // position that isn't where the face actually is on screen. A small
  // expand gives the same kind of safety margin protection.ts's own
  // expandRect gives the critical zone, just anchored to the right rect.
  const faceRect=input.subject?.faceRect;
  const faceGuard=faceRect?expand(faceRect,2.5):null;
  const awayFromFace=(rect:PercentRect)=>!faceGuard||overlapRatio(rect,faceGuard,"b")<=0;
  const fixed=(rect:PercentRect,hiddenBecauseNoText:boolean)=>awayFromFace(rect)?{rect:normalizeRect(rect),hidden:hiddenBecauseNoText}:null;

  const brandHeader=fixed(isStory?{x:12,y:8,width:76,height:8}:{x:20,y:4,width:60,height:9},!has(input,"details2"));
  if(brandHeader)addPinned("secondaryMeta","details2",brandHeader.rect,2,brandHeader.hidden);

  const leftInfo=fixed(isStory?{x:6,y:28,width:30,height:16}:{x:5,y:30,width:26,height:16},!has(input,"presenter"));
  if(leftInfo)addPinned("presenter","presenter",leftInfo.rect,3,leftInfo.hidden);

  const rightInfo=fixed(isStory?{x:64,y:28,width:30,height:16}:{x:69,y:30,width:26,height:16},!has(input,"price"));
  if(rightInfo)addPinned("badge","price",rightInfo.rect,3,rightInfo.hidden);

  // Fixed ratio + fixed padding of column.height, not independent
  // constants (old identityH/accentH could sum to more than column.height
  // itself - the container never promised to hold them, so the renderer's
  // overflow:hidden silently clipped whatever didn't fit). Every share
  // below is a fraction of the SAME column.height, so they always sum to
  // exactly column.height - the box can never outgrow the zone it comes
  // from. No top padding here: buildTypographyZoneModels sizes the zone's
  // real container to the UNION of these block rects, not column.height
  // itself, so padding placed outside a block's own rect is invisible to
  // that union and just wastes space without protecting anything. Accent's
  // signature-move rotation headroom is reserved correctly downstream
  // instead (enforceStackHeightFit in buildTypographyStackModel.ts, which
  // computes the exact headroom a given rotation angle needs, dynamically,
  // rather than a guessed static margin here).
  const accentHidden=!has(input,"accent");
  const bottomPadding=column.height*.03;
  const accentH=accentHidden?0:column.height*.2;
  const spacing=accentHidden?0:column.height*.04;
  const identityH=column.height-accentH-spacing-bottomPadding;
  const accentRect=normalizeRect({x:column.x,y:column.y,width:column.width,height:accentH});
  result.push({id:"block-accent",role:"accent",source:"accent",rect:accentRect,align,priority:1,order:result.length+1,
    maxVisualPower:maxPower("accent",input),allowOverlapWithSubject:allowOverlap("accent",input),
    overlapPurpose:allowOverlap("accent",input)?"signature":"none",maxProtectedOverlap:.35,hidden:accentHidden});
  const headlineY=column.y+(accentHidden?0:accentH+spacing);
  const headlineRect=normalizeRect({x:column.x,y:headlineY,width:column.width,height:identityH});
  result.push({id:"block-identity",role:"identity",source:"headline",rect:headlineRect,align,priority:1,order:result.length+1,
    minVisualPower:90,maxVisualPower:maxPower("identity",input),allowOverlapWithSubject:allowOverlap("identity",input),
    overlapPurpose:allowOverlap("identity",input)?"signature":"none",maxProtectedOverlap:.35,hidden:false});
  const dateZone=fixed(isStory?{x:6,y:83,width:24,height:7}:{x:5,y:84,width:26,height:10},!has(input,"date")&&!has(input,"time"));
  if(dateZone)addPinned("dateTime",["date","time"],dateZone.rect,4,dateZone.hidden);

  const venueZone=fixed(isStory?{x:32,y:83,width:36,height:4}:{x:33,y:84,width:38,height:6},!has(input,"venue")&&!has(input,"details"));
  if(venueZone)addPinned("venue",["venue","details"],venueZone.rect,4,venueZone.hidden);

  // Tagline (e.g. "DRINKS I HOOKAH I STRIPPERS") and the compliance badge
  // (e.g. "18+") are two distinct pieces of content with two distinct real
  // sources now (subtag, compliance), each with its own fixed spot - both
  // use role "footer" (already the correct downstream role for small
  // standalone labels, matching what "presenter" already remaps to) -
  // source is what tells them apart, the same pattern left-info relies on.
  const taglineZone=fixed(isStory?{x:32,y:87.5,width:36,height:3.5}:{x:33,y:90,width:38,height:5},!has(input,"subtag"));
  if(taglineZone)addPinned("footer","subtag",taglineZone.rect,5,taglineZone.hidden);

  const complianceZone=fixed(isStory?{x:70,y:83,width:20,height:7}:{x:77,y:84,width:18,height:11},!has(input,"compliance"));
  if(complianceZone)addPinned("footer","compliance",complianceZone.rect,5,complianceZone.hidden);

  // TEMPORARY DIAGNOSTIC - remove once confirmed.
  if(typeof window!=="undefined"){
    const fmt=(r:PercentRect|null)=>r?`x=${r.x.toFixed(1)} y=${r.y.toFixed(1)} w=${r.width.toFixed(1)} h=${r.height.toFixed(1)}`:"NOT FOUND";
    const fmtFixed=(z:{rect:PercentRect;hidden:boolean}|null)=>z?fmt(z.rect)+(z.hidden?" (no text)":""):"SKIPPED (overlaps face)";
    console.warn(
      "[coco-diagnostic] all zones - column(fixed): "+fmt(column)+
      "\n  accent(fixed ratio of column): "+fmt(accentRect)+
      "\n  headline(fixed ratio of column): "+fmt(headlineRect)+
      "\n  brandHeader(fixed): "+fmtFixed(brandHeader)+
      "\n  leftInfo(fixed): "+fmtFixed(leftInfo)+
      "\n  rightInfo(fixed): "+fmtFixed(rightInfo)+
      "\n  dateZone(fixed): "+fmtFixed(dateZone)+
      "\n  venueZone(fixed): "+fmtFixed(venueZone)+
      "\n  taglineZone(fixed): "+fmtFixed(taglineZone)+
      "\n  complianceZone(fixed): "+fmtFixed(complianceZone)
    );
  }

  return result;
}

// A wing only exists when the subject leaves real, usable width beside it at
// roughly shoulder height - never guessed from a family preset. Built from
// the subject's whole visible silhouette rather than just the face box,
// since a wing needs to clear the entire figure, not just avoid the face.
// bandBottom stays clear of the bottom-lockup column's own top edge (58/60)
// so a wing can never collide with the stack underneath it.
function wingRegionsForFace(input:CompositionDirectorInput):{left:PercentRect|null;right:PercentRect|null}{
  const subjectRect=input.subject?.visibleRect??input.subject?.rect;
  if(!subjectRect)return{left:null,right:null};
  // When there's no real body-silhouette evidence, subjectGeometry() (in
  // components/coco/pipeline/engine.ts) substitutes the face box itself as
  // "rect" so the pipeline doesn't crash on a missing subject - fine for
  // face-avoidance, but a wing measured against that narrow stand-in reads
  // as much more open space than actually exists once hair/arms/torso are
  // accounted for. Only build wings when the subject rect is meaningfully
  // wider than the face itself, i.e. real body geometry, not a substitute.
  const faceRect=input.subject?.faceRect;
  if(faceRect&&subjectRect.width<=faceRect.width*1.15&&subjectRect.height<=faceRect.height*1.15){
    return{left:null,right:null};
  }
  const format=input.format;
  const bandTop=format==="story"?26:28;
  const bandBottom=format==="story"?52:54;
  const gutter=format==="story"?3:3.5;
  const edgeMargin=format==="story"?4:5;
  const minWingWidth=format==="story"?20:22;
  const leftSpace=subjectRect.x-gutter-edgeMargin;
  const rightSpace=100-edgeMargin-gutter-(subjectRect.x+subjectRect.width);
  const left=leftSpace>=minWingWidth?normalizeRect({x:edgeMargin,y:bandTop,width:leftSpace,height:bandBottom-bandTop}):null;
  const right=rightSpace>=minWingWidth?normalizeRect({x:100-edgeMargin-rightSpace,y:bandTop,width:rightSpace,height:bandBottom-bandTop}):null;
  return{left,right};
}

function has(input:CompositionDirectorInput,key:CompositionSource){return Boolean(String(input.text[key]??"").trim())}
function alignedX(c:PercentRect,w:number,a:Align){if(a==="right")return c.x+c.width-w;if(a==="center")return c.x+(c.width-w)/2;return c.x}
function spacingAfter(role:CompositionRole,r:CompositionSystem["rhythm"]){switch(role){case"identity":return r.headlineToAccent;case"accent":return r.accentToMeta;case"primaryMeta":return r.metaToDateTime;case"dateTime":return r.dateTimeToVenue;default:return r.venueToFooter}}
function maxPower(role:CompositionRole,input:CompositionDirectorInput){const h=input.creativeDirection.hierarchy;switch(role){case"accent":return h.accentMaxRatio*100;case"primaryMeta":case"secondaryMeta":return h.bodyMaxRatio*100;case"dateTime":return h.dateMaxRatio*100;case"venue":return h.venueMaxRatio*100;case"badge":return h.badgeMaxRatio*100;case"presenter":return h.presenterMaxRatio*100;default:return 100}}
function allowOverlap(role:CompositionRole,input:CompositionDirectorInput){return input.creativeDirection.composition.overlapPolicy!=="none"&&(role==="accent"||role==="identity")}
function blendColumns(a:PercentRect,b:PercentRect,t:number){return normalizeRect({x:a.x*(1-t)+b.x*t,y:a.y*(1-t)+b.y*t,width:a.width*(1-t)+b.width*t,height:a.height*(1-t)+b.height*t})}
function inferSubjectRect(input:CompositionDirectorInput){const f=input.scene.creativeDecisions.composition.typeField;return f==="left"?normalizeRect({x:50,y:0,width:50,height:100}):f==="right"?normalizeRect({x:0,y:0,width:50,height:100}):normalizeRect({x:18,y:16,width:64,height:84})}
// The face box is the forbidden zone: the placeholder used to SELECT a
// layout is built directly FROM it, not from a fixed family-preset column
// that gets defensively shrunk afterward if it happens to reach too far.
// Left-anchored columns start at the family's own left margin and extend
// right until they reach the forbidden zone, using the actual full space
// next to the actual face - never capped at whatever width the family
// preset guessed. Right-anchored columns mirror that from the other edge.
// Center/other alignments keep the old defensive shrink instead of a
// maximize: narrowing a centered column by moving only one edge would push
// its visual center off from where it's supposed to be, and centered/
// bottom-anchored families are handled by their own vertical separation or
// by scoring instead. Mirrors the same logic in
// components/coco/compositionDirector.ts's columnAroundFace - two
// composition engines exist in this codebase; this keeps both consistent
// rather than only fixing whichever one happened to be tested last.
function columnAroundFace(fallback:PercentRect,faceRect:PercentRect|null|undefined,align:Align,format:"square"|"story"):PercentRect{
  if(!faceRect)return fallback;
  // Every branch below only ever compared X ranges - a column positioned
  // well below the face (bottom-lockup's column, or center-hero-event-
  // poster's hero-title zone) got shrunk as if it needed to dodge the face
  // sideways, even with zero vertical overlap between them. A face at
  // y:14-42% and a column starting at y:56% can never actually collide
  // regardless of X, so there's nothing here to avoid.
  const verticallyOverlaps=fallback.y<faceRect.y+faceRect.height&&fallback.y+fallback.height>faceRect.y;
  if(!verticallyOverlaps)return fallback;
  const gutter=format==="story"?3.25:2.75;
  const minWidth=format==="story"?16:18;
  const edgeMargin=format==="story"?4:5;
  if(align==="right"){
    const zoneRight=faceRect.x+faceRect.width;
    const x=Math.min(100-minWidth,zoneRight+gutter);
    const width=Math.max(minWidth,100-edgeMargin-x);
    return normalizeRect({...fallback,width,x});
  }
  if(align==="left"){
    const zoneLeft=faceRect.x;
    const width=Math.max(minWidth,zoneLeft-gutter-fallback.x);
    return normalizeRect({...fallback,width});
  }
  const zoneLeft=faceRect.x;
  const columnRight=fallback.x+fallback.width;
  if(fallback.x<zoneLeft&&columnRight>zoneLeft-gutter){
    const width=Math.max(minWidth,zoneLeft-gutter-fallback.x);
    return normalizeRect({...fallback,width:Math.min(fallback.width,width)});
  }
  return fallback;
}
