import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { LADIES_CSS_EDITORIAL_RECIPE as recipe, getLadiesCssEditorialFormatRecipe } from '../lib/recipes/ladiesCssEditorial.ts';
import { buildCocoLadiesCssEditorialAssets } from '../components/coco/ladiesCssEditorialAssets.ts';
import { compileCssMaster } from './lib/coco-css-master-compiler.mjs';
import { createPortableCocoProject } from './lib/coco-materializer.mjs';
import { withCompiledTextSelection } from '../lib/coco/compiledTextSelection.ts';

const native = { presenter:'presenter', headline:'headline', subtitle:'headline2', music:'djLineup', musicLabel:'djLineupLabel', hype:'details', hypeLabel:'detailsLabel', date:'date', time:'time', venue:'venue', address:'address', legal:'footerDetails', age:'compliance' };
const semanticRoles = Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}]));
semanticRoles.hypeLabel = {semanticRole:'detailsLabel',text:'detailsLabel',family:'detailsFamily',size:'detailsLabelSize',color:'detailsLabelColor',panel:'details',uiField:'detailsLabel',moveTarget:'details',mappedControls:true,editable:true};
semanticRoles.venueSuffix = {semanticRole:'venueSuffix',text:'ladiesVenueSuffix',panel:'venue',uiField:'venue',moveTarget:'venue',mappedControls:true,editable:true};
semanticRoles.signoff = {semanticRole:'signoff',text:'ladiesSignoff',panel:'rightRail',uiField:'rightRail',moveTarget:'rightRail',mappedControls:true,editable:true};
const fontMap = { Avigea:'Avigea', OpenScript:'OpenScript', Utility:'LEMONMILK-Regular', UtilityBold:'LEMONMILK-Bold', ...Object.fromEntries(Object.keys(semanticRoles).map(id=>[id,id==='headline'?'Avigea':id==='subtitle'?'OpenScript':['presenter','date','time','venue','venueSuffix','age'].includes(id)?'LEMONMILK-Bold':'LEMONMILK-Regular'])) };
export const cocoCssMasterAdapter = {
  id:recipe.id, masterPath:new URL('../public/generated-flyers/ladies-css-editorial-master.html',import.meta.url),
  outputPath:new URL('../public/generated-flyers/ladies-css-coco.nflyer',import.meta.url), publicRoot:new URL('../public/',import.meta.url),
  editorTextScale:1, semanticRoles, fontMap, requiredFonts:['Avigea','OpenScript','Utility','UtilityBold'],
  requiredRoles:['headline','headline2','presenter','date','time','venue','address','djLineup','footerDetails','compliance'],
  recipe, eventBrief:{eventName:'LADIES',subtitle:'Wednesday',date:'28 AUG',venueName:'LA VIDA NIGHT CLUB',address:'JAMESLINE HOTEL, AVIELE.',startTime:'09 PM'},
};
const esc = text => String(text).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const rect = z => `left:${z.x}%;top:${z.y}%;width:${z.width}%;`;

export function buildLadiesMaster() {
  const formats = {};
  for (const format of ['square','story']) {
    const f=getLadiesCssEditorialFormatRecipe(format), z=f.zones, h=f.canvas.height;
    const assets=buildCocoLadiesCssEditorialAssets({format,patternId:recipe.id});
    let html=`<img data-region="photo" data-coco-object="photo" data-coco-asset="background" src="/create-with-coco/subjects/subject02.jpg" style="inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 0%;transform:scale(${f.imageFit.scale});transform-origin:50% 0%;filter:contrast(1.045) brightness(.91) saturate(.96);z-index:0">`;
    Object.entries(f.assets).forEach(([id,g],i)=>{
      const height=g.height??g.heightPx/h*100;
      const style=`${rect(g)}height:${height}%;z-index:${i<2?1:3};transform:rotate(${g.rotation??0}deg);opacity:${id==='footerRule'?.25:1}`;
      // Thin rules use their actual thickness; the native asset's 160px SVG has large padding.
      html+=['footerRule','scriptUnderline'].includes(id)
        ? `<div data-region="${id}" data-coco-object="${id}" style="${style};background:#FBF8EF"></div>`
        : `<img data-region="${id}" data-coco-object="${id}" src="${assets[i].url}" style="${style}">`;
    });
    function text(id,copy,zone,size,css='') {
      html+=`<div data-region="${id}" data-coco-object="${id}" data-coco-kind="text" data-coco-editable="true" style="${rect(zone)}font-size:${size}px;${css}">${esc(copy)}</div>`;
    }
    text('presenter','LA VIDA NIGHT CLUB',z.presenter,6,'font-family:UtilityBold;letter-spacing:.05em');
    const policy=(dy)=>({...z.policies,y:z.policies.y+dy/h*100});
    text('musicLabel','MUSIC POLICY:',{...policy(0),width:8},4.5);
    text('music','DJ NJ · DJ KILTON · DJ MATTHEW & KAY DRUM',{...policy(0),x:64,width:31},4.5);
    text('hypeLabel','HYPE POLICY:',{...policy(10),width:8},4.5);
    text('hype','VOLTAGE PRINCE · CHIEF PRIEST OF HYPE\nECO BLACK · SHERICO',{...policy(10),x:64,width:31},4.5);
    text('headline','LADIES',z.headline,126,'font-family:Avigea;line-height:.78;letter-spacing:-.058em;text-align:center;text-shadow:0 2px 4px #0004');
    text('subtitle','Wednesday',z.script,85.2,'font-family:OpenScript;line-height:.78;letter-spacing:-.035em;transform:rotate(-2.1deg);text-shadow:0 3px 8px #0008');
    text('date','28\nAUG',{...z.date,y:z.date.y+(z.date.height-44.28/h*100)/2},27,'font-family:UtilityBold;line-height:.82;text-align:center;color:#FF302A');
    text('venue','LA VIDA',z.venue,22.8,'font-family:UtilityBold;line-height:.88');
    text('venueSuffix','NIGHT CLUB',{...z.venue,y:z.venue.y+22.8*.88/h*100},22.8,'font-family:UtilityBold;line-height:.88');
    text('address','JAMESLINE HOTEL, AVIELE.',{...z.venue,y:z.venue.y+(22.8*.88*2+4)/h*100},6);
    text('legal','ALL RIGHTS RESERVED. NO PART OF THIS PUBLICATION MAY BE REPRODUCED, DISTRIBUTED OR TRANSMITTED IN ANY FORM WITHOUT PRIOR WRITTEN PERMISSION OF LA VIDA.',z.legal,format==='story'?6:5,'white-space:pre-wrap;line-height:1.42');
    text('age','18+',{...z.age,y:z.age.y+(z.age.height-6.48/h*100)/2},5.4,'font-family:UtilityBold;text-align:center');
    text('time','09\nPM',z.time,18,'font-family:UtilityBold;line-height:1;text-align:right');
    text('signoff','DRINK RESPONSIBLY · ADMISSION RESERVED',z.signoff,4.8,'text-align:center;letter-spacing:.16em');
    formats[format]=html;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>Ladies CSS Editorial — recipe rebuild</title><style>
@font-face{font-family:Avigea;src:url('/fonts/Avigea.woff2')}@font-face{font-family:OpenScript;src:url('/fonts/OpenScript.ttf')}@font-face{font-family:Utility;src:url('/fonts/LEMONMILK-Regular.ttf')}@font-face{font-family:UtilityBold;src:url('/fonts/LEMONMILK-Bold.ttf')}
*{box-sizing:border-box}body{margin:0;background:#05070B}.canvas{position:relative;width:540px;overflow:hidden;background:#05070B}.canvas>*{position:absolute;margin:0}.canvas>div[data-coco-kind=text]{font-family:Utility;color:#FBF8EF;white-space:pre;line-height:1.2;z-index:4}
</style></head><body><main class="canvas" data-coco-canvas></main><script>const format=new URLSearchParams(location.search).get('format')==='story'?'story':'square';const canvas=document.querySelector('.canvas');canvas.dataset.format=format;canvas.style.height=(format==='story'?960:540)+'px';canvas.innerHTML=(${JSON.stringify(formats)})[format];</script></body></html>`;
}

export async function buildLadiesRecipe() {
  // Keep each displaced project byte-for-byte, including later editor saves.
  const previous=await readFile(cocoCssMasterAdapter.outputPath).catch(e=>{if(e.code!=='ENOENT')throw e;return null;});
  if(previous){
    const hash=createHash('sha256').update(previous).digest('hex');
    const archive=new URL('../recipe-file-backups/ladies-css-rebuild/',import.meta.url);
    await mkdir(archive,{recursive:true});
    await writeFile(new URL(`${hash}.nflyer`,archive),previous,{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});
  }
  await writeFile(cocoCssMasterAdapter.masterPath,buildLadiesMaster());
  const result=await compileCssMaster(cocoCssMasterAdapter);
  for(const v of [result.square,result.story]){
    Object.assign(v,{bgUrl:'',backgroundUrl:'',priceEnabled:false,qrEnabled:false,subtagEnabled:false,exp:1,contrast:1/.9,saturation:1,grain:0});
    v.head2Fx={...v.head2Fx,uppercase:false,shadowEnabled:true,shadow:.46};v.head2Shadow=true;v.head2ShadowStrength=.46;
    v.textFx={...v.textFx,shadowEnabled:true,shadow:.16};v.headShadow=true;v.headShadowStrength=.16;
    const ring=buildCocoLadiesCssEditorialAssets({format:v.format,patternId:recipe.id}).find(a=>a.isCircularText);
    for(const key of ['emojiList','portraits'])v[key]=v[key].map(asset=>asset.cocoCompiledObjectId==='dateRing'?{...asset,...ring,scale:asset.scale,layerOffset:asset.layerOffset,cocoCompiledObjectId:'dateRing'}:asset);
    const doc=v.cocoCompositionSystem.compiledDocument;
    doc.objects=doc.objects.map(withCompiledTextSelection).map(object=>{
      if(object.kind==='text'){
        object.binding.pixelHitBounds=true;
        object.binding.mappedControls=true;
        if(object.id==='music')object.binding.labelObjectId='musicLabel';
        if(object.id==='hype')object.binding.labelObjectId='hypeLabel';
      }
      return object;
    });
    v.cocoCssCompiler.ir=doc;
  }
  await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
  console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
  return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildLadiesRecipe();
