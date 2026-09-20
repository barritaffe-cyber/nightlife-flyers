import type {CopyGroup,CreativeEventInput,InformationDensity,MarketingGoal} from './types.ts';
export function buildCopyArchitecture(event:CreativeEventInput,density:InformationDensity,goal:MarketingGoal):CopyGroup[]{
 const max=density==='minimal'?2:density==='low'?3:density==='medium'?4:6;
 const groups:CopyGroup[]=[
  {id:'identity',role:'identity',sources:['headline'],treatment:'hero',priority:1,maxLines:3,hideWhenEmpty:false},
  {id:'emotion',role:'emotion',sources:['accent'],treatment:'accent',priority:2,maxLines:2,hideWhenEmpty:true},
  {id:'experience',role:goal==='sell-music'?'music':'experience',sources:['details','details2'],treatment:'metadata',priority:3,maxLines:max,mergeWith:'details2',hideWhenEmpty:true},
  {id:'logistics',role:'logistics',sources:['date','time'],treatment:'metadata',priority:3,maxLines:2,hideWhenEmpty:true},
  {id:'venue',role:'venue',sources:['venue'],treatment:'footer',priority:4,maxLines:2,hideWhenEmpty:true},
  {id:'presenter',role:'presenter',sources:['presenter'],treatment:density==='minimal'?'mute':'microcopy',priority:5,maxLines:1,hideWhenEmpty:true},
  {id:'badge',role:'badge',sources:['price'],treatment:'badge',priority:4,maxLines:2,hideWhenEmpty:true},
  {id:'footer',role:'footer',sources:['callToAction'],treatment:density==='minimal'?'hide':'footer',priority:5,maxLines:1,hideWhenEmpty:true}
 ];
 return groups.map(g=>{const has=g.sources.some(s=>String((event as any)[s]??'').trim());if(!has&&g.hideWhenEmpty)return{...g,treatment:'hide'};if(g.id==='experience'&&density!=='dense')return{...g,treatment:'merge'};return g});
}
