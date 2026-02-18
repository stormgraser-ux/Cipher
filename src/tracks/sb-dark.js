import * as Tone from "tone";
import { humanizeTiming, humanizeVelocity } from "../core/humanize.js";

// ── Musical Data: C#m, 140 BPM half-time, 2-bar loop ──
// $B / Budd Dwyer production DNA:
//   - Dark melody, dry and upfront
//   - Sub bass drone (follows harmony) + distorted 808 accents
//   - Half-time kick/snare, trap hi-hats

// Melody: 8th notes, 2 bars — descending through C#m
// Bar 1: C#4 → B3 → A3 → G#3 (stepwise descent)
// Bar 2: A3 → G#3 → F#3 → E3 (continues down, lands on minor 3rd)
const MELODY = [
  null, "C#4", "B3", null, "A3", null, "G#3", null,
  "A3", null, "G#3", "F#3", null, "E3", null, null,
];

// Sub bass root: whole notes, 2 bars — follows the harmony
// C#1 (home) → B0 (descends with melody in bar 2)
const SUB_ROOT = ["C#1", "B0"];

// 808 accents: 8th notes, 2 bars
const BASS_808 = [
  "C#1", null, null, null, "C#1", null, null, null,
  "D#1", null, null, null, "C#1", null, "B0", null,
];

// Kick: 16th notes, 2 bars (beat 1 + ghost kick end of bar 1)
const KICK = [
  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

// Snare: 16th notes, 1 bar (beat 3)
const SNARE = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
];

// Hi-hat velocity: 16th notes, 1 bar
const HAT_VEL = [
  0.08, 0.03, 0.06, 0.03, 0.08, 0.03, 0.06, 0.03,
  0.08, 0.03, 0.06, 0.03, 0.08, 0.03, 0.06, 0.03,
];

// Verse 2 hat variant — subtle velocity shuffle for variation
const HAT_VEL_V2 = [
  0.08, 0.03, 0.06, 0.03, 0.10, 0.02, 0.06, 0.03,
  0.08, 0.04, 0.06, 0.03, 0.08, 0.03, 0.05, 0.04,
];

// Open hat: 16th notes, 2 bars (accent near end of bar 2)
const OPEN_HAT = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
];

// High accent: 8th notes, 2 bars — sparse ghostly sine hits
// Anchored to strong beats: beat 1 (bar 1), beat 1 (bar 2), beat 3 (bar 2)
// C#m chord tones in the upper register
const HIGH_ACCENT = [
  "C#5", null, null, null, null, null, null, null,
  "E5",  null, null, null, "G#4", null, null, null,
];

// ── Arrangement ──
// 68 bars, ~1:57 at 140 BPM. Non-looping — plays once and stops.
// Verses leave vocal space (melody pulled back), hooks bring everything forward.

const SECTIONS = [
  { name: "intro",     start: 0,  end: 4  },
  { name: "verse-1",   start: 4,  end: 20 },
  { name: "hook-1",    start: 20, end: 28 },
  { name: "verse-2",   start: 28, end: 44 },
  { name: "hook-2",    start: 44, end: 52 },
  { name: "breakdown", start: 52, end: 56 },
  { name: "hook-3",    start: 56, end: 64 },
  { name: "outro",     start: 64, end: 68 },
];

// Which gated layers are active per section
// (sub, pad, melody are handled separately — they're continuous)
const LAYER_MAP = {
  "intro":     { kick: false, snare: false, hat: false, hatV2: false, eight: false, accent: true,  openHat: false },
  "verse-1":   { kick: true,  snare: true,  hat: true,  hatV2: false, eight: true,  accent: false, openHat: false },
  "hook-1":    { kick: true,  snare: true,  hat: true,  hatV2: false, eight: true,  accent: true,  openHat: true  },
  "verse-2":   { kick: true,  snare: true,  hat: false, hatV2: true,  eight: true,  accent: false, openHat: false },
  "hook-2":    { kick: true,  snare: true,  hat: true,  hatV2: false, eight: true,  accent: true,  openHat: true  },
  "breakdown": { kick: false, snare: false, hat: false, hatV2: false, eight: false, accent: true,  openHat: false },
  "hook-3":    { kick: true,  snare: true,  hat: true,  hatV2: false, eight: true,  accent: true,  openHat: true  },
  "outro":     { kick: true,  snare: true,  hat: false, hatV2: false, eight: true,  accent: false, openHat: false },
};

// Derive consolidated start/stop windows for a sequence from the layer map
function getSequenceWindows(seqName) {
  const windows = [];
  let current = null;
  for (const sec of SECTIONS) {
    const active = LAYER_MAP[sec.name][seqName];
    if (active && !current) {
      current = { start: sec.start };
    } else if (!active && current) {
      current.end = sec.start;
      windows.push(current);
      current = null;
    }
  }
  if (current) {
    current.end = 68;
    windows.push(current);
  }
  return windows;
}

export function createDarkTrapTrack(mixer) {
  // ── Channels ──
  const melCh     = mixer.createChannel("melody",   { volume: -10 });
  const subCh     = mixer.createChannel("sub-bass", { volume: -6 });
  const eightCh   = mixer.createChannel("808",      { volume: -8 });
  const kickCh    = mixer.createChannel("kick",     { volume: -6 });
  const snareCh   = mixer.createChannel("snare",    { volume: -8 });
  const hatCh     = mixer.createChannel("hat",      { volume: -12 });
  const openHatCh = mixer.createChannel("open-hat", { volume: -10 });
  const padCh     = mixer.createChannel("pad",      { volume: -18 });
  const accentCh  = mixer.createChannel("accent",   { volume: -14 });

  // Reverb sends
  melCh.send("reverb", -10);
  snareCh.send("reverb", -18);
  padCh.send("reverb", -3);
  accentCh.send("reverb", -6);

  // ── Melody: dark triangle, crushed ──
  const melSynth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.03, decay: 0.4, sustain: 0.35, release: 0.3 },
  });
  const melFilter = new Tone.Filter({ frequency: 2500, type: "lowpass", rolloff: -12 });
  const melCrush = new Tone.BitCrusher({ bits: 12 });
  const melPostFilter = new Tone.Filter({ frequency: 3500, type: "lowpass", rolloff: -24 });
  melSynth.chain(melFilter, melCrush, melPostFilter, melCh);

  // ── Sub Bass: continuous sine oscillator — the foundation ──
  const subOsc = new Tone.Oscillator({ frequency: "C#1", type: "sine" });
  const subFilter = new Tone.Filter({ frequency: 80, type: "lowpass", rolloff: -24 });
  subOsc.chain(subFilter, subCh);

  const subSeq = new Tone.Sequence(
    (time, note) => {
      const freq = Tone.Frequency(note).toFrequency();
      subOsc.frequency.rampTo(freq, 0.15, time);
    },
    SUB_ROOT, "1m"
  );
  subSeq.loop = true;

  // ── 808 Accents: sine + manual pitch envelope + distortion ──
  const eightOsc = new Tone.Oscillator({ type: "sine", frequency: "C#1" });
  const eightEnv = new Tone.AmplitudeEnvelope({
    attack: 0.001, decay: 0.25, sustain: 0.15, release: 0.1,
  });
  const eightDist = new Tone.Distortion({ distortion: 0.8 });
  const eightFilter = new Tone.Filter({ frequency: 200, type: "lowpass", rolloff: -12 });
  eightOsc.chain(eightEnv, eightDist, eightFilter, eightCh);

  // ── Kick: membrane synth ──
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 },
  });
  kick.connect(kickCh);

  // ── Snare: noise burst (high-passed) + sine body ──
  const snareNoise = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
  });
  const snareHPF = new Tone.Filter({ frequency: 5000, type: "highpass", rolloff: -12 });
  snareNoise.chain(snareHPF, snareCh);

  const snareBody = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
  });
  snareBody.connect(snareCh);

  // ── Closed Hi-hat: bandpassed noise, very short ──
  const hihat = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.04 },
  });
  const hatBPF = new Tone.Filter({ frequency: 6000, type: "bandpass", Q: 1.2 });
  hihat.chain(hatBPF, hatCh);

  // ── Open Hi-hat: bandpassed noise, longer decay ──
  const openHat = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0.03, release: 0.15 },
  });
  const openHatBPF = new Tone.Filter({ frequency: 5500, type: "bandpass", Q: 1 });
  openHat.chain(openHatBPF, openHatCh);

  // ── Dark Pad: sawtooth chord + slow auto-filter ──
  const padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: { attack: 1, decay: 0.3, sustain: 0.3, release: 2 },
  });
  const padAutoFilter = new Tone.AutoFilter({
    frequency: 0.0625,
    baseFrequency: 250,
    octaves: 0.85,
    type: "sine",
  }).start();
  padSynth.chain(padAutoFilter, padCh);

  // ── High Accent: ghostly sine, long tail ──
  const accentSynth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.05, decay: 0.6, sustain: 0.1, release: 0.8 },
  });
  accentSynth.connect(accentCh);

  // ── Sequences ──

  const melSeq = new Tone.Sequence(
    (time, note) => {
      if (note === null) return;
      melSynth.triggerAttackRelease(note, "4n", time + humanizeTiming(0.003));
    },
    MELODY, "8n"
  );
  melSeq.loop = true;

  const eightSeq = new Tone.Sequence(
    (time, note) => {
      if (note === null) return;
      const freq = Tone.Frequency(note).toFrequency();
      eightOsc.frequency.setValueAtTime(freq * 2, time);
      eightOsc.frequency.exponentialRampToValueAtTime(freq, time + 0.06);
      eightEnv.triggerAttackRelease(0.25, time);
    },
    BASS_808, "8n"
  );
  eightSeq.loop = true;

  const kickSeq = new Tone.Sequence(
    (time, hit) => {
      if (!hit) return;
      kick.triggerAttackRelease("C1", "8n", time);
    },
    KICK, "16n"
  );
  kickSeq.loop = true;

  const snareSeq = new Tone.Sequence(
    (time, hit) => {
      if (!hit) return;
      snareNoise.triggerAttackRelease("16n", time);
      snareBody.triggerAttackRelease("D#3", "16n", time);
    },
    SNARE, "16n"
  );
  snareSeq.loop = true;

  const hatSeq = new Tone.Sequence(
    (time, vel) => {
      const v = humanizeVelocity(vel, 0.02);
      hihat.triggerAttackRelease("32n", time + humanizeTiming(0.003), v);
    },
    HAT_VEL, "16n"
  );
  hatSeq.loop = true;

  const hatSeqV2 = new Tone.Sequence(
    (time, vel) => {
      const v = humanizeVelocity(vel, 0.02);
      hihat.triggerAttackRelease("32n", time + humanizeTiming(0.003), v);
    },
    HAT_VEL_V2, "16n"
  );
  hatSeqV2.loop = true;

  const openHatSeq = new Tone.Sequence(
    (time, hit) => {
      if (!hit) return;
      openHat.triggerAttackRelease("8n", time);
    },
    OPEN_HAT, "16n"
  );
  openHatSeq.loop = true;

  const accentSeq = new Tone.Sequence(
    (time, note) => {
      if (note === null) return;
      accentSynth.triggerAttackRelease(note, "4n", time);
    },
    HIGH_ACCENT, "8n"
  );
  accentSeq.loop = true;

  const padPart = new Tone.Part(
    (time, chord) => {
      padSynth.triggerAttackRelease(chord, "1m + 2n", time);
    },
    [["0:0:0", ["C#3", "E3", "G#3"]]]
  );
  padPart.loop = true;
  padPart.loopEnd = "2m";

  // ── Sequence map for gating ──
  const SEQ_MAP = {
    kick: kickSeq, snare: snareSeq, hat: hatSeq, hatV2: hatSeqV2,
    eight: eightSeq, accent: accentSeq, openHat: openHatSeq,
  };

  const allSequences = [subSeq, melSeq, eightSeq, kickSeq, snareSeq, hatSeq, hatSeqV2, openHatSeq, accentSeq];

  // ── Arrangement state ──
  let scheduledIds = [];
  let currentSection = "stopped";
  let sectionChangeCb = null;

  function sched(callback, bar) {
    const id = Tone.getTransport().schedule(callback, `${bar}m`);
    scheduledIds.push(id);
  }

  function setSection(name) {
    currentSection = name;
    sectionChangeCb?.(name);
  }

  // Apply mix automation (volume/filter) for a section
  function applyMix(name, instant) {
    const r = instant ? 0 : undefined; // flag for ramp times

    // Cancel any in-flight ramps so new values take cleanly
    melCh.volume.cancelScheduledValues(Tone.now());
    melFilter.frequency.cancelScheduledValues(Tone.now());

    switch (name) {
      case "intro":
        rampParam(melCh.volume, -20, instant ? 0 : 0.1);
        rampParam(melFilter.frequency, 800, instant ? 0 : 0.5);
        break;
      case "verse-1":
      case "verse-2":
        rampParam(melCh.volume, -16, instant ? 0 : 0.1);
        rampParam(melFilter.frequency, 2500, instant ? 0 : 0.5);
        break;
      case "hook-1":
      case "hook-2":
        rampParam(melCh.volume, -10, instant ? 0 : 0.05);
        rampParam(melFilter.frequency, 3000, instant ? 0 : 0.3);
        break;
      case "breakdown":
        rampParam(melCh.volume, -14, instant ? 0 : 0.2);
        rampParam(melFilter.frequency, 1200, instant ? 0 : 1.0);
        break;
      case "hook-3":
        rampParam(melCh.volume, -10, instant ? 0 : 0.02);
        rampParam(melFilter.frequency, 3200, instant ? 0 : 0.2);
        break;
      case "outro":
        rampParam(melCh.volume, -10, 0.01);
        // Master fade to silence over ~6 seconds
        mixer.master.volume.cancelScheduledValues(Tone.now());
        mixer.master.volume.rampTo(-Infinity, 6);
        break;
    }
  }

  function rampParam(param, value, time) {
    if (time <= 0) {
      param.value = value;
    } else {
      param.rampTo(value, time);
    }
  }

  // ── Transport ──

  function start(fromBar = 0) {
    const t = Tone.getTransport();

    // Clean slate — clear any previous arrangement
    scheduledIds.forEach(id => t.clear(id));
    scheduledIds = [];
    allSequences.forEach(s => { s.stop(0); s.cancel(0); });
    padPart.stop(0);
    padPart.cancel(0);

    // Reset master volume (may have been faded by previous outro)
    mixer.master.volume.cancelScheduledValues(Tone.now());
    mixer.master.volume.value = 0;

    // Start persistent oscillators
    try { subOsc.stop(); } catch (_) { /* not started yet */ }
    try { eightOsc.stop(); } catch (_) { /* not started yet */ }
    subOsc.start();
    eightOsc.start();

    // ── Continuous layers ──
    const origin = `${fromBar}m`;
    subSeq.start(origin);
    padPart.start(origin);

    // Pad: starts silent in intro, at normal volume otherwise
    padCh.volume.cancelScheduledValues(Tone.now());
    if (fromBar < 4) {
      padCh.volume.value = -40;
      sched(() => padCh.volume.rampTo(-18, 6), 0); // fade in over intro
    } else {
      padCh.volume.value = -18;
    }

    // Melody: enters at bar 2, continuous through end
    melSeq.start(fromBar < 2 ? "2m" : origin);

    // ── Gated layers — derive windows from LAYER_MAP ──
    for (const [name, seq] of Object.entries(SEQ_MAP)) {
      const windows = getSequenceWindows(name);
      for (const w of windows) {
        if (w.end <= fromBar) continue;
        const startBar = Math.max(w.start, fromBar);
        seq.start(`${startBar}m`);
        seq.stop(`${w.end}m`);
      }
    }

    // ── Find starting section and apply its mix state ──
    const secIdx = SECTIONS.findIndex(s => fromBar >= s.start && fromBar < s.end);
    const startSec = SECTIONS[Math.max(0, secIdx)];
    setSection(startSec.name);
    applyMix(startSec.name, true);

    // ── Schedule future section transitions ──
    for (const sec of SECTIONS) {
      if (sec.start <= fromBar) continue;
      sched(() => {
        setSection(sec.name);
        applyMix(sec.name, false);
      }, sec.start);
    }

    // ── Auto-stop at bar 68 ──
    sched(() => {
      cleanup();
      setSection("stopped");
    }, 68);
  }

  // Internal cleanup — stops sequences/oscillators, clears schedules
  function cleanup() {
    const t = Tone.getTransport();
    scheduledIds.forEach(id => t.clear(id));
    scheduledIds = [];

    allSequences.forEach(s => { s.stop(0); s.cancel(0); });
    padPart.stop(0);
    padPart.cancel(0);

    try { subOsc.stop(); } catch (_) {}
    try { eightOsc.stop(); } catch (_) {}

    // Cancel any in-flight automation
    melCh.volume.cancelScheduledValues(Tone.now());
    melFilter.frequency.cancelScheduledValues(Tone.now());
    padCh.volume.cancelScheduledValues(Tone.now());
    mixer.master.volume.cancelScheduledValues(Tone.now());
    mixer.master.volume.value = 0;
  }

  function stop() {
    cleanup();
    currentSection = "stopped";
    sectionChangeCb?.("stopped");
  }

  function setVolume(v) {
    const db = v <= 0 ? -Infinity : -60 + v * 60;
    mixer.master.volume.rampTo(db, 0.05);
  }

  function getSection() {
    return currentSection;
  }

  function getSections() {
    return SECTIONS;
  }

  function dispose() {
    stop();
    subSeq.dispose(); melSeq.dispose(); eightSeq.dispose();
    kickSeq.dispose(); snareSeq.dispose();
    hatSeq.dispose(); hatSeqV2.dispose(); openHatSeq.dispose();
    accentSeq.dispose();
    padPart.dispose();
    melSynth.dispose(); melFilter.dispose(); melCrush.dispose(); melPostFilter.dispose();
    subOsc.dispose(); subFilter.dispose();
    eightOsc.dispose(); eightEnv.dispose();
    eightDist.dispose(); eightFilter.dispose();
    kick.dispose();
    snareNoise.dispose(); snareHPF.dispose(); snareBody.dispose();
    hihat.dispose(); hatBPF.dispose();
    openHat.dispose(); openHatBPF.dispose();
    accentSynth.dispose();
    padSynth.dispose(); padAutoFilter.dispose();
  }

  return {
    start,
    stop,
    setVolume,
    getSection,
    getSections,
    onSectionChange: (fn) => { sectionChangeCb = fn; },
    dispose,
  };
}
