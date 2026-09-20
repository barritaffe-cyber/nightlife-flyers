export type LayerPeer = { id: string; z: number; background?: boolean; runtime?: boolean };
/** Move one neighbor at a time; the background is a floor, never a destination. */
export function stepCompiledLayer(id: string, current: number, direction: 'up'|'down', peers: LayerPeer[]) {
  const floor=Math.max(-120,...peers.filter(p=>p.background).map(p=>p.z));
  const candidates=peers.filter(p=>p.id!==id&&!p.background&&p.z>floor&&
    (direction==='down'?p.z<=current:p.z>=current))
    .sort((a,b)=>direction==='down'?b.z-a.z:a.z-b.z);
  const neighbor=candidates[0];
  if(!neighbor)return {[id]:Math.max(floor+1,current)};
  if(!neighbor.runtime&&neighbor.z!==current)return {[id]:neighbor.z,[neighbor.id]:current};
  return {[id]:Math.max(floor+1,neighbor.z+(direction==='up'?1:-1))};
}
