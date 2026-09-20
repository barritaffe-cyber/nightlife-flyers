export const clamp=(v:number,min=0,max=100)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):min;
export const average=(xs:number[])=>xs.filter(Number.isFinite).reduce((a,b)=>a+b,0)/Math.max(1,xs.filter(Number.isFinite).length);
export const weightedAverage=(xs:Array<[number,number]>)=>xs.reduce((a,[v,w])=>a+v*w,0)/Math.max(.0001,xs.reduce((a,[,w])=>a+w,0));
export const slug=(s:string)=>String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export function stableSort<T>(items:T[],cmp:(a:T,b:T)=>number){return items.map((item,index)=>({item,index})).sort((a,b)=>cmp(a.item,b.item)||a.index-b.index).map(x=>x.item)}
