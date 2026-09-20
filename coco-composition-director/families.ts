import type { CompositionFamily, CocoFormat, PercentRect, TypeField, Align, CompositionRhythm } from "./types.ts";
import { rect } from "./geometry.ts";
import {
  FASHION_CLUB_VERTICAL_RECIPE,
  getFashionClubVerticalFormatRecipe,
} from "../lib/recipes/fashionClubVertical.ts";

const fashionClubSquareColumn=getFashionClubVerticalFormatRecipe("square").textColumn;
const fashionClubStoryColumn=getFashionClubVerticalFormatRecipe("story").textColumn;
const fashionClubRhythm={...FASHION_CLUB_VERTICAL_RECIPE.runtime.rhythm};

export type FamilyPreset={
  family:CompositionFamily;
  fields:TypeField[];
  align:Align;
  squareColumn:PercentRect;
  storyColumn:PercentRect;
  rhythm:CompositionRhythm;
  supportsSubject:boolean;
  supportsOverlap:boolean;
  premiumBias:number;
  energyBias:number;
  originalityBias:number;
};

export const FAMILY_PRESETS:Record<CompositionFamily,FamilyPreset>={
  "left-premium-stack":{family:"left-premium-stack",fields:["left"],align:"left",squareColumn:rect(6,13,46,72),storyColumn:rect(6,12,52,72),rhythm:{headlineToAccent:1.4,accentToMeta:5.4,metaToDateTime:7.2,dateTimeToVenue:4.5,venueToFooter:4,baselineUnit:2,compression:.86},supportsSubject:true,supportsOverlap:true,premiumBias:94,energyBias:58,originalityBias:70},
  "right-premium-stack":{family:"right-premium-stack",fields:["right"],align:"right",squareColumn:rect(48,13,46,72),storyColumn:rect(42,12,52,72),rhythm:{headlineToAccent:1.4,accentToMeta:5.4,metaToDateTime:7.2,dateTimeToVenue:4.5,venueToFooter:4,baselineUnit:2,compression:.86},supportsSubject:true,supportsOverlap:true,premiumBias:94,energyBias:58,originalityBias:70},
  "center-poster-stack":{family:"center-poster-stack",fields:["center","top"],align:"center",squareColumn:rect(12,10,76,72),storyColumn:rect(10,9,80,72),rhythm:{headlineToAccent:2.2,accentToMeta:6.5,metaToDateTime:8,dateTimeToVenue:5.5,venueToFooter:5,baselineUnit:2.2,compression:.9},supportsSubject:false,supportsOverlap:false,premiumBias:78,energyBias:72,originalityBias:66},
  "bottom-lockup":{family:"bottom-lockup",fields:["bottom"],align:"center",squareColumn:rect(8,58,84,34),storyColumn:rect(8,60,84,32),rhythm:{headlineToAccent:1.2,accentToMeta:3.5,metaToDateTime:4,dateTimeToVenue:3,venueToFooter:2.5,baselineUnit:1.7,compression:.8},supportsSubject:true,supportsOverlap:false,premiumBias:82,energyBias:54,originalityBias:60},
  "split-editorial":{family:"split-editorial",fields:["split","left","right"],align:"left",squareColumn:rect(6,10,46,80),storyColumn:rect(6,9,46,80),rhythm:{headlineToAccent:2,accentToMeta:8,metaToDateTime:10,dateTimeToVenue:5,venueToFooter:4,baselineUnit:2.4,compression:.92},supportsSubject:true,supportsOverlap:false,premiumBias:92,energyBias:44,originalityBias:84},
  "diagonal-energy":{family:"diagonal-energy",fields:["left","right","center"],align:"left",squareColumn:rect(5,8,90,82),storyColumn:rect(5,8,90,82),rhythm:{headlineToAccent:1,accentToMeta:6,metaToDateTime:7,dateTimeToVenue:4,venueToFooter:3,baselineUnit:2,compression:.84},supportsSubject:true,supportsOverlap:true,premiumBias:68,energyBias:95,originalityBias:90},
  "full-bleed-type":{family:"full-bleed-type",fields:["center","split"],align:"center",squareColumn:rect(2,6,96,88),storyColumn:rect(2,6,96,88),rhythm:{headlineToAccent:1,accentToMeta:7,metaToDateTime:8,dateTimeToVenue:4,venueToFooter:3,baselineUnit:2.1,compression:.82},supportsSubject:true,supportsOverlap:true,premiumBias:64,energyBias:92,originalityBias:94},
  "type-around-subject":{family:"type-around-subject",fields:["split","left","right"],align:"left",squareColumn:rect(4,8,92,84),storyColumn:rect(4,8,92,84),rhythm:{headlineToAccent:1.4,accentToMeta:6,metaToDateTime:7,dateTimeToVenue:4,venueToFooter:4,baselineUnit:2,compression:.84},supportsSubject:true,supportsOverlap:true,premiumBias:76,energyBias:86,originalityBias:96},
  "top-lockup":{family:"top-lockup",fields:["top"],align:"center",squareColumn:rect(8,6,84,38),storyColumn:rect(8,7,84,36),rhythm:{headlineToAccent:1.2,accentToMeta:4,metaToDateTime:4,dateTimeToVenue:3,venueToFooter:2.5,baselineUnit:1.8,compression:.82},supportsSubject:true,supportsOverlap:false,premiumBias:80,energyBias:62,originalityBias:62},
  "corner-editorial":{family:"corner-editorial",fields:["left","right"],align:"left",squareColumn:rect(5,8,48,48),storyColumn:rect(5,8,54,46),rhythm:{headlineToAccent:1.5,accentToMeta:5,metaToDateTime:6,dateTimeToVenue:3.5,venueToFooter:3,baselineUnit:1.9,compression:.84},supportsSubject:true,supportsOverlap:true,premiumBias:88,energyBias:64,originalityBias:82},
  // A full-bleed image remains the canvas while the identity becomes a tall
  // right-side rail. Its structured footer is built as pinned blocks by the
  // specialized block grammar rather than squeezed into this title column.
  "fashion-club-vertical":{family:"fashion-club-vertical",fields:["right","bottom"],align:"right",squareColumn:rect(fashionClubSquareColumn.x,fashionClubSquareColumn.y,fashionClubSquareColumn.width,fashionClubSquareColumn.height),storyColumn:rect(fashionClubStoryColumn.x,fashionClubStoryColumn.y,fashionClubStoryColumn.width,fashionClubStoryColumn.height),rhythm:fashionClubRhythm,supportsSubject:true,supportsOverlap:true,premiumBias:84,energyBias:94,originalityBias:98},
  // Right-side photographic hero with a left-side display stack, a dedicated
  // handwritten weekday field, a wide factual band, and bottom communication cells.
  // This is the reusable grammar extracted from the Tribal Night reference.
  "golden-hero-editorial":{family:"golden-hero-editorial",fields:["left","bottom"],align:"left",squareColumn:rect(5,6,47,88),storyColumn:rect(5,7,47,84),rhythm:{headlineToAccent:3,accentToMeta:3,metaToDateTime:3,dateTimeToVenue:3,venueToFooter:2,baselineUnit:1.8,compression:.82},supportsSubject:true,supportsOverlap:true,premiumBias:92,energyBias:76,originalityBias:96},
  // The column here is only the hero-title zone (script welded onto the
  // headline, centered over the subject's lower torso) - brand-header,
  // left-info, right-info, date-card and venue-footer are built as pinned
  // blocks with their own independent rects in buildCenterHeroEventPosterBlocks,
  // not part of this column's rhythm at all.
  // y=60 (not 56) leaves clearance below left-info/right-info, which both
  // extend to y=58 in square format - anything higher overlaps them.
  "center-hero-event-poster":{family:"center-hero-event-poster",fields:["center","bottom"],align:"center",squareColumn:rect(20,60,60,24),storyColumn:rect(12,60,76,24),rhythm:{headlineToAccent:.3,accentToMeta:3,metaToDateTime:3,dateTimeToVenue:2.5,venueToFooter:2,baselineUnit:1.6,compression:.85},supportsSubject:true,supportsOverlap:true,premiumBias:86,energyBias:70,originalityBias:88},
};

export function columnForFamily(family:CompositionFamily,format:CocoFormat){const p=FAMILY_PRESETS[family];return format==="story"?{...p.storyColumn}:{...p.squareColumn}}
