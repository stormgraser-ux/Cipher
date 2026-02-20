import * as Tone from "tone";
import * as engine from "../core/engine.js";
import { createMixer } from "../core/mixer.js";
import { createSfxPlayer } from "../core/sfx.js";
import { registerAll } from "../sfx/presets.js";
import { createGardenTrack } from "../tracks/bgq-garden.js";

// BGQ adapter — global object, CDN script tag pattern
// Replaces the existing broken toggleBgm() and HTML <audio> BGM
//
// Integration in BGQ's HTML:
//   <script type="importmap">
//   { "imports": { "tone": "https://esm.run/tone" } }
//   </script>
//   <script type="module" src="path/to/bgq.js"></script>
//
// Then in game code: window.BgqAudio.init(musicVolume, sfxVolume)

const BgqAudio = {
  _mixer: null,
  _track: null,
  _sfxPlayer: null,
  _bgmOn: true,
  _musicVol: 0.7,
  _sfxVol: 0.7,

  async init(musicVolume = 0.7, sfxVolume = 0.7) {
    this._musicVol = musicVolume;
    this._sfxVol = sfxVolume;

    // Take ownership of existing AudioContext if present
    if (window.audioCtx) {
      Tone.setContext(window.audioCtx);
    }

    await engine.init(95); // BGQ garden theme BPM
    this._mixer = await createMixer();
    this._track = createGardenTrack(this._mixer);
    this._sfxPlayer = createSfxPlayer(this._mixer);
    registerAll(this._sfxPlayer);
    this._sfxPlayer.setVolume(sfxVolume);

    this.setBgmVolume(musicVolume);

    // Start music in roll phase (minimal layers)
    this._track.start();
    engine.start();
  },

  sfx(type, opts) {
    this._sfxPlayer?.play(type, opts);
  },

  setBgmVolume(v) {
    this._musicVol = v;
    this._track?.setVolume(v);
  },

  setSfxVolume(v) {
    this._sfxVol = v;
    this._sfxPlayer?.setVolume(v);
  },

  toggleBgm() {
    this._bgmOn = !this._bgmOn;
    if (this._bgmOn) {
      this.setBgmVolume(this._musicVol);
    } else {
      this.setBgmVolume(0);
    }
    return this._bgmOn;
  },

  onPhaseChange(phase) {
    // Phases: roll | pick | play
    // Smoothly crossfades layers over 400ms
    this._track?.setPhase(phase);
  },

  onTurnChange(player) {
    // TODO: Subtle audio cue on turn change
    // player: "player" | "opponent"
    void player;
  },
};

// Expose globally for CDN script tag usage
if (typeof window !== "undefined") {
  window.BgqAudio = BgqAudio;
}

export default BgqAudio;
