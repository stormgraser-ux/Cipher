import * as Tone from "tone";
import { humanizeTiming, humanizeVelocity } from "../core/humanize.js";
import { createLayerState } from "../studio/layer-state.js";
import { createMacros } from "../studio/macros.js";
import { createPatternStore } from "../studio/pattern-store.js";
import { createPlayhead } from "../studio/playhead.js";
import { createLayerRef } from "../studio/layer-ref.js";
import { getPreset, getPresets, getDefaultPresetId } from "../studio/preset-registry.js";

// ── Musical Data: C#m, 140 BPM half-time, 2-bar loop ──

const MELODY = [
  null, "C#4", "B3", null, "A3", null, "G#3", null,
  "A3", null, "G#3", "F#3", null, "E3", null, null,
];

const SUB_ROOT = ["C#1", "B0"];

const BASS_808 = [
  "C#1", null, null, null, "C#1", null, null, null,
  "D#1", null, null, null, "C#1", null, "B0", null,
];

const KICK = [
  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const SNARE = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
];

const HAT_VEL = [
  0.08, 0.03, 0.06, 0.03, 0.08, 0.03, 0.06, 0.03,
  0.08, 0.03, 0.06, 0.03, 0.08, 0.03, 0.06, 0.03,
];

const HAT_VEL_V2 = [
  0.08, 0.03, 0.06, 0.03, 0.10, 0.02, 0.06, 0.03,
  0.08, 0.04, 0.06, 0.03, 0.08, 0.03, 0.05, 0.04,
];

const OPEN_HAT = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
];

const HIGH_ACCENT = [
  "C#5", null, null, null, null, null, null, null,
  "E5",  null, null, null, "G#4", null, null, null,
];

// ── Arrangement ──
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

const LAYER_MAP = {
  "intro":     { kick: false, snare: false, hat: false, hatV2: false, eight: true,  accent: true,  openHat: false },
  "verse-1":   { kick: true,  snare: true,  hat: true,  hatV2: false, eight: true,  accent: false, openHat: false },
  "hook-1":    { kick: true,  snare: true,  hat: true,  hatV2: false, eight: true,  accent: true,  openHat: true  },
  "verse-2":   { kick: true,  snare: true,  hat: false, hatV2: true,  eight: true,  accent: false, openHat: false },
  "hook-2":    { kick: true,  snare: true,  hat: true,  hatV2: false, eight: true,  accent: true,  openHat: true  },
  "breakdown": { kick: false, snare: false, hat: false, hatV2: false, eight: false, accent: true,  openHat: false },
  "hook-3":    { kick: true,  snare: true,  hat: true,  hatV2: false, eight: true,  accent: true,  openHat: true  },
  "outro":     { kick: true,  snare: true,  hat: false, hatV2: false, eight: true,  accent: false, openHat: false },
};

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

// Step-index array helper
function idxArray(len) {
  return Array.from({ length: len }, (_, i) => i);
}

// ── All 10 layer names (display order) ──
const LAYER_NAMES = [
  "melody", "808", "kick", "snare", "hat", "open-hat", "accent", "pad", "sub", "vinyl"
];

// Map from layer display name to sequence gate name
const LAYER_TO_SEQ = {
  "melody": null,    // continuous
  "808": "eight",
  "kick": "kick",
  "snare": "snare",
  "hat": "hat",
  "open-hat": "openHat",
  "accent": "accent",
  "pad": null,       // continuous
  "sub": null,       // continuous
  "vinyl": null,     // continuous
};

// Layers whose presets have start/stop (oscillators, noise sources)
const STARTABLE_LAYERS = ["808", "sub", "vinyl"];

export function createDarkTrapTrack(mixer) {
  // ── Studio modules ──
  const layerState = createLayerState(LAYER_NAMES);
  const patternStore = createPatternStore();
  const playhead = createPlayhead();

  // Activity tracking — which layers triggered this frame
  const activity = {};
  const activityListeners = [];
  function fireActivity(layer) {
    activity[layer] = performance.now();
    for (const fn of activityListeners) fn(layer);
  }

  // ── Register patterns ──
  patternStore.register("melody",   { pattern: MELODY,       resolution: "8n",  type: "note" });
  patternStore.register("808",      { pattern: BASS_808,     resolution: "8n",  type: "note" });
  patternStore.register("kick",     { pattern: KICK,         resolution: "16n", type: "trigger" });
  patternStore.register("snare",    { pattern: SNARE,        resolution: "16n", type: "trigger" });
  patternStore.register("hat",      { pattern: HAT_VEL,      resolution: "16n", type: "velocity" });
  patternStore.register("hatV2",    { pattern: HAT_VEL_V2,   resolution: "16n", type: "velocity" });
  patternStore.register("open-hat", { pattern: OPEN_HAT,     resolution: "16n", type: "trigger" });
  patternStore.register("accent",   { pattern: HIGH_ACCENT,  resolution: "8n",  type: "note" });

  // ── Channels ──
  const melCh     = mixer.createChannel("melody",   { volume: -36 });
  const subCh     = mixer.createChannel("sub-bass", { volume: -6 });
  const eightCh   = mixer.createChannel("808",      { volume: -8 });
  const kickCh    = mixer.createChannel("kick",     { volume: -6 });
  const snareCh   = mixer.createChannel("snare",    { volume: -8 });
  const hatCh     = mixer.createChannel("hat",      { volume: -12 });
  const openHatCh = mixer.createChannel("open-hat", { volume: -10 });
  const padCh     = mixer.createChannel("pad",      { volume: -18 });
  const accentCh  = mixer.createChannel("accent",   { volume: -14 });
  const vinylCh   = mixer.createChannel("vinyl",    { volume: -54 });

  // Channel map for continuous layer muting
  const channelMap = {
    "melody": melCh, "sub": subCh, "808": eightCh, "kick": kickCh,
    "snare": snareCh, "hat": hatCh, "open-hat": openHatCh,
    "pad": padCh, "accent": accentCh, "vinyl": vinylCh,
  };

  // Store user-set volumes so we can restore after unmute
  const savedVolumes = {};
  for (const [name, ch] of Object.entries(channelMap)) {
    savedVolumes[name] = ch.volume.value;
  }

  // Continuous layers: mute by volume, not by callback gating
  const CONTINUOUS_LAYERS = ["melody", "pad", "sub", "vinyl"];

  function applyContinuousMutes() {
    for (const name of CONTINUOUS_LAYERS) {
      const ch = channelMap[name];
      if (!ch) continue;
      if (layerState.isSilenced(name)) {
        ch.volume.value = -Infinity;
      } else {
        ch.volume.value = savedVolumes[name];
      }
    }
  }

  // Listen for mute/solo changes
  layerState.onChange(applyContinuousMutes);

  // Reverb sends
  melCh.send("reverb", -10);
  snareCh.send("reverb", -18);
  padCh.send("reverb", -3);
  accentCh.send("reverb", -6);

  // ── Fixed intermediary nodes (survive preset swaps) ──
  const melAutoVol = new Tone.Volume(0);
  melAutoVol.connect(melCh);

  const vinylGain = new Tone.Gain(0);
  vinylGain.connect(vinylCh);

  // ── Layer Refs ──
  const layerRefs = {};
  for (const name of LAYER_NAMES) {
    layerRefs[name] = createLayerRef(name);
  }

  // Output map: where each preset chains to
  const outputMap = {
    melody:    melAutoVol,
    "808":     eightCh,
    kick:      kickCh,
    snare:     snareCh,
    hat:       hatCh,
    "open-hat": openHatCh,
    accent:    accentCh,
    pad:       padCh,
    sub:       subCh,
    vinyl:     vinylGain,
  };

  // Initialize all layers with default presets
  for (const name of LAYER_NAMES) {
    const defaultId = getDefaultPresetId(name);
    const preset = getPreset(name, defaultId);
    if (preset) {
      layerRefs[name].swap(preset.build(outputMap[name]), defaultId);
    }
  }

  // Start continuous sources (oscillators, noise)
  // These need to be running for audio to pass through
  // (They'll be stopped/started as needed in start/cleanup)

  // ── Sequences (PatternStore-backed, close over layerRefs) ──

  let melHeld = false;
  const melSeq = new Tone.Sequence(
    (time, stepIdx) => {
      if (layerState.isSilenced("melody")) {
        if (melHeld) { layerRefs.melody.triggerRelease(time); melHeld = false; }
        return;
      }
      const note = patternStore.get("melody", stepIdx);
      if (note === null) {
        if (melHeld) { layerRefs.melody.triggerRelease(time); melHeld = false; }
        return;
      }
      layerRefs.melody.triggerAttack(note, time + humanizeTiming(0.003));
      melHeld = true;
      fireActivity("melody");
    },
    idxArray(MELODY.length), "8n"
  );
  melSeq.loop = true;

  const eightSeq = new Tone.Sequence(
    (time, stepIdx) => {
      if (layerState.isSilenced("808")) return;
      const note = patternStore.get("808", stepIdx);
      if (note === null) return;
      layerRefs["808"].triggerAttackRelease(note, 0.25, time);
      fireActivity("808");
    },
    idxArray(BASS_808.length), "8n"
  );
  eightSeq.loop = true;

  const kickSeq = new Tone.Sequence(
    (time, stepIdx) => {
      if (layerState.isSilenced("kick")) return;
      const hit = patternStore.get("kick", stepIdx);
      if (!hit) return;
      layerRefs.kick.triggerAttackRelease("C1", "8n", time);
      fireActivity("kick");
    },
    idxArray(KICK.length), "16n"
  );
  kickSeq.loop = true;

  const snareSeq = new Tone.Sequence(
    (time, stepIdx) => {
      if (layerState.isSilenced("snare")) return;
      const hit = patternStore.get("snare", stepIdx);
      if (!hit) return;
      layerRefs.snare.triggerAttackRelease("D#3", "16n", time);
      fireActivity("snare");
    },
    idxArray(SNARE.length), "16n"
  );
  snareSeq.loop = true;

  const hatSeq = new Tone.Sequence(
    (time, stepIdx) => {
      if (layerState.isSilenced("hat")) return;
      const vel = patternStore.get("hat", stepIdx);
      if (!vel || vel <= 0) return;
      const v = humanizeVelocity(vel, 0.02);
      layerRefs.hat.triggerAttackRelease("32n", time + humanizeTiming(0.003), v);
      fireActivity("hat");
    },
    idxArray(HAT_VEL.length), "16n"
  );
  hatSeq.loop = true;

  const hatSeqV2 = new Tone.Sequence(
    (time, stepIdx) => {
      if (layerState.isSilenced("hat")) return;
      const vel = patternStore.get("hatV2", stepIdx);
      if (!vel || vel <= 0) return;
      const v = humanizeVelocity(vel, 0.02);
      layerRefs.hat.triggerAttackRelease("32n", time + humanizeTiming(0.003), v);
      fireActivity("hat");
    },
    idxArray(HAT_VEL_V2.length), "16n"
  );
  hatSeqV2.loop = true;

  const openHatSeq = new Tone.Sequence(
    (time, stepIdx) => {
      if (layerState.isSilenced("open-hat")) return;
      const hit = patternStore.get("open-hat", stepIdx);
      if (!hit) return;
      layerRefs["open-hat"].triggerAttackRelease("8n", time);
      fireActivity("open-hat");
    },
    idxArray(OPEN_HAT.length), "16n"
  );
  openHatSeq.loop = true;

  const accentSeq = new Tone.Sequence(
    (time, stepIdx) => {
      if (layerState.isSilenced("accent")) return;
      const note = patternStore.get("accent", stepIdx);
      if (note === null) return;
      layerRefs.accent.triggerAttackRelease(note, "4n", time);
      fireActivity("accent");
    },
    idxArray(HIGH_ACCENT.length), "8n"
  );
  accentSeq.loop = true;

  const subSeq = new Tone.Sequence(
    (time, note) => {
      const freq = Tone.Frequency(note).toFrequency();
      layerRefs.sub.setFrequency(freq, 0.15, time);
      fireActivity("sub");
    },
    SUB_ROOT, "1m"
  );
  subSeq.loop = true;

  const padPart = new Tone.Part(
    (time, chord) => {
      layerRefs.pad.triggerAttackRelease(chord, "1m + 2n", time);
      fireActivity("pad");
    },
    [["0:0:0", ["C#3", "E3", "G#3"]]]
  );
  padPart.loop = true;
  padPart.loopEnd = "2m";

  // ── Macros (targets go through layerRefs) ──
  const macros = createMacros({
    "dark-bright": {
      label: "DARK / BRIGHT",
      targets: [
        { param: (v) => { const f = layerRefs.melody.getParam("filter"); if (f) f.frequency.value = v; }, min: 800, max: 5000, curve: 1.5 },
        { param: (v) => { const f = layerRefs.hat.getParam("filter"); if (f) f.frequency.value = v; },    min: 3000, max: 10000 },
        { param: (v) => { const f = layerRefs.pad.getParam("autoFilter"); if (f) f.baseFrequency = v; }, min: 120, max: 500 },
      ],
    },
    "grit": {
      label: "GRIT",
      targets: [
        { param: (v) => { const d = layerRefs["808"].getParam("dist"); if (d) d.distortion = v; }, min: 0.3, max: 1.0, curve: 0.49 },
        { param: (v) => { const f = layerRefs["808"].getParam("filter"); if (f) f.frequency.value = v; }, min: 280, max: 420 },
        { param: (v) => { const c = layerRefs.melody.getParam("crush"); if (c) c.bits.value = v; }, min: 16, max: 2, curve: 1.8 },
        { param: (v) => { const f = layerRefs.melody.getParam("postFilter"); if (f) f.frequency.value = v; }, min: 3000, max: 4000 },
        { param: (v) => { const w = layerRefs.melody.getParam("waveshaper"); if (w) w.order = Math.round(v); }, min: 1, max: 5 },
      ],
    },
    "space": {
      label: "SPACE",
      targets: [
        { param: (v) => { mixer.fx.reverbChannel.volume.value = v; }, min: -24, max: 12 },
        { param: (v) => { mixer.fx.delayChannel.volume.value = v; },  min: -24, max: 8 },
      ],
    },
    "weight": {
      label: "WEIGHT",
      targets: [
        { param: (v) => { const e = layerRefs["808"].getParam("env"); if (e) e.decay = v; }, min: 0.1, max: 0.6 },
        { param: (v) => { subCh.volume.value = v; savedVolumes["sub"] = v; }, min: -20, max: 0 },
        { param: (v) => { const s = layerRefs.kick.getParam("synth"); if (s) s.envelope.decay = v; }, min: 0.15, max: 0.5 },
      ],
    },
    "bounce": {
      label: "BOUNCE",
      targets: [
        { param: (v) => { Tone.getTransport().swing = v; }, min: 0, max: 0.5 },
      ],
    },
  });

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

  function applyMix(name, instant) {
    melAutoVol.volume.cancelScheduledValues(Tone.now());
    const mf = layerRefs.melody.getParam("filter");
    if (mf) mf.frequency.cancelScheduledValues(Tone.now());
    vinylGain.gain.cancelScheduledValues(Tone.now());

    const vinylOn = ["verse-1", "verse-2", "hook-1", "hook-2", "hook-3", "outro"].includes(name);
    rampParam(vinylGain.gain, vinylOn ? 1 : 0, instant ? 0 : 0.8);

    switch (name) {
      case "intro":
        rampParam(melAutoVol.volume, -10, instant ? 0 : 0.1);
        if (mf) rampParam(mf.frequency, 800, instant ? 0 : 0.5);
        break;
      case "verse-1":
      case "verse-2":
        rampParam(melAutoVol.volume, -6, instant ? 0 : 0.1);
        if (mf) rampParam(mf.frequency, 2500, instant ? 0 : 0.5);
        break;
      case "hook-1":
      case "hook-2":
        rampParam(melAutoVol.volume, 0, instant ? 0 : 0.05);
        if (mf) rampParam(mf.frequency, 3000, instant ? 0 : 0.3);
        break;
      case "breakdown":
        rampParam(melAutoVol.volume, -4, instant ? 0 : 0.2);
        if (mf) rampParam(mf.frequency, 1200, instant ? 0 : 1.0);
        break;
      case "hook-3":
        rampParam(melAutoVol.volume, 0, instant ? 0 : 0.02);
        if (mf) rampParam(mf.frequency, 3200, instant ? 0 : 0.2);
        break;
      case "outro":
        rampParam(melAutoVol.volume, 0, 0.01);
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

    scheduledIds.forEach(id => t.clear(id));
    scheduledIds = [];
    allSequences.forEach(s => { s.stop(0); s.cancel(0); });
    padPart.stop(0);
    padPart.cancel(0);

    mixer.master.volume.cancelScheduledValues(Tone.now());
    mixer.master.volume.value = 0;

    // Stop and restart continuous-source layers
    for (const name of STARTABLE_LAYERS) {
      layerRefs[name].stop();
      layerRefs[name].start();
    }

    const origin = `${fromBar}m`;
    subSeq.start(origin);
    padPart.start(origin);

    padCh.volume.cancelScheduledValues(Tone.now());
    if (fromBar < 4) {
      padCh.volume.value = -40;
      sched(() => padCh.volume.rampTo(-18, 6), 0);
    } else {
      padCh.volume.value = -18;
    }

    melSeq.start(fromBar < 2 ? "2m" : origin);

    for (const [name, seq] of Object.entries(SEQ_MAP)) {
      const windows = getSequenceWindows(name);
      for (const w of windows) {
        if (w.end <= fromBar) continue;
        const startBar = Math.max(w.start, fromBar);
        seq.start(`${startBar}m`);
        seq.stop(`${w.end}m`);
      }
    }

    const secIdx = SECTIONS.findIndex(s => fromBar >= s.start && fromBar < s.end);
    const startSec = SECTIONS[Math.max(0, secIdx)];
    setSection(startSec.name);
    applyMix(startSec.name, true);

    for (const sec of SECTIONS) {
      if (sec.start <= fromBar) continue;
      sched(() => {
        setSection(sec.name);
        applyMix(sec.name, false);
      }, sec.start);
    }

    sched(() => {
      cleanup();
      setSection("stopped");
    }, 68);

    // Apply continuous mutes in case anything was muted before starting
    applyContinuousMutes();

    playhead.start();
  }

  function cleanup() {
    const t = Tone.getTransport();
    scheduledIds.forEach(id => t.clear(id));
    scheduledIds = [];

    allSequences.forEach(s => { s.stop(0); s.cancel(0); });
    padPart.stop(0);
    padPart.cancel(0);

    // Stop continuous-source layers
    for (const name of STARTABLE_LAYERS) {
      layerRefs[name].stop();
    }

    if (melHeld) {
      try { layerRefs.melody.triggerRelease(); } catch (_) {}
      melHeld = false;
    }

    melAutoVol.volume.cancelScheduledValues(Tone.now());
    melAutoVol.volume.value = 0;
    const mf = layerRefs.melody.getParam("filter");
    if (mf) mf.frequency.cancelScheduledValues(Tone.now());
    vinylGain.gain.cancelScheduledValues(Tone.now());
    vinylGain.gain.value = 0;
    padCh.volume.cancelScheduledValues(Tone.now());
    mixer.master.volume.cancelScheduledValues(Tone.now());
    mixer.master.volume.value = 0;

    playhead.stop();
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

  function getSection() { return currentSection; }
  function getSections() { return SECTIONS; }

  // ── Preset Swap ──
  function swapPreset(layerName, presetId) {
    const preset = getPreset(layerName, presetId);
    if (!preset) return false;
    const ref = layerRefs[layerName];
    if (!ref) return false;

    // Release held melody note before disposing old synth
    if (layerName === "melody" && melHeld) {
      try { ref.triggerRelease(); } catch (_) {}
      melHeld = false;
    }

    const output = outputMap[layerName];
    const built = preset.build(output);
    ref.swap(built, presetId);

    // If transport running and this is a startable layer, start the new preset
    const isRunning = Tone.getTransport().state === "started";
    if (isRunning && STARTABLE_LAYERS.includes(layerName)) {
      ref.start();
    }

    // Re-apply macros so the new preset gets current knob values
    macros.applyAll();

    return true;
  }

  function getActivePresets() {
    const result = {};
    for (const name of LAYER_NAMES) {
      result[name] = layerRefs[name].getPresetId();
    }
    return result;
  }

  // ── Dispose ──
  function dispose() {
    stop();
    // Dispose all layer refs (disposes underlying presets)
    for (const ref of Object.values(layerRefs)) {
      ref.dispose();
    }
    // Dispose sequences
    subSeq.dispose(); melSeq.dispose(); eightSeq.dispose();
    kickSeq.dispose(); snareSeq.dispose();
    hatSeq.dispose(); hatSeqV2.dispose(); openHatSeq.dispose();
    accentSeq.dispose();
    padPart.dispose();
    // Dispose fixed intermediary nodes
    melAutoVol.dispose();
    vinylGain.dispose();
  }

  // ── Controls (mixer faders) ──
  function getControls() {
    return [
      { name: "melody",   label: "MELODY",   group: "levels", get: () => melCh.volume.value,     set: (v) => { melCh.volume.value = v; savedVolumes["melody"] = v; },     min: -40, max: 0,    step: 1,    unit: "dB", default: -36 },
      { name: "sub-bass", label: "SUB",      group: "levels", get: () => subCh.volume.value,     set: (v) => { subCh.volume.value = v; savedVolumes["sub"] = v; },         min: -40, max: 0,    step: 1,    unit: "dB", default: -6 },
      { name: "808",      label: "808",      group: "levels", get: () => eightCh.volume.value,   set: (v) => { eightCh.volume.value = v; savedVolumes["808"] = v; },       min: -40, max: 0,    step: 1,    unit: "dB", default: -8 },
      { name: "kick",     label: "KICK",     group: "levels", get: () => kickCh.volume.value,    set: (v) => { kickCh.volume.value = v; savedVolumes["kick"] = v; },       min: -40, max: 0,    step: 1,    unit: "dB", default: -6 },
      { name: "snare",    label: "SNARE",    group: "levels", get: () => snareCh.volume.value,   set: (v) => { snareCh.volume.value = v; savedVolumes["snare"] = v; },     min: -40, max: 0,    step: 1,    unit: "dB", default: -8 },
      { name: "hat",      label: "HAT",      group: "levels", get: () => hatCh.volume.value,     set: (v) => { hatCh.volume.value = v; savedVolumes["hat"] = v; },         min: -40, max: 0,    step: 1,    unit: "dB", default: -12 },
      { name: "open-hat", label: "O-HAT",    group: "levels", get: () => openHatCh.volume.value, set: (v) => { openHatCh.volume.value = v; savedVolumes["open-hat"] = v; }, min: -40, max: 0,    step: 1,    unit: "dB", default: -10 },
      { name: "pad",      label: "PAD",      group: "levels", get: () => padCh.volume.value,     set: (v) => { padCh.volume.value = v; savedVolumes["pad"] = v; },         min: -40, max: 0,    step: 1,    unit: "dB", default: -18 },
      { name: "accent",   label: "ACCENT",   group: "levels", get: () => accentCh.volume.value,  set: (v) => { accentCh.volume.value = v; savedVolumes["accent"] = v; },   min: -40, max: 0,    step: 1,    unit: "dB", default: -14 },
      { name: "vinyl",    label: "VINYL",    group: "levels", get: () => vinylCh.volume.value,   set: (v) => { vinylCh.volume.value = v; savedVolumes["vinyl"] = v; },     min: -60, max: -30,  step: 1,    unit: "dB", default: -54 },
      { name: "portamento",  label: "GLIDE",     group: "synth", get: () => { const s = layerRefs.melody.getParam("synth"); return s?.portamento ?? 0.08; },              set: (v) => { const s = layerRefs.melody.getParam("synth"); if (s) s.set({ portamento: v }); }, min: 0,   max: 0.3,  step: 0.01, unit: "s",  default: 0.08 },
      { name: "808-filter",  label: "808 FILT",  group: "synth", get: () => { const f = layerRefs["808"].getParam("filter"); return f?.frequency?.value ?? 350; },         set: (v) => { const f = layerRefs["808"].getParam("filter"); if (f) f.frequency.value = v; }, min: 100, max: 800,  step: 10,   unit: "Hz", default: 350 },
      { name: "808-drive",   label: "808 DRIVE", group: "synth", get: () => { const d = layerRefs["808"].getParam("dist"); return d?.distortion ?? 0.8; },                set: (v) => { const d = layerRefs["808"].getParam("dist"); if (d) d.distortion = v; },        min: 0,   max: 1,    step: 0.05, unit: "",   default: 0.8 },
      { name: "mel-filter",  label: "MEL FILT",  group: "synth", get: () => { const f = layerRefs.melody.getParam("filter"); return f?.frequency?.value ?? 3200; },        set: (v) => { const f = layerRefs.melody.getParam("filter"); if (f) f.frequency.value = v; },   min: 500, max: 5000, step: 50,   unit: "Hz", default: 3200 },
    ];
  }

  // ── Public API ──
  return {
    start,
    stop,
    setVolume,
    getSection,
    getSections,
    getControls,
    onSectionChange: (fn) => { sectionChangeCb = fn; },
    dispose,
    // Studio API
    layerState,
    macros,
    patternStore,
    playhead,
    getLayerNames: () => LAYER_NAMES,
    getActivity: () => ({ ...activity }),
    onActivity: (fn) => {
      activityListeners.push(fn);
      return () => {
        const idx = activityListeners.indexOf(fn);
        if (idx >= 0) activityListeners.splice(idx, 1);
      };
    },
    // Preset API
    swapPreset,
    getPresets: (layer) => getPresets(layer),
    getActivePresets,
  };
}
