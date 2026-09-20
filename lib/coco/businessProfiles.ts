import type {CocoEventBriefInput} from './eventBriefFields.ts';
import {parsePresenterLogo} from './presenterLogo.ts';
export const BUSINESS_TYPES = [
 {id:'venue',label:'Venue / Club / Lounge / Bar'},
 {id:'promoter',label:'Promoter / Event Brand'},
 {id:'artist',label:'DJ / Artist'},
 {id:'other',label:'Another business'},
 {id:'personal',label:'Personal events'},
] as const;
export type BusinessKind=typeof BUSINESS_TYPES[number]['id'];
export type BusinessProfile={id:string;kind:BusinessKind;name:string;details:CocoEventBriefInput};
const stable=['presenterLogo','venueName','address','socials','website','qrDestination','rsvpContact','bookingContact','email'] as const;
const key=(owner:string)=>`coco-business:${owner}`;
export function businessNameField(kind:BusinessKind){return kind==='venue'?'venueName':kind==='artist'?'djs':'presenterName';}
export function cleanBusiness(profile:BusinessProfile):BusinessProfile {
 const kind=BUSINESS_TYPES.some(t=>t.id===profile.kind)?profile.kind:'other';
 const details=Object.fromEntries(stable.filter(f=>typeof profile.details?.[f]==='string').map(f=>[f,profile.details[f]]));
 // Venue data belongs to a venue, not the last location a promoter played.
 if(kind!=='venue'){delete details.venueName;delete details.address;}
 return {id:String(profile.id),kind,name:String(profile.name??'').trim(),details};
}
export function businessBrief(profile:BusinessProfile):CocoEventBriefInput {
 const p=cleanBusiness(profile),brief:CocoEventBriefInput={...p.details};
 if(p.kind!=='personal')brief[businessNameField(p.kind)]=p.name;
 const logo=parsePresenterLogo(brief.presenterLogo);
 if(logo)brief.presenterLogo=JSON.stringify({...logo,anchor:p.kind==='venue'?'venue':p.kind==='artist'?'artist':'presenter'});
 return brief;
}
export function applyBusiness(brief:CocoEventBriefInput,profile:BusinessProfile,previous?:BusinessProfile|null):CocoEventBriefInput {
 const next={...brief},old=previous?businessBrief(previous):{},defaults=businessBrief(profile);
 for(const field of new Set([...Object.keys(old),...Object.keys(defaults)])){
  const f=field as keyof CocoEventBriefInput;
  if(!brief[f] || (previous && brief[f]===old[f]))(next as Record<string,unknown>)[f]=(defaults as Record<string,unknown>)[f]??'';
 }
 return next;
}
export function updateBusinessFromFlyer(profile:BusinessProfile,brief:CocoEventBriefInput,supportedFields?:readonly string[]):BusinessProfile {
 const field=businessNameField(profile.kind);
 // The optional logo is a shared image slot, not a recipe text field.
 const supported=(f:string)=>f==='presenterLogo'||!supportedFields||supportedFields.includes(f);
 return cleanBusiness({...profile,name:profile.kind!=='personal' && supported(field) && typeof brief[field]==='string'?brief[field]!:profile.name,details:{...profile.details,...Object.fromEntries(stable.filter(f=>supported(f)&&typeof brief[f]==='string').map(f=>[f,brief[f]]))}});
}
// Auth user IDs identify the email account; each account has exactly one record.
export function readBusinessProfile(owner:string):BusinessProfile|null {
 if(!owner)return null;
 try{
  const raw=localStorage.getItem(key(owner));
  if(raw){const p=JSON.parse(raw);return p&&typeof p.name==='string'&&p.details?cleanBusiness({...p,id:owner}):null;}
  const legacy=JSON.parse(localStorage.getItem(`coco-brand:${owner}`)||'{}');
  const name=legacy.venueName||legacy.presenterName;
  if(name)return cleanBusiness({id:owner,kind:legacy.venueName?'venue':'promoter',name,details:legacy});
 }catch{/* Missing or invalid local data must not block creating a flyer. */}
 return null;
}
export function saveBusinessProfile(owner:string,profile:BusinessProfile):BusinessProfile {
 if(!owner)throw new Error('Sign in to save your business.');
 const clean=cleanBusiness({...profile,id:owner});if(!clean.name)throw new Error('Add your business or stage name.');
 try{localStorage.setItem(key(owner),JSON.stringify(clean));}catch{throw new Error('Your business could not be saved on this device. Try a smaller logo or continue without saving.');}
 return clean;
}
