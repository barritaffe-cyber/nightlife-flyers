import {writeFile,access} from 'node:fs/promises';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';
const roles={presenter:'presenter',headline:'headline',subtag:'subtag',date:'date',djs:'djLineup',venue:'venue',address:'address',compliance:'compliance'};
const extraBindings={
 presents:{semanticRole:'presents',text:'throwbackPresents',panel:'presenter',moveTarget:'presenter',uiField:'presenter'},
 day:{semanticRole:'weekday',text:'throwbackWeekday',panel:'date',moveTarget:'date',uiField:'date'},
 month:{semanticRole:'month',text:'throwbackMonth',panel:'date',moveTarget:'date',uiField:'date'},
 motto:{semanticRole:'motto',text:'throwbackMotto',panel:'details',moveTarget:'details',uiField:'details'},
 genres:{semanticRole:'details',text:'details',panel:'details',moveTarget:'details',uiField:'details'},
 musicBy:{semanticRole:'djLineupLabel',text:'djLineupLabel',panel:'details2',moveTarget:'details2',uiField:'djLineupLabel'},
 club:{semanticRole:'venueDescriptor',text:'throwbackVenueDescriptor',panel:'venue',moveTarget:'venue',uiField:'venueAddress'},
};
for(const binding of Object.values(extraBindings))Object.assign(binding,{editable:true,mappedControls:true});
export const cocoCssMasterAdapter={id:'throwback-saturdays',masterPath:new URL('../public/generated-flyers/throwback-saturdays-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/throwback-saturdays.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,
recipe:{id:'throwback-saturdays',name:'Throwback Saturdays',version:2,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#100d13',bgTo:'#5e1578',primary:'#f1eee8',secondary:'#5e1578',accent:'#ee00aa',neutral:'#f1eee8'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},requiredFonts:['ThrowBrush','ThrowScript','ThrowSans','ThrowCondensed'],requiredRoles:Object.values(roles),semanticRoles:{...Object.fromEntries(Object.entries(roles).map(([id,semanticRole])=>[id,{semanticRole}])),...extraBindings},fontMap:{presenter:'LEMONMILK-Regular',presents:'LEMONMILK-Regular',day:'LEMONMILK-Regular',month:'Bebas Neue',date:'Bebas Neue',motto:'LEMONMILK-Regular',genres:'Good Brush',oldschool:'Good Brush',different:'Good Brush',headline:'Road Rage',subtag:'Road Rage',musicBy:'LEMONMILK-Regular',djs:'LEMONMILK-Regular',venue:'Georgia',club:'LEMONMILK-Regular',address:'LEMONMILK-Regular',compliance:'LEMONMILK-Regular',ThrowBrush:'Road Rage',ThrowScript:'Good Brush',ThrowSans:'LEMONMILK-Regular',ThrowCondensed:'Bebas Neue'},eventBrief:{eventName:'THROWBACK',subtitle:'SATURDAYS',date:'OCT 05'}};
const hasSavedRevision=await access(new URL('../lib/template-data/throwback-saved-source.json',import.meta.url)).then(()=>true,()=>false);
if(hasSavedRevision)throw new Error('Throwback has an authoritative user save. Use scripts/sync-throwback-saved.mjs; do not rebuild over saved edits.');
const result=await compileCssMaster(cocoCssMasterAdapter);
for(const v of [result.square,result.story]){
 v.detailsEnabled=true;v.head2Enabled=false;v.headline2Enabled=false;v.head2line='';v.socialHandle='';v.socialHandleEnabled=false;v.qrEnabled=false;v.cocoSocialHandle='';v.cocoSocialHandleEnabled=false;
 v.exp=1;v.contrast=1/0.9;v.saturation=1;v.warmth=0;v.tint=0;v.gamma=1;v.grain=0;v.vibrance=0;v.filmGrade=0;
 const doc=v.cocoCompositionSystem.compiledDocument;doc.objects=doc.objects.map(withCompiledTextSelection);v.cocoCssCompiler.ir=doc;
}
await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
await writeFile(new URL('../lib/template-data/throwback-v2.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
