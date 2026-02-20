import * as Tone from "tone";

/**
 * Pool-based one-shot SFX player.
 *
 * Presets define voice factories. Each voice is a self-contained synth chain.
 * Voices are pre-allocated in a round-robin pool for zero-latency triggering.
 *
 * Preset shape:
 *   {
 *     poolSize?: number,  // max concurrent voices (default 4)
 *     createVoice(output: ToneAudioNode): {
 *       trigger(opts?: { pitch?, intensity? }): void,
 *       dispose(): void,
 *     }
 *   }
 */
export function createSfxPlayer(mixer, { volume = -6 } = {}) {
  const channel = mixer.createChannel("sfx", { volume });
  const pools = new Map();
  const loops = new Map(); // looping presets: name → { preset, voice, active }

  function register(name, preset) {
    if (pools.has(name) || loops.has(name)) {
      console.warn(`[Cipher SFX] Preset "${name}" already registered, skipping`);
      return;
    }
    if (preset.looping) {
      // Looping presets get a single voice, start/stop semantics
      const voice = preset.createVoice(channel);
      loops.set(name, { preset, voice, active: false });
    } else {
      const size = preset.poolSize || 4;
      const voices = [];
      for (let i = 0; i < size; i++) {
        voices.push(preset.createVoice(channel));
      }
      pools.set(name, { voices, next: 0 });
    }
  }

  function play(name, opts = {}) {
    const pool = pools.get(name);
    if (!pool) {
      console.warn(`[Cipher SFX] Unknown preset: "${name}"`);
      return;
    }
    const voice = pool.voices[pool.next];
    pool.next = (pool.next + 1) % pool.voices.length;
    voice.trigger(opts);
  }

  function startLoop(name, opts = {}) {
    const entry = loops.get(name);
    if (!entry) {
      console.warn(`[Cipher SFX] Unknown loop preset: "${name}"`);
      return;
    }
    if (entry.active) return; // already running
    entry.voice.start(opts);
    entry.active = true;
  }

  function stopLoop(name) {
    const entry = loops.get(name);
    if (!entry) {
      console.warn(`[Cipher SFX] Unknown loop preset: "${name}"`);
      return;
    }
    if (!entry.active) return; // already stopped
    entry.voice.stop();
    entry.active = false;
  }

  function isLooping(name) {
    const entry = loops.get(name);
    return entry ? entry.active : false;
  }

  function has(name) {
    return pools.has(name) || loops.has(name);
  }

  function list() {
    return [...pools.keys(), ...loops.keys()];
  }

  function setVolume(v) {
    channel.volume.value = v <= 0 ? -Infinity : 20 * Math.log10(v);
  }

  function dispose() {
    pools.forEach(({ voices }) => voices.forEach((v) => v.dispose()));
    pools.clear();
    loops.forEach(({ voice }) => voice.dispose());
    loops.clear();
    channel.dispose();
  }

  return {
    register, play,
    startLoop, stopLoop, isLooping,
    has, list, setVolume, dispose, channel,
  };
}
