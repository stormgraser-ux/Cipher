# Cipher

Procedural music as code — soundtracks, loops, ambient textures, driving beats for workspace games. Tone.js (production) + Strudel (prototyping). No build step.

## Commands

```bash
python3 -m http.server 8080    # serves from project root
# Open demo/index.html, demo/sb-dark.html, or demo/sfx-demo.html
```

## Domain

**Does:** Procedural/adaptive game soundtracks, synth patches, rhythm patterns, vibe-to-sound translation.
**Doesn't:** Record/process audio files. No music outside workspace games.

## Key Patterns

- **Strudel first, Tone.js second.** Prototype in Strudel for instant feedback, translate to Tone.js for game integration.
- **One layer needs human variation.** `humanize.js` exists for this.
- **CDN vs node_modules.** Demos load from CDN; production uses node_modules. Don't mix.
- **Macro knobs, not raw params.** Beat Studio exposes 5 macros (DARK/BRIGHT/GRIT/SPACE/WEIGHT/BOUNCE).
- **SFX are pooled.** `sfxPlayer.play()` draws from a voice pool — don't instantiate per call.
