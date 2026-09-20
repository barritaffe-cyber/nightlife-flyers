import {writeFile,access} from 'node:fs/promises';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';
const native={"presenter": "presenter", "headline": "headline", "script": "headline2", "genres": "details", "date": "date", "time": "time", "venue": "venue", "address": "address", "dj2": "djLineup", "musicLabel": "djLineupLabel", "reserve": "footerDetails"};
const companions={"entry":["entry","details","details"],"presents": ["presents", "presenter", "presenter"], "mood": ["mood", "details", "details"], "aside": ["aside", "details", "details"], "views": ["views", "details", "details"], "day": ["day", "date", "date"], "month": ["month", "date", "date"], "dj1": ["dj1", "details2", "details2"], "dj3": ["dj3", "details2", "details2"], "entryNote": ["entryNote", "details", "details"], "dress": ["dress", "details", "details"], "dressNote": ["dressNote", "details", "details"], "rsvp": ["rsvp", "details", "details"], "rsvpNote": ["rsvpNote", "details", "details"]};
const semanticRoles={...Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}])),...Object.fromEntries(Object.entries(companions).map(([id,[semanticRole,panel,uiField]])=>[id,{semanticRole,text:`new_york_${id}`,panel,uiField,moveTarget:panel,mappedControls:true,editable:true}]))};
const fontMap=Object.fromEntries(Object.keys(semanticRoles).map(id=>[id,['presenter','headline','day','month','date','venue','dj1','dj2','dj3'].includes(id)?'Didot':['script'].includes(id)?'Dear Script (Demo_Font)':'LEMONMILK-Regular']));
Object.assign(fontMap,{NYSerif:'Didot',NYScript:'Dear Script (Demo_Font)',NYSans:'LEMONMILK-Regular'});
export const cocoCssMasterAdapter={id:'new-york',masterPath:new URL('../public/generated-flyers/new-york-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/new-york.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,requiredFonts:['NYSerif','NYScript','NYSans'],requiredRoles:Object.values(native),semanticRoles,fontMap,recipe:{id:'new-york',name:'New York · Manhattan Nights',version:2,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#020609',bgTo:'#0b1923',primary:'#fff9ed',secondary:'#0b1923',accent:'#dfb66c',neutral:'#fff9ed'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},eventBrief:{eventName:'MANHATTAN',subtitle:'Nights',date:'OCT 05'}};
const hasSavedRevision=await access(new URL('../lib/template-data/new-york-saved-source.json',import.meta.url)).then(()=>true,()=>false);
if(hasSavedRevision)throw new Error('New York · Manhattan Nights has an authoritative user save. Preserve the accepted source; do not rebuild over saved edits.');
const result=await compileCssMaster(cocoCssMasterAdapter);
for(const v of [result.square,result.story]){
 v.subtagEnabled=false;v.subtag='';v.priceEnabled=false;v.priceLabel='';v.qrEnabled=false;v.socialHandleEnabled=false;v.cocoSocialHandleEnabled=false;v.exp=1;v.contrast=1/.9;v.saturation=1;v.warmth=0;v.tint=0;v.gamma=1;v.grain=0;v.vibrance=0;v.filmGrade=0;
 const doc=v.cocoCompositionSystem.compiledDocument;doc.objects=doc.objects.map(withCompiledTextSelection);v.cocoCssCompiler.ir=doc;
}
await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
await writeFile(new URL('../lib/template-data/new-york-v2.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
