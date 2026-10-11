import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMix} from '../dist/mix-worker.js';
import {fadeFactor,formatTime} from '../dist/audio-engine.js';
import fs from 'node:fs';
const pcm=(v,i)=>v.getInt16(44+i*2,true)/32767;
test('prepared audio has a valid mono WAV header and exact timer duration',()=>{
 const wav=makeMix({ambience:new Float32Array([.4]),narration:null,seconds:120,nv:1,av:1},100);const v=new DataView(wav);
 assert.equal(wav.byteLength,44+120*100*2);assert.equal(v.getUint32(24,true),100);assert.equal(v.getUint16(22,true),1);assert.equal(v.getUint32(40,true),120*100*2);assert.equal(new TextDecoder().decode(new Uint8Array(wav,0,4)),'RIFF');
 assert.equal(pcm(v,0),0);assert.ok(Math.abs(pcm(v,3000)-.4)<.001);assert.ok(Math.abs(pcm(v,9000)-.2)<.001);assert.equal(pcm(v,11999),0);
});
test('both channels mix independently; narration ends once while ambience continues',()=>{
 const args={ambience:new Float32Array([.2]),narration:new Float32Array(4000).fill(.3),seconds:120,nv:.5,av:.25};const view=new DataView(makeMix(args,100));
 assert.ok(Math.abs(pcm(view,1000)-.2)<.001);assert.ok(Math.abs(pcm(view,4500)-.05)<.001);
 const silentVoice=new DataView(makeMix({...args,nv:0},100));assert.ok(Math.abs(pcm(silentVoice,1000)-.05)<.001);
 const silentAmbience=new DataView(makeMix({...args,av:0},100));assert.equal(pcm(silentAmbience,4500),0);
});
test('clipping protection and invalid session limits',()=>{
 const view=new DataView(makeMix({ambience:new Float32Array([2]),narration:new Float32Array(1000).fill(2),seconds:120,nv:1,av:1},10));assert.equal(pcm(view,100),1);
 for(const seconds of [0,-1,Infinity,3601])assert.throws(()=>makeMix({ambience:new Float32Array([1]),seconds,nv:0,av:1}));
});
test('live fade handles pause position, timer end and no timer',()=>{
 assert.equal(fadeFactor(400,1800),1);assert.equal(fadeFactor(1770,1800),.5);assert.equal(fadeFactor(1800,1800),0);assert.equal(fadeFactor(1900,1800),0);assert.equal(fadeFactor(5000,null),1);assert.equal(fadeFactor(15,30),.5);assert.equal(formatTime(65),'1:05');assert.equal(formatTime(NaN),'—');
});
test('PWA icons and original assets exist; both voices are honestly pending',()=>{
 const manifest=JSON.parse(fs.readFileSync('dist/manifest.webmanifest'));for(const icon of manifest.icons)assert.ok(fs.existsSync(`dist/${icon.src}`));
 for(const a of ['rain','ocean','wind','forest'])assert.ok(fs.statSync(`dist/assets/${a}.mp3`).size>100000);
 const narration=JSON.parse(fs.readFileSync('dist/assets/narration.json'));for(const p of Object.values(narration))assert.ok(fs.existsSync('dist/'+p));
});
