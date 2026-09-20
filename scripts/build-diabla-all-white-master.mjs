import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';
export const cocoCssMasterAdapter={
id:'diabla-all-white',masterPath:new URL('../public/generated-flyers/diabla-all-white-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/diabla-all-white.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,
recipe:{"id": "diabla-all-white", "name": "Diabla All White", "version": 1, "runtime": {"compositionPattern": "center-poster-stack", "styleId": "black-electric", "palette": {"bgFrom": "#fffaf1", "bgTo": "#ece3d4", "primary": "#a77524", "secondary": "#6f471a", "accent": "#e4bc69", "neutral": "#4d4945"}, "authority": {"layout": {"owner": "recipe-elements"}, "palette": {"owner": "recipe-element-paint"}, "assets": {"owner": "recipe-elements"}, "crop": {"owner": "recipe-background-image"}}, "formats": {"square": {"canvas": {"width": 1080, "height": 1080}}, "story": {"canvas": {"width": 1080, "height": 1920}}}}},requiredFonts:["DiablaSerif","DiablaScript"],requiredRoles:["time", "month", "date", "details", "djLineup", "price", "headline", "headline2", "subtag", "footerDetails"],semanticRoles:{"weekday": {"semanticRole": "time"}, "month": {"semanticRole": "month", "text": "month", "family": "monthFamily", "size": "monthSize", "color": "monthColor", "panel": "date", "moveTarget": "date", "uiField": "date", "mappedControls": true, "editable": true}, "date": {"semanticRole": "date"}, "genres": {"semanticRole": "details"}, "mood": {"semanticRole": "djLineup"}, "dress": {"semanticRole": "price"}, "headline": {"semanticRole": "headline"}, "script": {"semanticRole": "headline2"}, "tagline": {"semanticRole": "subtag"}, "footer": {"semanticRole": "footerDetails"}, "background": {"semanticRole": "background", "editable": false}, "crown": {"semanticRole": "decoration", "editable": true}},fontMap:{"time": "Didot", "month": "Didot", "date": "Didot", "details": "Didot", "djLineup": "Didot", "price": "Didot", "headline": "Didot", "headline2": "Dear Script (Demo_Font)", "subtag": "Didot", "footerDetails": "Didot", "DiablaSerif": "Didot", "DiablaScript": "Dear Script (Demo_Font)"},eventBrief:{eventName:"DIABLA",subtitle:"All White",date:"OCT 05",time:"SAT"}
};
const result=await compileCssMaster(cocoCssMasterAdapter);
for(const v of [result.square,result.story]){
 v.exp=1;v.contrast=1/0.9;v.saturation=1;v.warmth=0;v.tint=0;v.gamma=1;v.grain=0;v.vibrance=0;v.filmGrade=0;
 v.head2Enabled=true;v.headline2Enabled=true;v.socialHandle='';v.socialHandleEnabled=false;v.qrEnabled=false;v.priceLabel='';v.priceEnabled=true;
 v.presenter='';v.presenterEnabled=false;v.venue='';v.venueEnabled=false;v.venueAddress='';v.leftRail='';v.leftRailEnabled=false;v.leftRailLabel='';v.cocoSocialHandle='';v.cocoSocialHandleEnabled=false;
 const doc=v.cocoCompositionSystem.compiledDocument;doc.objects=doc.objects.map(withCompiledTextSelection);
 for(const o of doc.objects)if(o.image?.src){const path=decodeURIComponent(new URL(o.image.src,'http://localhost').pathname);const bytes=await readFile(resolve('public','.'+path));const mime=path.endsWith('.svg')?'image/svg+xml':path.endsWith('.jpg')?'image/jpeg':'image/png';o.image.src='data:'+mime+';base64,'+bytes.toString('base64');}
 for(const list of [v.portraits,v.emojiList])for(const asset of list||[]){const o=doc.objects.find(o=>o.id===asset.cocoCompiledObjectId);if(o?.image)asset.url=o.image.src;}
 v.cocoCssCompiler.ir=doc;
}
await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
console.log(JSON.stringify({output:cocoCssMasterAdapter.outputPath.pathname,square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
