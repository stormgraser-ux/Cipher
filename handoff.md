# Cipher Handoff

**Last session:** 2026-02-17
**Status:** $B dark trap full arrangement built (68 bars, 8 sections). Demo page updated with section nav + progress. Ready for vocal recording.

---

## What's Built

- **Core engine:** `src/core/` — engine (transport), mixer (master bus + reverb/delay FX returns), humanize utils, instrument preset factories
- **TCB Salvage track:** `src/tracks/tcb-salvage.js` — 7-layer translation, intensity control. Bugs fixed: kickLoop restart, padReverbSend leak.
- **TCB adapter:** `src/adapters/tcb.js` — working, maps game ctx state to track intensity
- **BGQ Garden track:** `src/tracks/bgq-garden.js` — 6-layer AABA form (16 bars, ~40s loop), phase-based layering (roll/pick/play)
- **BGQ adapter:** `src/adapters/bgq.js` — wired up, onPhaseChange() maps game phases to layer crossfades
- **BGQ Strudel prototype:** `strudel/bgq-garden.js` — approved vibe reference
- **BGQ/WTW adapters:** `src/adapters/wtw.js` — correct API shape, stubbed internals
- **Demo page:** `demo/index.html` — redesigned with frontend-design skill (dark console, FFT visualizer, IBM Plex Mono)
- **$B Dark Trap arrangement:** `src/tracks/sb-dark.js` — 68-bar arrangement (intro→V1→H1→V2→H2→breakdown→H3→outro), 9 layers, table-driven section gating, volume/filter automation, auto-stop. Verses pull melody back (-16dB) for vocal space. Demo: `demo/sb-dark.html` with section display, progress bar, prev/next skip buttons.

## Next Steps

- [ ] Thistle wires BGQ adapter into BugGardenQuest game HTML (needs importmap + module script)
- [ ] Audition BGQ garden track in demo page (add track selector to demo?)
- [ ] Compose WTW menu + combat tracks (wolf/faeri themed)
- [ ] Add SFX system to core (one-shot synth triggers)
- [ ] Wire TCB adapter into TheColdBetween game loop
- [ ] Consider extending BGQ to 32-bar form (~80s) if phase layering isn't enough variation

## Musical Direction (from user)

- **TCB Salvage Op:** Vampire Survivors energy — driving, dark, retro-urgent. Cm key, ~140 BPM.
- **BGQ Garden:** Cozy garden whimsy — warm, relaxed, complex-not-boring. F major, ~95 BPM. AABA form. Phase layers: roll (pad+bass), pick (+melody+shaker), play (+bells+kick). User loves the vibe.
- **$B Dark Trap:** $uicideboy$ production style — C#m, 140 BPM half-time, distorted 808s, dark melody. Arrangement leaves vocal space in verses (melody -16dB + 2500Hz LP). Non-looping (68 bars, ~1:57). User will record vocals on top.
- Strudel v2 prototype approved as base (see Overlord session 2026-02-17)
