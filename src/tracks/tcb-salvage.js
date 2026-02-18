import * as Tone from "tone";
import {
  createSubBass,
  createMidBass,
  createArpLead,
  createDarkPad,
  createKick,
  createHat,
  createClap,
} from "../core/instruments.js";
import {
  humanizeVelocity,
  humanizeTiming,
  createVelocityPattern,
  pickGap,
} from "../core/humanize.js";

// Cm progression: Cm → Ab → Bb → Gm (4 measures, 1 chord each)
const CHORDS = [
  ["C3", "Eb3", "G3"],   // Cm
  ["Ab2", "C3", "Eb3"],  // Ab
  ["Bb2", "D3", "F3"],   // Bb
  ["G2", "Bb2", "D3"],   // Gm
];

const SUB_NOTES = ["C2", "Eb2", "Ab1", "Bb1"];
const MID_NOTES = ["C2", "C3", "Eb2", "Eb3", "Ab1", "Ab2", "Bb1", "Bb2"];
const ARP_NOTES = ["C4", "Eb4", "G4", "Bb4", "C5", "Bb4", "G4", "Eb4"];

// Base hat velocity pattern — 2-bar, humanized each loop
const HAT_BASE = [
  0.28, 0.12, null, 0.22, 0.28, 0.10, null, 0.18,
  0.28, null, 0.14, 0.22, null, 0.12, 0.28, 0.16,
];

export function createSalvageTrack(mixer) {
  // -- Create channels --
  const subCh = mixer.createChannel("sub-bass", { volume: -6 });
  const midCh = mixer.createChannel("mid-bass", { volume: -14 });
  const kickCh = mixer.createChannel("kick", { volume: -8 });
  const hatCh = mixer.createChannel("hat", { volume: -10 });
  const clapCh = mixer.createChannel("clap", { volume: -10 });
  const arpCh = mixer.createChannel("arp-lead", { volume: -10 });
  const padCh = mixer.createChannel("dark-pad", { volume: -12 });

  // Send pads and arp to reverb
  const padReverbSend = padCh.send("reverb", -6);
  arpCh.send("reverb", -18);

  // -- Create instruments, connect to channels --
  const subBass = createSubBass();
  subBass.connect(subCh);

  const midBass = createMidBass();
  midBass.connect(midCh);

  const kick = createKick();
  kick.connect(kickCh);

  const hat = createHat();
  hat.connect(hatCh);

  const clap = createClap();
  // Bandpass filter on clap for snap
  const clapFilter = new Tone.Filter({ frequency: 1200, type: "bandpass", Q: 2 });
  clap.chain(clapFilter, clapCh);

  const arpLead = createArpLead();
  // AutoFilter for the sweeping movement + delay for depth
  const arpFilter = new Tone.AutoFilter({
    frequency: "8m",  // one full sweep per 8 measures
    baseFrequency: 600,
    octaves: 2,
    type: "sine",
    wet: 1,
  }).start();
  const arpDelay = new Tone.FeedbackDelay({
    delayTime: "8n.",
    feedback: 0.35,
    wet: 0.2,
  });
  arpLead.chain(arpFilter, arpDelay, arpCh);

  const darkPad = createDarkPad();
  const padFilter = new Tone.Filter({ frequency: 1000, type: "lowpass", rolloff: -12 });
  darkPad.chain(padFilter, padCh);

  // -- Sequences --
  // Sub-bass: 1 note per measure, 4 measures
  const subSeq = new Tone.Sequence(
    (time, note) => {
      subBass.triggerAttackRelease(note, "2n", time);
    },
    SUB_NOTES,
    "1m"
  );
  subSeq.loop = true;

  // Mid-bass: 8 notes per measure (8th notes), staccato
  const midSeq = new Tone.Sequence(
    (time, note) => {
      midBass.triggerAttackRelease(note, "16n", time + humanizeTiming(0.003));
    },
    MID_NOTES,
    "8n"
  );
  midSeq.loop = true;

  // Kick: four on the floor
  const kickLoop = new Tone.Loop((time) => {
    kick.triggerAttackRelease("C1", "8n", time);
  }, "4n");

  // Hats: 16th note grid, 2-bar loop with humanized velocities
  const hatSeq = new Tone.Sequence(
    (time, vel) => {
      if (vel === null || !pickGap(0)) return;
      const v = humanizeVelocity(vel, 0.04);
      hat.triggerAttackRelease("16n", time + humanizeTiming(0.005), v);
    },
    HAT_BASE,
    "8n"
  );
  hatSeq.loop = true;

  // Clap on beats 2 and 4
  const clapSeq = new Tone.Sequence(
    (time, hit) => {
      if (hit) clap.triggerAttackRelease("8n", time, 0.3);
    },
    [null, true, null, true],
    "4n"
  );
  clapSeq.loop = true;

  // Lead arp: 8 notes per measure (8th notes)
  const arpSeq = new Tone.Sequence(
    (time, note) => {
      arpLead.triggerAttackRelease(note, "16n", time + humanizeTiming(0.004));
    },
    ARP_NOTES,
    "8n"
  );
  arpSeq.loop = true;

  // Dark chords: 1 chord per measure, 4-measure loop
  const chordPart = new Tone.Part(
    (time, chord) => {
      darkPad.triggerAttackRelease(chord, "2n + 4n", time);
    },
    CHORDS.map((chord, i) => [`${i}:0:0`, chord])
  );
  chordPart.loop = true;
  chordPart.loopEnd = "4m";

  // -- Intensity control state --
  let intensity = 0.5;

  function setIntensity(v) {
    intensity = Math.max(0, Math.min(1, v));

    // Arp filter sweep range: wider at high intensity
    const octaves = 1 + intensity * 3; // 1–4 octaves
    arpFilter.octaves = octaves;

    // Pad reverb send: more wet at high intensity
    const sendDb = -12 + intensity * 12; // -12 to 0 dB
    padReverbSend.gain.rampTo(Math.pow(10, sendDb / 20), 0.3);

    // Pad filter opens with intensity
    padFilter.frequency.rampTo(600 + intensity * 1400, 0.3); // 600–2000 Hz

    // Hat velocity spread increases with intensity
    // (applied per-trigger via humanize amount — store for hatSeq callback)
    hatVelSpread = 0.02 + intensity * 0.06;
  }

  let hatVelSpread = 0.04;

  // Patch the hat seq callback to use current spread
  hatSeq.callback = (time, vel) => {
    if (vel === null) return;
    if (!pickGap(0)) return;
    const v = humanizeVelocity(vel, hatVelSpread);
    hat.triggerAttackRelease("16n", time + humanizeTiming(0.005), v);
  };

  function start() {
    subSeq.start(0);
    midSeq.start(0);
    kickLoop.start(0);
    hatSeq.start(0);
    clapSeq.start(0);
    arpSeq.start(0);
    chordPart.start(0);
  }

  function stop() {
    subSeq.stop();
    midSeq.stop();
    kickLoop.stop();
    hatSeq.stop();
    clapSeq.stop();
    arpSeq.stop();
    chordPart.stop();
  }

  function setVolume(v) {
    // v: 0–1 → -60 to 0 dB
    const db = v <= 0 ? -Infinity : -60 + v * 60;
    mixer.master.volume.rampTo(db, 0.05);
  }

  function tick(_dtS) {
    // Reserved for per-frame automation (game state → audio params)
    // Currently a no-op; adapters call setIntensity directly
  }

  function dispose() {
    stop();
    subSeq.dispose();
    midSeq.dispose();
    kickLoop.dispose();
    hatSeq.dispose();
    clapSeq.dispose();
    arpSeq.dispose();
    chordPart.dispose();
    subBass.dispose();
    midBass.dispose();
    kick.dispose();
    hat.dispose();
    clap.dispose();
    clapFilter.dispose();
    arpLead.dispose();
    arpFilter.dispose();
    arpDelay.dispose();
    darkPad.dispose();
    padFilter.dispose();
  }

  // Apply initial intensity
  setIntensity(intensity);

  return { start, stop, setIntensity, setVolume, tick, dispose };
}
