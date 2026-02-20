import * as Tone from "tone";

// ── Helpers ──────────────────────────────────────────────

function freq(note, semitoneOffset = 0) {
  return semitoneOffset === 0
    ? Tone.Frequency(note).toFrequency()
    : Tone.Frequency(note).transpose(semitoneOffset).toFrequency();
}

// ── IMPACTS ──────────────────────────────────────────────

/** Heavy low impact — damage, collision, punch */
export const hit = {
  poolSize: 4,
  createVoice(output) {
    const synth = new Tone.MembraneSynth({
      pitchDecay: 0.04,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 },
    });
    const dist = new Tone.Distortion(0.4);
    synth.chain(dist, output);
    return {
      trigger({ pitch = 0, intensity = 0.8 } = {}) {
        synth.triggerAttackRelease(freq("C1", pitch), "16n", Tone.now(), intensity);
      },
      dispose() {
        synth.dispose();
        dist.dispose();
      },
    };
  },
};

/** Light tap — minor impacts, footsteps, small collisions */
export const hitLight = {
  poolSize: 4,
  createVoice(output) {
    const synth = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 3,
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
    });
    synth.connect(output);
    return {
      trigger({ pitch = 0, intensity = 0.6 } = {}) {
        synth.triggerAttackRelease(freq("C2", pitch), "32n", Tone.now(), intensity);
      },
      dispose() {
        synth.dispose();
      },
    };
  },
};

/** Explosion — noise burst + low thud */
export const explode = {
  poolSize: 3,
  createVoice(output) {
    const thud = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 6,
      envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.3 },
    });
    const noise = new Tone.NoiseSynth({
      noise: { type: "brown" },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
    });
    const noiseFilt = new Tone.Filter(800, "lowpass");
    thud.connect(output);
    noise.chain(noiseFilt, output);
    return {
      trigger({ pitch = 0, intensity = 0.8 } = {}) {
        const now = Tone.now();
        thud.triggerAttackRelease(freq("C1", pitch), "4n", now, intensity);
        noise.triggerAttackRelease("8n", now, intensity * 0.7);
      },
      dispose() {
        thud.dispose();
        noise.dispose();
        noiseFilt.dispose();
      },
    };
  },
};

// ── ENERGY ───────────────────────────────────────────────

/** Electric zap — sci-fi energy, laser, shock */
export const zap = {
  poolSize: 4,
  createVoice(output) {
    const synth = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 },
    });
    synth.connect(output);
    return {
      trigger({ pitch = 0, intensity = 0.7 } = {}) {
        const now = Tone.now();
        const startHz = freq("C6", pitch);
        synth.triggerAttackRelease(startHz, "16n", now, intensity);
        // Pitch sweep down for "zap" character
        synth.frequency.exponentialRampToValueAtTime(startHz / 8, now + 0.12);
      },
      dispose() {
        synth.dispose();
      },
    };
  },
};

/** Item pickup — two ascending notes (minor third) */
export const pickup = {
  poolSize: 4,
  createVoice(output) {
    const synth = new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 4,
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.08,
        sustain: 0,
        release: 0.05,
      },
    });
    synth.connect(output);
    return {
      trigger({ pitch = 0, intensity = 0.7 } = {}) {
        const now = Tone.now();
        synth.triggerAttackRelease(freq("C5", pitch), "32n", now, intensity * 0.7);
        synth.triggerAttackRelease(
          freq("Eb5", pitch),
          "16n",
          now + 0.08,
          intensity,
        );
      },
      dispose() {
        synth.dispose();
      },
    };
  },
};

/** Power up — ascending minor triad (Cm), three notes getting brighter */
export const powerup = {
  poolSize: 3,
  createVoice(output) {
    const synth = new Tone.FMSynth({
      harmonicity: 2,
      modulationIndex: 3,
      envelope: { attack: 0.001, decay: 0.15, sustain: 0.1, release: 0.15 },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0.2,
        release: 0.1,
      },
    });
    synth.connect(output);
    return {
      trigger({ pitch = 0, intensity = 0.8 } = {}) {
        const now = Tone.now();
        synth.triggerAttackRelease(
          freq("C4", pitch),
          "16n",
          now,
          intensity * 0.5,
        );
        synth.triggerAttackRelease(
          freq("Eb4", pitch),
          "16n",
          now + 0.12,
          intensity * 0.7,
        );
        synth.triggerAttackRelease(
          freq("G4", pitch),
          "8n",
          now + 0.24,
          intensity,
        );
      },
      dispose() {
        synth.dispose();
      },
    };
  },
};

// ── UI ───────────────────────────────────────────────────

/** UI click — ultra-short noise, crisp */
export const click = {
  poolSize: 4,
  createVoice(output) {
    const synth = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.01 },
    });
    const filter = new Tone.Filter(4000, "highpass");
    synth.chain(filter, output);
    return {
      trigger({ intensity = 0.5 } = {}) {
        synth.triggerAttackRelease("64n", Tone.now(), intensity);
      },
      dispose() {
        synth.dispose();
        filter.dispose();
      },
    };
  },
};

/** Error / invalid action — two descending square-wave notes */
export const error = {
  poolSize: 3,
  createVoice(output) {
    const synth = new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0.05, release: 0.08 },
    });
    synth.connect(output);
    return {
      trigger({ pitch = 0, intensity = 0.6 } = {}) {
        const now = Tone.now();
        synth.triggerAttackRelease(freq("Eb4", pitch), "16n", now, intensity);
        synth.triggerAttackRelease(
          freq("C4", pitch),
          "16n",
          now + 0.1,
          intensity * 0.8,
        );
      },
      dispose() {
        synth.dispose();
      },
    };
  },
};

/** Success / confirm — two ascending FM notes (fifth interval) */
export const success = {
  poolSize: 3,
  createVoice(output) {
    const synth = new Tone.FMSynth({
      harmonicity: 2,
      modulationIndex: 2,
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.08,
        sustain: 0,
        release: 0.05,
      },
    });
    synth.connect(output);
    return {
      trigger({ pitch = 0, intensity = 0.7 } = {}) {
        const now = Tone.now();
        synth.triggerAttackRelease(
          freq("C4", pitch),
          "16n",
          now,
          intensity * 0.7,
        );
        synth.triggerAttackRelease(
          freq("G4", pitch),
          "16n",
          now + 0.1,
          intensity,
        );
      },
      dispose() {
        synth.dispose();
      },
    };
  },
};

// ── AMBIENT ──────────────────────────────────────────────

/** Bell chime — metallic FM tone, longer decay */
export const chime = {
  poolSize: 4,
  createVoice(output) {
    const synth = new Tone.FMSynth({
      harmonicity: 5.07, // slightly off-integer for inharmonic bell character
      modulationIndex: 8,
      envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 0.4 },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0,
        release: 0.2,
      },
    });
    synth.connect(output);
    return {
      trigger({ pitch = 0, intensity = 0.6 } = {}) {
        synth.triggerAttackRelease(freq("C5", pitch), "4n", Tone.now(), intensity);
      },
      dispose() {
        synth.dispose();
      },
    };
  },
};

/** Sparkle — high bright FM blip with random pitch drift */
export const sparkle = {
  poolSize: 4,
  createVoice(output) {
    const synth = new Tone.FMSynth({
      harmonicity: 7,
      modulationIndex: 12,
      envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.06 },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.04,
        sustain: 0,
        release: 0.03,
      },
    });
    synth.connect(output);
    return {
      trigger({ pitch = 0, intensity = 0.4 } = {}) {
        const drift = (Math.random() - 0.5) * 4; // ±2 semitones organic variation
        synth.triggerAttackRelease(
          freq("C6", pitch + drift),
          "64n",
          Tone.now(),
          intensity,
        );
      },
      dispose() {
        synth.dispose();
      },
    };
  },
};

/** Whoosh — filtered noise sweep, transitions and movement */
export const whoosh = {
  poolSize: 3,
  createVoice(output) {
    const noise = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.02, decay: 0.25, sustain: 0, release: 0.15 },
    });
    const filter = new Tone.Filter(200, "bandpass", -24);
    filter.Q.value = 2;
    noise.chain(filter, output);
    return {
      trigger({ intensity = 0.5 } = {}) {
        const now = Tone.now();
        filter.frequency.cancelScheduledValues(now);
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        noise.triggerAttackRelease("4n", now, intensity);
      },
      dispose() {
        noise.dispose();
        filter.dispose();
      },
    };
  },
};

// ── TCB: OVERCHARGED RAIL ────────────────────────────────
// Requested by Junk — signature railgun weapon SFX suite

/**
 * Overcharged Rail — Lock-In Chime (0.3-0.5s)
 * Capacitor reaching full charge. Electromagnetic hum sweeps up with
 * building FM buzz, resolves into a sharp metallic ping. Anticipatory,
 * not aggressive — maximum potential energy locked in.
 */
export const railLockin = {
  poolSize: 3,
  createVoice(output) {
    // Electromagnetic hum — FM with square mod for buzzy/electric feel
    // Mod envelope builds over 200ms, peaking right before the ping
    const hum = new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 8,
      oscillator: { type: "sine" },
      modulation: { type: "square" },
      envelope: { attack: 0.02, decay: 0.25, sustain: 0, release: 0.08 },
      modulationEnvelope: { attack: 0.2, decay: 0.05, sustain: 0, release: 0.05 },
    });
    // Lock-in ping — sharp metallic bell, clean against the buzzy buildup
    const ping = new Tone.FMSynth({
      harmonicity: 5.07,
      modulationIndex: 14,
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.1 },
      modulationEnvelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
    });
    hum.connect(output);
    ping.connect(output);
    return {
      trigger({ pitch = 0, intensity = 0.7 } = {}) {
        const now = Tone.now();
        // Hum: starts at C3, sweeps up to C4 over 250ms
        const humStart = freq("C3", pitch);
        const humEnd = freq("C4", pitch);
        hum.triggerAttackRelease(humStart, "8n", now, intensity * 0.4);
        hum.frequency.exponentialRampToValueAtTime(humEnd, now + 0.25);
        // Ping: metallic lock-in at the peak — octave above hum's destination
        ping.triggerAttackRelease(freq("C5", pitch), "16n", now + 0.25, intensity);
      },
      dispose() {
        hum.dispose();
        ping.dispose();
      },
    };
  },
};

/**
 * Overcharged Rail — Fire (~0.8s)
 * Massive railgun discharge. Two layers: (1) deep metallic bass CRACK with
 * heavy distortion — instant attack, no ramp, octave sweep from sky-high to
 * sub bass. (2) High-frequency electric sizzle riding on top for 0.5s.
 * THE signature shot. Should make the player grin.
 */
export const railFire = {
  poolSize: 2,
  createVoice(output) {
    // Bass crack — MembraneSynth at C0, 8 octave sweep = metallic thunder
    const crack = new Tone.MembraneSynth({
      pitchDecay: 0.06,
      octaves: 8,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.2 },
    });
    const crackDist = new Tone.Distortion(0.8);
    // Electric sizzle — white noise, high-passed, light distortion for crackle
    const sizzle = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.2 },
    });
    const sizzleFilt = new Tone.Filter(3000, "highpass");
    const sizzleDist = new Tone.Distortion(0.3);
    crack.chain(crackDist, output);
    sizzle.chain(sizzleFilt, sizzleDist, output);
    return {
      trigger({ pitch = 0, intensity = 0.9 } = {}) {
        const now = Tone.now();
        crack.triggerAttackRelease(freq("C0", pitch), "8n", now, intensity);
        sizzle.triggerAttackRelease("4n", now, intensity * 0.6);
      },
      dispose() {
        crack.dispose();
        crackDist.dispose();
        sizzle.dispose();
        sizzleFilt.dispose();
        sizzleDist.dispose();
      },
    };
  },
};

/**
 * Overcharged Rail — Pierce Impact (0.2-0.3s)
 * Metallic punch-through — hot slug through sheet metal. Sharp FM hit at G5
 * (mid-high, sits above rail-fire's bass) + brief pink noise sizzle tail.
 * Pool of 6 for rapid succession (multiple enemies pierced on one shot).
 * Pink noise instead of white = less fatiguing when stacked.
 */
export const railPierce = {
  poolSize: 6,
  createVoice(output) {
    // Metallic punch — high harmonicity FM, very short, inharmonic
    const punch = new Tone.FMSynth({
      harmonicity: 7,
      modulationIndex: 14,
      envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.04 },
      modulationEnvelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 },
    });
    // Brief sizzle tail — pink noise, bandpassed at 2500Hz
    const sizzle = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
    });
    const sizzleFilt = new Tone.Filter(2500, "bandpass");
    sizzleFilt.Q.value = 1.5;
    punch.connect(output);
    sizzle.chain(sizzleFilt, output);
    return {
      trigger({ pitch = 0, intensity = 0.7 } = {}) {
        const now = Tone.now();
        punch.triggerAttackRelease(freq("G5", pitch), "64n", now, intensity);
        sizzle.triggerAttackRelease("32n", now, intensity * 0.4);
      },
      dispose() {
        punch.dispose();
        sizzle.dispose();
        sizzleFilt.dispose();
      },
    };
  },
};

// ── TCB: RAMPAGE EVOLUTION ───────────────────────────────
// Burst rifle evolution — metallic shell casings, aggressive fire, turbine hum

/**
 * Rampage Tick — shell casing ping (~80ms)
 * Brass round dropped on steel. High FM with inharmonic harmonicity for
 * metallic bell character. Ultra-short, satisfying click-ping.
 * Pitch option critical: game pitches +2 semitones per stack (0 to +10).
 */
export const rampageTick = {
  poolSize: 6,
  createVoice(output) {
    const synth = new Tone.FMSynth({
      harmonicity: 5.5, // inharmonic = metallic
      modulationIndex: 10,
      envelope: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.02 },
      modulationEnvelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.01 },
    });
    // Highpass to keep it bright and clean — no mud
    const hp = new Tone.Filter(2000, "highpass");
    synth.chain(hp, output);
    return {
      trigger({ pitch = 0, intensity = 0.6 } = {}) {
        synth.triggerAttackRelease(freq("C6", pitch), "64n", Tone.now(), intensity);
      },
      dispose() { synth.dispose(); hp.dispose(); },
    };
  },
};

/**
 * Rampage Fire — burst rifle round (~120ms)
 * Aggressive metallic burst. Sawtooth body with fast pitch drop gives the
 * "crack," layered noise burst gives the grit. Meaner than base fire sound.
 */
export const rampageFire = {
  poolSize: 4,
  createVoice(output) {
    // Metallic crack — sawtooth with fast pitch drop
    const crack = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.03 },
    });
    const dist = new Tone.Distortion(0.5);
    // Noise snap — short white noise burst for grit
    const snap = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 },
    });
    const snapFilt = new Tone.Filter(5000, "bandpass");
    snapFilt.Q.value = 1;
    crack.chain(dist, output);
    snap.chain(snapFilt, output);
    return {
      trigger({ pitch = 0, intensity = 0.8 } = {}) {
        const now = Tone.now();
        const startHz = freq("C5", pitch);
        crack.triggerAttackRelease(startHz, "32n", now, intensity);
        // Fast pitch drop — metallic "crack" character
        crack.frequency.exponentialRampToValueAtTime(startHz / 4, now + 0.1);
        snap.triggerAttackRelease("64n", now, intensity * 0.5);
      },
      dispose() { crack.dispose(); dist.dispose(); snap.dispose(); snapFilt.dispose(); },
    };
  },
};

/**
 * Rampage Sustain — turbine hum (looping)
 * Low warm metallic drone. FM synth with gentle LFO on filter cutoff for
 * organic "turbine at cruising speed" movement. Not threatening — satisfied.
 * The machine is happy. 0.5s fade in/out.
 */
export const rampageSustain = {
  looping: true,
  createVoice(output) {
    const synth = new Tone.FMSynth({
      harmonicity: 2, // mild metallic character
      modulationIndex: 3,
      oscillator: { type: "sine" },
      modulation: { type: "triangle" },
      envelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 },
      modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 },
    });
    const filter = new Tone.Filter(600, "lowpass");
    filter.Q.value = 1.5;
    // LFO on filter cutoff — gentle turbine wobble
    const lfo = new Tone.LFO("0.4hz", 400, 900);
    lfo.connect(filter.frequency);
    // Gain node for fade control
    const gain = new Tone.Gain(0);
    synth.chain(filter, gain, output);
    let held = false;
    return {
      start({ pitch = 0, intensity = 0.5 } = {}) {
        if (held) return;
        held = true;
        const now = Tone.now();
        synth.triggerAttack(freq("C2", pitch), now, intensity);
        lfo.start(now);
        // Fade in over 0.5s
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + 0.5);
      },
      stop() {
        if (!held) return;
        held = false;
        const now = Tone.now();
        // Fade out over 0.5s, then release
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        synth.triggerRelease(now + 0.5);
        lfo.stop(now + 0.5);
      },
      dispose() { synth.dispose(); filter.dispose(); lfo.dispose(); gain.dispose(); },
    };
  },
};

// ── Registry ─────────────────────────────────────────────

const ALL_PRESETS = {
  hit,
  "hit-light": hitLight,
  zap,
  explode,
  pickup,
  powerup,
  click,
  error,
  success,
  chime,
  sparkle,
  whoosh,
  "rail-lockin": railLockin,
  "rail-fire": railFire,
  "rail-pierce": railPierce,
  "rampage-tick": rampageTick,
  "rampage-fire": rampageFire,
  "rampage-sustain": rampageSustain,
};

/** Register all presets on an SFX player */
export function registerAll(sfxPlayer) {
  for (const [name, preset] of Object.entries(ALL_PRESETS)) {
    sfxPlayer.register(name, preset);
  }
}

/** Register a subset of presets by name */
export function registerSome(sfxPlayer, names) {
  for (const name of names) {
    const preset = ALL_PRESETS[name];
    if (preset) {
      sfxPlayer.register(name, preset);
    } else {
      console.warn(`[Cipher SFX] Unknown preset name: "${name}"`);
    }
  }
}
