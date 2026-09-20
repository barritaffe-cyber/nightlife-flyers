import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { compileCssMaster } from './lib/coco-css-master-compiler.mjs';
import { createPortableCocoProject } from './lib/coco-materializer.mjs';
import { withCompiledTextSelection } from '../lib/coco/compiledTextSelection.ts';
const extra=role=>withCompiledTextSelection({kind:'text',editable:true,semanticRole:role,binding:{semanticRole:role,text:role,family:`${role}Family`,size:`${role}Size`,color:`${role}Color`,x:`${role}X`,y:`${role}Y`,rotation:`${role}Rotation`,align:`${role}Align`,lineHeight:`${role}LineHeight`,editable:true}}).binding;
export const cocoCssMasterAdapter={
 id:'pulse',masterPath:new URL('../public/generated-flyers/pulse-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/pulse.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,
 recipe:{id:'pulse',name:'Pulse Sunday',version:1,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#1b191a',bgTo:'#1b191a',primary:'#e63299',secondary:'#ffffff',accent:'#b11196',neutral:'#999999'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},
 requiredFonts:['PulseBold','PulseLight'],requiredRoles:['headline','headline2','day','month','weekday','price','details','rsvp','address','subtag'],
 semanticRoles:{background:{semanticRole:'background',editable:false},shade:{editable:false},banner:{editable:true},headline:{semanticRole:'headline'},pulse:{semanticRole:'headline2'},day:extra('day'),month:extra('month'),weekday:extra('weekday'),offer:{semanticRole:'price'},details:{semanticRole:'details'},rsvp:{semanticRole:'rsvp'},address:{semanticRole:'address'},terms:{semanticRole:'subtag'},...Object.fromEntries(['ghost-one','ghost-two'].map(id=>[id,{text:'headline',fontFamily:'LEMONMILK-Bold',editable:false}]))},
 fontMap:{PulseBold:'LEMONMILK-Bold',PulseLight:'LEMONMILK-Light',headline:'LEMONMILK-Bold',headline2:'Times New Roman',day:'LEMONMILK-Bold',month:'LEMONMILK-Light',weekday:'LEMONMILK-Light',price:'LEMONMILK-Bold',details:'Times New Roman',rsvp:'LEMONMILK-Bold',address:'Arial',subtag:'LEMONMILK-Light'},
 eventBrief:{eventName:'SUNDAY',subtitle:'PULSE',date:'SUN 14 SEP',entryFee:'ENJOY 15% OFF',eventDetails:'ON ALL MENU ITEMS',rsvpContact:'FOR RESERVATIONS : +971 50 836 2445',address:'CONCORDE CREEK VIEW HOTEL, GROUND FLOOR, AL SEEF, ABRA, BUR DUBAI'}
};
export async function buildPulseMaster(){
 const root=resolve('public');
 const sheet=resolve(root,'generated-flyers/assets/pulse-square-story-bg.png');
 await sharp(sheet).extract({left:9,top:87,width:834,height:834}).resize(1080,1080).png().toFile(resolve(root,'generated-flyers/assets/pulse-square-bg.png'));
 await sharp(sheet).extract({left:950,top:0,width:576,height:1024}).resize(1080,1920).png().toFile(resolve(root,'generated-flyers/assets/pulse-story-bg.png'));
 const result=await compileCssMaster(cocoCssMasterAdapter);
 for(const v of [result.square,result.story]){
  v.priceLabel='';
  v.textFx={...v.textFx,compiledGradientEdited:false,gradFrom:'#3c91c7',gradTo:'#3079a2'};
  const doc=v.cocoCompositionSystem.compiledDocument;
  for(const o of doc.objects.filter(o=>o.id.startsWith('ghost-'))){o.paint.strokeWidthPx=.5;o.paint.strokeColor='#777777';}

  for(const o of doc.objects)if(o.image?.src){const path=decodeURIComponent(new URL(o.image.src,'http://localhost').pathname);o.image.src='data:image/webp;base64,'+(await sharp(await readFile(resolve(root,'.'+path))).webp({quality:96}).toBuffer()).toString('base64');}
  for(const list of [v.portraits,v.emojiList])for(const asset of list||[]){const o=doc.objects.find(o=>o.id===asset.cocoCompiledObjectId);if(o?.image)asset.url=o.image.src;}
  v.cocoCssCompiler.ir=doc;
 }
 await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
 console.log(JSON.stringify({output:cocoCssMasterAdapter.outputPath.pathname,square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildPulseMaster();
