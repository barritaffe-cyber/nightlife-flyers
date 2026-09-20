import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {pathToFileURL} from 'node:url';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';
const extra=role=>withCompiledTextSelection({kind:'text',editable:true,semanticRole:role,binding:{semanticRole:role,text:role,family:`${role}Family`,size:`${role}Size`,color:`${role}Color`,x:`${role}X`,y:`${role}Y`,rotation:`${role}Rotation`,align:`${role}Align`,lineHeight:`${role}LineHeight`,editable:true}}).binding;
export const cocoCssMasterAdapter={
 id:'elite-monday',masterPath:new URL('../public/generated-flyers/elite-monday-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/elite-monday.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,
 recipe:{id:'elite-monday',name:'Elite Monday',version:1,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#030b13',bgTo:'#030b13',primary:'#aeb2b4',secondary:'#ffffff',accent:'#328bb0',neutral:'#111927'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},
 requiredFonts:['EliteCondensed','EliteBold'],requiredRoles:['presenter','subtag','headline','details','djLineup','footerDetails','headline2','venue','day','weekday','month','time','timeConnector','rsvp','address'],
 semanticRoles:{background:{semanticRole:'background',editable:false},shade:{editable:false},subject:{semanticRole:'subject',editable:true},djFrame:{semanticRole:'decoration',editable:true},rule:{semanticRole:'decoration',editable:true},brand:{semanticRole:'presenter'},tagline:{semanticRole:'subtag'},headline:{semanticRole:'headline'},corporate:{semanticRole:'details'},special:{semanticRole:'djLineup'},featuring:{semanticRole:'footerDetails'},dj:{semanticRole:'headline2'},artist:{semanticRole:'venue'},day:extra('day'),ordinal:extra('weekday'),month:extra('month'),time:{semanticRole:'time'},onwards:extra('timeConnector'),reservation:{semanticRole:'rsvp'},address:{semanticRole:'address'}},
 fontMap:{EliteCondensed:'Bebas Neue',EliteBold:'LEMONMILK-Bold',headline:'Bebas Neue',headline2:'LEMONMILK-Bold',presenter:'Times New Roman',subtag:'Times New Roman',details:'Arial',djLineup:'Arial',footerDetails:'Arial',venue:'Bebas Neue',day:'LEMONMILK-Bold',weekday:'LEMONMILK-Bold',month:'LEMONMILK-Bold',time:'LEMONMILK-Bold',timeConnector:'LEMONMILK-Bold',rsvp:'Arial',address:'Arial'},
 eventBrief:{eventName:'ELITE MONDAY',subtitle:'DJ',presenterName:'ZYTHOS',date:'01 JUNE',startTime:'08PM',eventDetails:'CORPORATE',djs:'NIGHT SPECIAL',venueName:'KARAN\nSHARMA',address:'2nd floor, Sector -83 Entertainland mall,\n201, beside Hyatt Regency, Gurugram, Haryana 122012',rsvpContact:'For Reservations Call:-\n9211334950 | 9211334951'}
};
export async function prepareEliteAssets(){
 const root=resolve('public/generated-flyers/assets');
 const data=async file=>'data:image/png;base64,'+(await readFile(resolve(root,file))).toString('base64');
 const sheet=await data('elite-assets plus square-story bg.png');
 for(const [format,box] of [['square','0 168 452 628'],['story','458 74 402 950']])await writeFile(resolve(root,`elite-monday-${format}-bg.svg`),`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${format==='square'?1080:1920}" viewBox="${box}" preserveAspectRatio="xMidYMid slice"><image width="1536" height="1024" href="${sheet}"/></svg>`);
 // The original bitmap is retained intact; an imagegen-authored luminance mask supplies its silhouette.
 await writeFile(resolve(root,'elite-monday-subject-cutout.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="1133" height="1388" viewBox="0 0 1133 1388"><defs><filter id="inset"><feMorphology operator="erode" radius="5"/></filter><mask id="cut" maskUnits="userSpaceOnUse" x="0" y="0" width="1133" height="1388" style="mask-type:luminance"><image width="1133" height="1388" preserveAspectRatio="none" href="${await data('elite-monday-subject-mask.png')}" filter="url(#inset)"/></mask></defs><image width="1133" height="1388" href="${await data('elite-monday-subject.png')}" mask="url(#cut)"/></svg>`);
}
export async function buildEliteMondayMaster(){
 await prepareEliteAssets();
 await sharp("public/generated-flyers/assets/elite-monday-subject-cutout.svg").png().toFile("public/generated-flyers/assets/elite-monday-subject-cutout.png");
 const root=resolve('public');
 const result=await compileCssMaster(cocoCssMasterAdapter);
 for(const v of [result.square,result.story]){
  v.subtagEnabled=true;v.subtagUppercase=false;v.qrEnabled=false;v.priceEnabled=false;v.textFx={...v.textFx,compiledGradientEdited:false};
  const doc=v.cocoCompositionSystem.compiledDocument;
  for(const o of doc.objects)if(o.image?.src){const path=decodeURIComponent(new URL(o.image.src,'http://localhost').pathname);o.image.src='data:image/webp;base64,'+(await sharp(await readFile(resolve(root,'.'+path))).webp({quality:96}).toBuffer()).toString('base64');}
  for(const list of [v.portraits,v.emojiList])for(const asset of list||[]){const o=doc.objects.find(o=>o.id===asset.cocoCompiledObjectId);if(o?.image)asset.url=o.image.src;}
  v.cocoCssCompiler.ir=doc;
 }
 await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
 console.log(JSON.stringify({output:cocoCssMasterAdapter.outputPath.pathname,square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildEliteMondayMaster();
