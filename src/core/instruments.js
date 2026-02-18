import * as Tone from "tone";

export function createSubBass() {
  return new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    filter: { Q: 2, type: "lowpass", rolloff: -24 },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.3,
      sustain: 0.2,
      release: 0.4,
      baseFrequency: 60,
      octaves: 1.5,
    },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.4 },
  });
}

export function createMidBass() {
  return new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    filter: { Q: 1, type: "lowpass", rolloff: -12 },
    filterEnvelope: {
      attack: 0.005,
      decay: 0.08,
      sustain: 0,
      release: 0.1,
      baseFrequency: 150,
      octaves: 1.5,
    },
    envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.1 },
  });
}

export function createArpLead() {
  return new Tone.Synth({
    oscillator: { type: "square" },
    envelope: { attack: 0.005, decay: 0.07, sustain: 0.04, release: 0.15 },
  });
}

export function createDarkPad() {
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.05, decay: 0.25, sustain: 0.3, release: 0.8 },
  });
}

export function createKick() {
  return new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 },
  });
}

export function createHat() {
  return new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.06 },
  });
}

export function createClap() {
  return new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
  });
}
