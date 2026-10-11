export const clamp = (value, min=0, max=1) => Math.max(min, Math.min(max, value));
export function fadeFactor(elapsed, end, fadeSeconds=60) {
  return end === null ? 1 : clamp((end-elapsed)/Math.min(fadeSeconds,end));
}
export function formatTime(seconds) {
  if(!Number.isFinite(seconds)) return '—';
  seconds=Math.max(0,Math.floor(seconds));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
}
export class DreamAudio {
 constructor(element,onChange){
  this.audio=element;this.onChange=onChange;this.settings={ambience:'rain',voice:'female',narration:.8,ambient:.45,timer:30,only:true,lock:false};this.offset=0;this.playing=false;this.end=null;this.cache=new Map();this.readySession=false;this.loading=false;this.sources=[];this.narrationBlob=null;this.generation=0;
  this.audio.addEventListener('ended',()=>this.finish());
  this.audio.addEventListener('pause',()=>{if(this.settings.lock && this.playing && !this.audio.ended){this.playing=false;this.emit();}});
  this.audio.addEventListener('play',()=>{if(this.settings.lock){this.playing=true;this.emit();}});
  this.audio.addEventListener('error',()=>{if(this.settings.lock && this.audio.src){this.pause();this.emit('Audio playback failed. Please prepare the session again.');}});
  this.interval=setInterval(()=>this.tick(),250);
 }
 async context(){
  if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.ng=this.ctx.createGain();this.ag=this.ctx.createGain();this.ng.connect(this.master);this.ag.connect(this.master);this.master.connect(this.ctx.destination);}
  return this.ctx;
 }
 elapsed(){return this.settings.lock && this.readySession ? this.audio.currentTime : this.offset+(this.playing&&this.ctx?Math.max(0,this.ctx.currentTime-this.startedAt):0);}
 snapshot(){return {playing:this.playing,loading:this.loading,elapsed:this.elapsed(),end:this.end,narrationDuration:this.nb?.duration||0,prepared:this.readySession};}
 emit(message){this.onChange(this.snapshot(),message);}
 async decode(key,blob){
  if(this.cache.has(key))return this.cache.get(key);
  const ctx=await this.context();const bytes=blob?await blob.arrayBuffer():await (await this.fetchAudio(`assets/${key}.mp3`)).arrayBuffer();
  const result=await ctx.decodeAudioData(bytes);this.cache.set(key,result);return result;
 }
 async fetchAudio(url){const r=await fetch(url);if(!r.ok)throw new Error('Sound file could not load. Connect to the internet and retry.');return r;}
 async loadNarration(){
  if(this.settings.only){this.nb=null;return;}
  if(!this.narrationBlob)throw new Error('This narrator has not been added yet. Choose ambience only, or add a narration file in Your narrators.');
  this.nb=await this.decode(`voice-${this.voiceKey}`,this.narrationBlob);
 }
 async play(){
  if(this.playing||this.loading)return;
  const ctx=await this.context();
  try{if('audioSession' in navigator)navigator.audioSession.type='playback';}catch{}
  await ctx.resume();this.loading=true;this.emit('Preparing your quiet moment…');const gen=++this.generation;
  try{
   await this.loadNarration();this.ab=await this.decode(this.settings.ambience);
   if(gen!==this.generation)return;
   if(this.settings.lock){
    if(!this.settings.timer)throw new Error('Choose a sleep timer to prepare a lock-screen session.');
    if(!this.readySession){await this.prepareSession();if(gen!==this.generation)return;}
    await this.audio.play();this.playing=true;
   }else{
    if(this.end===null&&this.settings.timer)this.end=this.offset+this.settings.timer*60;
    if(this.end!==null&&this.offset>=this.end){this.offset=0;this.end=this.settings.timer?this.settings.timer*60:null;}
    this.startLive();this.playing=true;
   }
   this.setMedia();this.emit(this.settings.only?'Just you and the soundscape.': 'Settle in. Your story is playing.');
  }catch(e){this.stopSources();this.playing=false;this.emit(e.message||'Audio could not start. Please try again.');}
  finally{this.loading=false;this.emit();}
 }
 startLive(){
  this.startedAt=this.ctx.currentTime;this.master.gain.cancelScheduledValues(this.ctx.currentTime);this.scheduleFade();
  this.ng.gain.setValueAtTime(this.settings.narration,this.ctx.currentTime);this.ag.gain.setValueAtTime(this.settings.ambient,this.ctx.currentTime);
  const amb=this.ctx.createBufferSource();amb.buffer=this.ab;amb.loop=true;amb.connect(this.ag);amb.start(0,this.offset%this.ab.duration);this.sources=[amb];
  if(this.nb&&this.offset<this.nb.duration){const voice=this.ctx.createBufferSource();voice.buffer=this.nb;voice.connect(this.ng);voice.start(0,this.offset);this.sources.push(voice);}
 }
 scheduleFade(){
  const time=this.ctx.currentTime,remaining=this.end===null?null:this.end-this.offset;
  this.master.gain.cancelScheduledValues(time);this.master.gain.setValueAtTime(fadeFactor(this.offset,this.end),time);
  if(remaining!==null){const window=Math.min(60,this.end);if(remaining>window)this.master.gain.setValueAtTime(1,time+remaining-window);this.master.gain.linearRampToValueAtTime(0,time+Math.max(0,remaining));}
 }
 stopSources(){for(const s of this.sources){try{s.stop();s.disconnect();}catch{}}this.sources=[];}
 pause(){
  if(this.loading){++this.generation;this.worker?.terminate();this.rejectWorker?.(new Error('Session preparation cancelled.'));this.loading=false;}
  if(this.settings.lock){this.audio.pause();this.offset=this.audio.currentTime;}else if(this.playing){this.offset=this.elapsed();this.stopSources();}
  this.playing=false;this.emit();this.setMedia();
 }
 finish(){this.pause();this.offset=0;if(this.readySession)this.audio.currentTime=0;this.end=null;this.emit('Your session has finished. Rest well.');}
 tick(){
  if(this.playing&&this.end!==null&&this.elapsed()>=this.end-.05){this.finish();return;}
  if(this.playing)this.emit();
 }
 setVolume(kind,value){this.settings[kind]=clamp(value);if(!this.settings.lock&&this.ctx){(kind==='narration'?this.ng:this.ag).gain.setTargetAtTime(value,this.ctx.currentTime,.12);}else{this.invalidateSession();}this.emit();}
 invalidateSession(){if(this.playing)this.pause();this.readySession=false;this.audio.removeAttribute('src');this.audio.load();if(this.sessionURL){URL.revokeObjectURL(this.sessionURL);this.sessionURL=null;}this.end=null;}
 configure(changes){
  const resume=this.playing;this.pause();this.invalidateSession();Object.assign(this.settings,changes);
  this.end=this.settings.timer?this.offset+this.settings.timer*60:null;
  if(this.settings.lock)this.offset=0;
  this.emit();return resume;
 }
 setStory(blob,key){this.pause();this.invalidateSession();this.narrationBlob=blob;this.voiceKey=key;this.offset=0;this.end=null;this.nb=null;}
 seek(seconds){
  const active=this.playing;this.pause();seconds=Math.max(0,seconds);if(this.end!==null)seconds=Math.min(seconds,Math.max(0,this.end-.1));
  this.offset=seconds;if(this.readySession)this.audio.currentTime=seconds;if(active)this.play();else this.emit();
 }
 async resample(buffer){
  if(!buffer)return null;const offline=new OfflineAudioContext(1,Math.ceil(buffer.duration*16000),16000);const source=offline.createBufferSource();source.buffer=buffer;source.connect(offline.destination);source.start();return (await offline.startRendering()).getChannelData(0);
 }
 async prepareSession(){
  this.emit('Preparing a single audio file. Keep Dreamscape open for a moment…');
  const narration=await this.resample(this.nb),ambience=await this.resample(this.ab);
  const result=await new Promise((resolve,reject)=>{
   this.rejectWorker=reject;const worker=new Worker('mix-worker.js',{type:'module'});this.worker=worker;
   worker.onmessage=e=>{if(e.data.error)reject(new Error(e.data.error));else resolve(e.data.wav);worker.terminate();this.worker=null;this.rejectWorker=null;};
   worker.onerror=()=>{reject(new Error('Not enough memory to prepare this session. Try a shorter timer or turn off lock-screen preparation.'));worker.terminate();this.worker=null;this.rejectWorker=null;};
   worker.postMessage({narration,ambience,seconds:this.settings.timer*60,nv:this.settings.narration,av:this.settings.ambient});
  });
  this.sessionURL=URL.createObjectURL(new Blob([result],{type:'audio/wav'}));this.audio.src=this.sessionURL;this.audio.currentTime=0;this.offset=0;this.end=this.settings.timer*60;this.readySession=true;
 }
 setMedia(){
  if(!('mediaSession'in navigator))return;
  try{
   navigator.mediaSession.metadata=new MediaMetadata({title:this.title||'Dreamscape',artist:this.settings.only?'Dreamscape soundscapes':'Dreamscape · AI narration',album:'A softer end to your day',artwork:[{src:new URL('assets/icon-192.png',location.href).href,sizes:'192x192',type:'image/png'}]});
   navigator.mediaSession.playbackState=this.playing?'playing':'paused';
   for(const [name,fn] of Object.entries({play:()=>this.play(),pause:()=>this.pause(),seekbackward:d=>this.seek(this.elapsed()-(d.seekOffset||15)),seekforward:d=>this.seek(this.elapsed()+(d.seekOffset||15)),seekto:d=>this.seek(d.seekTime)})){try{navigator.mediaSession.setActionHandler(name,fn);}catch{}}
  }catch{}
 }
}
