import {writeFile,access} from 'node:fs/promises';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';

const native={headline:'headline',subtitle:'headline2',presenter:'presenter',date:'date',venue:'venue',address:'address',genres:'details'};
const companions={"day": ["day", "date", "date"], "year": ["year", "date", "date"], "djEnvy": ["djEnvy", "details", "details"], "djKash": ["djKash", "details", "details"], "dress": ["dress", "details", "details"], "qrCaption": ["qrCaption", "details", "details"], "doors": ["doors", "details", "details"], "offer": ["offer", "details", "details"], "age": ["age", "details", "details"], "footer": ["footer", "details", "details"]};
const semanticRoles={...Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}])),...Object.fromEntries(Object.entries(companions).map(([id,[semanticRole,panel,uiField]])=>[id,{semanticRole,text:id==='detailsLabel'?'detailsLabel':`soireeDreamHouse_${id}`,panel,uiField,moveTarget:panel,mappedControls:true,editable:true}]))};
const fontMap={TieSerif:'Didot',Script:'Dear Script (Demo_Font)',Condensed:'Bebas Neue',Sans:'LEMONMILK-Light',...Object.fromEntries(Object.keys(semanticRoles).map(id=>[id,id==='headline'?'Dear Script (Demo_Font)':id==='subtitle'?'Didot':['date','age'].includes(id)?'Bebas Neue':'LEMONMILK-Light']))};
export const cocoCssMasterAdapter={
 id:'soiree-dream-house',masterPath:new URL('../public/generated-flyers/soiree-dream-house-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/soiree-dream-house.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,requiredFonts:['TieSerif','Sans','Script','Condensed'],requiredRoles:Object.values(native),semanticRoles,fontMap,
 recipe:{id:'soiree-dream-house',name:'Soiree — Dream House',version:2,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#070707',bgTo:'#171714',primary:'#f9f6eb',secondary:'#aaa69b',accent:'#dcc38e',neutral:'#edece5'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},eventBrief:{eventName:'Soiree',subtitle:'AN EVENING OF ELEGANCE & CELEBRATION',date:'DEC 1'}
};
if(await access(new URL('../lib/template-data/soiree-dream-house-saved-source.json',import.meta.url)).then(()=>true,()=>false))throw Error('Soiree has an accepted user save; preserve it instead of rebuilding.');
const result=await compileCssMaster(cocoCssMasterAdapter);
const blank="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
for(const v of [result.square,result.story]){
 Object.assign(v,{backgroundUrl:blank,bgUrl:blank,subtagEnabled:false,rightRailEnabled:false,rightRailLabel:'',presenterEnabled:true,priceEnabled:false,priceLabel:'',qrEnabled:true,qrImageUrl:null,qrX:v===result.story?85:88.8,qrY:v===result.story?18:25.7,qrScale:7/11,leftRailEnabled:false,leftRail:'',leftRailLabel:'',headShadow:false,detailsShadow:false,venueShadow:false,socialHandleEnabled:false,cocoSocialHandleEnabled:false,details2Enabled:false,details2:'',djLineupLabel:'',exp:1,contrast:1/.9,saturation:1,warmth:0,tint:0,gamma:1,grain:0,vibrance:0,filmGrade:0});
 const doc=v.cocoCompositionSystem.compiledDocument;
 // Use the editor QR overlay so its upload/replace controls remain available.
 doc.objects=doc.objects.filter(object=>object.id!=='qrPlaceholder');
 for(const key of ['portraits','emojiList'])v[key]=(v[key]||[]).filter(object=>!String(object.id).endsWith('_qrPlaceholder'));
 // The extractor omits empty text; author its canvas owner explicitly.
 const body=doc.objects.find(object=>object.id==='genres');
 const bounds={x:5.6,y:v===result.story?84:67.5,width:45,height:2};
 doc.objects.push({...structuredClone(body),id:'detailsLabel',sourceObjectId:'detailsLabel',semanticRole:'detailsLabel',text:'',textRuns:[],bounds,paintBounds:bounds,
   typography:{...body.typography,fontSizePx:6,lineHeight:1.4},
   binding:{text:'detailsLabel',size:'detailsLabelSize',color:'detailsLabelColor',family:'detailsFamily',panel:'details',moveTarget:'details',uiField:'detailsLabel',mappedControls:true,initial:{text:'',size:6,color:'#ffffff'}}});
 doc.report.compiled=doc.objects.length;
 v.detailsLabel='';v.detailsLabelSize=6;v.detailsLabelColor='#ffffff';
 v.detailsTracking=v.bodyTracking;
 v.head2Shadow=false; v.head2Fx={...v.head2Fx,shadowEnabled:false,tracking:doc.objects.find(object=>object.id==='subtitle').typography.letterSpacingEm};
 doc.objects=doc.objects.map(withCompiledTextSelection).map(object=>{
   if(object.kind!=='text')return object;
   if(object.id==='subtitle') object.binding.tracking='head2Tracking';
   object.binding.pixelHitBounds=true;
   if(object.binding?.panel==='details')object.binding.labelObjectId='detailsLabel';
   if(['details','venue'].includes(object.binding?.panel))object.binding.mappedControls=true;
   if(object.id==='detailsLabel')Object.assign(object.binding,{size:'detailsLabelSize',color:'detailsLabelColor',family:'detailsFamily'});
   return object;
 });
 v.cocoCssCompiler.ir=doc;
}
await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
await writeFile(new URL('../lib/template-data/soiree-dream-house-v2.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
