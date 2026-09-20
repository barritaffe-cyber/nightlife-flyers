import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';
const extra=role=>withCompiledTextSelection({kind:'text',editable:true,semanticRole:role,binding:{semanticRole:role,text:role,family:`${role}Family`,size:`${role}Size`,color:`${role}Color`,x:`${role}X`,y:`${role}Y`,rotation:`${role}Rotation`,align:`${role}Align`,lineHeight:`${role}LineHeight`,editable:true}}).binding;
export const cocoCssMasterAdapter={
 id:'amapiano-night',masterPath:new URL('../public/generated-flyers/amapiano-night-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/amapiano-night.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,
 recipe:{id:'amapiano-night',name:'Amapiano Night',version:1,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#210d28',bgTo:'#100518',primary:'#ffdb96',secondary:'#b9a16b',accent:'#c12eff',neutral:'#ffffff'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},
 requiredFonts:['AmaScript','AmaBold'],requiredRoles:["presenter", "presents", "headline", "headline2", "date", "djLineupLabel", "djLineup", "hostLabel", "hostMC", "detailsLabel", "details", "venue", "address", "rsvpLabel", "rsvp"],
 semanticRoles:{"paperTear": {"semanticRole": "decoration", "editable": true}, "footerBacking": {"semanticRole": "decoration", "editable": true}, "presenter": {"semanticRole": "presenter"}, "presents": {"semanticRole": "presents", "text": "presents", "family": "presentsFamily", "size": "presentsSize", "color": "presentsColor", "panel": "presenter", "moveTarget": "presenter", "uiField": "presenter", "mappedControls": true, "editable": true}, "headline": {"semanticRole": "headline"}, "night": {"semanticRole": "headline2"}, "date": {"semanticRole": "date"}, "musicLabel": {"semanticRole": "djLineupLabel", "text": "djLineupLabel", "family": "djLineupLabelFamily", "size": "djLineupLabelSize", "color": "djLineupLabelColor", "panel": "details2", "moveTarget": "details2", "uiField": "djLineupLabel", "mappedControls": true, "editable": true}, "lineup": {"semanticRole": "djLineup"}, "hostLabel": {"semanticRole": "hostLabel", "text": "detailsLabel", "family": "detailsLabelFamily", "size": "detailsLabelSize", "color": "detailsLabelColor", "panel": "details", "moveTarget": "details", "uiField": "detailsLabel", "mappedControls": true, "editable": true}, "hosts": {"semanticRole": "hostMC", "text": "hostsText", "family": "hostsFamily", "size": "hostsSize", "color": "hostsColor", "panel": "details", "moveTarget": "details", "uiField": "details", "mappedControls": true, "editable": true}, "offerLabel": {"semanticRole": "detailsLabel", "text": "offerLabel", "family": "offerLabelFamily", "size": "offerLabelSize", "color": "offerLabelColor", "panel": "details", "moveTarget": "details", "uiField": "detailsLabel", "mappedControls": true, "editable": true}, "offer": {"semanticRole": "details", "text": "offerText", "family": "offerFamily", "size": "offerSize", "color": "offerColor", "panel": "details", "moveTarget": "details", "uiField": "details", "mappedControls": true, "editable": true}, "venue": {"semanticRole": "venue"}, "address": {"semanticRole": "address"}, "contactLabel": {"semanticRole": "rsvpLabel"}, "contact": {"semanticRole": "rsvp"}, "background": {"semanticRole": "background", "editable": false}, "divider": {"semanticRole": "decoration", "editable": true}},
 fontMap:{"hostMC":"LEMONMILK-Bold","hostLabel":"LEMONMILK-Bold","presenter": "LEMONMILK-Bold", "presents": "LEMONMILK-Bold", "headline": "Lacheyard Script", "headline2": "LEMONMILK-Bold", "date": "LEMONMILK-Bold", "djLineupLabel": "LEMONMILK-Bold", "djLineup": "LEMONMILK-Bold", "detailsLabel": "LEMONMILK-Bold", "details": "LEMONMILK-Bold", "offerLabel": "LEMONMILK-Bold", "footerDetails": "LEMONMILK-Bold", "venue": "LEMONMILK-Bold", "address": "LEMONMILK-Bold", "rsvpLabel": "LEMONMILK-Bold", "rsvp": "LEMONMILK-Bold", "AmaScript": "Lacheyard Script", "AmaBold": "LEMONMILK-Bold"},
 eventBrief:{"eventName": "Amapiano", "subtitle": "Night", "presenterName": "ABISCO\nEVENTS", "date": "5TH OCTOBER", "djs": "DJ AB\nDJ Sky\nDJ Breezy", "eventDetails": "MC Zigimba\nMC Phatbone", "venueName": "YOROGO", "address": "OPP. SOCIAL CENTER, BOLGA\n\u2013 BONGO ROAD", "rsvpContact": "0553388379\n0540750039"}
};
export async function buildAmapianoNightMaster(){
 const root=resolve('public');
 const result=await compileCssMaster(cocoCssMasterAdapter);
 for(const v of [result.square,result.story]){
  v.head2Enabled=true; v.headline2Enabled=true; v.presenterEnabled=true; v.socialHandle=''; v.socialHandleEnabled=false; v.priceLabel=''; v.priceEnabled=false; v.qrEnabled=false; v.subtag=''; v.subtagEnabled=false;
  const doc=v.cocoCompositionSystem.compiledDocument;
  for(const o of doc.objects){
   if(o.id==='headline'){o.paint.strokeWidthPx=2.5;o.paint.strokeColor='#ffffff';o.paint.textShadow='rgb(0, 0, 0) 5px 6px 0px';}
   if(o.image?.src){const path=decodeURIComponent(new URL(o.image.src,'http://localhost').pathname);o.image.src='data:image/webp;base64,'+(await sharp(await readFile(resolve(root,'.'+path))).webp({quality:96}).toBuffer()).toString('base64');}
  }
  for(const list of [v.portraits,v.emojiList])for(const asset of list||[]){const o=doc.objects.find(o=>o.id===asset.cocoCompiledObjectId);if(o?.image)asset.url=o.image.src;}
  v.cocoCssCompiler.ir=doc;
 }
 await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
 console.log(JSON.stringify({output:cocoCssMasterAdapter.outputPath.pathname,square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildAmapianoNightMaster();
