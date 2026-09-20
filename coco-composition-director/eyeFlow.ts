import type { CompositionSystem, EyeFlowStep, CompositionDirectorInput } from "./types.ts";
import { center, distance } from "./geometry.ts";

export function buildEyeFlow(system:CompositionSystem,input:CompositionDirectorInput):EyeFlowStep[]{
  const steps:EyeFlowStep[]=[];const block=(role:string)=>system.blocks.find(b=>b.role===role&&!b.hidden);
  const order=input.scene.creativeDecisions.hero.type==="subject"?["identity","accent","subject","primaryMeta","dateTime","venue"]:["identity","accent","primaryMeta","dateTime","venue","subject"];
  order.forEach((role,index)=>{
    if(role==="subject")steps.push({role:"subject",order:index+1,targetPoint:center(system.subjectRect),weight:index===0?1:.82});
    else{const b=block(role);if(b)steps.push({role:b.role,order:index+1,targetPoint:center(b.rect),weight:1-index*.1})}
  });
  return steps;
}

export function scoreEyeFlow(steps:EyeFlowStep[]){if(steps.length<2)return 50;let score=100;for(let i=1;i<steps.length;i++){const d=distance(steps[i-1].targetPoint,steps[i].targetPoint);if(d>62)score-=14;else if(d>48)score-=8;else if(d<3)score-=4;}
  return Math.max(0,Math.min(100,score));
}
