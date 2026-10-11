import test from 'node:test';
import assert from 'node:assert/strict';
import {DreamAudio} from '../dist/audio-engine.js';
class FakeAudioContext {
 constructor(){this.currentTime=0;this.destination={};this.created=[];}
 createGain(){return {connect(){},gain:{value:1,setValueAtTime(){},setTargetAtTime(v){this.value=v;},cancelScheduledValues(){},linearRampToValueAtTime(){}}};}
 createBufferSource(){const s={connect(){},disconnect(){},start(time,offset){this.offset=offset;},stop(){this.stopped=true;}};this.created.push(s);return s;}
 async resume(){}async decodeAudioData(){return {duration:60};}
}
function setup(){
 globalThis.window={AudioContext:FakeAudioContext};Object.defineProperty(globalThis,'navigator',{value:{},configurable:true});
 const a={currentTime:0,addEventListener(){},pause(){},play(){return Promise.resolve();},removeAttribute(){},load(){}};
 const events=[];const engine=new DreamAudio(a,(s,m)=>events.push({s,m}));engine.decode=async()=>({duration:60});return {engine,events};
}
test('live player pause and resume retain the listening position and remaining timer',async()=>{
 const {engine}=setup();try{await engine.play();assert.equal(engine.playing,true);assert.equal(engine.end,1800);engine.ctx.currentTime=40;engine.pause();assert.equal(engine.offset,40);assert.equal(engine.playing,false);await engine.play();engine.ctx.currentTime=50;assert.equal(engine.elapsed(),50);assert.equal(engine.end,1800);assert.equal(engine.sources[0].offset,40);}finally{engine.pause();clearInterval(engine.interval);}
});
test('narration is mixed simultaneously and source gains can be changed independently',async()=>{
 const {engine}=setup();try{engine.settings.only=false;engine.narrationBlob=new Blob(['test']);engine.voiceKey='cabin-male';await engine.play();assert.equal(engine.sources.length,2);engine.setVolume('narration',.3);engine.setVolume('ambient',.6);assert.equal(engine.ng.gain.value,.3);assert.equal(engine.ag.gain.value,.6);}finally{engine.pause();clearInterval(engine.interval);}
});
test('missing narration fails visibly without pretending a voice is playing',async()=>{
 const {engine,events}=setup();try{engine.settings.only=false;await engine.play();assert.equal(engine.playing,false);assert.ok(events.some(e=>/has not been added/.test(e.m||'')));assert.equal(engine.sources.length,0);}finally{clearInterval(engine.interval);}
});
test('seek and timer expiry stop audio and allow a fresh session',async()=>{
 const {engine,events}=setup();try{engine.settings.timer=5;await engine.play();engine.seek(150);await new Promise(r=>setImmediate(r));assert.equal(engine.elapsed(),150);engine.ctx.currentTime=150;engine.tick();assert.equal(engine.playing,false);assert.equal(engine.offset,0);assert.ok(events.some(e=>/finished/.test(e.m||'')));await engine.play();assert.equal(engine.end,300);}finally{engine.pause();clearInterval(engine.interval);}
});
test('prepared native playback keeps pause/resume position and locks the timer into audio duration',async()=>{
 const {engine}=setup();let plays=0;engine.settings.lock=true;engine.settings.timer=5;
 engine.prepareSession=async()=>{engine.readySession=true;engine.end=300;engine.audio.currentTime=0;};engine.audio.play=async()=>{plays++;};
 try{await engine.play();assert.equal(engine.readySession,true);assert.equal(engine.end,300);engine.audio.currentTime=120;engine.pause();assert.equal(engine.elapsed(),120);await engine.play();assert.equal(plays,2);assert.equal(engine.elapsed(),120);engine.audio.currentTime=300;engine.tick();assert.equal(engine.playing,false);assert.equal(engine.audio.currentTime,0);}finally{engine.pause();clearInterval(engine.interval);}
});
