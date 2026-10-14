import { describe, expect, it } from 'vitest';
import { buildRound, gapRatio } from '../../../src/game/generate/buildRound';
import { createRng } from '../../../src/game/generate/random';
import type { Champion, StatMeta } from '../../../src/data/schema';

const STAT: StatMeta = {
  id: 'hp',
  subject: 'champion',
  label: 'Health',
  question: 'Which champion has the most health?',
  format: { kind: 'number' },
  source: 'test',
};

function champion(id: string, value: number): Champion {
  return {
    id,
    name: id,
    title: '',
    classes: [],
    iconUrl: `https://example.com/${id}.png`,
    stats: { hp: value },
  };
}

const roster = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10].map((v) => champion(`C${String(v)}`, v));

describe('gapRatio', () => {
  it('is the relative drop from the higher value', () => {
    expect(gapRatio(100, 80)).toBeCloseTo(0.2);
  });
});

describe('buildRound', () => {
  it('builds a round with 4 distinct champions, a unique highest, and a gap inside the band', () => {
    const band = { minRatio: 0.05, maxRatio: 0.12 };
    for (let seed = 0; seed < 50; seed++) {
      const round = buildRound(roster, STAT, band, createRng(`seed${String(seed)}`));
      expect(round).toBeDefined();
      if (!round) return;

      expect(new Set(round.optionIds).size).toBe(4);
      const sorted = Object.values(round.values).sort((a, b) => b - a);
      expect(round.values[round.answerId]).toBe(sorted[0]);
      expect(sorted[0]).toBeGreaterThan(sorted[1] as number);
      const ratio = gapRatio(sorted[0] as number, sorted[1] as number);
      expect(ratio).toBeGreaterThanOrEqual(band.minRatio);
      expect(ratio).toBeLessThanOrEqual(band.maxRatio);
    }
  });

  it('returns undefined when no pair can satisfy the band', () => {
    const tight = [champion('A', 100), champion('B', 99), champion('C', 98), champion('D', 97)];
    expect(buildRound(tight, STAT, { minRatio: 0.3, maxRatio: 1 }, createRng('x'))).toBeUndefined();
  });

  it('returns undefined when fewer than 4 distinct values exist', () => {
    const ties = [champion('A', 100), champion('B', 50), champion('C', 50), champion('D', 50)];
    expect(buildRound(ties, STAT, { minRatio: 0.3, maxRatio: 1 }, createRng('x'))).toBeUndefined();
  });

  it('carries the stat label, question and format into the round', () => {
    const dateStat: StatMeta = { ...STAT, format: { kind: 'date', epoch: '2009-01-01' } };
    const round = buildRound(roster, dateStat, { minRatio: 0.05, maxRatio: 1 }, createRng('q'));
    expect(round?.statLabel).toBe('Health');
    expect(round?.question).toBe('Which champion has the most health?');
    expect(round?.format).toEqual({ kind: 'date', epoch: '2009-01-01' });
  });

  it('ignores champions that lack the stat', () => {
    const withMissing = [...roster, { ...champion('NoStat', 0), stats: {} }];
    const round = buildRound(withMissing, STAT, { minRatio: 0.05, maxRatio: 1 }, createRng('m'));
    expect(round?.optionIds).not.toContain('NoStat');
  });
});
