// ── Pattern Store: mutable pattern data for live editing ──
// Sequences read from here at trigger time. UI writes here on click/drag.
// Types: "trigger" (0/1), "velocity" (0-1), "note" (string|null)

export function createPatternStore() {
  const layers = {};  // name -> { pattern: [...], original: [...], resolution, type }
  const listeners = [];

  function notify(layerName, stepIdx) {
    for (const fn of listeners) fn(layerName, stepIdx);
  }

  /**
   * Register a layer's pattern data.
   * @param {string} name - Layer name (e.g. "kick", "melody")
   * @param {Object} opts
   * @param {Array} opts.pattern - Initial pattern array
   * @param {string} opts.resolution - Tone.js subdivision ("16n", "8n", etc.)
   * @param {string} opts.type - "trigger", "velocity", or "note"
   */
  function register(name, { pattern, resolution, type }) {
    layers[name] = {
      pattern: [...pattern],
      original: [...pattern],
      resolution,
      type,
    };
  }

  function get(name, stepIdx) {
    const layer = layers[name];
    if (!layer) return null;
    return layer.pattern[stepIdx];
  }

  function getPattern(name) {
    const layer = layers[name];
    if (!layer) return [];
    return layer.pattern;
  }

  function set(name, stepIdx, value) {
    const layer = layers[name];
    if (!layer || stepIdx < 0 || stepIdx >= layer.pattern.length) return;
    layer.pattern[stepIdx] = value;
    notify(name, stepIdx);
  }

  function toggleStep(name, stepIdx) {
    const layer = layers[name];
    if (!layer) return;

    if (layer.type === "trigger") {
      layer.pattern[stepIdx] = layer.pattern[stepIdx] ? 0 : 1;
    } else if (layer.type === "velocity") {
      // Toggle between 0 and a default velocity
      layer.pattern[stepIdx] = layer.pattern[stepIdx] > 0 ? 0 : 0.08;
    } else if (layer.type === "note") {
      // Toggle between null and the original note (if any)
      if (layer.pattern[stepIdx] !== null) {
        layer.pattern[stepIdx] = null;
      } else {
        layer.pattern[stepIdx] = layer.original[stepIdx];
      }
    }
    notify(name, stepIdx);
  }

  function getLength(name) {
    const layer = layers[name];
    return layer ? layer.pattern.length : 0;
  }

  function getInfo(name) {
    const layer = layers[name];
    if (!layer) return null;
    return {
      name,
      length: layer.pattern.length,
      resolution: layer.resolution,
      type: layer.type,
    };
  }

  function getLayerNames() {
    return Object.keys(layers);
  }

  function resetLayer(name) {
    const layer = layers[name];
    if (!layer) return;
    layer.pattern = [...layer.original];
    notify(name, -1); // -1 signals full layer refresh
  }

  function resetAll() {
    for (const name of Object.keys(layers)) {
      layers[name].pattern = [...layers[name].original];
    }
    notify(null, -1);
  }

  function onChange(fn) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  function toJSON() {
    const out = {};
    for (const [name, layer] of Object.entries(layers)) {
      out[name] = [...layer.pattern];
    }
    return out;
  }

  function fromJSON(data) {
    if (!data) return;
    for (const [name, pattern] of Object.entries(data)) {
      if (layers[name] && Array.isArray(pattern) && pattern.length === layers[name].pattern.length) {
        layers[name].pattern = [...pattern];
      }
    }
    notify(null, -1);
  }

  return {
    register,
    get,
    getPattern,
    set,
    toggleStep,
    getLength,
    getInfo,
    getLayerNames,
    resetLayer,
    resetAll,
    onChange,
    toJSON,
    fromJSON,
  };
}
