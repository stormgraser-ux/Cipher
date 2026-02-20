// ── Playhead: tracks transport position and maps to step indices per resolution ──
// Uses requestAnimationFrame for smooth UI updates.

import * as Tone from "tone";

// Resolution to steps-per-bar mapping
const STEPS_PER_BAR = {
  "16n": 16,
  "8n": 8,
  "4n": 4,
  "2n": 2,
  "1m": 1,
};

export function createPlayhead() {
  let running = false;
  let animId = null;
  let listeners = [];
  let lastSteps = {};

  function parsePosition() {
    const pos = Tone.getTransport().position; // "bars:beats:sixteenths"
    const parts = pos.split(":");
    const bar = parseInt(parts[0], 10);
    const beat = parseInt(parts[1], 10);      // 0-3
    const sixteenth = parseFloat(parts[2]);    // 0-3.xxx
    return { bar, beat, sixteenth };
  }

  function getStepIndex(resolution, patternLength) {
    const { beat, sixteenth } = parsePosition();
    const spb = STEPS_PER_BAR[resolution] || 16;

    let stepInBar;
    if (resolution === "16n") {
      stepInBar = beat * 4 + Math.floor(sixteenth);
    } else if (resolution === "8n") {
      stepInBar = beat * 2 + (sixteenth >= 2 ? 1 : 0);
    } else if (resolution === "4n") {
      stepInBar = beat;
    } else if (resolution === "2n") {
      stepInBar = beat >= 2 ? 1 : 0;
    } else {
      stepInBar = 0;
    }

    // Wrap to pattern length (patterns may span multiple bars)
    return stepInBar % patternLength;
  }

  // Returns step index within a multi-bar pattern
  function getAbsoluteStep(resolution, patternLength) {
    const { bar, beat, sixteenth } = parsePosition();
    const spb = STEPS_PER_BAR[resolution] || 16;

    let stepInBar;
    if (resolution === "16n") {
      stepInBar = beat * 4 + Math.floor(sixteenth);
    } else if (resolution === "8n") {
      stepInBar = beat * 2 + (sixteenth >= 2 ? 1 : 0);
    } else if (resolution === "4n") {
      stepInBar = beat;
    } else {
      stepInBar = 0;
    }

    const absStep = bar * spb + stepInBar;
    return absStep % patternLength;
  }

  function tick() {
    if (!running) return;
    const steps = {};
    // Notify listeners with a getter function so they can query specific resolutions
    for (const fn of listeners) fn(getAbsoluteStep);
    animId = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    tick();
  }

  function stop() {
    running = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  function onChange(fn) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  function getCurrentBar() {
    return parsePosition().bar;
  }

  return {
    start,
    stop,
    onChange,
    getAbsoluteStep,
    getCurrentBar,
  };
}
