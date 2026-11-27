// Deterministic seeded PRNG (Mulberry32) for consistent runs and reproducible decorations.

export function createRng(seed = 20261127) {
  let state = (Number(seed) || 20261127) >>> 0;

  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function range(min, max) {
    return min + next() * (max - min);
  }

  function int(min, max) {
    return Math.floor(range(min, max + 1));
  }

  function pick(items) {
    return items[Math.floor(next() * items.length)];
  }

  return { next, range, int, pick };
}
