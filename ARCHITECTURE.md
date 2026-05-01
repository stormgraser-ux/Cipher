# Cipher — Architecture

> Auto-referenced by Claude when exploring the codebase.
> For orientation and commands, see CLAUDE.md.

## File Structure

```
Cipher/
├── CLAUDE.md
├── handoff.md
├── package.json
├── WHATSNEW.md
├── strudel/              # Strudel prototypes
│   ├── tcb-salvage.js
│   ├── bgq-garden.js
│   └── sb-dark.js
├── src/
│   ├── core/             # engine.js, mixer.js, instruments.js, humanize.js, sfx.js
│   ├── studio/           # Beat Studio: layer-state.js, macros.js, pattern-store.js,
│   │                     #   playhead.js, layer-ref.js, preset-registry.js (~50KB)
│   ├── tracks/           # tcb-salvage.js, bgq-garden.js, sb-dark.js
│   ├── adapters/         # tcb.js, bgq.js, wtw.js — game-state → track intensity
│   ├── sfx/              # presets.js — 18 SFX presets
│   └── utils/            # render-wav.py (Python WAV export utility)
└── demo/
    ├── index.html        # TCB Salvage audition
    ├── sb-dark.html      # Beat Studio ($B Dark Trap) — main working demo
    └── sfx-demo.html     # SFX preset browser
```

## Tech Stack Details

### Strudel (Prototyping)
- Browser-based at strudel.cc — zero install, instant feedback
- Pattern-based: mini-notation for rhythms, `stack()` for layers
- Great for: quick vibes, testing ideas, live iteration with user
- Output: paste-ready code blocks

### Tone.js (Production)
- JavaScript library on Web Audio API
- Embeddable in any web project (games, apps)
- Instruments: Synth, FMSynth, AMSynth, MonoSynth, NoiseSynth, Sampler
- Effects: Reverb, Delay, Chorus, Distortion, Filter, Compressor
- Sequencing: Transport, Loop, Sequence, Part, Pattern
- Adaptive: music can react to game state in real-time

No build step. Tone.js loads from CDN in demo pages, from node_modules in production builds.

## Beat Studio

10-layer beat arrangement engine (`src/studio/`). The `sb-dark.js` track is the primary demo.

- 5 macro knobs: DARK/BRIGHT/GRIT/SPACE/WEIGHT/BOUNCE
- Step grid editor per layer
- 52 instrument presets (45 synth + 7 sampler via tonejs-instruments CDN)
- Instrument swap at runtime
- Custom sampler support via `buildCustomSamplerPreset()` / `registerCustomPreset()`
- localStorage persistence for pattern and macro state
- Demo: `demo/sb-dark.html`

## SFX System

Pool-based one-shot SFX player with loop support (`src/core/sfx.js`).
18 presets across 5 categories including TCB rail/rampage suites (`src/sfx/presets.js`).
Usage: `sfxPlayer.play("rail-fire", { intensity: 0.9 })`

## Game Adapters

Adapters in `src/adapters/` bridge game state to track intensity. Each game persona
(Junk/TCB, Yggdrasil/WTW) can request music via the council tool. Workflow:
1. Get the vibe/scene description
2. Prototype in Strudel for fast user feedback
3. Translate to Tone.js for integration into their codebase
4. Hand off the Tone.js module — they handle integration, Cipher handles sound

## Musical Identity

**Stormgraser's taste profile:**
- Classical: Debussy (impressionist, textural, atmospheric)
- Modern: $uicideboy$, Memphis rap, phonk
- Production: trap, dark synths, heavy 808s
- Game music: retro-modern synth — "trying to copy 8-bit without being 8-bit"
- Through-line: **dark, textured, atmospheric, with weight**

**Compositional principles:**
- Mechanical consistency is the foundation, but one layer always needs human variation
- Drums support, they don't dominate — synths sit on top
- Filter sweeps and delay tails create movement and space
- Minor keys, diminished chords, dark progressions
- Energy comes from rhythm and layering, not volume
