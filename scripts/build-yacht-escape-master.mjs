import {writeFile,access} from 'node:fs/promises';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';
const native={presenter:'presenter',headline:'headline',script:'headline2',tagline:'subtag',genres:'details',date:'date',boarding:'time',venue:'venue',marina:'address',footer:'footerDetails',compliance:'compliance'};
const companions={presents:['presents','presenter','presenter'],day:['weekday','date','date'],month:['month','date','date'],mood:['mood','details','details'],boardingLabel:['boardingLabel','date','time'],sailingLabel:['sailingLabel','date','time'],sailing:['endTime','date','time'],aside:['aside','details','details'],club:['venueDescriptor','venue','venueAddress'],views:['views','details','details']};
const semanticRoles={...Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}])),...Object.fromEntries(Object.entries(companions).map(([id,[semanticRole,panel,uiField]])=>[id,{semanticRole,text:`yacht_${id}`,panel,uiField,moveTarget:panel,mappedControls:true,editable:true}]))};
const fontMap=Object.fromEntries(Object.keys(semanticRoles).map(id=>[id,['headline','month','date','venue'].includes(id)?'Didot':['script','aside'].includes(id)?'Dear Script (Demo_Font)':'LEMONMILK-Regular']));
Object.assign(fontMap,{YachtSerif:'Didot',YachtScript:'Dear Script (Demo_Font)',YachtSans:'LEMONMILK-Regular'});
export const cocoCssMasterAdapter={id:'yacht-escape',masterPath:new URL('../public/generated-flyers/yacht-escape-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/yacht-escape.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,requiredFonts:['YachtSerif','YachtScript','YachtSans'],requiredRoles:Object.values(native),semanticRoles,fontMap,recipe:{id:'yacht-escape',name:'Yacht Escape',version:2,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#052333',bgTo:'#163e51',primary:'#fff9ed',secondary:'#163e51',accent:'#dfb66c',neutral:'#fff9ed'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},eventBrief:{eventName:'YACHT',subtitle:'Saturdays',date:'OCT 05'}};
const hasSavedRevision=await access(new URL('../lib/template-data/yacht-saved-source.json',import.meta.url)).then(()=>true,()=>false);
if(hasSavedRevision)throw new Error('Yacht Escape has an authoritative user save. Use scripts/sync-yacht-saved.mjs; do not rebuild over saved edits.');
const result=await compileCssMaster(cocoCssMasterAdapter);
for(const v of [result.square,result.story]){
 v.qrEnabled=false;v.socialHandleEnabled=false;v.cocoSocialHandleEnabled=false;v.exp=1;v.contrast=1/.9;v.saturation=1;v.warmth=0;v.tint=0;v.gamma=1;v.grain=0;v.vibrance=0;v.filmGrade=0;
 const doc=v.cocoCompositionSystem.compiledDocument;doc.objects=doc.objects.map(withCompiledTextSelection);v.cocoCssCompiler.ir=doc;
}
await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
await writeFile(new URL('../lib/template-data/yacht-escape-v2.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
