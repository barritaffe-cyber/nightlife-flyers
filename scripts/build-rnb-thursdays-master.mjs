import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {GLASS_HEADLINE_EFFECT,GLASS_HEADLINE_FILL,GLASS_HEADLINE_FONT} from '../lib/coco/glassHeadline.ts';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';
export const cocoCssMasterAdapter={
id:'rnb-thursdays',masterPath:new URL('../public/generated-flyers/rnb-thursdays-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/rnb-thursdays.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,
recipe:{"id": "rnb-thursdays", "name": "R&B Thursdays", "version": 1, "runtime": {"compositionPattern": "center-poster-stack", "styleId": "black-electric", "palette": {"bgFrom": "#001137", "bgTo": "#008caf", "primary": "#a0e5eb", "secondary": "#78e9ff", "accent": "#13bfff", "neutral": "#eaffff"}, "authority": {"layout": {"owner": "recipe-elements"}, "palette": {"owner": "recipe-element-paint"}, "assets": {"owner": "recipe-elements"}, "crop": {"owner": "recipe-background-image"}}, "formats": {"square": {"canvas": {"width": 1080, "height": 1080}}, "story": {"canvas": {"width": 1080, "height": 1920}}}}},
requiredFonts:["RnbSerif", "RnbLight", "RnbRegular", "RnbCond"],requiredRoles:["presenter", "headline", "headline2", "month", "date", "time", "endTime", "footerDetails", "details", "price", "priceLabel", "address", "rsvpLabel", "rsvp"],
semanticRoles:{"presenter": {"semanticRole": "presenter"}, "headline": {"semanticRole": "headline"}, "thursdays": {"semanticRole": "headline2"}, "month": {"semanticRole": "month", "text": "month", "family": "monthFamily", "size": "monthSize", "color": "monthColor", "panel": "date", "moveTarget": "date", "uiField": "date", "mappedControls": true, "editable": true}, "date": {"semanticRole": "date"}, "time": {"semanticRole": "time"}, "endTime": {"semanticRole": "endTime", "text": "endTime", "family": "endTimeFamily", "size": "endTimeSize", "color": "endTimeColor", "panel": "date", "moveTarget": "time", "uiField": "time", "mappedControls": true, "editable": true}, "attractions": {"semanticRole": "footerDetails"}, "recurrence": {"semanticRole": "details"}, "entry": {"semanticRole": "price"}, "entryLabel": {"semanticRole":"priceLabel","text":"priceLabel","family":"priceLabelFamily","size":"priceLabelSize","color":"priceLabelColor","panel":"price","moveTarget":"price","uiField":"priceLabel","mappedControls":true,"editable":true}, "address": {"semanticRole": "address"}, "contactLabel": {"semanticRole": "rsvpLabel"}, "contact": {"semanticRole": "rsvp"}, "background": {"semanticRole": "background", "editable": false}, "subject": {"semanticRole": "subject", "editable": true}},
fontMap:{"presenter": "LEMONMILK-Light", "headline": GLASS_HEADLINE_FONT, "headline2": "LEMONMILK-Light", "month": "Bebas Neue", "date": "LEMONMILK-Regular", "time": "Bebas Neue", "endTime": "Bebas Neue", "footerDetails": "Bebas Neue", "details": "LEMONMILK-Light", "price": "LEMONMILK-Light", "priceLabel": "LEMONMILK-Light", "address": "LEMONMILK-Light", "rsvpLabel": "LEMONMILK-Light", "rsvp": "LEMONMILK-Light", "RnbSerif": GLASS_HEADLINE_FONT, "RnbLight": "LEMONMILK-Light", "RnbRegular": "LEMONMILK-Regular", "RnbCond": "Bebas Neue"},
eventBrief:{"eventName": "R&B", "subtitle": "THURSDAYS", "presenterName": "THE ROXY LOUNGE PRESENTS", "date": "FEB 28", "time": "10PM", "eventDetails": "EACH &\nEVERY\nTHURSDAY", "address": "12, ANYWHERE STR OFF ANY TX 68674", "rsvpContact": "+01234556789"}
};
export async function buildRnbThursdaysMaster(){
 const root=resolve('public');
 const result=await compileCssMaster(cocoCssMasterAdapter);
 for(const [format,v] of Object.entries({square:result.square,story:result.story})){
  v.head2Enabled=true; v.headline2Enabled=true; v.presenterEnabled=true; v.socialHandle=''; v.socialHandleEnabled=false; v.priceLabel='FOR LADIES ONLY'; v.priceEnabled=true; v.qrEnabled=true; v.qrImageUrl=null; v.qrX=84; v.qrY=format==='story'?67:70; v.qrScale=.9; v.subtagEnabled=false;
  const doc=v.cocoCompositionSystem.compiledDocument;
  doc.objects=doc.objects.map(withCompiledTextSelection);
  const headline=doc.objects.find(o=>o.id==='headline');headline.paint.strokeWidthPx=0;headline.paint.textEffect=GLASS_HEADLINE_EFFECT;headline.paint.backgroundImage=GLASS_HEADLINE_FILL;headline.paint.backgroundClip='text';headline.paint.webkitBackgroundClip='text';headline.paint.textShadow='none';headline.paint.filter='none';headline.typography.fontFamily=GLASS_HEADLINE_FONT;headline.typography.fontWeight='700';
  headline.text='R&B';headline.textRuns=[{...headline.textRuns[0],text:'R&B',fontFamily:GLASS_HEADLINE_FONT,runtimeFontFamily:GLASS_HEADLINE_FONT,fontWeight:'700'}];headline.binding.initial={...headline.binding.initial,text:'R&B',family:GLASS_HEADLINE_FONT,tracking:-.07,lineHeight:.85};v.headline='R&B';v.headlineFamily=GLASS_HEADLINE_FONT;v.headTracking=-.07;v.lineHeight=.85;v.textFx={...v.textFx,tracking:-.07,gradient:true,compiledGradientEdited:false};
  for(const o of doc.objects){
   if(o.image?.src){const path=decodeURIComponent(new URL(o.image.src,'http://localhost').pathname);const bytes=await readFile(resolve(root,'.'+path));o.image.src=o.id==='subject'?'data:image/png;base64,'+bytes.toString('base64'):'data:image/webp;base64,'+(await sharp(bytes).webp({quality:96}).toBuffer()).toString('base64');}
  }
  for(const list of [v.portraits,v.emojiList])for(const asset of list||[]){const o=doc.objects.find(o=>o.id===asset.cocoCompiledObjectId);if(o?.image)asset.url=o.image.src;}
  v.cocoCssCompiler.ir=doc;
 }
 await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
 console.log(JSON.stringify({output:cocoCssMasterAdapter.outputPath.pathname,square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildRnbThursdaysMaster();
