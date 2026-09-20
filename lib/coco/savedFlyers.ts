import type {CocoEventBriefInput} from './eventBriefFields';
export type SavedFlyer = {id:string; owner:string; name:string; updatedAt:string; state:Record<string,any>};
async function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open('coco-saved-flyers',1);request.onupgradeneeded=()=>request.result.createObjectStore('flyers',{keyPath:'key'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function operation<T>(mode:IDBTransactionMode,run:(store:IDBObjectStore)=>IDBRequest):Promise<T>{const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('flyers',mode);const request=run(tx.objectStore('flyers'));tx.oncomplete=()=>{db.close();resolve(request.result as T)};tx.onerror=tx.onabort=()=>{db.close();reject(tx.error ?? new Error('Could not save on this device.'))};});}
export async function saveFlyer(flyer:SavedFlyer){if(!flyer.owner)throw new Error('Sign in to save.');await operation('readwrite',s=>s.put({...flyer,key:`${flyer.owner}:${flyer.id}`}));}
export async function listSavedFlyers(owner:string):Promise<SavedFlyer[]>{const all=await operation<SavedFlyer[]>('readonly',s=>s.getAll());return all.filter(f=>f.owner===owner).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
export function duplicateFlyerState<T extends Record<string,any>>(state:T,id:string){return {...state,cocoProjectId:id};}
const BRAND_FIELDS=['presenterName','presenterLogo','venueName','address','socials','website','qrDestination'] as const;
export function brandFromBrief(brief:CocoEventBriefInput):CocoEventBriefInput{return Object.fromEntries(BRAND_FIELDS.filter(key=>typeof brief[key]==='string').map(key=>[key,brief[key]]));}
export function readRememberedBrand(owner:string):CocoEventBriefInput {try{return owner?brandFromBrief(JSON.parse(localStorage.getItem(`coco-brand:${owner}`)||'{}')):{};}catch{return {};}}
export function rememberBrand(owner:string,brief:CocoEventBriefInput){if(!owner)throw new Error('Sign in to remember your brand.');localStorage.setItem(`coco-brand:${owner}`,JSON.stringify(brandFromBrief(brief)));}

export function mergeRememberedBrand(brand:CocoEventBriefInput,brief:CocoEventBriefInput):CocoEventBriefInput {return {...brand,...Object.fromEntries(Object.entries(brief).filter(([,v])=>v!==''&&v!=null))};}
export async function saveCurrentOneFlyer(flyer:SavedFlyer){if(!flyer.owner)throw new Error('Sign in to save.');await operation('readwrite',s=>s.put({...flyer,key:`${flyer.owner}:current-one-flyer`,currentOnly:true}));}
