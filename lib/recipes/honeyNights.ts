import type { VisualRecipe } from './types.ts';
export const HONEY_NIGHTS_RECIPE = {
 id:'honey-nights',name:'Honey Nights',version:1,reference:'honey-nights.nflyer',referenceMode:'visual-inheritance',
 summary:'Honey gold serif lettering, a sculpted bee medallion and black stone with gold splashes.',
 layerStack:['Supplied Square or Story bee photograph.','Editable honey gold title and spaced serif subtitle.','Independent presenter, date, time, music, DJs, venue and age.'],
 textZones:[{id:'headline',purpose:'Event name.',placement:'Centered above the bee.'},{id:'headline2',purpose:'Second title line.',placement:'Spaced subtitle beneath the headline.'},{id:'details',purpose:'Music and atmosphere.',placement:'Side rails and lower information stack.'},{id:'date',purpose:'Date.',placement:'Upper left.'},{id:'venue',purpose:'Venue and address.',placement:'Centered footer.'}],
 typography:['Supplied Honey Gold Serif PNG glyphs.','Avigea serif support copy.','Spaced light sans serif details.'],
 colorGrade:['Preserve black stone and warm honey gold.'],
 avoid:['Baking event copy into the photograph.','Covering the central bee with text.'],
 appNotes:['Independently authored Square and Story.','Authoritative project: honey-nights.nflyer.'],
 runtime:{directionId:'honey-nights',compositionPattern:'center-poster-stack',styleId:'black-electric',formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}},
} satisfies VisualRecipe & {runtime:Record<string,unknown>};
