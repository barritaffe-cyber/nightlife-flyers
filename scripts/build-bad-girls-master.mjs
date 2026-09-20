import { access, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { compileCssMaster } from './lib/coco-css-master-compiler.mjs';
import { createPortableCocoProject } from './lib/coco-materializer.mjs';
import { withCompiledTextSelection } from '../lib/coco/compiledTextSelection.ts';

const native = { presenter:'presenter', headline:'headline', subtitle:'headline2', date:'date', time:'time', genres:'details', venue:'venue', address:'address' };
const companions = {
  presents:['presents','presenter'], mood:['mood','details'], day:['weekday','date'], month:['month','date'],
  tagline:['tagline','details'], only:['taglineSuffix','details'], lineupLabel:['lineupLabel','details2'],
  dj1:['dj1','details2'], dj2:['dj2','details2'], cocktails:['drinkSpecials','details'],
  tables:['tableAvailability','details'],dressCode:['dressCode','details'],age:['ageRequirement','details'],
  entry:['entryFee','details'],contact:['contacts','details'],motto:['motto','details'],
};
const semanticRoles = {
  ...Object.fromEntries(Object.entries(native).map(([id,semanticRole]) => [id,{semanticRole}])),
  ...Object.fromEntries(Object.entries(companions).map(([id,[semanticRole,panel]]) => [id,{
    semanticRole, text:`badGirls_${id}`, panel, uiField:panel, moveTarget:panel, mappedControls:true, editable:true,
  }])), background:{semanticRole:'background',editable:false},subject:{semanticRole:'subject',editable:true},
};
const fontMap = {
  Brush:'Bad Girls Brush PNG', Pink:'Bad Girls Pink PNG', Script:'Dear Script (Demo_Font)', Lineup:'Nexa-Heavy', Sans:'LEMONMILK-Light', Medium:'LEMONMILK-Regular', Bold:'LEMONMILK-Bold',
  ...Object.fromEntries(Object.keys(semanticRoles).map(id => [id,
    id==='headline' ? 'Bad Girls Brush PNG' : id==='subtitle' ? 'Bad Girls Pink PNG' : ['tagline','only','motto'].includes(id) ? 'Dear Script (Demo_Font)' :
    ['dj1','dj2'].includes(id) ? 'Nexa-Heavy' : ['date','month','entry','lineupLabel'].includes(id) ? 'LEMONMILK-Bold' :
    ['presenter','cocktails','tables','dressCode','age','address'].includes(id) ? 'LEMONMILK-Regular' : 'LEMONMILK-Light',
  ])),
};
export const cocoCssMasterAdapter = {
  id:'bad-girls', masterPath:new URL('../public/generated-flyers/bad-girls-master.html',import.meta.url),
  outputPath:new URL('../public/generated-flyers/bad-girls.nflyer',import.meta.url), publicRoot:new URL('../public/',import.meta.url),
  editorTextScale:.5, requiredFonts:['Brush','Pink','Script','Sans','Medium','Bold','Lineup'], requiredRoles:Object.values(native), semanticRoles, fontMap,
  recipe:{id:'bad-girls',name:'Bad Girls',version:1,runtime:{
    compositionPattern:'center-poster-stack',styleId:'black-electric',
    palette:{bgFrom:'#190000',bgTo:'#650000',primary:'#fff3ed',secondary:'#ff174c',accent:'#ff174c',neutral:'#fff9f5'},
    authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},
    formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}},
  }}, eventBrief:{eventName:'BAD',subtitle:'GIRLS',date:'24'},
};

export async function buildBadGirlsMaster() {
  if (await access(new URL('../lib/template-data/bad-girls-saved-source.json',import.meta.url)).then(()=>true,()=>false)) {
    throw new Error('Bad Girls has an accepted user save; preserve it instead of rebuilding.');
  }
  const result = await compileCssMaster(cocoCssMasterAdapter);
  const blank = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
  for (const v of [result.square,result.story]) {
    Object.assign(v,{
      backgroundUrl:blank,bgUrl:blank,subtagEnabled:false,rightRailEnabled:false,rightRailLabel:'',
      presenterEnabled:true,venueEnabled:true,priceEnabled:false,priceLabel:'',qrEnabled:false,qrImageUrl:null,
      leftRailEnabled:false,leftRail:'',leftRailLabel:'',headShadow:true,headShadowStrength:2,head2Shadow:true,head2ShadowStrength:2,detailsShadow:false,venueShadow:false,
      socialHandleEnabled:false,cocoSocialHandleEnabled:false,details2Enabled:false,details2:'',djLineupLabel:'',
      exp:1,contrast:1/.9,saturation:1,warmth:0,tint:0,gamma:1,grain:0,vibrance:0,filmGrade:0,
    });
    const doc = v.cocoCompositionSystem.compiledDocument;
    const body = doc.objects.find(o=>o.id==='genres');
    const bounds = {x:5.2,y:v===result.story?31:28,width:25,height:2};
    doc.objects.push({...structuredClone(body),id:'detailsLabel',sourceObjectId:'detailsLabel',semanticRole:'detailsLabel',text:'',textRuns:[],bounds,paintBounds:bounds,
      typography:{...body.typography,fontSizePx:6,lineHeight:1.4},
      binding:{text:'detailsLabel',size:'detailsLabelSize',color:'detailsLabelColor',family:'detailsFamily',panel:'details',moveTarget:'details',uiField:'detailsLabel',mappedControls:true,initial:{text:'',size:6,color:'#fff9ff'}},
    });
    v.detailsLabel='';v.detailsLabelSize=6;v.detailsLabelColor='#fff9ff';v.detailsTracking=v.bodyTracking;
    v.head2Fx={...v.head2Fx,shadowEnabled:true,uppercase:false,tracking:doc.objects.find(o=>o.id==='subtitle').typography.letterSpacingEm};
    doc.objects=doc.objects.map(withCompiledTextSelection).map(o=>{
      if(o.kind!=='text')return o;
      
      if(o.id==='subtitle')o.binding.tracking='head2Tracking';
      o.binding.pixelHitBounds=true;
      if(o.binding.panel==='details')o.binding.labelObjectId='detailsLabel';
      if(['details','venue'].includes(o.binding.panel))o.binding.mappedControls=true;
      return o;
    });
    doc.report.compiled=doc.objects.length;
    v.textFx={...v.textFx,uppercase:false};v.headlineUppercase=false;v.cocoCssCompiler.ir=doc;
  }
  await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
  await writeFile(new URL('../lib/template-data/bad-girls-v1.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
  console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
  return result;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)await buildBadGirlsMaster();
