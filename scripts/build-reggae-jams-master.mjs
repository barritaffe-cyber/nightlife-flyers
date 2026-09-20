import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';

const native={presenter:'presenter',headline:'headline',jams:'headline2',time:'time',musicLabel:'djLineupLabel',lineup:'djLineup',hosts:'details',date:'date',venue:'venue',address:'address',contactLabel:'rsvpLabel',contact:'rsvp'};
const companion={
 presents:['presents','presents','presenter'],endTime:['endTime','endTime','date'],
 dressCode:['dressCode','reggaeDress','details'],hostLabel:['detailsLabel','detailsLabel','details'],
 weekday:['weekday','weekday','date'],year:['year','year','date'],motto:['rightRail','rightRail','rightRail'],
 attractions:['footerDetails','reggaeAttractions','details'],
};
const semanticRoles={
 ...Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}])),
 ...Object.fromEntries(Object.entries(companion).map(([id,[semanticRole,text,panel]])=>[id,{semanticRole,text,family:text+'Family',size:text+'Size',color:text+'Color',panel,moveTarget:panel,uiField:panel,mappedControls:true,editable:true}])),
 background:{semanticRole:'background',editable:false},subject:{semanticRole:'subject',editable:true},
};
const fontMap={
 presenter:'LEMONMILK-Bold',headline:'Anton',headline2:'Reggae Jams Script PNG',time:'Bebas Neue',
 djLineupLabel:'LEMONMILK-Bold',djLineup:'Bebas Neue',details:'Bebas Neue',date:'Anton',
 venue:'Bebas Neue',address:'LEMONMILK-Bold',rsvpLabel:'LEMONMILK-Bold',rsvp:'LEMONMILK-Bold',
 presents:'LEMONMILK-Light',endTime:'Bebas Neue',dressCode:'LEMONMILK-Bold',detailsLabel:'LEMONMILK-Bold',
 weekday:'Bebas Neue',year:'Bebas Neue',rightRail:'Bebas Neue',footerDetails:'Bebas Neue',
 RegDisplay:'Anton',RegBold:'LEMONMILK-Bold',RegLight:'LEMONMILK-Light',RegCond:'Bebas Neue',RegScript:'Reggae Jams Script PNG',
};
export const cocoCssMasterAdapter={
 id:'reggae-jams',
 masterPath:new URL('../public/generated-flyers/reggae-jams-master.html',import.meta.url),
 outputPath:new URL('../public/generated-flyers/reggae-jams.nflyer',import.meta.url),
 publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,
 recipe:{id:'reggae-jams',name:'Reggae Jams',version:3,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#070806',bgTo:'#11150d',primary:'#fff0cf',secondary:'#f0bc17',accent:'#079a4e',neutral:'#ffffff'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},
 requiredFonts:['RegDisplay','RegBold','RegLight','RegCond','RegScript'],
 requiredRoles:['presenter','presents','headline','headline2','time','endTime','dressCode','djLineupLabel','djLineup','detailsLabel','details','weekday','date','year','rightRail','venue','address','footerDetails','rsvpLabel','rsvp'],
 semanticRoles,fontMap,
 eventBrief:{eventName:'REGGAE',subtitle:'Jams',presenterName:'NIGHTLIFE',date:'SAT 07 MAR',time:'7PM',djs:'MASTER ICE\nDJ SPANKY',eventDetails:'MC PAGES\nMC PRINCE',venueName:'DUEDUAH 1 HOTEL',address:'AKYEM AWENARE',rsvpContact:'059 782 1413'},
};

export async function buildReggaeJamsMaster(){
 const root=resolve('public');
 const result=await compileCssMaster(cocoCssMasterAdapter);
 for(const v of [result.square,result.story]){
  Object.assign(v,{head2Enabled:true,headline2Enabled:true,presenterEnabled:true,socialHandle:'',socialHandleEnabled:false,priceLabel:'',priceEnabled:false,qrEnabled:false,subtagEnabled:false,rightRailEnabled:true,headShadow:true,headShadowStrength:2,head2Shadow:true,head2ShadowStrength:1,headlineUppercase:true});
  const doc=v.cocoCompositionSystem.compiledDocument;
  doc.objects=doc.objects.map(withCompiledTextSelection).map(o=>{
   if(o.id==='headline')Object.assign(o.paint,{backgroundImage:'url("/generated-flyers/assets/reggae-jams-stucco.svg")',backgroundSize:'100% 100%',backgroundPosition:'50% 50%',backgroundRepeat:'no-repeat',textEffect:'reggae-stucco-v1'});
   if(o.id==='jams'){o.binding.tracking='head2Tracking';o.typography.textTransform='none';}
   if(o.kind==='text')o.binding.pixelHitBounds=true;
   return o;
  });
  v.textFx={...v.textFx,uppercase:true};
  v.head2Fx={...v.head2Fx,uppercase:false,tracking:doc.objects.find(o=>o.id==='jams').typography.letterSpacingEm};
  for(const o of doc.objects){
   if(o.image?.src && !o.image.src.startsWith('data:')){
    const path=decodeURIComponent(new URL(o.image.src,'http://localhost').pathname);
    o.image.src='data:image/webp;base64,'+(await sharp(await readFile(resolve(root,'.'+path))).webp({quality:96}).toBuffer()).toString('base64');
   }
  }
  for(const list of [v.portraits,v.emojiList])for(const asset of list||[]){const o=doc.objects.find(o=>o.id===asset.cocoCompiledObjectId);if(o?.image)asset.url=o.image.src;}
  v.cocoCssCompiler.ir=doc;
 }
 await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
 await writeFile(new URL('../lib/template-data/reggae-jams-v3.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
 console.log(JSON.stringify({output:cocoCssMasterAdapter.outputPath.pathname,square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildReggaeJamsMaster();
