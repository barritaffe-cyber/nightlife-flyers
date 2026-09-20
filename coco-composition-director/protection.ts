import type { CompositionDirectorInput, CompositionSystem } from "./types.ts";
import { overlapRatio } from "./geometry.ts";

export type ProtectionEvaluation={score:number;violations:Array<{blockId:string;target:string;ratio:number;allowed:number;severity:string}>};
export function evaluateProtection(system:CompositionSystem,input:CompositionDirectorInput):ProtectionEvaluation{
  const violations:ProtectionEvaluation["violations"]=[];let penalty=0;
  for(const b of system.blocks.filter(x=>!x.hidden))for(const z of input.scene.protectionZones??[]){const ratio=overlapRatio(b.rect,z.rect,"b");const allowed=Math.min(z.allowOverlapRatio,b.maxProtectedOverlap||z.allowOverlapRatio);if(ratio>allowed){const severity=z.importance;violations.push({blockId:b.id,target:z.target,ratio,allowed,severity});penalty+=(severity==="critical"?55:severity==="high"?34:severity==="medium"?18:8)*(ratio-allowed+0.02)}}
  // TEMPORARY DIAGNOSTIC - remove once confirmed.
  if(typeof window!=="undefined"&&violations.some(v=>v.severity==="critical")){
    console.warn("[coco-diagnostic] protection violations:",violations.map(v=>`${v.blockId} vs ${v.target}(${v.severity}) ratio=${v.ratio.toFixed(2)} allowed=${v.allowed.toFixed(2)}`).join(" | "),"zones:",(input.scene.protectionZones??[]).map(z=>`${z.target} x=${z.rect.x.toFixed(1)} y=${z.rect.y.toFixed(1)} w=${z.rect.width.toFixed(1)} h=${z.rect.height.toFixed(1)}`).join(" | "));
  }
  return{score:Math.max(0,100-penalty),violations};
}
