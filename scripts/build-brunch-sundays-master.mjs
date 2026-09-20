import { access, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { compileCssMaster } from './lib/coco-css-master-compiler.mjs';
import { createPortableCocoProject } from './lib/coco-materializer.mjs';
import { withCompiledTextSelection } from '../lib/coco/compiledTextSelection.ts';

const native = {presenter:'presenter',headline:'headline',subtitle:'headline2',date:'date',included:'details',venue:'venue',address:'address'};
const companions = {day:['weekday','date'],month:['month','date'],dj1:['dj1','details2'],dj2:['dj2','details2'],dj3:['dj3','details2'],mood:['mood','details'],motto:['motto','details'],tagline:['tagline','details'],mug:['designCopy','details'],offer:['offers','details'],drinks:['drinkSpecials','details'],venueCaption:['venueCaption','venue'],contact:['contacts','details'],age:['ageRequirement','details']};
const semanticRoles = {...Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}])),...Object.fromEntries(Object.entries(companions).map(([id,[semanticRole,panel]])=>[id,{semanticRole,text:`brunchSundays_${id}`,panel,uiField:panel,moveTarget:panel,mappedControls:true,editable:true}])),background:{semanticRole:'background',editable:false},...Object.fromEntries(['ribbon','rDate','rMotto','rLeft','rRight','footerDivider','b1','b2','glass'].map(id=>[id,{editable:false}]))};
const fontMap = {Whim:'Whimsical SVG',Display:'Avigea',Hand:'Northwell',Sans:'LEMONMILK-Light',Medium:'LEMONMILK-Regular',Bold:'LEMONMILK-Bold',...Object.fromEntries(Object.keys(semanticRoles).map(id=>[id,id==='headline'?'Whimsical SVG':id==='venue'?'Avigea':['tagline','mug'].includes(id)?'Northwell':['subtitle','day','month','date','dj1','dj2','dj3','offer','included','drinks'].includes(id)?'LEMONMILK-Bold':['presenter'].includes(id)?'LEMONMILK-Light':'LEMONMILK-Regular']))};
export const cocoCssMasterAdapter = {
  id:'brunch-sundays', masterPath:new URL('../public/generated-flyers/brunch-sundays-master.html',import.meta.url),
  outputPath:new URL('../public/generated-flyers/brunch-sundays.nflyer',import.meta.url), publicRoot:new URL('../public/',import.meta.url),
  editorTextScale:.5, requiredFonts:['Whim','Display','Hand','Sans','Medium','Bold'], requiredRoles:Object.values(native), semanticRoles, fontMap,
  recipe:{id:'brunch-sundays',name:'Brunch Sundays',version:1,summary:'White whimsical script, turquoise depth and yellow accents over the supplied pink brunch photographs.',runtime:{
    compositionPattern:'center-poster-stack',styleId:'black-electric',
    palette:{bgFrom:'#f5648a',bgTo:'#fcf2e8',primary:'#e00070',secondary:'#00414e',accent:'#fff06b',neutral:'#fffaf1'},
    authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},
    formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}},
  }}, eventBrief:{eventName:'Brunch',subtitle:'SUNDAYS',date:'5',presenterName:'GRODIFY PRESENTS',djs:'DJNAME | DJNAME | DJNAME',venueName:'Flyers HQ',address:'297 GRODIFY ST | NEW YORK, NY 07345'},
};

export async function buildBrunchSundaysMaster() {
  if (await access(new URL('../lib/template-data/brunch-sundays-saved-source.json',import.meta.url)).then(()=>true,()=>false)) {
    throw new Error('Brunch Sundays has an accepted user save; preserve it instead of rebuilding.');
  }
  const result = await compileCssMaster(cocoCssMasterAdapter);
  const blank = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
  for (const v of [result.square,result.story]) {
    Object.assign(v,{
      backgroundUrl:blank,bgUrl:blank,subtagEnabled:false,rightRailEnabled:false,rightRailLabel:'',
      presenterEnabled:true,venueEnabled:true,priceEnabled:false,priceLabel:'',qrEnabled:false,qrImageUrl:null,
      leftRailEnabled:false,leftRail:'',leftRailLabel:'',headShadow:false,headShadowStrength:1,head2Shadow:false,head2ShadowStrength:1,detailsShadow:false,venueShadow:false,
      socialHandleEnabled:false,cocoSocialHandleEnabled:false,details2Enabled:true,details2:'',djLineupLabel:'',
      exp:1,contrast:1/.9,saturation:1,warmth:0,tint:0,gamma:1,grain:0,vibrance:0,filmGrade:0,
    });
    const doc = v.cocoCompositionSystem.compiledDocument;
    const body = doc.objects.find(o=>o.id==='included');
    const bounds = {x:100/10.8,y:v===result.story?1466/19.2:875/10.8,width:26,height:1};
    doc.objects.push({...structuredClone(body),id:'detailsLabel',sourceObjectId:'detailsLabel',semanticRole:'detailsLabel',text:'',textRuns:[],bounds,paintBounds:bounds,
      typography:{...body.typography,fontSizePx:6,lineHeight:1.4},
      binding:{text:'detailsLabel',size:'detailsLabelSize',color:'detailsLabelColor',family:'detailsFamily',panel:'details',moveTarget:'details',uiField:'detailsLabel',mappedControls:true,initial:{text:'',size:6,color:'#ae0053'}},
    });
    v.detailsLabel='';v.detailsLabelSize=6;v.detailsLabelColor='#ae0053';v.detailsTracking=v.bodyTracking;
    v.head2Fx={...v.head2Fx,shadowEnabled:false,uppercase:false,tracking:doc.objects.find(o=>o.id==='subtitle').typography.letterSpacingEm};
    doc.objects=doc.objects.map(withCompiledTextSelection).map(o=>{
      if(o.kind!=='text')return o;
      
      if(o.id==='subtitle')o.binding.tracking='head2Tracking';
      o.binding.pixelHitBounds=true;
      if(o.paint?.backgroundImage)o.paint.backgroundImage=o.paint.backgroundImage.replace(/http:\/\/(?:127\.0\.0\.1|localhost):\d+/g,'');
      if(o.binding.panel==='details')o.binding.labelObjectId='detailsLabel';


      if(['details','venue','details2'].includes(o.binding.panel))o.binding.mappedControls=true;
      return o;
    });
    doc.report.compiled=doc.objects.length;
    v.textFx={...v.textFx,uppercase:false};v.headlineUppercase=false;v.cocoCssCompiler.ir=doc;
  }
  await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
  await writeFile(new URL('../lib/template-data/brunch-sundays-v1.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
  console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
  return result;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)await buildBrunchSundaysMaster();
