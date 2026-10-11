#!/usr/bin/env python3
"""Generate precisely two original samples, using a FREE ElevenLabs plan only.
No API key is stored. Run with Python 3; it asks privately for a key.
"""
import os,json,getpass,re,sys,urllib.request,urllib.error, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
KEY=os.environ.get('ELEVENLABS_API_KEY') or getpass.getpass('ElevenLabs API key (hidden, not saved): ')
if not KEY:sys.exit('No key supplied; nothing generated.')
def request(path,payload=None):
 req=urllib.request.Request('https://api.elevenlabs.io'+path,data=json.dumps(payload).encode() if payload is not None else None,headers={'xi-api-key':KEY,'Content-Type':'application/json','Accept':'application/json' if payload is None else 'audio/mpeg'})
 try:
  with urllib.request.urlopen(req,timeout=180) as response:return response.read(),response.headers
 except urllib.error.HTTPError as error:sys.exit(f'ElevenLabs returned HTTP {error.code}. Nothing will be upgraded or purchased. Check free credits and key permissions. Do not share your API key.')
# Enforce the user’s explicit free-only constraint before any generation call.
subscription=json.loads(request('/v1/user/subscription')[0])
if subscription.get('tier')!='free':sys.exit('Stopped: this account is not on the Free plan. No generation requests were made.')
match=re.search(r'export const SAMPLE = `([\s\S]*?)`;', (ROOT/'dist/stories.js').read_text())
if not match:sys.exit('Original sample script was not found.')
text=match.group(1);spoken='\n\n<break time="1.2s" />\n\n'.join(text.split('\n\n'))
required=len(spoken)*2;available=subscription.get('character_limit',0)-subscription.get('character_count',0)
if available<required:sys.exit(f'Stopped: the two samples require approximately {required} credits, but only {available} free credits remain. No audio generation was requested.')
voices=json.loads(request('/v1/voices')[0]).get('voices',[])
chosen={}
for gender,names in [('male',['George','Bill','Brian','Adam']),('female',['Sarah','Matilda','Alice','Rachel'])]:
 chosen[gender]=next((v for name in names for v in voices if v.get('name')==name and v.get('labels',{}).get('gender',gender)==gender),None)
 if not chosen[gender]:sys.exit(f'No suitable built-in {gender} narrator found. Choose a voice in ElevenLabs and add the resulting MP3 in Dreamscape instead. No audio generated.')
print(f'Free plan verified. Two samples: {chosen["male"]["name"]} and {chosen["female"]["name"]}. Approximate maximum credits: {required}. No purchases.')
manifest=json.loads((ROOT/'dist/assets/narration.json').read_text());log=[]
for gender,v in chosen.items():
 path=ROOT/f'dist/assets/cabin-{gender}.mp3'
 if path.exists():sys.exit(f'Stopped: {path.name} already exists. Not spending credits on a duplicate.')
 payload={'text':spoken,'model_id':'eleven_multilingual_v2','language_code':'en','voice_settings':{'stability':.65,'similarity_boost':.75,'style':0,'use_speaker_boost':True,'speed':.85}}
 audio,headers=request(f'/v1/text-to-speech/{v["voice_id"]}?output_format=mp3_44100_128',payload)
 if 'audio' not in headers.get('Content-Type','') or len(audio)<1000:sys.exit('The provider did not return a valid audio response. Generation stopped.')
 path.write_bytes(audio);manifest[f'cabin-{gender}']=f'assets/cabin-{gender}.mp3';(ROOT/'dist/assets/narration.json').write_text(json.dumps(manifest,indent=2)+'\n');print(f'Saved {path.name}: {len(audio)} bytes. Listen before accepting the voice.')
 log.append({'gender':gender,'voice_name':v['name'],'voice_id':v['voice_id'],'model':'eleven_multilingual_v2','speed':.85})
(ROOT/'dist/assets/narration-provenance.json').write_text(json.dumps({'provider':'ElevenLabs','license':'Free plan, personal non-commercial use with attribution','voices':log},indent=2)+'\n')
print('Two files generated. Restart/redeploy Dreamscape to bundle them. Audio quality has not been subjectively evaluated.')
