// ── Layer Ref: mutable instrument reference for hot-swapping presets ──
// Sequences close over the ref object. Swapping replaces the underlying
// preset without rebuilding sequences or touching channels.

export function createLayerRef(name) {
  let current = null;
  let presetId = null;

  function swap(preset, id) {
    if (current) {
      try { current.stop?.(); } catch (_) {}
      try { current.dispose(); } catch (_) {}
    }
    current = preset;
    presetId = id || null;
  }

  function triggerAttack(note, time, velocity) {
    current?.triggerAttack?.(note, time, velocity);
  }

  function triggerRelease(time) {
    current?.triggerRelease?.(time);
  }

  function triggerAttackRelease(noteOrNotes, dur, time, velocity) {
    current?.triggerAttackRelease?.(noteOrNotes, dur, time, velocity);
  }

  function start() { try { current?.start?.(); } catch (_) {} }
  function stop()  { try { current?.stop?.(); } catch (_) {} }

  function setFrequency(freq, rampTime, time) {
    current?.setFrequency?.(freq, rampTime, time);
  }

  function getParam(paramName) {
    return current?.params?.[paramName] ?? null;
  }

  function getPresetId() { return presetId; }

  function dispose() {
    if (current) {
      try { current.stop?.(); } catch (_) {}
      try { current.dispose(); } catch (_) {}
      current = null;
      presetId = null;
    }
  }

  return {
    swap, triggerAttack, triggerRelease, triggerAttackRelease,
    start, stop, setFrequency, getParam, getPresetId, dispose,
    get name() { return name; },
  };
}
