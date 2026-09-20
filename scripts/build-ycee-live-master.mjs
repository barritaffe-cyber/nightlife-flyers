import {access,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';
const native={presenter:'presenter',headline:'headline',subtitle:'headline2',date:'date',time:'time',contact:'details',venue:'venue',address:'address'};
const companions={presents:['presenterLabel','presenter'],day:['weekday','date'],month:['month','date'],ordinal:['ordinal','date'],doors:['timeLabel','date'],brandName:['brandName','details2'],brandCity:['brandCity','details2'],motto:['motto','details2'],contactLabel:['detailsLabel','details'],age:['ageRequirement','details2']};
const semanticRoles={...Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}])),...Object.fromEntries(Object.entries(companions).map(([id,[semanticRole,panel]])=>[id,{semanticRole,text:id==='contactLabel'?'detailsLabel':`yceeLive_${id}`,panel,uiField:id==='contactLabel'?'detailsLabel':panel,moveTarget:panel,mappedControls:true,editable:true}])),background:{semanticRole:'background',editable:false},subject:{semanticRole:'subject',editable:true},ghost:{semanticRole:'portraitEcho',editable:true},...Object.fromEntries(['shade','rDate','rMotto','rVenue','rContact','brandMark'].map(id=>[id,{editable:false}]))};
const fontMap={Gold:'Spotlight Gold PNG',Script:'Dear Script (Demo_Font)',Sans:'LEMONMILK-Light',Wide:'Nexa-Heavy',Condensed:'Bebas Neue',...Object.fromEntries(Object.keys(semanticRoles).map(id=>[id,id==='headline'?'Spotlight Gold PNG':id==='subtitle'?'Dear Script (Demo_Font)':['month','date','ordinal','time'].includes(id)?'Nexa-Heavy':['address','contactLabel','contact','age'].includes(id)?'Bebas Neue':id==='brandName'?'Georgia':'LEMONMILK-Light']))};
export const cocoCssMasterAdapter={id:'ycee-live',masterPath:new URL('../public/generated-flyers/ycee-live-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/ycee-live.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,requiredFonts:['Gold','Script','Sans','Wide','Condensed'],requiredRoles:Object.values(native),semanticRoles,fontMap,
 recipe:{id:'ycee-live',name:'YCEE Live',version:1,summary:'Spotlight gold type, a separate artist portrait and amber concert crowd.',runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#160b04',bgTo:'#58270d',primary:'#f7c46e',secondary:'#fff3dc',accent:'#ef9439',neutral:'#fff3dc'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},eventBrief:{eventName:'YCEE',subtitle:'Live',date:'01',startTime:'8PM',venueName:'TIPSY ABUJA',address:'FIRST FLOOR, ALERO HOUSE, 114 AMINU KANO CRESCENT, WUSE 2, ABUJA'}};
export async function buildYceeLiveMaster(){
 if(await access(new URL('../lib/template-data/ycee-live-saved-source.json',import.meta.url)).then(()=>true,()=>false))throw new Error('YCEE Live has an accepted user save; preserve it instead of rebuilding.');
 const result=await compileCssMaster(cocoCssMasterAdapter);
 const blank="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
 for(const v of [result.square,result.story]){
  Object.assign(v,{backgroundUrl:blank,bgUrl:blank,subtagEnabled:false,rightRailEnabled:false,rightRailLabel:'',presenterEnabled:true,venueEnabled:true,priceEnabled:false,priceLabel:'',qrEnabled:false,qrImageUrl:null,leftRailEnabled:false,leftRail:'',leftRailLabel:'',headShadow:false,headShadowStrength:1,head2Shadow:false,head2ShadowStrength:1,detailsShadow:false,venueShadow:false,socialHandleEnabled:false,cocoSocialHandleEnabled:false,details2Enabled:true,details2:'',djLineupLabel:'',exp:1,contrast:1/.9,saturation:1,warmth:0,tint:0,gamma:1,grain:0,vibrance:0,filmGrade:0});
  const doc=v.cocoCompositionSystem.compiledDocument;
  v.head2Fx={...v.head2Fx,shadowEnabled:false,uppercase:false,tracking:0};
  doc.objects=doc.objects.map(withCompiledTextSelection).map(o=>{
   if(o.kind!=='text')return o;
   o.binding.pixelHitBounds=true;
   if(o.id==='subtitle')o.binding.tracking='head2Tracking';
   if(o.id==='presenter')o.binding.labelObjectId='presents';
   if(o.id==='contact')o.binding.labelObjectId='contactLabel';
   if(o.paint?.backgroundImage)o.paint.backgroundImage=o.paint.backgroundImage.replace(/http:\/\/(?:127\.0\.0\.1|localhost):\d+/g,'');
   return o;
  });
  v.textFx={...v.textFx,uppercase:false};v.headlineUppercase=false;v.cocoCssCompiler.ir=doc;
 }
 await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
 await writeFile(new URL('../lib/template-data/ycee-live-v1.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
 console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildYceeLiveMaster();
