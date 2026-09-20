import type { CompositionSystem, VisualMassItem, VisualBalance, CompositionDirectorInput } from "./types.ts";
import { center, weightedCenter, clamp } from "./geometry.ts";

export function buildVisualMassItems(system:CompositionSystem,input:CompositionDirectorInput):VisualMassItem[]{
  const items:VisualMassItem[]=[];
  const subjectWeight=input.subject?.visualMass??input.subject?.saliency??.82;
  items.push({id:"subject",kind:"subject",rect:system.subjectRect,weight:subjectWeight*100,center:center(system.subjectRect)});
  for(const b of system.blocks.filter(x=>!x.hidden)){
    const kind=roleKind(b.role);const weight=blockWeight(b.role,input);
    items.push({id:b.id,kind,rect:b.rect,weight,center:center(b.rect)});
  }
  return items;
}

export function analyzeBalance(system:CompositionSystem,input:CompositionDirectorInput):VisualBalance{
  const items=buildVisualMassItems(system,input);const c=weightedCenter(items.map(i=>({point:i.center,weight:i.weight})));
  let left=0,right=0,top=0,bottom=0;
  for(const i of items){if(i.center.x<50)left+=i.weight;else right+=i.weight;if(i.center.y<50)top+=i.weight;else bottom+=i.weight}
  const target={x:50,y:50};const deviation=Math.hypot(c.x-50,c.y-50);const score=clamp(100-deviation*2.2,0,100);
  return{center:c,targetCenter:target,deviation,leftMass:left,rightMass:right,topMass:top,bottomMass:bottom,score};
}
function roleKind(role:string):VisualMassItem["kind"]{if(role==="identity")return"headline";if(role==="accent")return"accent";if(role==="badge")return"badge";if(role==="venue")return"venue";return"metadata"}
function blockWeight(role:string,input:CompositionDirectorInput){const h=input.creativeDirection.hierarchy;switch(role){case"identity":return h.headlinePower;case"accent":return h.headlinePower*h.accentMaxRatio*.82;case"primaryMeta":return h.headlinePower*h.bodyMaxRatio*.8;case"dateTime":return h.headlinePower*h.dateMaxRatio*.8;case"venue":return h.headlinePower*h.venueMaxRatio*.75;case"badge":return h.headlinePower*h.badgeMaxRatio*.7;default:return 10}}
