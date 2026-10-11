// A baked mix keeps the timer and fade in the audio, independent of page timers.
export function makeMix({narration,ambience,seconds,nv,av},sampleRate=16000){
 if(!ambience?.length||!Number.isFinite(seconds)||seconds<=0||seconds>3600)throw new Error('Choose a session between 1 second and 60 minutes.');
 const frames=Math.floor(seconds*sampleRate);const wav=new ArrayBuffer(44+frames*2);const view=new DataView(wav);
 const str=(at,s)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i));};
 str(0,'RIFF');view.setUint32(4,36+frames*2,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,frames*2,true);
 const fadeFrames=Math.min(60*sampleRate,frames);const fadeIn=Math.min(sampleRate,frames/4);
 for(let i=0;i<frames;i++){
  const gain=Math.min(1,i/fadeIn,(frames-1-i)/fadeFrames);
  const v=((narration&&i<narration.length?narration[i]:0)*nv+ambience[i%ambience.length]*av)*gain;
  view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,v))*32767),true);
 }
 return wav;
}
if(typeof self!=='undefined'&&typeof Window==='undefined')self.onmessage=e=>{try{const wav=makeMix(e.data);self.postMessage({wav},[wav]);}catch(error){self.postMessage({error:error.message});}};
