import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import fs from 'node:fs';
const win=new Window({url:'http://localhost:4173/'});win.document.write(fs.readFileSync('dist/index.html','utf8'));
for(const key of ['window','document','localStorage','location'])globalThis[key]=win[key];
Object.defineProperty(globalThis,'navigator',{value:win.navigator,configurable:true});
// These are DOM simulations, not real browser/audio-device tests.
const intervals=[];const interval=globalThis.setInterval;globalThis.setInterval=(...args)=>{const id=interval(...args);intervals.push(id);return id;};
globalThis.fetch=async url=>{const path=String(url).replace(/^http:\/\/localhost:4173\//,'');return path==='assets/narration.json'?new Response('{}'):new Response(fs.readFileSync('dist/'+path));};
win.scrollTo=()=>{};
await import('../dist/app.js');await new Promise(r=>setTimeout(r,40));
const $=id=>win.document.getElementById(id);
test('main views, filters, saving, dialog and remembered volume work',async()=>{
 try{
  assert.equal($('storyGrid').children.length,4);assert.equal($('soundGrid').children.length,4);assert.equal($('voiceGrid').children.length,2);
  win.document.querySelector('[data-page="sounds"]').click();assert.equal($('page-sounds').hidden,false);assert.equal($('page-stories').hidden,true);
  win.document.querySelector('[data-page="stories"]').click();win.document.querySelector('[data-filter="coast"]').click();assert.equal($('storyGrid').children.length,1);assert.match($('storyGrid').textContent,/Lighthouse/);
  $('storyGrid').querySelector('.save-button').click();assert.equal($('savedGrid').children.length,1);assert.equal($('emptySaved').hidden,true);
  const prefs=JSON.parse(win.localStorage.getItem('dreamscape-prefs'));assert.deepEqual(prefs.saved,['ocean']);
  $('ambienceVol').value=23;$('ambienceVol').dispatchEvent(new win.Event('input'));assert.equal($('ambienceValue').value,'23%');assert.equal(JSON.parse(win.localStorage.getItem('dreamscape-prefs')).ambient,.23);
  $('nightBtn').click();assert.equal(win.document.body.classList.contains('dimmed'),true);assert.equal($('nightBtn').getAttribute('aria-pressed'),'true');
  $('heroPlay').click();await new Promise(r=>setTimeout(r,20));assert.equal($('playerDialog').open,true);assert.equal($('playerTitle').textContent,'The Rainy Cabin');
  $('readStory').click();assert.equal($('readDialog').open,true);assert.ok($('readText').textContent.includes('The rain has been here'));
  for(const b of $('voiceGrid').querySelectorAll('.sample-play'))assert.equal(b.disabled,true);
 }finally{for(const id of intervals)clearInterval(id);globalThis.setInterval=interval;await win.happyDOM.abort();}
});
