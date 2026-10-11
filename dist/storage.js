const DATABASE='dreamscape-audio';
function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DATABASE,1);r.onupgradeneeded=()=>r.result.createObjectStore('voices');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function voiceStore(key,blob){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('voices',blob===undefined?'readonly':'readwrite');const store=tx.objectStore('voices');const request=blob===undefined?store.get(key):blob===null?store.delete(key):store.put(blob,key);let value;request.onsuccess=()=>value=request.result;tx.oncomplete=()=>{db.close();resolve(value);};tx.onerror=()=>{db.close();reject(tx.error);};});}
export function loadPreferences(){try{return JSON.parse(localStorage.getItem('dreamscape-prefs'))||{};}catch{return {};}}
export function savePreferences(value){try{localStorage.setItem('dreamscape-prefs',JSON.stringify(value));return true;}catch{return false;}}
