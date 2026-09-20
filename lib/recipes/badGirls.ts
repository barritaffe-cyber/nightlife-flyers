import type { VisualRecipe } from "./types.ts";
export const BAD_GIRLS_RECIPE = {
 id:"bad-girls",name:"Bad Girls",version:1,reference:"bad-girls.nflyer",referenceMode:"visual-inheritance",
 summary:"Red grunge, oversized white and pink brush lettering, and a separate portrait, with independent Square and Story compositions.",
 layerStack:["Supplied format-specific red grunge background.","Two editable brush headline words behind the subject.","Separate replaceable portrait.","Independent date, music, offer and venue text; crown and heart accents."],
 textZones:[{id:"headline",purpose:"First event-name word.",placement:"Oversized pale brush lettering across the upper composition."},{id:"subtitle",purpose:"Second event-name word.",placement:"Pink brush lettering behind the portrait."},{id:"details",purpose:"Music, hours, offers and atmosphere.",placement:"Side rails clear of the face."},{id:"venue",purpose:"Venue and reservations.",placement:"Lower footer."}],
 typography:["Use the supplied template-only Bad Girls Brush PNG and Bad Girls Pink PNG families.","Keep headline words separate and editable, with compact per-letter shadows.","Retain uppercase supporting copy and title-case handwritten accents."],
 colorGrade:["Preserve red, black, hot pink, pale brush paint and natural skin tones."],
 avoid:["Baking the portrait or headline into the background.","Using rectangular panels over the artwork.","Clipping brush strokes or borrowing ink from adjacent glyph cells."],
 appNotes:["Requires a separate portrait; discoverable under Urban and Reggae / Dancehall.","Form fields map to saved text objects with saved wording plus ten character capacity.","Authoritative portable project: bad-girls.nflyer."],
 runtime:{directionId:"bad-girls",compositionPattern:"center-poster-stack",styleId:"black-electric",formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}},
} satisfies VisualRecipe & {runtime:Record<string,unknown>};
