import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';
const extra=role=>withCompiledTextSelection({kind:'text',editable:true,semanticRole:role,binding:{semanticRole:role,text:role,family:`${role}Family`,size:`${role}Size`,color:`${role}Color`,x:`${role}X`,y:`${role}Y`,rotation:`${role}Rotation`,align:`${role}Align`,lineHeight:`${role}LineHeight`,editable:true}}).binding;
export const cocoCssMasterAdapter={
 id:'como-una-boa',masterPath:new URL('../public/generated-flyers/como-una-boa-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/como-una-boa.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,
 recipe:{id:'como-una-boa',name:'Como Una Boa',version:1,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#020d08',bgTo:'#020d08',primary:'#ffd124',secondary:'#ffffff',accent:'#00b886',neutral:'#193d23'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},
 requiredFonts:['BoaHeavy','BoaBold'],requiredRoles:["presenter","presents","headline2","headline","weekday","day","month","rsvp","djLineup","footerDetails","details","subtag","addressLabel","address"],
 semanticRoles:{background:{semanticRole:'background',editable:false},shade:{editable:false},presenter:{semanticRole:'presenter'},presents:extra('presents'),prefix:{semanticRole:'headline2'},headline:{semanticRole:'headline'},weekday:extra('weekday'),day:extra('day'),month:extra('month'),lineupLabel:{semanticRole:'rsvp'},lineup:{semanticRole:'djLineup'},hostLabel:{semanticRole:'footerDetails'},host:{semanticRole:'details'},sponsors:{semanticRole:'subtag'},addressLabel:{...extra('addressLabel'),panel:'venue',moveTarget:'venue',uiField:'venueAddress',mappedControls:true},address:{semanticRole:'address'}},
 fontMap:{"presenter":"Arial","presents":"Arial","headline2":"LEMONMILK-Bold","headline":"Anton","weekday":"LEMONMILK-Bold","day":"LEMONMILK-Bold","month":"LEMONMILK-Bold","rsvp":"LEMONMILK-Bold","djLineup":"LEMONMILK-Bold","footerDetails":"LEMONMILK-Bold","details":"LEMONMILK-Bold","subtag":"Georgia","addressLabel":"LEMONMILK-Bold","address":"Arial","BoaHeavy":"Anton","BoaBold":"LEMONMILK-Bold","BoaWide":"Brigends Expanded"},
 eventBrief:{eventName:'BOA',subtitle:'COMO UNA',presenterName:'GROCreative',date:'08 FEB',djs:'DJ CRIS\nDJ NEXT',eventDetails:'PABLO\nLORET',address:'SANTA LUCÍA #178 B - CENTRO, PIURA'}
};
export async function buildComoUnaBoaMaster(){
 const root=resolve('public');
 const result=await compileCssMaster(cocoCssMasterAdapter);
 for(const v of [result.square,result.story]){
  v.priceLabel=''; v.qrEnabled=false; v.subtagEnabled=true;v.subtagUppercase=false;v.priceEnabled=false;
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
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildComoUnaBoaMaster();
