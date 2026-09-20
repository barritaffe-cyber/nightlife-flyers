import type { CocoEventBriefInput } from './eventBriefFields.ts';

export const COCO_PRESENTER_LOGO_ID = 'coco-presenter-logo';
export const COCO_PRESENTER_LOGO_LAYOUT_VERSION = 2;
export type PresenterLogo = {url:string;aspect:number;scale:number;anchor?:'presenter'|'venue'|'artist';originalUrl?:string;backgroundTolerance?:number;clearEnclosedGaps?:boolean};
export function parsePresenterLogo(value:unknown):PresenterLogo|null {
  try {
    const data=JSON.parse(String(value||''));
    if(typeof data.url!=='string'||!/^data:image\//.test(data.url))return null;
    return {...(['presenter','venue','artist'].includes(data.anchor)?{anchor:data.anchor}:{}),url:data.url,aspect:Math.max(.1,Math.min(10,Number(data.aspect)||1)),scale:Math.max(.2,Math.min(2,Number(data.scale)||1)),
      ...(typeof data.originalUrl==='string'&&/^data:image\//.test(data.originalUrl)?{originalUrl:data.originalUrl,clearEnclosedGaps:data.clearEnclosedGaps===true,backgroundTolerance:Math.max(0,Math.min(100,Number(data.backgroundTolerance) || 0))}:{})};
  } catch {return null;}
}

// Asset positions are centres. The existing compiled image renderer derives
// left/top from centre - scaled dimensions/2, keeping resizing symmetrical.
export function withCocoPresenterLogo(variant:Record<string,any>,brief:CocoEventBriefInput) {
  const id=COCO_PRESENTER_LOGO_ID,logo=parsePresenterLogo(brief.presenterLogo);
  const system=variant.cocoCompositionSystem,document=system?.compiledDocument;
  if(!document)return variant;
  const objects=(document.objects??[]) as Record<string,any>[];
  const assets=(variant.portraits??variant.emojiList??[]) as Record<string,any>[];
  const existing=assets.find(a=>a.id===id),oldObject=objects.find(o=>o.id===id);
  if(!logo&&!existing&&!oldObject)return variant;
  const nextObjects=objects.filter(o=>o.id!==id),nextAssets=assets.filter(a=>a.id!==id);
  if(logo){
    const role=logo.anchor??'presenter';
    const roles=role==='venue'?['venue','venueName']:role==='artist'?['djs','djLineup','dj']:['presenter','presenterName'];
    const presenter=objects.find(o=>o.kind==='text'&&[o.binding?.text,o.semanticRole,o.id].some(r=>roles.includes(r)));
    const sameAnchor=(existing?.cocoBusinessLogoAnchor??'presenter')===role;
    const anchor=presenter?.bounds??{x:6,y:6,width:25,height:5};
    const ratio=variant.format==='story'?1920/1080:1;
    // Give the uploaded mark a readable footprint, independent of tiny text
    // metrics. Use canvas width for both formats so Story doesn't shrink it.
    const width=Math.min(16,12*logo.aspect);
    const height=width/(logo.aspect*ratio),gap=1.25;
    let x=anchor.x+anchor.width+gap+width/2,y=anchor.y+anchor.height/2;
    if(!String(brief[role==='venue'?'venueName':role==='artist'?'djs':'presenterName']??'').trim()){x=anchor.x+width/2;y=anchor.y+height/2;}
    else if(anchor.x>=width+gap+2)x=anchor.x-gap-width/2;
    else if(x+width/2>98){x=anchor.x+anchor.width/2;y=anchor.y+anchor.height+gap+height/2;}
    x=(sameAnchor?existing?.x:undefined)??Math.max(width/2+2,Math.min(98-width/2,x));
    y=(sameAnchor?existing?.y:undefined)??Math.max(height/2+2,Math.min(98-height/2,y));
    const currentLayout=sameAnchor&&existing?.cocoPresenterLogoLayoutVersion===COCO_PRESENTER_LOGO_LAYOUT_VERSION;
    const bounds=currentLayout&&oldObject?.bounds?oldObject.bounds:{x:x-width/2,y:y-height/2,width,height};
    const topLayer=objects.filter(o=>o.id!==id).reduce((z,o)=>Math.max(z,Number(o.stacking?.effectiveZIndex??o.stacking?.zIndex??0)||0),0)+1;
    nextObjects.push({id,sourceObjectId:id,assetRole:id,kind:'image',editable:true,bounds,paintBounds:bounds,
      transform:{rotate:0,scaleX:1,scaleY:1,originX:50,originY:50},
      paint:{opacity:1,blendMode:'normal',filter:'none',overflow:'visible'},
      stacking:{order:1000,zIndex:topLayer,effectiveZIndex:topLayer,contextPath:[]},compileStatus:'compiled',warnings:[],
      image:{src:logo.url,fit:'contain',position:'50% 50%',naturalWidth:logo.aspect*1000,naturalHeight:1000},binding:{}});
    nextAssets.push({...existing,id,cocoCompiledObjectId:id,cocoAssetRole:id,label:role==='venue'?'Venue logo':role==='artist'?'Artist logo':'Presenter logo',cocoBusinessLogoAnchor:role,url:logo.url,
      x,y,scale:existing?.cocoPresenterLogoScale===logo.scale?existing.scale:logo.scale,cocoPresenterLogoScale:logo.scale,
      cocoPresenterLogoLayoutVersion:COCO_PRESENTER_LOGO_LAYOUT_VERSION,
      opacity:existing?.opacity??1,rotation:existing?.rotation??0,locked:existing?.locked??false,
      isLogo:true,isSticker:true,isExtracted:false,layerOffset:currentLayout?(existing?.layerOffset??topLayer):topLayer,showLabel:false,
      cocoCssBounds:{...bounds,centerX:x,centerY:y},cocoCssFit:'contain'});
  }
  return {...variant,portraits:nextAssets,emojiList:nextAssets,
    cocoCompositionSystem:{...system,compiledDocument:{...document,objects:nextObjects}}};
}
