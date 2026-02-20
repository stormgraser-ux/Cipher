import * as engine from "../core/engine.js";
import { createMixer } from "../core/mixer.js";
import { createSfxPlayer } from "../core/sfx.js";
import { registerAll } from "../sfx/presets.js";
import { createSalvageTrack } from "../tracks/tcb-salvage.js";

export async function initCipherAudio(ctx) {
  await engine.init(140);
  const mixer = await createMixer();
  const track = createSalvageTrack(mixer);
  const sfxPlayer = createSfxPlayer(mixer);
  registerAll(sfxPlayer);

  let running = false;

  function start() {
    if (running) return;
    track.start();
    engine.start();
    running = true;
  }

  function stop() {
    engine.stop();
    track.stop();
    running = false;
  }

  function tick(_dtS) {
    if (!running) return;

    // Map game state to track intensity
    // Higher insanity / more enemies / boss = more intense
    let intensity = 0.3;
    if (ctx.bossActive) {
      intensity = ctx.currentBoss?.bossNum === 10 ? 1.0 : 0.85;
    } else if (ctx.alive) {
      // Base intensity from alignment counts
      const alignTotal = (ctx.curseAlignedCount || 0) + (ctx.techAlignedCount || 0);
      intensity = Math.min(0.8, 0.3 + alignTotal * 0.05);
    }

    if (ctx.paused || ctx.upgradeMenuActive || ctx.inMenu) {
      intensity *= 0.4;
    }

    track.setIntensity(intensity);
    track.tick(_dtS);
  }

  function setIntensity(v) {
    track.setIntensity(v);
  }

  function setMasterVolume(v) {
    track.setVolume(v);
  }

  function sfx(name, opts) {
    sfxPlayer.play(name, opts);
  }

  function sfxLoop(name, opts) {
    sfxPlayer.startLoop(name, opts);
  }

  function sfxStop(name) {
    sfxPlayer.stopLoop(name);
  }

  function setSfxVolume(v) {
    sfxPlayer.setVolume(v);
  }

  function dispose() {
    stop();
    track.dispose();
    sfxPlayer.dispose();
    mixer.dispose();
    engine.dispose();
  }

  return {
    start,
    stop,
    tick,
    setIntensity,
    setMasterVolume,
    sfx,
    sfxLoop,
    sfxStop,
    setSfxVolume,
    dispose,
  };
}
