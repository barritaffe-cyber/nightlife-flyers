import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';
const extra=role=>withCompiledTextSelection({kind:'text',editable:true,semanticRole:role,binding:{semanticRole:role,text:role,family:`${role}Family`,size:`${role}Size`,color:`${role}Color`,x:`${role}X`,y:`${role}Y`,rotation:`${role}Rotation`,align:`${role}Align`,lineHeight:`${role}LineHeight`,editable:true}}).binding;
export const cocoCssMasterAdapter={
 id:'we-outside',masterPath:new URL('../public/generated-flyers/we-outside-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/we-outside.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,
 recipe:{id:'we-outside',name:'We Outside Saturday',version:1,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#8c00a3',bgTo:'#8c00a3',primary:'#ed00f5',secondary:'#ffffff',accent:'#fa81ef',neutral:'#201027'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},
 requiredFonts:['OutsideHeavy','OutsideScript','OutsideNarrow','OutsideWide'],requiredRoles:['headline','headline2','presenter','day','weekday','time','subtag','details','djLineup','address','compliance','footerDetails'],
 semanticRoles:{background:{semanticRole:'background',editable:false},shade:{editable:false},clockRing:{editable:false},clockFill:{editable:false},weBadge:{semanticRole:'badge',editable:true},we:{semanticRole:'subtag'},divider:{semanticRole:'decoration',editable:true},brand:{semanticRole:'footerDetails'},presenter:{semanticRole:'presenter'},day:extra('day'),weekday:extra('weekday'),time:{semanticRole:'time'},headline:{semanticRole:'headline'},script:{semanticRole:'headline2'},host:{semanticRole:'details'},lineup:{semanticRole:'djLineup'},address:{semanticRole:'address'},legal:{semanticRole:'compliance'}},
 fontMap:{OutsideHeavy:'Anton',OutsideScript:'Dear Script (Demo_Font)',OutsideNarrow:'Bebas Neue',OutsideWide:'LEMONMILK-Bold',headline:'Anton',headline2:'Dear Script (Demo_Font)',presenter:'Bebas Neue',day:'Anton',weekday:'Dear Script (Demo_Font)',time:'Anton',subtag:'Anton',details:'Bebas Neue',djLineup:'Bebas Neue',address:'LEMONMILK-Bold',compliance:'Bebas Neue',footerDetails:'LEMONMILK-Bold',rsvp:'Arial'},
 eventBrief:{eventName:'OUTSIDE',subtitle:'Saturday',presenterName:'DEON’S CAVE',date:'SAT 12',startTime:'9PM',eventDetails:'HYPE MAN PHYNO',djs:'DJ WAVY | DJ MARVEL',address:'NO 7 BROS JOHN OKOYO STREET\nOFF PZ ROAD BY SAPELE ROAD BENIN CITY'}
};
export async function buildWeOutsideMaster(){
 const root=resolve('public');
 const sheet=resolve(root,'generated-flyers/purple-square-story.png');
 await sharp(sheet).extract({left:5,top:113,width:894,height:874}).resize(1080,1080,{fit:'cover'}).png().toFile(resolve(root,'generated-flyers/assets/we-outside-square-bg.png'));
 await sharp(sheet).extract({left:912,top:0,width:624,height:1024}).resize(1080,1920,{fit:'cover'}).png().toFile(resolve(root,'generated-flyers/assets/we-outside-story-bg.png'));
 const result=await compileCssMaster(cocoCssMasterAdapter);
 for(const v of [result.square,result.story]){
  v.subtagEnabled=true;v.subtagUppercase=false;v.qrEnabled=false;v.priceEnabled=false;v.leftRailEnabled=false;v.leftRail='';v.leftRailLabel='';v.textFx={...v.textFx,compiledGradientEdited:false};
  const doc=v.cocoCompositionSystem.compiledDocument;
  for(const o of doc.objects)if(o.image?.src){const path=decodeURIComponent(new URL(o.image.src,'http://localhost').pathname);const bytes=await readFile(resolve(root,'.'+path));o.image.src=path.endsWith('.svg')?'data:image/svg+xml;base64,'+bytes.toString('base64'):'data:image/webp;base64,'+(await sharp(bytes).webp({quality:96}).toBuffer()).toString('base64');}
  for(const list of [v.portraits,v.emojiList])for(const asset of list||[]){if(asset.cocoCompiledObjectId==='divider'){asset.hitTestMode='alpha-envelope';asset.isSeparator=true;}const o=doc.objects.find(o=>o.id===asset.cocoCompiledObjectId);if(o?.image)asset.url=o.image.src;}
  v.cocoCssCompiler.ir=doc;
 }
 await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
 console.log(JSON.stringify({output:cocoCssMasterAdapter.outputPath.pathname,square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildWeOutsideMaster();
