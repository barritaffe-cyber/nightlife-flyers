import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';
export const cocoCssMasterAdapter={
id:'summer-sunset',masterPath:new URL('../public/generated-flyers/summer-sunset-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/summer-sunset.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,
recipe:{"id": "summer-sunset", "name": "Summer Sunset", "version": 1, "runtime": {"compositionPattern": "center-poster-stack", "styleId": "black-electric", "palette": {"bgFrom": "#ffe228", "bgTo": "#9c2e26", "primary": "#ffffff", "secondary": "#ffe000", "accent": "#ffe000", "neutral": "#fff6df"}, "authority": {"layout": {"owner": "recipe-elements"}, "palette": {"owner": "recipe-element-paint"}, "assets": {"owner": "recipe-elements"}, "crop": {"owner": "recipe-background-image"}}, "formats": {"square": {"canvas": {"width": 1080, "height": 1080}}, "story": {"canvas": {"width": 1080, "height": 1920}}}}},requiredFonts:["SummerBold","SummerRegular"],requiredRoles:["presenter", "price", "time", "rsvpLabel", "rsvp", "headline", "subtag", "djLineup", "address", "date", "month"],semanticRoles:{"presenter": {"semanticRole": "presenter"}, "price": {"semanticRole": "price"}, "time": {"semanticRole": "time"}, "contactLabel": {"semanticRole": "rsvpLabel"}, "contact": {"semanticRole": "rsvp"}, "headline": {"semanticRole": "headline"}, "sunset": {"semanticRole": "subtag"}, "djs": {"semanticRole": "djLineup"}, "website": {"semanticRole": "address"}, "date": {"semanticRole": "date"}, "month": {"semanticRole": "month", "text": "month", "family": "monthFamily", "size": "monthSize", "color": "monthColor", "panel": "date", "moveTarget": "date", "uiField": "date", "mappedControls": true, "editable": true}, "background": {"semanticRole": "background", "editable": false}},fontMap:{"presenter": "LEMONMILK-Regular", "price": "LEMONMILK-Regular", "time": "LEMONMILK-Regular", "rsvpLabel": "LEMONMILK-Regular", "rsvp": "LEMONMILK-Regular", "headline": "LEMONMILK-Regular", "subtag": "LEMONMILK-Regular", "djLineup": "LEMONMILK-Regular", "address": "LEMONMILK-Regular", "date": "LEMONMILK-Bold", "month": "LEMONMILK-Regular", "SummerRegular": "LEMONMILK-Regular", "SummerBold": "LEMONMILK-Bold"},eventBrief:{eventName:"SUMMER",subtitle:"SUNSET",date:"JUNE 24"}
};
const result=await compileCssMaster(cocoCssMasterAdapter);
for(const v of [result.square,result.story]){
 v.details="";v.detailsEnabled=false;v.exp=1;v.contrast=1/0.9;v.saturation=1;v.warmth=0;v.tint=0;v.gamma=1;v.grain=0;v.vibrance=0;v.filmGrade=0;
 v.head2Enabled=false;v.headline2Enabled=false;v.head2line="";v.socialHandle='';v.socialHandleEnabled=false;v.qrEnabled=false;v.priceLabel='';v.priceEnabled=true;
 v.venue='';v.venueEnabled=false;v.cocoSocialHandle='';v.cocoSocialHandleEnabled=false;
 const doc=v.cocoCompositionSystem.compiledDocument;doc.objects=doc.objects.map(withCompiledTextSelection);
 const headline=doc.objects.find(o=>o.id==='headline');
 // Keep the authored multiline title anchored across the editor's format callbacks.
 v.cocoCompositionSystem.compiledObjectOverrides={headline:{left:headline.bounds.x,top:headline.bounds.y,x:headline.binding.initial.x,y:headline.binding.initial.y,tracking:headline.binding.initial.tracking,size:headline.binding.initial.size,align:'left'}};
 for(const o of doc.objects)if(o.image?.src){const path=decodeURIComponent(new URL(o.image.src,'http://localhost').pathname);const bytes=await readFile(resolve('public','.'+path));const mime=path.endsWith('.svg')?'image/svg+xml':path.endsWith('.jpg')?'image/jpeg':'image/png';o.image.src='data:'+mime+';base64,'+bytes.toString('base64');}
 for(const list of [v.portraits,v.emojiList])for(const asset of list||[]){const o=doc.objects.find(o=>o.id===asset.cocoCompiledObjectId);if(o?.image)asset.url=o.image.src;}
 v.cocoCssCompiler.ir=doc;
}
await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
console.log(JSON.stringify({output:cocoCssMasterAdapter.outputPath.pathname,square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
