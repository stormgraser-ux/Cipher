import * as Tone from "tone";
import { humanizeTiming } from "../core/humanize.js";

// ── Musical Data: AABA form, F major, 95 BPM, 16 bars ──
// A: Fmaj7 → Am7 → Bbmaj7 → Cmaj7
// B: Dm7 → Gm7 → Bbmaj7 → C7

const A_CHORDS = [
  ["F3","C4","E4","A4"], ["A2","E3","G3","C4"],
  ["Bb2","F3","A3","D4"], ["C3","G3","B3","E4"],
];
const B_CHORDS = [
  ["D3","A3","C4","F4"], ["G2","D3","F3","Bb3"],
  ["Bb2","F3","A3","D4"], ["C3","G3","Bb3","E4"],
];
const CHORDS = [...A_CHORDS, ...A_CHORDS, ...A_CHORDS, ...B_CHORDS];

const A_BASS = ["F2", "A2", "Bb2", "C3"];
const B_BASS = ["D2", "G2", "Bb2", "C3"];
const BASS = [...A_BASS, ...A_BASS, ...A_BASS, ...B_BASS];

// Melody: 8 eighth notes per bar × 16 bars = 128 events
const A_MEL = [
  "C5","A4",null,"F4",null,"A4","C5","E5",
  "E5","C5",null,"A4",null,"G4","A4","C5",
  "D5","Bb4",null,"F4",null,"A4","Bb4","D5",
  "E5","C5",null,"G4",null,"B4","C5","E5",
];
const B_MEL = [
  "A4","F4",null,"D4",null,"F4","A4","C5",
  "D5","Bb4",null,"G4",null,"F4","G4","Bb4",
  "D5","Bb4",null,"F4",null,"A4","Bb4","D5",
  "E5","C5",null,"G4",null,"Bb4","C5","E5",
];
const MELODY = [...A_MEL, ...A_MEL, ...A_MEL, ...B_MEL];

// Bells: sparse — one note per bar at varying 8th-note positions
function buildBells() {
  const bells = new Array(128).fill(null);
  const a = [[0, 4, "F5"], [1, 6, "E5"], [2, 2, "A5"], [3, 5, "G5"]];
  const b = [[0, 4, "D5"], [1, 6, "Bb4"], [2, 2, "A5"], [3, 5, "E5"]];
  for (let p = 0; p < 3; p++) {
    for (const [bar, pos, note] of a) bells[(p * 4 + bar) * 8 + pos] = note;
  }
  for (const [bar, pos, note] of b) bells[(12 + bar) * 8 + pos] = note;
  return bells;
}
const BELLS = buildBells();

const SHAKER_VEL = [0.09, 0.04, 0.07, 0.04, 0.09, 0.04, 0.07, 0.05];

// Phase volume targets (dB). -60 = effectively silent.
const PHASE_LEVELS = {
  roll: { pad: -12, bass: -14, mel: -60, shaker: -60, bells: -60, kick: -60 },
  pick: { pad: -10, bass: -12, mel: -10, shaker: -18, bells: -60, kick: -60 },
  play: { pad: -8,  bass: -10, mel: -8,  shaker: -16, bells: -20, kick: -14 },
};
const RAMP = 0.4; // 400ms phase crossfade

export function createGardenTrack(mixer) {
  // ── Channels ──
  const padCh    = mixer.createChannel("pad",    { volume: -12 });
  const bassCh   = mixer.createChannel("bass",   { volume: -14 });
  const melCh    = mixer.createChannel("melody", { volume: -60 });
  const shakerCh = mixer.createChannel("shaker", { volume: -60 });
  const bellCh   = mixer.createChannel("bells",  { volume: -60 });
  const kickCh   = mixer.createChannel("kick",   { volume: -60 });

  // Reverb sends
  padCh.send("reverb", -6);
  melCh.send("reverb", -18);
  bellCh.send("reverb", -3);
  shakerCh.send("reverb", -20);

  // ── Instruments + Effects ──

  // Pad: warm sawtooth with slow auto-filter sweep (~40s cycle)
  const padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.5, decay: 0.3, sustain: 0.5, release: 2 },
  });
  const padAutoFilter = new Tone.AutoFilter({
    frequency: 0.025,
    baseFrequency: 600,
    octaves: 0.74, // sweeps to ~1000 Hz
    type: "sine",
  }).start();
  padSynth.chain(padAutoFilter, padCh);

  // Bass: round triangle
  const bassSynth = new Tone.MonoSynth({
    oscillator: { type: "triangle" },
    filter: { Q: 1, type: "lowpass", rolloff: -12 },
    filterEnvelope: {
      attack: 0.06, decay: 0.2, sustain: 0.35, release: 0.4,
      baseFrequency: 320, octaves: 0.5,
    },
    envelope: { attack: 0.06, decay: 0.2, sustain: 0.35, release: 0.4 },
  });
  bassSynth.connect(bassCh);

  // Melody: plucky triangle music box + dotted 8th delay
  const melSynth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0.01, release: 0.25 },
  });
  const melFilter = new Tone.Filter({ frequency: 2800, type: "lowpass", rolloff: -12 });
  const melDelay = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.3, wet: 0.3 });
  melSynth.chain(melFilter, melDelay, melCh);

  // Bells: sine, ethereal + dotted 8th delay
  const bellSynth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.25, sustain: 0.01, release: 0.6 },
  });
  const bellFilter = new Tone.Filter({ frequency: 4000, type: "lowpass", rolloff: -12 });
  const bellDelay = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.35, wet: 0.4 });
  bellSynth.chain(bellFilter, bellDelay, bellCh);

  // Shaker: filtered white noise
  const shaker = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.04 },
  });
  const shakerBPF = new Tone.Filter({ frequency: 5500, type: "bandpass", Q: 1.5 });
  shaker.chain(shakerBPF, shakerCh);

  // Kick: soft membrane, heavy LP filter
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.03,
    octaves: 3,
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
  });
  const kickFilter = new Tone.Filter({ frequency: 150, type: "lowpass", rolloff: -24 });
  kick.chain(kickFilter, kickCh);

  // ── Sequences ──

  // Pad: 1 chord per bar, 16-bar loop (uses Part to avoid array sub-division)
  const padPart = new Tone.Part(
    (time, chord) => {
      padSynth.triggerAttackRelease(chord, "2n + 4n", time);
    },
    CHORDS.map((chord, i) => [`${i}:0:0`, chord])
  );
  padPart.loop = true;
  padPart.loopEnd = "16m";

  // Bass: 1 note per bar, 16-bar loop
  const bassSeq = new Tone.Sequence(
    (time, note) => {
      bassSynth.triggerAttackRelease(note, "2n", time);
    },
    BASS,
    "1m"
  );
  bassSeq.loop = true;

  // Melody: 8th notes, 128 events = 16-bar loop
  const melSeq = new Tone.Sequence(
    (time, note) => {
      if (note === null) return;
      melSynth.triggerAttackRelease(note, "16n", time + humanizeTiming(0.004));
    },
    MELODY,
    "8n"
  );
  melSeq.loop = true;

  // Bells: 8th notes, 128 events (mostly null), 16-bar loop
  const bellSeq = new Tone.Sequence(
    (time, note) => {
      if (note === null) return;
      bellSynth.triggerAttackRelease(note, "4n", time);
    },
    BELLS,
    "8n"
  );
  bellSeq.loop = true;

  // Shaker: 8th note pulse, 1-bar loop
  const shakerSeq = new Tone.Sequence(
    (time, vel) => {
      shaker.triggerAttackRelease("16n", time + humanizeTiming(0.003), vel);
    },
    SHAKER_VEL,
    "8n"
  );
  shakerSeq.loop = true;

  // Kick: beats 1 and 3 (half-note pulse)
  const kickLoop = new Tone.Loop((time) => {
    kick.triggerAttackRelease("C1", "8n", time);
  }, "2n");

  // ── Phase control ──
  let currentPhase = "roll";

  function setPhase(phase) {
    const levels = PHASE_LEVELS[phase];
    if (!levels) return;
    currentPhase = phase;
    padCh.volume.rampTo(levels.pad, RAMP);
    bassCh.volume.rampTo(levels.bass, RAMP);
    melCh.volume.rampTo(levels.mel, RAMP);
    shakerCh.volume.rampTo(levels.shaker, RAMP);
    bellCh.volume.rampTo(levels.bells, RAMP);
    kickCh.volume.rampTo(levels.kick, RAMP);
  }

  // ── Transport ──
  function start() {
    padPart.start(0);
    bassSeq.start(0);
    melSeq.start(0);
    bellSeq.start(0);
    shakerSeq.start(0);
    kickLoop.start(0);
  }

  function stop() {
    padPart.stop();
    bassSeq.stop();
    melSeq.stop();
    bellSeq.stop();
    shakerSeq.stop();
    kickLoop.stop();
  }

  function setVolume(v) {
    const db = v <= 0 ? -Infinity : -60 + v * 60;
    mixer.master.volume.rampTo(db, 0.05);
  }

  function dispose() {
    stop();
    padPart.dispose(); bassSeq.dispose(); melSeq.dispose();
    bellSeq.dispose(); shakerSeq.dispose(); kickLoop.dispose();
    padSynth.dispose(); padAutoFilter.dispose();
    bassSynth.dispose();
    melSynth.dispose(); melFilter.dispose(); melDelay.dispose();
    bellSynth.dispose(); bellFilter.dispose(); bellDelay.dispose();
    shaker.dispose(); shakerBPF.dispose();
    kick.dispose(); kickFilter.dispose();
  }

  // Apply initial phase (roll = minimal)
  setPhase(currentPhase);

  return { start, stop, setPhase, setVolume, dispose };
}
