import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';
const extra=role=>withCompiledTextSelection({kind:'text',editable:true,semanticRole:role,binding:{semanticRole:role,text:role,family:`${role}Family`,size:`${role}Size`,color:`${role}Color`,x:`${role}X`,y:`${role}Y`,rotation:`${role}Rotation`,align:`${role}Align`,lineHeight:`${role}LineHeight`,editable:true}}).binding;
export const cocoCssMasterAdapter={
 id:'i-love-thursday',masterPath:new URL('../public/generated-flyers/i-love-thursday-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/i-love-thursday.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,
 recipe:{id:'i-love-thursday',name:'I Love Thursday',version:1,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#030303',bgTo:'#080808',primary:'#ffffff',secondary:'#f000b4',accent:'#ff721d',neutral:'#999999'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},
 requiredFonts:['TeddyBrush','TeddyBold','TeddyScript','TeddyBlock'],requiredRoles:["weekday","month","day","dateOrdinal","presenter","headline","headline2","venue","details","price","djLineup","address","rsvp","subtag"],
 semanticRoles:{background:{semanticRole:'background',editable:false},shade:{editable:false},banner:{semanticRole:'decoration',editable:true},rule:{semanticRole:'decoration',editable:true},weekday:extra('weekday'),month:extra('month'),day:extra('day'),ordinal:{...extra('dateOrdinal'),panel:'date',moveTarget:'date',uiField:'date',mappedControls:true},presenter:{semanticRole:'presenter'},headline:{semanticRole:'headline'},thursday:{semanticRole:'headline2'},city:{semanticRole:'venue'},offer:{semanticRole:'details'},prices:{semanticRole:'price'},host:{semanticRole:'djLineup'},address:{semanticRole:'address'},contact:{semanticRole:'rsvp'},brand:{semanticRole:'subtag'}},
 fontMap:{weekday:'Arial',month:'LEMONMILK-Bold',day:'LEMONMILK-Bold',dateOrdinal:'Dear Script (Demo_Font)',presenter:'LEMONMILK-Bold',headline:'Good Brush',headline2:'LEMONMILK-Bold',venue:'Good Brush',details:'Arial',price:'Arial',djLineup:'LEMONMILK-Bold',address:'LEMONMILK-Bold',rsvp:'LEMONMILK-Bold',subtag:'Brigends Expanded',TeddyBrush:'Good Brush',TeddyBold:'LEMONMILK-Bold',TeddyScript:'Dear Script (Demo_Font)',TeddyBlock:'Brigends Expanded'},
 eventBrief:{eventName:'I LOVE',subtitle:'THURSDAY',presenterName:'GRODIFY PRESENTS',date:'22 MAY',eventDetails:'MUJERES GRATIS TODA LA NOCHE',entryFee:'BOTELLAS $150 • CUBETAZOS $25 • HOOKAH $25',djs:'HOSTED BY @GRODIFY',venueName:'FLYERS\nHQ',address:'297 GRODIFY ST • NEW YORK • NY. 07345',rsvpContact:'INFO OR RSVP: 978.000.0000'}
};
export async function buildILoveThursdayMaster(){
 const root=resolve('public');
 const result=await compileCssMaster(cocoCssMasterAdapter);
 for(const v of [result.square,result.story]){
  v.priceLabel=''; v.qrEnabled=false; v.subtagEnabled=true;v.subtagUppercase=false;
  const doc=v.cocoCompositionSystem.compiledDocument;
  for(const o of doc.objects){
   if(o.image?.src){const path=decodeURIComponent(new URL(o.image.src,'http://localhost').pathname);o.image.src='data:image/webp;base64,'+(await sharp(await readFile(resolve(root,'.'+path))).webp({quality:96}).toBuffer()).toString('base64');}
  }
  for(const list of [v.portraits,v.emojiList])for(const asset of list||[]){const o=doc.objects.find(o=>o.id===asset.cocoCompiledObjectId);if(o?.image)asset.url=o.image.src;}
  v.cocoCssCompiler.ir=doc;
 }
 await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
 console.log(JSON.stringify({output:cocoCssMasterAdapter.outputPath.pathname,square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildILoveThursdayMaster();
