import {writeFile,access} from 'node:fs/promises';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';

const native={headline:'headline',subtitle:'headline2',presenter:'presenter',date:'date',venue:'venue',address:'address',genres:'details',description:'footerDetails'};
const companions={"day": ["day", "date", "date"], "month": ["month", "date", "date"], "price1": ["price1", "details", "details"], "price2": ["price2", "details", "details"], "price3": ["price3", "details", "details"], "item1": ["item1", "details", "details"], "item2": ["item2", "details", "details"], "item3": ["item3", "details", "details"], "motto": ["motto", "details", "details"], "detailsLabel": ["detailsLabel", "details", "detailsLabel"]};
const semanticRoles={...Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}])),...Object.fromEntries(Object.entries(companions).map(([id,[semanticRole,panel,uiField]])=>[id,{semanticRole,text:id==='detailsLabel'?'detailsLabel':`tacoTuesday_${id}`,panel,uiField,moveTarget:panel,mappedControls:true,editable:true}]))};
const fontMap={Gold:'Textured Gold Serif PNG',Script:'Dear Script (Demo_Font)',TieSerif:'Didot',Condensed:'Bebas Neue',Sans:'LEMONMILK-Light',...Object.fromEntries(Object.keys(semanticRoles).map(id=>[id,id==='headline'?'Textured Gold Serif PNG':['subtitle','motto'].includes(id)?'Dear Script (Demo_Font)':['day','month','date','venue'].includes(id)?'Didot':/^(price|item)/.test(id)?'Bebas Neue':'LEMONMILK-Light']))};
export const cocoCssMasterAdapter={
 id:'taco-tuesday',masterPath:new URL('../public/generated-flyers/taco-tuesday-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/taco-tuesday.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,requiredFonts:['Gold','Script','TieSerif','Condensed','Sans'],requiredRoles:Object.values(native),semanticRoles,fontMap,
 recipe:{id:'taco-tuesday',name:'Taco Tuesday — Velvet Room',version:2,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#070707',bgTo:'#171714',primary:'#f9f6eb',secondary:'#aaa69b',accent:'#dcc38e',neutral:'#edece5'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},eventBrief:{eventName:'TACO',subtitle:'Tuesday',date:'12'}
};
if(await access(new URL('../lib/template-data/taco-tuesday-saved-source.json',import.meta.url)).then(()=>true,()=>false))throw Error('Taco Tuesday has an accepted user save; preserve it instead of rebuilding.');
const result=await compileCssMaster(cocoCssMasterAdapter);
const blank="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
for(const v of [result.square,result.story]){
 Object.assign(v,{backgroundUrl:blank,bgUrl:blank,subtagEnabled:false,rightRailEnabled:true,rightRailLabel:'',presenterEnabled:true,priceEnabled:false,priceLabel:'',qrEnabled:false,qrImageUrl:null,qrX:89,qrY:v===result.story?92:85,qrScale:6.5/11,leftRailEnabled:false,leftRail:'',leftRailLabel:'',headShadow:false,detailsShadow:false,venueShadow:false,socialHandleEnabled:false,cocoSocialHandleEnabled:false,details2Enabled:false,details2:'',djLineupLabel:'',exp:1,contrast:1/.9,saturation:1,warmth:0,tint:0,gamma:1,grain:0,vibrance:0,filmGrade:0});
 const doc=v.cocoCompositionSystem.compiledDocument;
 // The extractor decomposes R*Scale*Skew; the editor renders R*Skew*Scale.
 // Convert the shear so skewY plus condensed width preserves the source matrix.
 for(const object of doc.objects){
  const t=object.transform;
  if(t?.skewX)t.skewX=Math.atan(Math.tan(t.skewX*Math.PI/180)*(t.scaleX??1)/(t.scaleY??1))*180/Math.PI;
 }

 // Use the editor QR overlay so its upload/replace controls remain available.
 doc.objects=doc.objects.filter(object=>object.id!=='qrPlaceholder');
 for(const key of ['portraits','emojiList'])v[key]=(v[key]||[]).filter(object=>!String(object.id).endsWith('_qrPlaceholder'));
 // The extractor omits empty text; author its canvas owner explicitly.
 const body=doc.objects.find(object=>object.id==='genres');
 const bounds={x:7,y:v===result.story?77:55,width:45,height:2};
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
await writeFile(new URL('../lib/template-data/taco-tuesday-v2.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
