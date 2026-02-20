// ── Macro Knobs: high-level controls that map 0-1 to multiple params ──
// Each macro is a definition object. The track factory constructs them
// with references to actual Tone.js nodes.

// Linear interpolation with optional curve
function lerp(a, b, t, curve = 1) {
  const ct = curve === 1 ? t : Math.pow(t, curve);
  return a + (b - a) * ct;
}

/**
 * Create a macro system from definitions.
 *
 * @param {Object} defs - { macroName: { label, targets: [{ param, min, max, curve? }] } }
 *   Each target.param must be a setter function: (value) => { ... }
 *
 * Returns: { set(name, value01), get(name), getAll(), toJSON(), fromJSON(data), getMacroDefs() }
 */
export function createMacros(defs) {
  const values = {};
  const listeners = [];

  // Initialize all macros to 0.5 (center)
  for (const name of Object.keys(defs)) {
    values[name] = 0.5;
  }

  function notify() {
    for (const fn of listeners) fn();
  }

  function apply(name) {
    const def = defs[name];
    if (!def) return;
    const t = values[name];
    for (const target of def.targets) {
      const v = lerp(target.min, target.max, t, target.curve || 1);
      target.param(v);
    }
  }

  function set(name, value01) {
    const clamped = Math.max(0, Math.min(1, value01));
    values[name] = clamped;
    apply(name);
    notify();
  }

  function get(name) {
    return values[name] ?? 0.5;
  }

  function getAll() {
    return { ...values };
  }

  // Apply all macros (e.g. on load from saved state)
  function applyAll() {
    for (const name of Object.keys(defs)) {
      apply(name);
    }
  }

  function onChange(fn) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  function getMacroDefs() {
    return Object.entries(defs).map(([name, def]) => ({
      name,
      label: def.label,
      value: values[name],
    }));
  }

  function toJSON() {
    return { ...values };
  }

  function fromJSON(data) {
    if (!data) return;
    for (const [name, val] of Object.entries(data)) {
      if (defs[name] !== undefined) {
        values[name] = Math.max(0, Math.min(1, val));
      }
    }
    applyAll();
    notify();
  }

  return {
    set,
    get,
    getAll,
    applyAll,
    onChange,
    getMacroDefs,
    toJSON,
    fromJSON,
  };
}
