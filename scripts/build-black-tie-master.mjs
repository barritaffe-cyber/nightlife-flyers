import {writeFile,access} from 'node:fs/promises';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';

const native={presenter:'presenter',headline:'headline',subtitle:'headline2',details:'details',date:'date',time:'time',venue:'venue',address:'address',invitation:'footerDetails'};
const companions={presents:['presents','presenter','presenter'],day:['day','date','date'],month:['month','date','date'],tagline:['tagline','details','details'],mood:['mood','details','details'],detailsLabel:['detailsLabel','details','detailsLabel']};
const semanticRoles={...Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}])),...Object.fromEntries(Object.entries(companions).map(([id,[semanticRole,panel,uiField]])=>[id,{semanticRole,text:id==='detailsLabel'?'detailsLabel':`blackTie_${id}`,panel,uiField,moveTarget:panel,mappedControls:true,editable:true}]))};
const serif=new Set(['headline','subtitle','month','date']);
const fontMap={TieSerif:'Didot',TieSans:'LEMONMILK-Regular',...Object.fromEntries(Object.keys(semanticRoles).map(id=>[id,serif.has(id)?'Didot':'LEMONMILK-Regular']))};
export const cocoCssMasterAdapter={
 id:'black-tie',masterPath:new URL('../public/generated-flyers/black-tie-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/black-tie.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,requiredFonts:['TieSerif','TieSans'],requiredRoles:Object.values(native),semanticRoles,fontMap,
 recipe:{id:'black-tie',name:'Black Tie · Maison',version:2,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#070707',bgTo:'#171714',primary:'#f9f6eb',secondary:'#aaa69b',accent:'#dcc38e',neutral:'#edece5'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},eventBrief:{eventName:'BLACK',subtitle:'TIE',date:'NOV 14'}
};
if(await access(new URL('../lib/template-data/black-tie-saved-source.json',import.meta.url)).then(()=>true,()=>false))throw Error('Black Tie has an accepted user save; preserve it instead of rebuilding.');
const result=await compileCssMaster(cocoCssMasterAdapter);
const blank="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
for(const v of [result.square,result.story]){
 Object.assign(v,{backgroundUrl:blank,bgUrl:blank,subtagEnabled:false,subtag:'',priceEnabled:false,priceLabel:'',qrEnabled:false,socialHandleEnabled:false,cocoSocialHandleEnabled:false,details2Enabled:false,details2:'',djLineupLabel:'',exp:1,contrast:1/.9,saturation:1,warmth:0,tint:0,gamma:1,grain:0,vibrance:0,filmGrade:0});
 const doc=v.cocoCompositionSystem.compiledDocument;
 v.detailsTracking=v.bodyTracking;
 doc.objects=doc.objects.map(withCompiledTextSelection).map(object=>{
   if(object.kind!=='text')return object;
   object.binding.pixelHitBounds=true;
   if(object.binding?.panel==='details')object.binding.labelObjectId='detailsLabel';
   if(['details','venue'].includes(object.binding?.panel))object.binding.mappedControls=true;
   if(object.id==='detailsLabel')Object.assign(object.binding,{size:'detailsLabelSize',color:'detailsLabelColor',family:'detailsFamily'});
   return object;
 });
 v.cocoCssCompiler.ir=doc;
}
await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
await writeFile(new URL('../lib/template-data/black-tie-v2.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
