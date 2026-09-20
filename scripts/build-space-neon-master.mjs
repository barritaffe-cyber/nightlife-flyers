import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';
const extra=role=>withCompiledTextSelection({kind:'text',editable:true,semanticRole:role,binding:{semanticRole:role,text:role,family:`${role}Family`,size:`${role}Size`,color:`${role}Color`,x:`${role}X`,y:`${role}Y`,rotation:`${role}Rotation`,align:`${role}Align`,lineHeight:`${role}LineHeight`,editable:true}}).binding;
export const cocoCssMasterAdapter={
 id:'space-neon',masterPath:new URL('../public/generated-flyers/space-neon-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/space-neon.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,
 recipe:{id:'space-neon',name:'Space Neon',version:1,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#08091b',bgTo:'#08091b',primary:'#ff3187',secondary:'#ffffff',accent:'#2739ef',neutral:'#999999'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},
 requiredFonts:['SpaceWide','SpaceScript','SpaceNarrow','SpaceBold'],requiredRoles:['headline','headline2','presenter','day','month','details','djLineup','price','subtag','address','rsvp','footerDetails'],
 semanticRoles:{background:{semanticRole:'background',editable:false},shade:{editable:false},subject:{semanticRole:'subject',editable:true},presenter:{semanticRole:'presenter'},day:extra('day'),month:extra('month'),guestLabel:{semanticRole:'footerDetails'},guest:{semanticRole:'details'},offer:{semanticRole:'price'},lineup:{semanticRole:'djLineup'},headline:{semanticRole:'headline'},space:{semanticRole:'headline2'},subtag:{semanticRole:'subtag'},address:{semanticRole:'address'},contact:{semanticRole:'rsvp'}},
 fontMap:{SpaceWide:'Brigends Expanded',SpaceScript:'Dear Script (Demo_Font)',SpaceNarrow:'Bebas Neue',SpaceBold:'LEMONMILK-Bold',headline:'Brigends Expanded',headline2:'Dear Script (Demo_Font)',presenter:'Bebas Neue',day:'LEMONMILK-Bold',month:'Dear Script (Demo_Font)',details:'LEMONMILK-Bold',djLineup:'Bebas Neue',price:'Brigends Expanded',subtag:'Brigends Expanded',address:'Bebas Neue',rsvp:'Bebas Neue',footerDetails:'Dear Script (Demo_Font)'},
 eventBrief:{eventName:'NEON',subtitle:'Space',presenter:'GET READY FOR MADNESS',date:'12 APRIL',entryFee:'FREE DRINKS',eventDetails:'DJ MISTER\nBOBBA',djLineup:'DJ MEGATRON\nGALAXY FIGHTERS\nSTAR TROOPER\nDJ DRILLEX',address:'NEW-YORK CITY, 23, ECHOLOTE STREET, THE GRAND BIG BUILDING',rsvpContact:'SOCIAL: @ASTRONAUT, WEB: SPACEMAN.COM'}
};
export async function buildSpaceNeonMaster(){
 const root=resolve('public');
 const sheet=resolve(root,'generated-flyers/assets/space-assets.png');
 // Extract supplied artwork panels; their labels and sheet dividers are outside these bounds.
 await sharp(sheet).extract({left:0,top:170,width:493,height:647}).resize(1080,1080,{fit:'cover'}).png().toFile(resolve(root,'generated-flyers/assets/space-neon-square-bg.png'));
 await sharp(sheet).extract({left:498,top:34,width:406,height:990}).resize(1080,1920,{fit:'cover'}).png().toFile(resolve(root,'generated-flyers/assets/space-neon-story-bg.png'));
 const result=await compileCssMaster(cocoCssMasterAdapter);
 for(const v of [result.square,result.story]){
  v.priceLabel=''; v.qrEnabled=false;
  const doc=v.cocoCompositionSystem.compiledDocument;
  for(const o of doc.objects){
   if(['headline','day'].includes(o.id)){o.paint.strokeWidthPx=o.id==='headline'?1.5:1;o.paint.strokeColor='#ff3187';}
   if(o.image?.src){const path=decodeURIComponent(new URL(o.image.src,'http://localhost').pathname);o.image.src='data:image/webp;base64,'+(await sharp(await readFile(resolve(root,'.'+path))).webp({quality:96}).toBuffer()).toString('base64');}
  }
  for(const list of [v.portraits,v.emojiList])for(const asset of list||[]){const o=doc.objects.find(o=>o.id===asset.cocoCompiledObjectId);if(o?.image)asset.url=o.image.src;}
  v.cocoCssCompiler.ir=doc;
 }
 await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
 console.log(JSON.stringify({output:cocoCssMasterAdapter.outputPath.pathname,square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildSpaceNeonMaster();
