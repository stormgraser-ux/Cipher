# Cipher Handoff

**Last session:** 2026-03-17
**Status:** Beat Studio Phase 1+2 + Instrument Swap + Sampler Presets built. SFX system live. 18 SFX presets, 52 instrument presets (45 synth + 7 sampler).

---

## What's Built

- **Core engine:** `src/core/` — engine (transport), mixer (master bus + reverb/delay FX returns), humanize utils, instrument preset factories
- **Studio modules:** `src/studio/` — layer-state (mute/solo), macros (5 knobs), pattern-store (mutable step data), playhead (transport→step index tracker), **layer-ref** (mutable instrument refs), **preset-registry** (52 presets across 10 layers, incl. 7 sampler presets)
- **TCB Salvage track:** `src/tracks/tcb-salvage.js` — 7-layer translation, intensity control
- **TCB adapter:** `src/adapters/tcb.js` — working, maps game ctx state to track intensity
- **BGQ Garden track:** `src/tracks/bgq-garden.js` — 6-layer AABA form (16 bars, ~40s loop), phase-based layering
- **BGQ adapter:** `src/adapters/bgq.js` — wired up, onPhaseChange() maps game phases to layer crossfades
- **BGQ/WTW adapters:** `src/adapters/wtw.js` — correct API shape, stubbed internals
- **Demo page:** `demo/index.html` — dark console, FFT visualizer, IBM Plex Mono
- **$B Dark Trap — Beat Studio:** `src/tracks/sb-dark.js` + `demo/sb-dark.html`
  - 68-bar arrangement (intro→V1→H1→V2→H2→breakdown→H3→outro), 10 layers
  - **Phase 1 — Mute/Solo + Macros:**
    - Mute/solo any of 10 layers (gated layers checked in sequence callbacks, continuous layers via channel volume)
    - 5 macro knobs: DARK/BRIGHT (filters), GRIT (distortion + bit crush), SPACE (reverb/delay returns), WEIGHT (808 decay + sub + kick), BOUNCE (swing)
    - Activity indicators per layer (green dot pulses on trigger)
  - **Phase 2 — Step Grid:**
    - PatternStore-backed sequences — step-index arrays, callbacks read mutable state at trigger time
    - 7-layer step grid: MELODY (note/8n/16), 808 (note/8n/16), KICK (trigger/16n/32), SNARE (trigger/16n/16), HI-HAT (velocity/16n/16), O-HAT (trigger/16n/32), ACCENT (note/8n/16)
    - Click-to-toggle steps, velocity drag on hat, animated playhead, beat grouping visual
    - Page toggle (1/2) for 32-step kick and open-hat patterns
    - 3 continuous layers (PAD, SUB, VINYL) show M/S buttons only, no grid
  - **Instrument Swap:**
    - 52 presets across all 10 layers (4-9 per layer), swappable at any time including during playback
    - 7 sampler presets via tonejs-instruments CDN: trumpet, piano, violin, electric guitar (melody), upright bass, electric bass (808), xylophone (accent)
    - Custom sample loader: `buildCustomSamplerPreset()` + `registerCustomPreset()` for user-provided audio (RVC vocals, custom samples)
    - Architecture: `layerRef` mutable refs — sequences close over refs, channels stay fixed, only upstream nodes get rebuilt on swap
    - Preset selector dropdown on each layer row with name + description
    - Macros gracefully no-op if a preset lacks a target param (e.g. GRIT bitcrusher on a preset without one)
    - Arrangement filter sweeps go through ref.getParam() lookups
    - Fixed intermediary nodes: melAutoVol (melody volume automation), vinylGain (arrangement on/off)
  - **Persistence:** All state (mix, layers, macros, patterns, grid pages, **presets**) saved to localStorage
  - Arrangement gating still works on top of user edits
- **SFX system:** `src/core/sfx.js` — pool-based one-shot player + loop support. `src/sfx/presets.js` — 18 presets across 5 categories + TCB rail/rampage suites. Demo: `demo/sfx-demo.html`

## Next Steps

- [ ] **Audition sampler presets** — open `demo/sb-dark.html`, swap melody to TRUMPET/PIANO/VIOLIN/GUITAR, swap 808 to UPRIGHT/ELECTRIC BASS, swap accent to XYLOPHONE. Verify: samples load, sound plays, macros still work, persistence survives refresh
- [ ] **Vocal chop integration** — record vocals → RVC pipeline → use `buildCustomSamplerPreset()` to load as preset → `registerCustomPreset("melody", preset)` → swap to it
- [ ] **Phase 3 — Per-layer params** — expand grid rows with per-layer synth controls (808 pitch/glide/decay/dist/filter/Q, melody filter/glide/crush)
- [ ] **Phase 4 — Export** — WAV bounce via MediaRecorder, pattern JSON export
- [ ] Audition SFX presets — `demo/sfx-demo.html`
- [ ] Thistle wires BGQ adapter into BugGardenQuest
- [ ] Compose WTW menu + combat tracks
- [ ] Wire TCB adapter into TheColdBetween game loop

## Musical Direction (from user)

- **TCB Salvage Op:** Vampire Survivors energy — driving, dark, retro-urgent. Cm key, ~140 BPM.
- **BGQ Garden:** Cozy garden whimsy — warm, relaxed, complex-not-boring. F major, ~95 BPM. AABA form.
- **$B Dark Trap:** $uicideboy$ production style — C#m, 140 BPM half-time, distorted 808s, dark melody. Beat studio for shaping the beat in real-time.

## SFX Requests

### ~~TCB — Overcharged Rail~~ DONE

Built as `rail-lockin`, `rail-fire`, `rail-pierce`. Usage: `audio.sfx("rail-fire", { intensity: 0.9 })`

*(no pending requests)*
