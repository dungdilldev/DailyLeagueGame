import { describe, expect, it } from 'vitest';
import { createRng } from '../../../src/game/generate/random';

describe('createRng', () => {
  it('gives the same sequence for the same seed', () => {
    const a = createRng('2026-03-05');
    const b = createRng('2026-03-05');
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it('gives different sequences for different seeds', () => {
    expect(createRng('2026-03-05').next()).not.toBe(createRng('2026-03-06').next());
  });

  it('produces values in [0, 1)', () => {
    const rng = createRng('range');
    for (let i = 0; i < 1000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('shuffles without losing or duplicating items, and without mutating the input', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = createRng('shuffle').shuffle(input);
    expect([...shuffled].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('throws when picking from an empty list', () => {
    expect(() => createRng('x').pick([])).toThrow();
  });
});
