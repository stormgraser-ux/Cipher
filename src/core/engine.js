import * as Tone from "tone";

let initialized = false;

export async function init(bpm = 140) {
  if (initialized) return;
  await Tone.start();
  Tone.getTransport().bpm.value = bpm;
  initialized = true;
}

export function start() {
  Tone.getTransport().start();
}

export function stop() {
  Tone.getTransport().stop();
  Tone.getTransport().position = 0;
}

export function pause() {
  Tone.getTransport().pause();
}

export function setBPM(bpm, rampTime = 0) {
  if (rampTime > 0) {
    Tone.getTransport().bpm.rampTo(bpm, rampTime);
  } else {
    Tone.getTransport().bpm.value = bpm;
  }
}

export function getBPM() {
  return Tone.getTransport().bpm.value;
}

export function isReady() {
  return initialized && Tone.getContext().state === "running";
}

export function dispose() {
  Tone.getTransport().stop();
  Tone.getTransport().cancel();
  initialized = false;
}
