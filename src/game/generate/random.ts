export interface Rng {
  /** Uniform float in [0, 1). */
  next: () => number;
  pick: <T>(items: readonly T[]) => T;
  /** Returns a shuffled copy; the input is not modified. */
  shuffle: <T>(items: readonly T[]) => T[];
}

/** FNV-1a: turns a seed string into a 32-bit integer. */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministic PRNG (mulberry32): the same seed string always yields the same sequence. */
export function createRng(seed: string): Rng {
  let state = hashSeed(seed);

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error('Cannot pick from an empty list');
    return items[Math.floor(next() * items.length)] as T;
  };

  const shuffle = <T>(items: readonly T[]): T[] => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [result[i], result[j]] = [result[j] as T, result[i] as T];
    }
    return result;
  };

  return { next, pick, shuffle };
}
