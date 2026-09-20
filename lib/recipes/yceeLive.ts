import type { VisualRecipe } from './types.ts';
export const YCEE_LIVE_RECIPE = {
 id:'ycee-live',name:'YCEE Live',version:1,reference:'ycee-live.nflyer',referenceMode:'visual-inheritance',
 summary:'Spotlight gold lettering, an editable artist portrait and an amber concert crowd.',
 layerStack:['Supplied Square or Story concert photograph and separate subject PNG.','Editable Spotlight Gold title and flowing Live signature.','Independent presenter, date, time, venue, contact and age.'],
 textZones:[{id:'headline',purpose:'Event name.',placement:'Across the lower portrait.'},{id:'headline2',purpose:'Second title line.',placement:'Flowing signature beneath the headline.'},{id:'details',purpose:'Contact and atmosphere.',placement:'Side rails and lower information stack.'},{id:'date',purpose:'Date.',placement:'Upper left.'},{id:'venue',purpose:'Venue and address.',placement:'Centered footer.'}],
 typography:['Supplied Spotlight Gold PNG glyphs.','Dear Script signature.','Spaced light sans serif details.'],
 colorGrade:['Preserve warm skin and amber lighting.'],
 avoid:['Baking event copy into the photograph.','Covering the face with text.'],
 appNotes:['Independently authored Square and Story.','Authoritative project: ycee-live.nflyer.'],
 runtime:{directionId:'ycee-live',compositionPattern:'center-poster-stack',styleId:'black-electric',formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}},
} satisfies VisualRecipe & {runtime:Record<string,unknown>};
