/** Temporary local handoff from the home file picker to the editor. */
async function openHandoffDb(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('coco-home-project-handoff',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('files');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
export async function stageHomeProject(file:File):Promise<string>{
  const db=await openHandoffDb();const key=crypto.randomUUID();
  try{await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction('files','readwrite');tx.objectStore('files').put(file,key);
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });return key;}finally{db.close();}
}
export async function readHomeProject(key:string):Promise<File|undefined>{
  const db=await openHandoffDb();
  try{return await new Promise<File|undefined>((resolve,reject)=>{
    const request=db.transaction('files').objectStore('files').get(key);
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });}finally{db.close();}
}
export async function clearHomeProject(key:string):Promise<void>{
  const db=await openHandoffDb();
  try{await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction('files','readwrite');tx.objectStore('files').delete(key);
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });}finally{db.close();}
}
