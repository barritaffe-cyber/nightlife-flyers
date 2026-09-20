import type { VisualRecipe } from './types.ts';
export const GRILLS_AND_GROOVE_RECIPE = {
 id:'grills-and-groove',name:'Grills & Groove',version:1,reference:'grills-and-groove.nflyer',referenceMode:'visual-inheritance',
 summary:'Live-fire steaks and cocktails with textured gold serif GRILLS, cream brush GROOVE, and elegant event details.',
 layerStack:['Supplied format-specific grill photograph.','Soft readability shade.','Editable textured gold and brush title.','Independent date, DJs, specials and venue.'],
 textZones:[{id:'headline',purpose:'First title word.',placement:'Right column in Square; upper title in Story.'},{id:'headline2',purpose:'Second title word.',placement:'Cream brush beneath GRILLS.'},{id:'details',purpose:'Music and dinner specials.',placement:'Right column in Square; lower information section in Story.'},{id:'venue',purpose:'Venue and address.',placement:'Footer.'}],
 typography:['Textured Gold Serif PNG for GRILLS.','Another Danger Slanted for GROOVE.','Light tracked uppercase metadata and bold date/DJs.'],
 colorGrade:['Preserve the warm grill photograph and gold/ivory type.'],
 avoid:['Flattening text into the photograph.','Covering the main steak with event details.','Changing saved sizes to fit unrelated names.'],
 appNotes:['Square and Story are independently authored.','No added portrait required.','Authoritative project: grills-and-groove.nflyer.'],
 runtime:{directionId:'grills-and-groove',compositionPattern:'center-poster-stack',styleId:'black-electric',formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}
} satisfies VisualRecipe & {runtime:Record<string,unknown>};
