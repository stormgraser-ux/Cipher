// ── Preset Registry: instrument presets for every layer ──
// Each preset: { id, name, desc, build(output) → PresetInstance }
// PresetInstance: { triggerAttack?, triggerRelease?, triggerAttackRelease?,
//                   start?, stop?, setFrequency?, dispose(), params: {} }

import * as Tone from "tone";

// ── Sampler Helpers ──────────────────────────────────────────
const SAMPLES_BASE = "https://nbrosowsky.github.io/tonejs-instruments/samples/";

/** Convert note names to file names: C#4 → Cs4.mp3 */
function sampleUrls(notes) {
  const urls = {};
  for (const n of notes) urls[n] = n.replace("#", "s") + ".mp3";
  return urls;
}

/** Wrap a Tone.Sampler for mono-style playback (tracks last note for release) */
function monoSamplerWrap(sampler) {
  let lastNote = null;
  return {
    triggerAttack(note, time, vel) {
      if (lastNote) try { sampler.triggerRelease(lastNote, time); } catch (_) {}
      lastNote = note;
      sampler.triggerAttack(note, time, vel);
    },
    triggerRelease(time) {
      if (lastNote) { try { sampler.triggerRelease(lastNote, time); } catch (_) {} lastNote = null; }
    },
    triggerAttackRelease(note, dur, time, vel) {
      sampler.triggerAttackRelease(note, dur, time, vel);
    },
  };
}

// ═══════════════════════════════════════════════════════════
//  MELODY
// ═══════════════════════════════════════════════════════════

const melody = [
  {
    id: "mel-monosaw",
    name: "MONO SAW",
    desc: "Portamento sawtooth with filter sweep — the default dark melody",
    build(output) {
      const synth = new Tone.MonoSynth({
        oscillator: { type: "sawtooth" },
        filter: { Q: 3, type: "lowpass", rolloff: -24, frequency: 1800 },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.7, release: 0.4 },
        filterEnvelope: {
          attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.5,
          baseFrequency: 400, octaves: 3,
        },
      });
      synth.set({ portamento: 0.08 });
      const filter = new Tone.Filter({ frequency: 3200, type: "lowpass", rolloff: -12 });
      const waveshaper = new Tone.Chebyshev(3);
      const crush = new Tone.BitCrusher({ bits: 12 });
      const postFilter = new Tone.Filter({ frequency: 3500, type: "lowpass", rolloff: -24 });
      synth.chain(filter, waveshaper, crush, postFilter, output);
      return {
        triggerAttack(note, time, vel) { synth.triggerAttack(note, time, vel); },
        triggerRelease(time) { synth.triggerRelease(time); },
        triggerAttackRelease(note, dur, time, vel) { synth.triggerAttackRelease(note, dur, time, vel); },
        dispose() { synth.dispose(); filter.dispose(); waveshaper.dispose(); crush.dispose(); postFilter.dispose(); },
        params: { filter, waveshaper, crush, postFilter, synth },
      };
    },
  },
  {
    id: "mel-fmsquare",
    name: "FM SQUARE",
    desc: "Buzzy FM synthesis — digital and aggressive",
    build(output) {
      const synth = new Tone.FMSynth({
        harmonicity: 2,
        modulationIndex: 4,
        oscillator: { type: "square" },
        modulation: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.4 },
        modulationEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.3 },
      });
      synth.set({ portamento: 0.06 });
      const filter = new Tone.Filter({ frequency: 2800, type: "lowpass", rolloff: -12 });
      const crush = new Tone.BitCrusher({ bits: 14 });
      synth.chain(filter, crush, output);
      return {
        triggerAttack(note, time, vel) { synth.triggerAttack(note, time, vel); },
        triggerRelease(time) { synth.triggerRelease(time); },
        triggerAttackRelease(note, dur, time, vel) { synth.triggerAttackRelease(note, dur, time, vel); },
        dispose() { synth.dispose(); filter.dispose(); crush.dispose(); },
        params: { filter, crush, synth },
      };
    },
  },
  {
    id: "mel-detuned",
    name: "DETUNED",
    desc: "Fat detuned sawtooth — wide and thick",
    build(output) {
      const synth = new Tone.MonoSynth({
        oscillator: { type: "fatsawtooth", count: 3, spread: 25 },
        filter: { Q: 2, type: "lowpass", rolloff: -24, frequency: 2000 },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.5 },
        filterEnvelope: {
          attack: 0.02, decay: 0.5, sustain: 0.3, release: 0.6,
          baseFrequency: 300, octaves: 3.5,
        },
      });
      synth.set({ portamento: 0.1 });
      const filter = new Tone.Filter({ frequency: 3000, type: "lowpass", rolloff: -12 });
      const waveshaper = new Tone.Chebyshev(2);
      synth.chain(filter, waveshaper, output);
      return {
        triggerAttack(note, time, vel) { synth.triggerAttack(note, time, vel); },
        triggerRelease(time) { synth.triggerRelease(time); },
        triggerAttackRelease(note, dur, time, vel) { synth.triggerAttackRelease(note, dur, time, vel); },
        dispose() { synth.dispose(); filter.dispose(); waveshaper.dispose(); },
        params: { filter, waveshaper, synth },
      };
    },
  },
  {
    id: "mel-pluck",
    name: "PLUCK",
    desc: "Short decay staccato — percussive melodic hits",
    build(output) {
      const synth = new Tone.MonoSynth({
        oscillator: { type: "triangle" },
        filter: { Q: 4, type: "lowpass", rolloff: -24, frequency: 3000 },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
        filterEnvelope: {
          attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.15,
          baseFrequency: 600, octaves: 4,
        },
      });
      const filter = new Tone.Filter({ frequency: 4000, type: "lowpass", rolloff: -12 });
      const crush = new Tone.BitCrusher({ bits: 14 });
      synth.chain(filter, crush, output);
      return {
        triggerAttack(note, time, vel) { synth.triggerAttack(note, time, vel); },
        triggerRelease(time) { synth.triggerRelease(time); },
        triggerAttackRelease(note, dur, time, vel) { synth.triggerAttackRelease(note, dur, time, vel); },
        dispose() { synth.dispose(); filter.dispose(); crush.dispose(); },
        params: { filter, crush, synth },
      };
    },
  },
  {
    id: "mel-acid",
    name: "ACID",
    desc: "High resonance filter with slide — 303 style",
    build(output) {
      const synth = new Tone.MonoSynth({
        oscillator: { type: "sawtooth" },
        filter: { Q: 8, type: "lowpass", rolloff: -24, frequency: 1200 },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.4, release: 0.2 },
        filterEnvelope: {
          attack: 0.005, decay: 0.15, sustain: 0.2, release: 0.3,
          baseFrequency: 200, octaves: 4.5,
        },
      });
      synth.set({ portamento: 0.04 });
      const filter = new Tone.Filter({ frequency: 3500, type: "lowpass", rolloff: -12 });
      const waveshaper = new Tone.Chebyshev(4);
      const postFilter = new Tone.Filter({ frequency: 4000, type: "lowpass", rolloff: -24 });
      synth.chain(filter, waveshaper, postFilter, output);
      return {
        triggerAttack(note, time, vel) { synth.triggerAttack(note, time, vel); },
        triggerRelease(time) { synth.triggerRelease(time); },
        triggerAttackRelease(note, dur, time, vel) { synth.triggerAttackRelease(note, dur, time, vel); },
        dispose() { synth.dispose(); filter.dispose(); waveshaper.dispose(); postFilter.dispose(); },
        params: { filter, waveshaper, postFilter, synth },
      };
    },
  },
  // ── Sampler presets ──
  {
    id: "mel-trumpet",
    name: "TRUMPET",
    desc: "Sampled brass — warm and dark through lowpass",
    build(output) {
      const sampler = new Tone.Sampler({
        urls: sampleUrls(["A3","C4","D#4","F3","F4","G4","A#4","D5","F5","A5","C6"]),
        baseUrl: SAMPLES_BASE + "trumpet/",
        release: 0.4,
      });
      const filter = new Tone.Filter({ frequency: 2500, type: "lowpass", rolloff: -12 });
      const crush = new Tone.BitCrusher({ bits: 16 });
      sampler.chain(filter, crush, output);
      const wrap = monoSamplerWrap(sampler);
      return {
        ...wrap,
        dispose() { sampler.dispose(); filter.dispose(); crush.dispose(); },
        params: { filter, crush, sampler },
      };
    },
  },
  {
    id: "mel-piano",
    name: "PIANO",
    desc: "Sampled piano — dark filtered keys",
    build(output) {
      const sampler = new Tone.Sampler({
        urls: sampleUrls(["C2","E2","A2","C3","E3","A3","C4","E4","A4","C5","E5","A5","C6"]),
        baseUrl: SAMPLES_BASE + "piano/",
        release: 0.6,
      });
      const filter = new Tone.Filter({ frequency: 2000, type: "lowpass", rolloff: -24 });
      const crush = new Tone.BitCrusher({ bits: 14 });
      sampler.chain(filter, crush, output);
      const wrap = monoSamplerWrap(sampler);
      return {
        ...wrap,
        dispose() { sampler.dispose(); filter.dispose(); crush.dispose(); },
        params: { filter, crush, sampler },
      };
    },
  },
  {
    id: "mel-violin",
    name: "VIOLIN",
    desc: "Sampled strings — atmospheric, haunting",
    build(output) {
      const sampler = new Tone.Sampler({
        urls: sampleUrls(["A3","C4","E4","G4","A4","C5","E5","G5","A5","C6","E6","G6","A6","C7"]),
        baseUrl: SAMPLES_BASE + "violin/",
        release: 0.5,
      });
      const filter = new Tone.Filter({ frequency: 3000, type: "lowpass", rolloff: -12 });
      const crush = new Tone.BitCrusher({ bits: 16 });
      sampler.chain(filter, crush, output);
      const wrap = monoSamplerWrap(sampler);
      return {
        ...wrap,
        dispose() { sampler.dispose(); filter.dispose(); crush.dispose(); },
        params: { filter, crush, sampler },
      };
    },
  },
  {
    id: "mel-guitar",
    name: "ELECTRIC GTR",
    desc: "Sampled electric guitar — gritty and raw",
    build(output) {
      const sampler = new Tone.Sampler({
        urls: sampleUrls(["C#2","A2","F#2","C3","A3","D#3","F#3","C4","A4","D#4","F#4","C5","A5","D#5","F#5","C6"]),
        baseUrl: SAMPLES_BASE + "guitar-electric/",
        release: 0.3,
      });
      const filter = new Tone.Filter({ frequency: 3500, type: "lowpass", rolloff: -12 });
      const crush = new Tone.BitCrusher({ bits: 12 });
      sampler.chain(filter, crush, output);
      const wrap = monoSamplerWrap(sampler);
      return {
        ...wrap,
        dispose() { sampler.dispose(); filter.dispose(); crush.dispose(); },
        params: { filter, crush, sampler },
      };
    },
  },
];

// ═══════════════════════════════════════════════════════════
//  808
// ═══════════════════════════════════════════════════════════

const eight = [
  {
    id: "808-classic",
    name: "CLASSIC",
    desc: "Distorted sine with pitch drop — the default 808",
    build(output) {
      const osc = new Tone.Oscillator({ type: "sine", frequency: "C#1" });
      const env = new Tone.AmplitudeEnvelope({
        attack: 0.001, decay: 0.25, sustain: 0.15, release: 0.1,
      });
      const dist = new Tone.Distortion({ distortion: 0.8 });
      const filter = new Tone.Filter({ frequency: 350, type: "lowpass", rolloff: -12, Q: 2 });
      osc.chain(env, dist, filter, output);
      return {
        triggerAttackRelease(note, dur, time) {
          const freq = Tone.Frequency(note).toFrequency();
          osc.frequency.setValueAtTime(freq * 2, time);
          osc.frequency.exponentialRampToValueAtTime(freq, time + 0.06);
          env.triggerAttackRelease(typeof dur === "number" ? dur : 0.25, time);
        },
        start() { osc.start(); },
        stop() { osc.stop(); },
        dispose() { osc.dispose(); env.dispose(); dist.dispose(); filter.dispose(); },
        params: { dist, filter, env, osc },
      };
    },
  },
  {
    id: "808-clean",
    name: "CLEAN SUB",
    desc: "No distortion, longer decay — pure sub weight",
    build(output) {
      const osc = new Tone.Oscillator({ type: "sine", frequency: "C#1" });
      const env = new Tone.AmplitudeEnvelope({
        attack: 0.002, decay: 0.5, sustain: 0.2, release: 0.15,
      });
      const filter = new Tone.Filter({ frequency: 250, type: "lowpass", rolloff: -24, Q: 1 });
      osc.chain(env, filter, output);
      return {
        triggerAttackRelease(note, dur, time) {
          const freq = Tone.Frequency(note).toFrequency();
          osc.frequency.setValueAtTime(freq * 1.5, time);
          osc.frequency.exponentialRampToValueAtTime(freq, time + 0.04);
          env.triggerAttackRelease(typeof dur === "number" ? dur : 0.5, time);
        },
        start() { osc.start(); },
        stop() { osc.stop(); },
        dispose() { osc.dispose(); env.dispose(); filter.dispose(); },
        params: { filter, env, osc },
      };
    },
  },
  {
    id: "808-growl",
    name: "GROWL",
    desc: "Heavy distortion, aggressive bite",
    build(output) {
      const osc = new Tone.Oscillator({ type: "sine", frequency: "C#1" });
      const env = new Tone.AmplitudeEnvelope({
        attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.08,
      });
      const dist = new Tone.Distortion({ distortion: 1.0 });
      const filter = new Tone.Filter({ frequency: 500, type: "lowpass", rolloff: -12, Q: 3 });
      const waveshaper = new Tone.Chebyshev(5);
      osc.chain(env, dist, waveshaper, filter, output);
      return {
        triggerAttackRelease(note, dur, time) {
          const freq = Tone.Frequency(note).toFrequency();
          osc.frequency.setValueAtTime(freq * 3, time);
          osc.frequency.exponentialRampToValueAtTime(freq, time + 0.08);
          env.triggerAttackRelease(typeof dur === "number" ? dur : 0.2, time);
        },
        start() { osc.start(); },
        stop() { osc.stop(); },
        dispose() { osc.dispose(); env.dispose(); dist.dispose(); filter.dispose(); waveshaper.dispose(); },
        params: { dist, filter, env, osc },
      };
    },
  },
  {
    id: "808-reese",
    name: "REESE",
    desc: "Detuned oscillators — phasing, thick bass",
    build(output) {
      const osc1 = new Tone.Oscillator({ type: "sawtooth", frequency: "C#1" });
      const osc2 = new Tone.Oscillator({ type: "sawtooth", frequency: "C#1" });
      osc2.detune.value = 8;
      const env = new Tone.AmplitudeEnvelope({
        attack: 0.002, decay: 0.35, sustain: 0.15, release: 0.12,
      });
      const merge = new Tone.Gain(0.5);
      const dist = new Tone.Distortion({ distortion: 0.5 });
      const filter = new Tone.Filter({ frequency: 300, type: "lowpass", rolloff: -24, Q: 2 });
      osc1.connect(merge);
      osc2.connect(merge);
      merge.chain(env, dist, filter, output);
      return {
        triggerAttackRelease(note, dur, time) {
          const freq = Tone.Frequency(note).toFrequency();
          osc1.frequency.setValueAtTime(freq, time);
          osc2.frequency.setValueAtTime(freq, time);
          env.triggerAttackRelease(typeof dur === "number" ? dur : 0.35, time);
        },
        start() { osc1.start(); osc2.start(); },
        stop() { osc1.stop(); osc2.stop(); },
        dispose() { osc1.dispose(); osc2.dispose(); env.dispose(); merge.dispose(); dist.dispose(); filter.dispose(); },
        params: { dist, filter, env },
      };
    },
  },
  {
    id: "808-pluck",
    name: "PLUCK BASS",
    desc: "Very short decay — punchy bass stabs",
    build(output) {
      const osc = new Tone.Oscillator({ type: "triangle", frequency: "C#1" });
      const env = new Tone.AmplitudeEnvelope({
        attack: 0.001, decay: 0.1, sustain: 0, release: 0.05,
      });
      const dist = new Tone.Distortion({ distortion: 0.4 });
      const filter = new Tone.Filter({ frequency: 400, type: "lowpass", rolloff: -12, Q: 2 });
      osc.chain(env, dist, filter, output);
      return {
        triggerAttackRelease(note, dur, time) {
          const freq = Tone.Frequency(note).toFrequency();
          osc.frequency.setValueAtTime(freq * 4, time);
          osc.frequency.exponentialRampToValueAtTime(freq, time + 0.03);
          env.triggerAttackRelease(typeof dur === "number" ? dur : 0.1, time);
        },
        start() { osc.start(); },
        stop() { osc.stop(); },
        dispose() { osc.dispose(); env.dispose(); dist.dispose(); filter.dispose(); },
        params: { dist, filter, env, osc },
      };
    },
  },
  // ── Sampler presets ──
  {
    id: "808-upright",
    name: "UPRIGHT",
    desc: "Sampled contrabass — organic low-end rumble",
    build(output) {
      const sampler = new Tone.Sampler({
        urls: sampleUrls(["D#1","G1","A1","C2","D#2","E2","F#1","F#2","A2","C3","D#3","F#3","A3"]),
        baseUrl: SAMPLES_BASE + "contrabass/",
        release: 0.2,
      });
      const dist = new Tone.Distortion({ distortion: 0.3 });
      const filter = new Tone.Filter({ frequency: 400, type: "lowpass", rolloff: -12, Q: 2 });
      sampler.chain(dist, filter, output);
      return {
        triggerAttackRelease(note, dur, time) {
          sampler.triggerAttackRelease(note, typeof dur === "number" ? dur : 0.25, time);
        },
        dispose() { sampler.dispose(); dist.dispose(); filter.dispose(); },
        params: { dist, filter, sampler },
      };
    },
  },
  {
    id: "808-ebass",
    name: "ELECTRIC BASS",
    desc: "Sampled bass guitar — punchy, defined notes",
    build(output) {
      const sampler = new Tone.Sampler({
        urls: sampleUrls(["C#2","A2","F#2","C3","A3","D#3","F#3","C4","A4","D#4","F#4","C5","A5"]),
        baseUrl: SAMPLES_BASE + "bass-electric/",
        release: 0.15,
      });
      const dist = new Tone.Distortion({ distortion: 0.5 });
      const filter = new Tone.Filter({ frequency: 500, type: "lowpass", rolloff: -12, Q: 2 });
      sampler.chain(dist, filter, output);
      return {
        triggerAttackRelease(note, dur, time) {
          sampler.triggerAttackRelease(note, typeof dur === "number" ? dur : 0.25, time);
        },
        dispose() { sampler.dispose(); dist.dispose(); filter.dispose(); },
        params: { dist, filter, sampler },
      };
    },
  },
];

// ═══════════════════════════════════════════════════════════
//  KICK
// ═══════════════════════════════════════════════════════════

const kick = [
  {
    id: "kick-trap",
    name: "TRAP",
    desc: "Standard membrane synth kick — the default",
    build(output) {
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 6,
        envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 },
      });
      synth.connect(output);
      return {
        triggerAttackRelease(note, dur, time) { synth.triggerAttackRelease(note || "C1", dur || "8n", time); },
        dispose() { synth.dispose(); },
        params: { synth },
      };
    },
  },
  {
    id: "kick-punchy",
    name: "PUNCHY",
    desc: "Short tight kick — cuts through the mix",
    build(output) {
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.03,
        octaves: 8,
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
      });
      synth.connect(output);
      return {
        triggerAttackRelease(note, dur, time) { synth.triggerAttackRelease(note || "C1", dur || "8n", time); },
        dispose() { synth.dispose(); },
        params: { synth },
      };
    },
  },
  {
    id: "kick-boom",
    name: "BOOM",
    desc: "Long decay, deep low end — room-filling",
    build(output) {
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.08,
        octaves: 5,
        envelope: { attack: 0.002, decay: 0.6, sustain: 0.02, release: 0.5 },
      });
      synth.connect(output);
      return {
        triggerAttackRelease(note, dur, time) { synth.triggerAttackRelease(note || "C1", dur || "8n", time); },
        dispose() { synth.dispose(); },
        params: { synth },
      };
    },
  },
  {
    id: "kick-click",
    name: "CLICK",
    desc: "Ultra-short transient — all attack, no sustain",
    build(output) {
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.015,
        octaves: 10,
        envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.04 },
      });
      synth.connect(output);
      return {
        triggerAttackRelease(note, dur, time) { synth.triggerAttackRelease(note || "D1", dur || "8n", time); },
        dispose() { synth.dispose(); },
        params: { synth },
      };
    },
  },
  {
    id: "kick-heavy",
    name: "HEAVY",
    desc: "Maximum low end with saturation",
    build(output) {
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.06,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.45, sustain: 0.01, release: 0.4 },
      });
      const dist = new Tone.Distortion({ distortion: 0.3 });
      const filter = new Tone.Filter({ frequency: 200, type: "lowpass", rolloff: -12 });
      synth.chain(dist, filter, output);
      return {
        triggerAttackRelease(note, dur, time) { synth.triggerAttackRelease(note || "C1", dur || "8n", time); },
        dispose() { synth.dispose(); dist.dispose(); filter.dispose(); },
        params: { synth },
      };
    },
  },
];

// ═══════════════════════════════════════════════════════════
//  SNARE
// ═══════════════════════════════════════════════════════════

const snare = [
  {
    id: "snare-trap",
    name: "TRAP SNAP",
    desc: "White noise + body — the default snare",
    build(output) {
      const noise = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
      });
      const hpf = new Tone.Filter({ frequency: 5000, type: "highpass", rolloff: -12 });
      noise.chain(hpf, output);
      const body = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
      });
      body.connect(output);
      return {
        triggerAttackRelease(note, dur, time) {
          noise.triggerAttackRelease(dur || "16n", time);
          body.triggerAttackRelease(note || "D#3", dur || "16n", time);
        },
        dispose() { noise.dispose(); hpf.dispose(); body.dispose(); },
        params: { noise, body },
      };
    },
  },
  {
    id: "snare-tight",
    name: "TIGHT",
    desc: "Very short, controlled — sits in a pocket",
    build(output) {
      const noise = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.04 },
      });
      const hpf = new Tone.Filter({ frequency: 6000, type: "highpass", rolloff: -12 });
      noise.chain(hpf, output);
      const body = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 },
      });
      body.connect(output);
      return {
        triggerAttackRelease(note, dur, time) {
          noise.triggerAttackRelease("32n", time);
          body.triggerAttackRelease(note || "E3", "32n", time);
        },
        dispose() { noise.dispose(); hpf.dispose(); body.dispose(); },
        params: { noise, body },
      };
    },
  },
  {
    id: "snare-rim",
    name: "RIM",
    desc: "More body, less noise — rim shot character",
    build(output) {
      const body = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.08 },
      });
      const filter = new Tone.Filter({ frequency: 3000, type: "bandpass", Q: 3 });
      body.chain(filter, output);
      const noise = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 },
      });
      const hpf = new Tone.Filter({ frequency: 8000, type: "highpass", rolloff: -12 });
      noise.chain(hpf, output);
      return {
        triggerAttackRelease(note, dur, time) {
          body.triggerAttackRelease(note || "G#3", dur || "16n", time);
          noise.triggerAttackRelease("64n", time);
        },
        dispose() { body.dispose(); filter.dispose(); noise.dispose(); hpf.dispose(); },
        params: { noise, body },
      };
    },
  },
  {
    id: "snare-digital",
    name: "DIGITAL",
    desc: "Bit-crushed snare — lo-fi crunch",
    build(output) {
      const noise = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.06 },
      });
      const hpf = new Tone.Filter({ frequency: 4000, type: "highpass", rolloff: -12 });
      const crush = new Tone.BitCrusher({ bits: 6 });
      noise.chain(hpf, crush, output);
      const body = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.04 },
      });
      body.connect(output);
      return {
        triggerAttackRelease(note, dur, time) {
          noise.triggerAttackRelease(dur || "16n", time);
          body.triggerAttackRelease(note || "D3", dur || "16n", time);
        },
        dispose() { noise.dispose(); hpf.dispose(); crush.dispose(); body.dispose(); },
        params: { noise, body },
      };
    },
  },
  {
    id: "snare-fat",
    name: "FAT",
    desc: "Long noise tail, heavy body — fills the space",
    build(output) {
      const noise = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.001, decay: 0.25, sustain: 0.02, release: 0.15 },
      });
      const bpf = new Tone.Filter({ frequency: 4000, type: "bandpass", Q: 0.8 });
      noise.chain(bpf, output);
      const body = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.1 },
      });
      body.connect(output);
      return {
        triggerAttackRelease(note, dur, time) {
          noise.triggerAttackRelease("8n", time);
          body.triggerAttackRelease(note || "C#3", "8n", time);
        },
        dispose() { noise.dispose(); bpf.dispose(); body.dispose(); },
        params: { noise, body },
      };
    },
  },
];

// ═══════════════════════════════════════════════════════════
//  HI-HAT
// ═══════════════════════════════════════════════════════════

const hat = [
  {
    id: "hat-closed",
    name: "CLOSED",
    desc: "Bandpass noise — the default closed hat",
    build(output) {
      const synth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.04 },
      });
      const filter = new Tone.Filter({ frequency: 6000, type: "bandpass", Q: 1.2 });
      synth.chain(filter, output);
      return {
        triggerAttackRelease(dur, time, vel) { synth.triggerAttackRelease(dur || "32n", time, vel); },
        dispose() { synth.dispose(); filter.dispose(); },
        params: { filter, synth },
      };
    },
  },
  {
    id: "hat-metallic",
    name: "METALLIC",
    desc: "Higher frequency, resonant ring",
    build(output) {
      const synth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
      });
      const filter = new Tone.Filter({ frequency: 9000, type: "bandpass", Q: 3 });
      synth.chain(filter, output);
      return {
        triggerAttackRelease(dur, time, vel) { synth.triggerAttackRelease(dur || "32n", time, vel); },
        dispose() { synth.dispose(); filter.dispose(); },
        params: { filter, synth },
      };
    },
  },
  {
    id: "hat-shaker",
    name: "SHAKER",
    desc: "Longer decay, wider — organic shake",
    build(output) {
      const synth = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.002, decay: 0.08, sustain: 0, release: 0.06 },
      });
      const filter = new Tone.Filter({ frequency: 5000, type: "highpass", rolloff: -12 });
      synth.chain(filter, output);
      return {
        triggerAttackRelease(dur, time, vel) { synth.triggerAttackRelease(dur || "32n", time, vel); },
        dispose() { synth.dispose(); filter.dispose(); },
        params: { filter, synth },
      };
    },
  },
  {
    id: "hat-tick",
    name: "TICK",
    desc: "Ultra-short transient click",
    build(output) {
      const synth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.01 },
      });
      const filter = new Tone.Filter({ frequency: 8000, type: "highpass", rolloff: -24 });
      synth.chain(filter, output);
      return {
        triggerAttackRelease(dur, time, vel) { synth.triggerAttackRelease("64n", time, vel); },
        dispose() { synth.dispose(); filter.dispose(); },
        params: { filter, synth },
      };
    },
  },
];

// ═══════════════════════════════════════════════════════════
//  OPEN HI-HAT
// ═══════════════════════════════════════════════════════════

const openHat = [
  {
    id: "ohat-standard",
    name: "STANDARD",
    desc: "Sustained noise — the default open hat",
    build(output) {
      const synth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.03, release: 0.15 },
      });
      const filter = new Tone.Filter({ frequency: 5500, type: "bandpass", Q: 1 });
      synth.chain(filter, output);
      return {
        triggerAttackRelease(dur, time) { synth.triggerAttackRelease(dur || "8n", time); },
        dispose() { synth.dispose(); filter.dispose(); },
        params: { filter, synth },
      };
    },
  },
  {
    id: "ohat-ride",
    name: "RIDE",
    desc: "Tighter, more metallic sustain",
    build(output) {
      const synth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0.05, release: 0.12 },
      });
      const filter = new Tone.Filter({ frequency: 7000, type: "bandpass", Q: 2.5 });
      synth.chain(filter, output);
      return {
        triggerAttackRelease(dur, time) { synth.triggerAttackRelease(dur || "8n", time); },
        dispose() { synth.dispose(); filter.dispose(); },
        params: { filter, synth },
      };
    },
  },
  {
    id: "ohat-crash",
    name: "CRASH",
    desc: "Wide bandwidth, long tail — crash cymbal feel",
    build(output) {
      const synth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.005, decay: 0.5, sustain: 0.04, release: 0.4 },
      });
      const filter = new Tone.Filter({ frequency: 4000, type: "highpass", rolloff: -12 });
      synth.chain(filter, output);
      return {
        triggerAttackRelease(dur, time) { synth.triggerAttackRelease(dur || "4n", time); },
        dispose() { synth.dispose(); filter.dispose(); },
        params: { filter, synth },
      };
    },
  },
  {
    id: "ohat-sizzle",
    name: "SIZZLE",
    desc: "Filtered shimmer — background texture",
    build(output) {
      const synth = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.003, decay: 0.3, sustain: 0.06, release: 0.25 },
      });
      const filter = new Tone.Filter({ frequency: 6000, type: "bandpass", Q: 1.5 });
      synth.chain(filter, output);
      return {
        triggerAttackRelease(dur, time) { synth.triggerAttackRelease(dur || "8n", time); },
        dispose() { synth.dispose(); filter.dispose(); },
        params: { filter, synth },
      };
    },
  },
];

// ═══════════════════════════════════════════════════════════
//  ACCENT
// ═══════════════════════════════════════════════════════════

const accent = [
  {
    id: "acc-fmbell",
    name: "FM BELL",
    desc: "Bright FM synthesis — the default accent bell",
    build(output) {
      const synth = new Tone.FMSynth({
        harmonicity: 4.07,
        modulationIndex: 8,
        oscillator: { type: "sine" },
        modulation: { type: "sine" },
        envelope: { attack: 0.005, decay: 1.5, sustain: 0.08, release: 1.8 },
        modulationEnvelope: { attack: 0.005, decay: 0.8, sustain: 0.1, release: 0.6 },
      });
      const filter = new Tone.Filter({ frequency: 4500, type: "lowpass", rolloff: -12 });
      synth.chain(filter, output);
      return {
        triggerAttackRelease(note, dur, time) { synth.triggerAttackRelease(note, dur || "4n", time); },
        dispose() { synth.dispose(); filter.dispose(); },
        params: { filter, synth },
      };
    },
  },
  {
    id: "acc-chime",
    name: "CHIME",
    desc: "Simple bright tone — clean and clear",
    build(output) {
      const synth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.002, decay: 1.0, sustain: 0.05, release: 1.2 },
      });
      const filter = new Tone.Filter({ frequency: 6000, type: "lowpass", rolloff: -12 });
      synth.chain(filter, output);
      return {
        triggerAttackRelease(note, dur, time) { synth.triggerAttackRelease(note, dur || "4n", time); },
        dispose() { synth.dispose(); filter.dispose(); },
        params: { filter, synth },
      };
    },
  },
  {
    id: "acc-stab",
    name: "STAB",
    desc: "Short aggressive hit — punchy accent",
    build(output) {
      const synth = new Tone.FMSynth({
        harmonicity: 3,
        modulationIndex: 12,
        oscillator: { type: "square" },
        modulation: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
        modulationEnvelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
      });
      const filter = new Tone.Filter({ frequency: 5000, type: "lowpass", rolloff: -24 });
      synth.chain(filter, output);
      return {
        triggerAttackRelease(note, dur, time) { synth.triggerAttackRelease(note, dur || "16n", time); },
        dispose() { synth.dispose(); filter.dispose(); },
        params: { filter, synth },
      };
    },
  },
  {
    id: "acc-blip",
    name: "BLIP",
    desc: "Tiny electronic blip — minimal accent",
    build(output) {
      const synth = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
      });
      synth.connect(output);
      return {
        triggerAttackRelease(note, dur, time) { synth.triggerAttackRelease(note, "32n", time); },
        dispose() { synth.dispose(); },
        params: { synth },
      };
    },
  },
  {
    id: "acc-glass",
    name: "GLASS",
    desc: "Harmonic shimmer — ethereal overtones",
    build(output) {
      const synth = new Tone.AMSynth({
        harmonicity: 5,
        oscillator: { type: "sine" },
        modulation: { type: "sine" },
        envelope: { attack: 0.01, decay: 2.0, sustain: 0.05, release: 2.5 },
        modulationEnvelope: { attack: 0.01, decay: 1.0, sustain: 0.1, release: 0.8 },
      });
      const filter = new Tone.Filter({ frequency: 5000, type: "lowpass", rolloff: -12 });
      synth.chain(filter, output);
      return {
        triggerAttackRelease(note, dur, time) { synth.triggerAttackRelease(note, dur || "4n", time); },
        dispose() { synth.dispose(); filter.dispose(); },
        params: { filter, synth },
      };
    },
  },
  // ── Sampler presets ──
  {
    id: "acc-xylo",
    name: "XYLOPHONE",
    desc: "Sampled xylophone — bright percussive shimmer",
    build(output) {
      const sampler = new Tone.Sampler({
        urls: sampleUrls(["G4","C5","G5","C6","G6","C7","G7","C8"]),
        baseUrl: SAMPLES_BASE + "xylophone/",
        release: 0.3,
      });
      const filter = new Tone.Filter({ frequency: 5000, type: "lowpass", rolloff: -12 });
      sampler.chain(filter, output);
      return {
        triggerAttackRelease(note, dur, time) { sampler.triggerAttackRelease(note, dur || "4n", time); },
        dispose() { sampler.dispose(); filter.dispose(); },
        params: { filter, sampler },
      };
    },
  },
];

// ═══════════════════════════════════════════════════════════
//  PAD
// ═══════════════════════════════════════════════════════════

const pad = [
  {
    id: "pad-darksaw",
    name: "DARK SAW",
    desc: "Filtered sawtooth with slow LFO — the default pad",
    build(output) {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 1, decay: 0.3, sustain: 0.3, release: 2 },
      });
      const autoFilter = new Tone.AutoFilter({
        frequency: 0.0625,
        baseFrequency: 250,
        octaves: 0.85,
        type: "sine",
      }).start();
      synth.chain(autoFilter, output);
      return {
        triggerAttackRelease(notes, dur, time) { synth.triggerAttackRelease(notes, dur, time); },
        dispose() { synth.dispose(); autoFilter.dispose(); },
        params: { autoFilter, synth },
      };
    },
  },
  {
    id: "pad-strings",
    name: "STRINGS",
    desc: "Warm slow attack — orchestral feel",
    build(output) {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "fatsawtooth", count: 3, spread: 15 },
        envelope: { attack: 1.5, decay: 0.5, sustain: 0.4, release: 3 },
      });
      const filter = new Tone.Filter({ frequency: 2000, type: "lowpass", rolloff: -12 });
      const autoFilter = new Tone.AutoFilter({
        frequency: 0.04,
        baseFrequency: 300,
        octaves: 0.5,
        type: "sine",
      }).start();
      synth.chain(filter, autoFilter, output);
      return {
        triggerAttackRelease(notes, dur, time) { synth.triggerAttackRelease(notes, dur, time); },
        dispose() { synth.dispose(); filter.dispose(); autoFilter.dispose(); },
        params: { autoFilter, synth },
      };
    },
  },
  {
    id: "pad-ambient",
    name: "AMBIENT",
    desc: "Very slow movement — atmospheric wash",
    build(output) {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 3, decay: 1, sustain: 0.5, release: 5 },
      });
      const autoFilter = new Tone.AutoFilter({
        frequency: 0.03,
        baseFrequency: 200,
        octaves: 1.2,
        type: "sine",
      }).start();
      synth.chain(autoFilter, output);
      return {
        triggerAttackRelease(notes, dur, time) { synth.triggerAttackRelease(notes, dur, time); },
        dispose() { synth.dispose(); autoFilter.dispose(); },
        params: { autoFilter, synth },
      };
    },
  },
  {
    id: "pad-drone",
    name: "DRONE",
    desc: "Static dark tone — minimal movement",
    build(output) {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "square" },
        envelope: { attack: 2, decay: 0.5, sustain: 0.2, release: 3 },
      });
      const filter = new Tone.Filter({ frequency: 600, type: "lowpass", rolloff: -24 });
      const autoFilter = new Tone.AutoFilter({
        frequency: 0.02,
        baseFrequency: 150,
        octaves: 0.4,
        type: "sine",
      }).start();
      synth.chain(filter, autoFilter, output);
      return {
        triggerAttackRelease(notes, dur, time) { synth.triggerAttackRelease(notes, dur, time); },
        dispose() { synth.dispose(); filter.dispose(); autoFilter.dispose(); },
        params: { autoFilter, synth },
      };
    },
  },
];

// ═══════════════════════════════════════════════════════════
//  SUB
// ═══════════════════════════════════════════════════════════

const sub = [
  {
    id: "sub-sine",
    name: "SINE",
    desc: "Pure sine oscillator — the default sub bass",
    build(output) {
      const osc = new Tone.Oscillator({ frequency: "C#1", type: "sine" });
      const filter = new Tone.Filter({ frequency: 80, type: "lowpass", rolloff: -24 });
      osc.chain(filter, output);
      return {
        setFrequency(freq, rampTime, time) { osc.frequency.rampTo(freq, rampTime || 0.15, time); },
        start() { osc.start(); },
        stop() { osc.stop(); },
        dispose() { osc.dispose(); filter.dispose(); },
        params: { osc, filter },
      };
    },
  },
  {
    id: "sub-triangle",
    name: "TRIANGLE",
    desc: "Slight harmonic warmth — triangle wave",
    build(output) {
      const osc = new Tone.Oscillator({ frequency: "C#1", type: "triangle" });
      const filter = new Tone.Filter({ frequency: 100, type: "lowpass", rolloff: -24 });
      osc.chain(filter, output);
      return {
        setFrequency(freq, rampTime, time) { osc.frequency.rampTo(freq, rampTime || 0.15, time); },
        start() { osc.start(); },
        stop() { osc.stop(); },
        dispose() { osc.dispose(); filter.dispose(); },
        params: { osc, filter },
      };
    },
  },
  {
    id: "sub-squarelp",
    name: "SQUARE LP",
    desc: "Filtered square wave — more harmonic presence",
    build(output) {
      const osc = new Tone.Oscillator({ frequency: "C#1", type: "square" });
      const filter = new Tone.Filter({ frequency: 60, type: "lowpass", rolloff: -24 });
      osc.chain(filter, output);
      return {
        setFrequency(freq, rampTime, time) { osc.frequency.rampTo(freq, rampTime || 0.15, time); },
        start() { osc.start(); },
        stop() { osc.stop(); },
        dispose() { osc.dispose(); filter.dispose(); },
        params: { osc, filter },
      };
    },
  },
  {
    id: "sub-warm",
    name: "WARM",
    desc: "Gentle saturation on sine — thicker low end",
    build(output) {
      const osc = new Tone.Oscillator({ frequency: "C#1", type: "sine" });
      const filter = new Tone.Filter({ frequency: 90, type: "lowpass", rolloff: -24 });
      const waveshaper = new Tone.Chebyshev(2);
      const postFilter = new Tone.Filter({ frequency: 100, type: "lowpass", rolloff: -24 });
      osc.chain(filter, waveshaper, postFilter, output);
      return {
        setFrequency(freq, rampTime, time) { osc.frequency.rampTo(freq, rampTime || 0.15, time); },
        start() { osc.start(); },
        stop() { osc.stop(); },
        dispose() { osc.dispose(); filter.dispose(); waveshaper.dispose(); postFilter.dispose(); },
        params: { osc, filter },
      };
    },
  },
];

// ═══════════════════════════════════════════════════════════
//  VINYL
// ═══════════════════════════════════════════════════════════

const vinyl = [
  {
    id: "vinyl-pink",
    name: "PINK",
    desc: "Pink noise — the default vinyl texture",
    build(output) {
      const noise = new Tone.Noise("pink");
      const filter = new Tone.Filter({ frequency: 2000, type: "lowpass", rolloff: -24 });
      noise.chain(filter, output);
      return {
        start() { noise.start(); },
        stop() { noise.stop(); },
        dispose() { noise.dispose(); filter.dispose(); },
        params: { noise, filter },
      };
    },
  },
  {
    id: "vinyl-hiss",
    name: "TAPE HISS",
    desc: "High-passed noise — cassette tape character",
    build(output) {
      const noise = new Tone.Noise("white");
      const hpf = new Tone.Filter({ frequency: 3000, type: "highpass", rolloff: -12 });
      const lpf = new Tone.Filter({ frequency: 8000, type: "lowpass", rolloff: -24 });
      const gain = new Tone.Gain(0.4);
      noise.chain(hpf, lpf, gain, output);
      return {
        start() { noise.start(); },
        stop() { noise.stop(); },
        dispose() { noise.dispose(); hpf.dispose(); lpf.dispose(); gain.dispose(); },
        params: { noise },
      };
    },
  },
  {
    id: "vinyl-crackle",
    name: "CRACKLE",
    desc: "Intermittent pops and crackle — vinyl warmth",
    build(output) {
      const noise = new Tone.Noise("brown");
      const filter = new Tone.Filter({ frequency: 1500, type: "bandpass", Q: 2 });
      const crush = new Tone.BitCrusher({ bits: 4 });
      const gain = new Tone.Gain(0.3);
      noise.chain(filter, crush, gain, output);
      return {
        start() { noise.start(); },
        stop() { noise.stop(); },
        dispose() { noise.dispose(); filter.dispose(); crush.dispose(); gain.dispose(); },
        params: { noise },
      };
    },
  },
  {
    id: "vinyl-room",
    name: "ROOM TONE",
    desc: "Very low, dark rumble — room ambiance",
    build(output) {
      const noise = new Tone.Noise("brown");
      const filter = new Tone.Filter({ frequency: 400, type: "lowpass", rolloff: -24 });
      const gain = new Tone.Gain(0.6);
      noise.chain(filter, gain, output);
      return {
        start() { noise.start(); },
        stop() { noise.stop(); },
        dispose() { noise.dispose(); filter.dispose(); gain.dispose(); },
        params: { noise },
      };
    },
  },
];

// ═══════════════════════════════════════════════════════════
//  REGISTRY
// ═══════════════════════════════════════════════════════════

const PRESETS = {
  melody,
  "808": eight,
  kick,
  snare,
  hat,
  "open-hat": openHat,
  accent,
  pad,
  sub,
  vinyl,
};

export function getPresets(layer) {
  return PRESETS[layer] || [];
}

export function getPreset(layer, id) {
  return PRESETS[layer]?.find(p => p.id === id) || null;
}

export function getDefaultPresetId(layer) {
  return PRESETS[layer]?.[0]?.id || null;
}

export function getAllLayers() {
  return Object.keys(PRESETS);
}

// ═══════════════════════════════════════════════════════════
//  CUSTOM SAMPLE LOADER
// ═══════════════════════════════════════════════════════════

/**
 * Build a sampler preset from arbitrary sample URLs.
 * Use for vocal chops, RVC-processed audio, or any user-provided samples.
 *
 * @param {Object} opts
 * @param {string} opts.id       - Unique preset ID (e.g. "mel-vocal-1")
 * @param {string} opts.name     - Display name (e.g. "VOCAL CHOP")
 * @param {string} opts.desc     - Description
 * @param {string} opts.layer    - Target layer ("melody", "accent", etc.)
 * @param {Object} opts.urls     - Note-to-URL map (e.g. { "C4": "/samples/vocal-c4.mp3" })
 * @param {string} [opts.baseUrl] - Optional base URL prefix for all sample paths
 * @param {boolean} [opts.mono]  - Use mono note tracking (default true for melody/accent)
 * @param {number} [opts.filterFreq] - Lowpass filter cutoff (default 4000)
 * @returns {Object} Preset definition ready for registerCustomPreset()
 */
export function buildCustomSamplerPreset(opts) {
  const { id, name, desc, layer, urls, baseUrl, mono = true, filterFreq = 4000 } = opts;
  return {
    id,
    name,
    desc,
    build(output) {
      const sampler = new Tone.Sampler({
        urls,
        baseUrl: baseUrl || "",
        release: 0.3,
      });
      const filter = new Tone.Filter({ frequency: filterFreq, type: "lowpass", rolloff: -12 });
      const crush = new Tone.BitCrusher({ bits: 16 });
      sampler.chain(filter, crush, output);

      const base = mono ? monoSamplerWrap(sampler) : {
        triggerAttackRelease(note, dur, time, vel) { sampler.triggerAttackRelease(note, dur, time, vel); },
      };

      return {
        ...base,
        dispose() { sampler.dispose(); filter.dispose(); crush.dispose(); },
        params: { filter, crush, sampler },
      };
    },
  };
}

/**
 * Register a custom preset at runtime (e.g. user-loaded vocal samples).
 * The preset will appear in the preset selector dropdown for its layer.
 */
export function registerCustomPreset(layer, preset) {
  if (!PRESETS[layer]) return false;
  // Avoid duplicates
  const idx = PRESETS[layer].findIndex(p => p.id === preset.id);
  if (idx >= 0) PRESETS[layer][idx] = preset;
  else PRESETS[layer].push(preset);
  return true;
}
