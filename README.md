# Dreamscape

A personal sleep-story PWA with original branding, illustrated landscapes, story scripts, and synthesized ambience. Built with plain HTML, CSS, JavaScript, Web Audio, a service worker, and browser-local storage. No production dependencies or secrets in browser code.

## Open on iPhone

1. Open https://dreamscape-nightfall.adeptball2.chatgpt.site in **Safari**. This is a private preview: use the ChatGPT account that owns it.
2. Tap **Share → Add to Home Screen** and open the new Dreamscape icon.
3. Choose **Soundscapes** and a sound. It starts in ambience-only mode. **Your mix** opens the narration/ambience volume controls, background sound selector, and sleep timer.
4. For a screen-locked session, select a timer and enable **Prepare a session for the lock screen** before pressing Play. Keep the app open until playback starts. The prepared session contains the mix, timer endpoint, and final 60-second fade in one audio file. Pause before changing the mix.

Narrator preferences, mix settings, timer preference, saved stories, and dimming are remembered in this browser. Uploaded narration is stored in IndexedDB on this device. Safari and the Home Screen app may have separate storage; upload recordings in the mode you will use. Clearing website data removes uploads and preferences. Uploads are not shared between devices.

## Current functionality

- Original rain with quiet distant thunder, ocean, wind, and night forest ambience.
- Ambience alone or narration and ambience together; independent gain controls in live mixing.
- Play, pause/resume, skip 15 seconds, seek, narrator selection, favorites, dark interface and dimming.
- Timers of 5, 15, 30, 45 or 60 minutes with gradual fade-out, or no timer for live listening.
- Optional prepared playback uses one native HTML audio element. The mix and fade are rendered into a mono 16 kHz WAV in a worker. A 30-minute file is about 58 MB; 60 minutes about 115 MB. Shorter sessions reduce memory use.
- Media Session pause/play/seek handlers where supported; PWA manifest, icons, and offline shell/soundscape caching after a successful visit. Private hosting authentication can still require being online.
- Two Rainy Cabin narrator slots, local upload and removal, and a shared original comparison script. Other stories can receive bundled narrations through `dist/assets/narration.json`.

## Narration: free ElevenLabs only

**No narration has been generated yet.** There is no connected ElevenLabs account or API key in this environment. No paid subscription, credits, or purchases were authorized or made. Browser speech synthesis is deliberately not used because it would undermine the requested quality.

ElevenLabs' Free plan includes API access and a limited allowance; confirm the current balance in your own account. Its [pricing](https://elevenlabs.io/pricing) and [API billing explanation](https://help.elevenlabs.io/hc/en-us/articles/28184926326033-How-much-does-it-cost-to-use-the-API) explain free access. The intended samples are about four minutes each, depending on delivery; this is an estimate, not measured audio duration. Naturalness must be judged by listening.

### Easiest route: no API key

1. Create or sign in to a **Free** ElevenLabs account. Do not upgrade or enable paid billing.
2. In Dreamscape, open **Your narrators → Copy original sample script**. Alternatively use the included `RAINY-CABIN-SAMPLE.txt`.
3. Open ElevenLabs Text to Speech. Use **Eleven Multilingual v2**, a warm male narrator such as **George**, speed **0.85**, stability about **65%**, similarity about **75%**, and style **0**. Available free voices can differ by account. Use paragraph breaks for breathing room; optional pauses are supported by this model.
4. Generate once and download the MP3. Repeat the **same text** with a soothing female narrator such as **Sarah**.
5. In Dreamscape, use **Your narrators → Add narration audio** under Male and Female. Tap **Compare this voice** to listen to the same passage with each voice. This is genuine generated narration from your account, not a provider's prerecorded demo.

The app supports the recordings but does not evaluate whether they meet your human-sounding standard. If a voice is too theatrical or breathy, compare a different stock voice before committing to full-length production. Generated voices must be disclosed as AI-generated. Free-plan ElevenLabs content is for personal non-commercial use and requires attribution; do not commercialize these samples under the free plan. Attribution appears in the app's narration section.

### Automated generation for the developer

Add `ELEVENLABS_API_KEY` as a **secret** in the development environment, with access to `api.elevenlabs.io`. Do not paste it into chat, put it in frontend code, commit it, or send it in a URL. For a local machine, run `python3 scripts/generate-samples.py`; it asks for the key with hidden input and does not save it.

The generator checks the subscription is **Free**, checks remaining allowance covers both samples, selects male/female stock voices from your account, and generates only two files. It stops on an account or quota mismatch and never upgrades, purchases, enables overage billing, or switches to another service. It stores only audio, public voice/model metadata, and the narration manifest. With a configured secret the same command works without interactive entry.

Generation consumes free credits. The chosen settings and voices are a starting point; the script cannot guarantee perceived naturalness. After generation, verify the MP3 files, listen, then redeploy to include the two files in the hosted app.

OpenAI's [text-to-speech guide](https://developers.openai.com/api/docs/guides/text-to-speech) supports delivery instructions and recommends marin/cedar for quality. It is an investigated alternative, not used: the user selected free ElevenLabs only.

## iPhone verification and limits

**Physical iPhone background playback is untested.** Browser DOM checks and audio math tests do not establish iOS behavior. WebKit has a history of [background AudioContext suspension](https://bugs.webkit.org/show_bug.cgi?id=261554). The app requests `navigator.audioSession.type = 'playback'` where available and uses Media Session handlers, but these are not guarantees.

- Live mode mixes using Web Audio. Audio processing, page intervals, and timer callbacks can be suspended while locked. The scheduled gain ramp runs on the audio clock if that clock continues. If suspension occurs, a live timer may finish late.
- Prepared mode builds one finite audio file, including its fade. This removes the need for a running page timer or two simultaneously playing tracks while locked. Native `<audio>` is the practical PWA route, but interruptions, device memory pressure, browser termination, authentication and OS version can still affect playback.
- In prepared mode, independent gain settings are applied when the file is made. Pause to change them; the next Play rebuilds the session. Preparation can take time and uses device memory. It cannot be started after locking the screen.
- A native app can use [Apple's AVAudioSession](https://developer.apple.com/documentation/avfaudio/avaudiosession) with the playback category and audio background mode, with native mixing and interruption handling. It adds native development, hardware testing, and Apple distribution work. Choose that route if dependable overnight playback is a firm requirement.

### Physical test checklist

Record your iPhone model and iOS version. Repeat in Safari and the Home Screen app:

1. Test narration+rain at independent volumes; pause/resume, seek and switch narrators.
2. Start a **5-minute prepared session**, wait a minute, then lock for at least five minutes. Audio should continue, soften in the final minute, and stop at the deadline.
3. Repeat in live mode and compare. Test lock-screen pause/resume, headphones, a notification/interruption, backgrounding to another app, and Low Power Mode.
4. Reopen and confirm preferences/uploads survive. Load once online, then test ambience offline; private sign-in may limit offline entry.

Nothing in this checklist has been claimed as completed.

## Content still to produce

The Rainy Cabin is an original comparison script, not a 30–45 minute story. The Lighthouse Keeper, The Moonlit Glasshouse, The Midnight Railway, and Under the Desert Stars are original short drafts. None has a full-length narration. The 30–45 minute lengths are future targets; app session durations are timer durations, not story durations. Full scripts, voice approval, long-form generation, listening review, and final audio mastering remain.

## Develop and test

Node 22+ and Python 3 are sufficient. Serve `dist/` over HTTP locally and HTTPS for a hosted PWA:

```sh
npm ci
npm run check
npm test
npm run dev
```

Then open `http://localhost:4173`. A laptop's localhost URL does not work from an iPhone: use the deployed HTTPS link. All production assets are in `dist/`; this app needs no build step. `npm ci` installs only development test dependencies.

Tests cover timer endpoints, fades, independent mixing, clipping, missing narration, pause/resume/seek, native-player state, navigation, preferences, saving, narrator pending states and the asset manifest. Happy DOM tests simulate the DOM; they are not real browser or device playback tests. Original MP3s have also been decoded successfully with FFmpeg. Real browser visual QA, subjective listening and physical iOS QA remain unverified.

Maintain `dist/assets/narration.json` as a map, e.g. `{"cabin-male":"assets/cabin-male.mp3","cabin-female":"assets/cabin-female.mp3"}`. Never put a secret in the manifest. Provider access belongs in a separate developer-side generator or a secured server, not in the PWA.
