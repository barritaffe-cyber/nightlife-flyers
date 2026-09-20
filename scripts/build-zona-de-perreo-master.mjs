import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';
const extra=role=>withCompiledTextSelection({kind:'text',editable:true,semanticRole:role,binding:{semanticRole:role,text:role,family:`${role}Family`,size:`${role}Size`,color:`${role}Color`,x:`${role}X`,y:`${role}Y`,rotation:`${role}Rotation`,align:`${role}Align`,lineHeight:`${role}LineHeight`,editable:true}}).binding;
export const cocoCssMasterAdapter={
 id:'zona-de-perreo',masterPath:new URL('../public/generated-flyers/zona-de-perreo-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/zona-de-perreo.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,
 recipe:{id:'zona-de-perreo',name:'Zona de Perreo',version:1,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#210d28',bgTo:'#100518',primary:'#ffdb96',secondary:'#b9a16b',accent:'#c12eff',neutral:'#ffffff'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},
 requiredFonts:['ZonaBrush','ZonaCondensed'],requiredRoles:["weekday", "date", "headline", "djLineupLabel", "djLineup", "venue", "subtag", "details", "time", "endTime", "address", "compliance"],
 semanticRoles:{"weekday": extra("weekday"), "date": {"semanticRole": "date"}, "headline": {"semanticRole": "headline"}, "musicLabel": {"semanticRole": "djLineupLabel", "text": "djLineupLabel", "family": "djLineupLabelFamily", "size": "djLineupLabelSize", "color": "djLineupLabelColor", "panel": "details2", "moveTarget": "details2", "uiField": "djLineupLabel", "mappedControls": true, "editable": true}, "lineup": {"semanticRole": "djLineup"}, "venue": {"semanticRole": "venue"}, "bar": {"semanticRole": "subtag"}, "details": {"semanticRole": "details"}, "start": {"semanticRole": "time"}, "end": extra("endTime"), "address": {"semanticRole": "address"}, "age": {"semanticRole": "compliance"}, "background": {"semanticRole": "background", "editable": false}, "shade": {"editable": false}, "rule": {"semanticRole": "decoration", "editable": true}},
 fontMap:{"weekday": "Arial", "date": "Arial", "headline": "Good Brush", "djLineupLabel": "Bebas Neue", "djLineup": "Bebas Neue", "venue": "Arial", "subtag": "Arial", "details": "Bebas Neue", "time": "Bebas Neue", "endTime": "Bebas Neue", "address": "Arial", "compliance": "Arial", "ZonaBrush": "Good Brush", "ZonaCondensed": "Bebas Neue"},
 eventBrief:{"eventName": "ZONA DE\nPERREO", "date": "JUNE . 12 . 26", "djs": "DJ TOUCH", "venueName": "baressito", "address": "1322 3RD AVE. CHULA VISTA CA 91911", "eventDetails": "FREE COVER UNTIL 10PM\nBOTTLE SERVICE AVAILABLE"}
};
export async function buildZonaDePerreoMaster(){
 const root=resolve('public');
 const result=await compileCssMaster(cocoCssMasterAdapter);
 for(const v of [result.square,result.story]){
  v.head2line=''; v.head2=''; v.head2Enabled=false; v.headline2Enabled=false; v.presenter=''; v.presenterEnabled=false; v.socialHandle=''; v.socialHandleEnabled=false; v.rsvp=''; v.rsvpEnabled=false;
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
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildZonaDePerreoMaster();
