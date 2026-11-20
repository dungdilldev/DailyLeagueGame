import { describe, expect, it } from 'vitest';
import { createRng, weightedShuffle } from '../../../src/game/generate/random';

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

describe('weightedShuffle', () => {
  const weights: Record<string, number> = { light: 1, heavy: 4 };
  const weightOf = (item: string) => weights[item] ?? 1;

  it('keeps every item once, without mutating the input', () => {
    const input = ['a', 'b', 'light', 'heavy', 'c'];
    const shuffled = weightedShuffle(input, weightOf, createRng('weighted'));
    expect([...shuffled].sort()).toEqual([...input].sort());
    expect(input).toEqual(['a', 'b', 'light', 'heavy', 'c']);
  });

  it('is deterministic for the same seed', () => {
    const input = ['a', 'b', 'c', 'd'];
    expect(weightedShuffle(input, weightOf, createRng('s'))).toEqual(
      weightedShuffle(input, weightOf, createRng('s')),
    );
  });

  it('puts an item first about in proportion to its weight', () => {
    const rng = createRng('proportion');
    const runs = 5000;
    let heavyFirst = 0;
    for (let i = 0; i < runs; i++) {
      if (weightedShuffle(['light', 'heavy'], weightOf, rng)[0] === 'heavy') heavyFirst++;
    }
    // Weight 4 against 1: first four times in five.
    expect(heavyFirst / runs).toBeGreaterThan(0.77);
    expect(heavyFirst / runs).toBeLessThan(0.83);
  });

  it('is a plain shuffle when all weights are equal', () => {
    const rng = createRng('equal');
    const firsts = new Map<string, number>();
    for (let i = 0; i < 3000; i++) {
      const [first] = weightedShuffle(['a', 'b', 'c'], () => 1, rng);
      firsts.set(first ?? '', (firsts.get(first ?? '') ?? 0) + 1);
    }
    for (const count of firsts.values()) expect(count / 3000).toBeCloseTo(1 / 3, 1);
  });
});
