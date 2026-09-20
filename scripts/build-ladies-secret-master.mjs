import {writeFile,access} from 'node:fs/promises';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';

const native={headline:'headline',subtitle:'headline2',presenter:'presenter',date:'date',venue:'venue',address:'address',genres:'details',description:'footerDetails'};
const companions={"day": ["day", "date", "date"], "month": ["month", "date", "date"], "year": ["year", "date", "date"], "detailsLabel": ["detailsLabel", "details", "detailsLabel"], "mood": ["mood", "details", "details"], "motto": ["motto", "details", "details"], "musicBy": ["musicBy", "details", "details"], "dj1": ["dj1", "details", "details"], "dj2": ["dj2", "details", "details"], "dj3": ["dj3", "details", "details"], "drink": ["drink", "details", "details"], "vip": ["vip", "details", "details"], "vibes": ["vibes", "details", "details"], "qrCaption": ["qrCaption", "details", "details"]};
const semanticRoles={...Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}])),...Object.fromEntries(Object.entries(companions).map(([id,[semanticRole,panel,uiField]])=>[id,{semanticRole,text:id==='detailsLabel'?'detailsLabel':`ladiesSecret_${id}`,panel,uiField,moveTarget:panel,mappedControls:true,editable:true}]))};
const fontMap={Chrome:'Ladies Neon Chrome PNG',Script:'Dear Script (Demo_Font)',TieSerif:'Didot',Condensed:'Bebas Neue',Sans:'LEMONMILK-Light',...Object.fromEntries(Object.keys(semanticRoles).map(id=>[id,id==='headline'?'Ladies Neon Chrome PNG':id==='motto'?'Dear Script (Demo_Font)':id==='date'?'Didot':['month','dj1','dj2','dj3'].includes(id)?'Bebas Neue':'LEMONMILK-Light']))};
export const cocoCssMasterAdapter={
 id:'ladies-secret',masterPath:new URL('../public/generated-flyers/ladies-secret-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/ladies-secret.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,requiredFonts:['Chrome','Script','TieSerif','Condensed','Sans'],requiredRoles:Object.values(native),semanticRoles,fontMap,
 recipe:{id:'ladies-secret',name:'Ladies Night — Neon Chrome',version:2,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#070707',bgTo:'#171714',primary:'#f9f6eb',secondary:'#aaa69b',accent:'#dcc38e',neutral:'#edece5'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},eventBrief:{eventName:'LADIES',subtitle:'NIGHT',date:'05'}
};
if(await access(new URL('../lib/template-data/ladies-secret-saved-source.json',import.meta.url)).then(()=>true,()=>false))throw Error('Ladies Night has an accepted user save; preserve it instead of rebuilding.');
const result=await compileCssMaster(cocoCssMasterAdapter);
const blank="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
for(const v of [result.square,result.story]){
 Object.assign(v,{backgroundUrl:blank,bgUrl:blank,subtagEnabled:false,rightRailEnabled:true,rightRailLabel:'',presenterEnabled:true,priceEnabled:false,priceLabel:'',qrEnabled:true,qrImageUrl:null,qrX:v===result.story?84:80,qrY:v===result.story?92:88.4,qrScale:6.5/11,leftRailEnabled:false,leftRail:'',leftRailLabel:'',headShadow:false,detailsShadow:false,venueShadow:false,socialHandleEnabled:false,cocoSocialHandleEnabled:false,details2Enabled:false,details2:'',djLineupLabel:'',exp:1,contrast:1/.9,saturation:1,warmth:0,tint:0,gamma:1,grain:0,vibrance:0,filmGrade:0});
 const doc=v.cocoCompositionSystem.compiledDocument;
 // Use the editor QR overlay so its upload/replace controls remain available.
 doc.objects=doc.objects.filter(object=>object.id!=='qrPlaceholder');
 for(const key of ['portraits','emojiList'])v[key]=(v[key]||[]).filter(object=>!String(object.id).endsWith('_qrPlaceholder'));
 const label=doc.objects.find(object=>object.id==='detailsLabel');
 v.detailsLabel=label.text;v.detailsLabelSize=label.typography.fontSizePx;v.detailsLabelColor='#ff2382';
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
await writeFile(new URL('../lib/template-data/ladies-secret-v2.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
