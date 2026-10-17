import { describe, expect, it } from 'vitest';
import { buildRound, gapRatio } from '../../../src/game/generate/buildRound';
import { createRng } from '../../../src/game/generate/random';
import type { Question } from '../../../src/data/questions';
import type { Champion } from '../../../src/data/schema';

const STAT: Question = {
  id: 'health',
  stat: 'hp',
  subject: 'champion',
  question: 'Which champion has the most health?',
  statMeta: { id: 'hp', label: 'Health', format: { kind: 'number' }, source: 'test' },
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

  it('carries the question id, stat label, question and format into the round', () => {
    const dateStat: Question = {
      ...STAT,
      statMeta: { ...STAT.statMeta, format: { kind: 'date', epoch: '2009-01-01' } },
    };
    const round = buildRound(roster, dateStat, { minRatio: 0.05, maxRatio: 1 }, createRng('q'));
    expect(round?.questionId).toBe('health');
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

describe('buildRound answer lists', () => {
  const band = { minRatio: 0.05, maxRatio: 1 };
  const rounds = (question: Question) =>
    Array.from({ length: 60 }, (_, seed) =>
      buildRound(roster, question, band, createRng(`list${String(seed)}`)),
    ).flatMap((round) => (round ? [round] : []));

  it('only uses champions from the correct list as the answer', () => {
    const built = rounds({ ...STAT, correct: ['C60', 'C50'] });
    expect(built.length).toBeGreaterThan(0);
    for (const round of built) expect(['C60', 'C50']).toContain(round.answerId);
  });

  it('only uses champions from the wrong list as the other options', () => {
    const wrong = ['C90', 'C80', 'C70', 'C60', 'C50'];
    const built = rounds({ ...STAT, correct: ['C100'], wrong });
    expect(built.length).toBeGreaterThan(0);
    for (const round of built) {
      expect(round.answerId).toBe('C100');
      const others = round.optionIds.filter((id) => id !== round.answerId);
      expect(others.every((id) => wrong.includes(id))).toBe(true);
    }
  });

  it('never uses an excluded champion, neither as answer nor as other option', () => {
    const exclude = ['C100', 'C90', 'C10'];
    const built = rounds({ ...STAT, exclude });
    expect(built.length).toBeGreaterThan(0);
    for (const round of built) {
      expect(round.optionIds.some((id) => exclude.includes(id))).toBe(false);
    }
  });

  it('still builds a valid round from the wrong list: the answer stays the highest', () => {
    const built = rounds({ ...STAT, wrong: ['C95', 'C90', 'C20', 'C10'] });
    for (const round of built) {
      const best = Math.max(...Object.values(round.values));
      expect(round.values[round.answerId]).toBe(best);
    }
  });

  it('returns undefined when the lists leave too few champions', () => {
    const question = { ...STAT, wrong: ['C90', 'C80'] };
    expect(buildRound(roster, question, band, createRng('few'))).toBeUndefined();
  });

  it('returns undefined when the correct list has nobody who fits the difficulty', () => {
    const question = { ...STAT, correct: ['C10'] };
    expect(buildRound(roster, question, band, createRng('low'))).toBeUndefined();
  });
});
