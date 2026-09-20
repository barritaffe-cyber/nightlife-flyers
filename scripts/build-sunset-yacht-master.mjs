import {writeFile,access} from 'node:fs/promises';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';

const native={"presenter":"presenter","headline":"headline","subtitle":"headline2","tagline":"subtag","date":"date","time":"time","venue":"venue","address":"address","mood":"details","invitation":"footerDetails"};
const companions={"presents":["presents","presenter","presenter"],"day":["weekday","date","date"],"month":["month","date","date"],"club":["venueDescriptor","venue","venueAddress"],"views":["views","details","details"],"detailsLabel":["detailsLabel","details","detailsLabel"]};
const semanticRoles={...Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}])),...Object.fromEntries(Object.entries(companions).map(([id,[semanticRole,panel,uiField]])=>[id,{semanticRole,text:id==='detailsLabel'?'detailsLabel':`sunsetYacht_${id}`,panel,uiField,moveTarget:panel,mappedControls:true,editable:true}]))};
const serif=new Set(['headline']);
const fontMap={TieSerif:'Didot',TieScript:'Dear Script (Demo_Font)',TieSans:'LEMONMILK-Light',TieBold:'LEMONMILK-Bold',...Object.fromEntries(Object.keys(semanticRoles).map(id=>[id,serif.has(id)?'Didot':id==='subtitle'?'Dear Script (Demo_Font)':id==='date'?'LEMONMILK-Bold':'LEMONMILK-Light']))};
export const cocoCssMasterAdapter={
 id:'sunset-yacht',masterPath:new URL('../public/generated-flyers/sunset-yacht-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/sunset-yacht.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,requiredFonts:['TieSerif','TieScript','TieSans','TieBold'],requiredRoles:Object.values(native),semanticRoles,fontMap,
 recipe:{id:'sunset-yacht',name:'Sunset Yacht · Sunset Sessions',version:2,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#070707',bgTo:'#171714',primary:'#f9f6eb',secondary:'#aaa69b',accent:'#dcc38e',neutral:'#edece5'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},eventBrief:{eventName:'SUNSET',subtitle:'Sessions',date:'OCT 12'}
};
if(await access(new URL('../lib/template-data/sunset-yacht-saved-source.json',import.meta.url)).then(()=>true,()=>false))throw Error('Sunset Yacht has an accepted user save; preserve it instead of rebuilding.');
const result=await compileCssMaster(cocoCssMasterAdapter);
const blank="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
for(const v of [result.square,result.story]){
 Object.assign(v,{backgroundUrl:blank,bgUrl:blank,priceEnabled:false,priceLabel:'',qrEnabled:false,leftRailEnabled:false,leftRail:'',leftRailLabel:'',headShadow:false,socialHandleEnabled:false,cocoSocialHandleEnabled:false,details2Enabled:false,details2:'',djLineupLabel:'',exp:1,contrast:1/.9,saturation:1,warmth:0,tint:0,gamma:1,grain:0,vibrance:0,filmGrade:0});
 const doc=v.cocoCompositionSystem.compiledDocument;
 // The extractor omits empty text; author its canvas owner explicitly.
 const body=doc.objects.find(object=>object.id==='mood');
 const bounds={x:v===result.story?82:87,y:v===result.story?62:44,width:v===result.story?13:10,height:2};
 doc.objects.push({...structuredClone(body),id:'detailsLabel',sourceObjectId:'detailsLabel',semanticRole:'detailsLabel',text:'',textRuns:[],bounds,paintBounds:bounds,
   typography:{...body.typography,fontSizePx:6,lineHeight:1.4},
   binding:{text:'detailsLabel',size:'detailsLabelSize',color:'detailsLabelColor',family:'detailsFamily',panel:'details',moveTarget:'details',uiField:'detailsLabel',mappedControls:true,initial:{text:'',size:6,color:'#ffffff'}}});
 doc.report.compiled=doc.objects.length;
 v.detailsLabel='';v.detailsLabelSize=6;v.detailsLabelColor='#ffffff';
 v.detailsTracking=v.bodyTracking;
 v.head2Shadow=false; v.head2Fx={...v.head2Fx,shadowEnabled:false};
 doc.objects=doc.objects.map(withCompiledTextSelection).map(object=>{
   if(object.kind!=='text')return object;
   if(object.id==='headline') {object.paint.backgroundImage='url("/generated-flyers/assets/sunset-yacht-gold.svg")';object.paint.backgroundSize=v===result.story?'994px 244px':'972px 235px';}
   object.binding.pixelHitBounds=true;
   if(object.binding?.panel==='details')object.binding.labelObjectId='detailsLabel';
   if(['details','venue'].includes(object.binding?.panel))object.binding.mappedControls=true;
   if(object.id==='detailsLabel')Object.assign(object.binding,{size:'detailsLabelSize',color:'detailsLabelColor',family:'detailsFamily'});
   return object;
 });
 v.cocoCssCompiler.ir=doc;
}
await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
await writeFile(new URL('../lib/template-data/sunset-yacht-v2.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
