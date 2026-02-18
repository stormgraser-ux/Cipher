export function humanizeVelocity(base, amount = 0.05) {
  const v = base + (Math.random() * 2 - 1) * amount;
  return Math.max(0, Math.min(1, v));
}

export function humanizeTiming(amount = 0.01) {
  return (Math.random() * 2 - 1) * amount;
}

export function createVelocityPattern(basePattern, amount = 0.05) {
  return basePattern.map((v) => (v === null ? null : humanizeVelocity(v, amount)));
}

export function pickGap(probability = 0.1) {
  return Math.random() < probability ? null : true;
}
