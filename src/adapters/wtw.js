import * as engine from "../core/engine.js";
import { createMixer } from "../core/mixer.js";

export class WTWAudio {
  constructor() {
    this._mixer = null;
    this._track = null;
    this._muted = false;
    this._volume = 0.7;
  }

  async init() {
    await engine.init(120); // WTW default BPM — TBD
    this._mixer = await createMixer();
    // TODO: Create WTW tracks when composed
  }

  playMenu() {
    // TODO: Menu ambient track
  }

  startCombat(heroId) {
    // heroId: 'wolf' (icy/cold) | 'faeri' (ember/fire)
    // TODO: Start combat track with hero-themed instrument presets
    void heroId;
  }

  setCombatPhase(phase) {
    // phase: calm | spawning | active | complete
    // TODO: Adjust track intensity/layers per wave phase
    void phase;
  }

  startBossPhase() {
    // TODO: Intensify — faster BPM, more layers, darker
  }

  endBossPhase() {
    // TODO: Return to normal combat energy
  }

  gameOver() {
    // TODO: Fade out, somber sting
  }

  pause() {
    engine.pause();
  }

  resume() {
    engine.start();
  }

  stop() {
    engine.stop();
    this._track?.stop();
  }

  sfx(name) {
    // Types: hit, kill, chain, levelup, bossdie, treehurt
    // TODO: SFX synth triggers
    void name;
  }

  setTreeHealth(pct) {
    // 0–1, lower = more decayed/distorted ambient
    // TODO: Filter + distortion automation
    void pct;
  }

  setChainCount(n) {
    // Chain multiplier — higher = pitch shift + filter open
    // TODO: Drive lead instrument filter/pitch based on chain
    void n;
  }

  setMasterVolume(v) {
    this._volume = v;
    if (this._mixer) {
      const db = v <= 0 ? -Infinity : -60 + v * 60;
      this._mixer.master.volume.rampTo(db, 0.05);
    }
  }

  mute() {
    this._muted = true;
    this._mixer?.master.volume.rampTo(-Infinity, 0.05);
  }

  unmute() {
    this._muted = false;
    this.setMasterVolume(this._volume);
  }

  dispose() {
    this.stop();
    this._track?.dispose();
    this._mixer?.dispose();
    engine.dispose();
  }
}
