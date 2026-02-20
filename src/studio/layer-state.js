// ── Layer State: Mute/Solo management for all track layers ──
// Observable, serializable, zero-rebuild.

export function createLayerState(layerNames) {
  const muted = new Set();
  const soloed = new Set();
  const listeners = [];

  function notify() {
    for (const fn of listeners) fn();
  }

  function toggleMute(name) {
    if (muted.has(name)) muted.delete(name);
    else muted.add(name);
    notify();
  }

  function toggleSolo(name) {
    if (soloed.has(name)) soloed.delete(name);
    else soloed.add(name);
    notify();
  }

  function setMute(name, val) {
    if (val) muted.add(name); else muted.delete(name);
    notify();
  }

  function setSolo(name, val) {
    if (val) soloed.add(name); else soloed.delete(name);
    notify();
  }

  // Core logic: if ANY layer is soloed, only soloed layers are audible.
  // A layer is silenced if: it's muted, OR (solo mode active AND it's not soloed).
  function isSilenced(name) {
    if (muted.has(name)) return true;
    if (soloed.size > 0 && !soloed.has(name)) return true;
    return false;
  }

  function isMuted(name) { return muted.has(name); }
  function isSoloed(name) { return soloed.has(name); }
  function hasSolo() { return soloed.size > 0; }

  function onChange(fn) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  // Serialization
  function toJSON() {
    return {
      muted: [...muted],
      soloed: [...soloed],
    };
  }

  function fromJSON(data) {
    if (!data) return;
    muted.clear();
    soloed.clear();
    if (data.muted) for (const n of data.muted) muted.add(n);
    if (data.soloed) for (const n of data.soloed) soloed.add(n);
    notify();
  }

  function getLayers() {
    return layerNames.map(name => ({
      name,
      muted: muted.has(name),
      soloed: soloed.has(name),
      silenced: isSilenced(name),
    }));
  }

  return {
    toggleMute,
    toggleSolo,
    setMute,
    setSolo,
    isSilenced,
    isMuted,
    isSoloed,
    hasSolo,
    onChange,
    getLayers,
    toJSON,
    fromJSON,
  };
}
