import {writeFile,access} from 'node:fs/promises';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';

const native={presenter:'presenter',headline:'headline',subtitle:'headline2',details:'details',date:'date',time:'time',venue:'venue',address:'address',dj2:'djLineup',musicLabel:'djLineupLabel',dress:'footerDetails'};
const companions={presents:['presents','presenter','presenter'],day:['day','date','date'],month:['month','date','date'],mood:['mood','details','details'],escape:['escape','details','details'],dj1:['dj1','details2','details2'],dj3:['dj3','details2','details2'],detailsLabel:['detailsLabel','details','detailsLabel']};
const semanticRoles={...Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}])),...Object.fromEntries(Object.entries(companions).map(([id,[semanticRole,panel,uiField]])=>[id,{semanticRole,text:id==='detailsLabel'?'detailsLabel':`dayParty_${id}`,panel,uiField,moveTarget:panel,mappedControls:true,editable:true}]))};
const serif=new Set(['headline','date']);
const fontMap={DaySerif:'Didot',DaySans:'LEMONMILK-Regular',DayDisplay:'Avigea',...Object.fromEntries(Object.keys(semanticRoles).map(id=>[id,id==='venue'?'Avigea':serif.has(id)?'Didot':'LEMONMILK-Regular']))};
export const cocoCssMasterAdapter={
 id:'day-party',masterPath:new URL('../public/generated-flyers/day-party-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/day-party.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,requiredFonts:['DaySerif','DaySans','DayDisplay'],requiredRoles:Object.values(native),semanticRoles,fontMap,
 recipe:{id:'day-party',name:'Day Party · Offshore',version:2,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#a2dfdf',bgTo:'#26aabd',primary:'#063d56',secondary:'#2a95ad',accent:'#083b55',neutral:'#063d56'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},eventBrief:{eventName:'OFFSHORE',subtitle:'SOMEWHERE BETWEEN HERE & PARADISE',date:'JUL 19'}
};
if(await access(new URL('../lib/template-data/day-party-saved-source.json',import.meta.url)).then(()=>true,()=>false))throw Error('Day Party has an accepted user save; preserve it instead of rebuilding.');
const result=await compileCssMaster(cocoCssMasterAdapter);
const blank="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
for(const v of [result.square,result.story]){
 Object.assign(v,{backgroundUrl:blank,bgUrl:blank,subtagEnabled:false,subtag:'',priceEnabled:false,priceLabel:'',qrEnabled:false,socialHandleEnabled:false,cocoSocialHandleEnabled:false,exp:1,contrast:1/.9,saturation:1,warmth:0,tint:0,gamma:1,grain:0,vibrance:0,filmGrade:0});
 const doc=v.cocoCompositionSystem.compiledDocument;
 v.detailsTracking=v.bodyTracking;
 v.head2Shadow=false; v.head2Fx={...v.head2Fx,shadowEnabled:false};
 doc.objects=doc.objects.map(withCompiledTextSelection).map(object=>{
   if(object.kind!=='text')return object;
   if(object.id==='headline'){
     object.paint.backgroundImage='url("/generated-flyers/assets/day-party-title-texture.svg")';
     object.paint.backgroundSize=v===result.story?'1000px 205px':'850px 179px';
   }
   object.binding.pixelHitBounds=true;
   if(object.binding?.panel==='details')object.binding.labelObjectId='detailsLabel';
   if(object.binding?.panel==='details2')object.binding.labelObjectId='musicLabel';
   if(['details','details2','venue'].includes(object.binding?.panel))object.binding.mappedControls=true;
   if(object.id==='detailsLabel')Object.assign(object.binding,{size:'detailsLabelSize',color:'detailsLabelColor',family:'detailsFamily'});
   return object;
 });
 v.cocoCssCompiler.ir=doc;
 useOffshoreGlyphs(v);
}
await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
await writeFile(new URL('../lib/template-data/day-party-v2.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
import { useOffshoreGlyphs } from './offshore-headline-config.mjs';
