import { describe, expect, it } from 'vitest';
import type { YearQuestion } from '../../../src/data/questions';
import type { Entity } from '../../../src/data/schema';
import { buildYearRound } from '../../../src/game/generate/buildYearRound';
import { createRng } from '../../../src/game/generate/random';

const byYear = [
  { year: 2011, answer: 'Fnatic' },
  { year: 2012, answer: 'Taipei Assassins' },
  { year: 2013, answer: 'T1' },
  { year: 2014, answer: 'Samsung White' },
  { year: 2015, answer: 'T1' },
  { year: 2016, answer: 'T1' },
  { year: 2017, answer: 'Samsung Galaxy' },
  { year: 2018, answer: 'Invictus Gaming' },
];

const question: YearQuestion = {
  kind: 'yearly',
  id: 'worldsWinnerByYear',
  category: 'esports',
  difficulty: 'medium',
  subject: 'text',
  label: 'Worlds winners',
  question: 'Which team won Worlds in {year}?',
  byYear,
};

const entities = (names: string[]): Entity[] =>
  names.map((name) => ({ id: name, name, iconUrl: '', stats: {} }));
const everyTeam = entities([...new Set(byYear.map(({ answer }) => answer))]);
const seeds = Array.from({ length: 50 }, (_, index) => `seed${String(index)}`);

describe('buildYearRound', () => {
  it("names a year and offers that year's answer plus three answers of other years", () => {
    for (const seed of seeds) {
      const round = buildYearRound(everyTeam, question, createRng(seed));
      expect(round).toBeDefined();
      const year = Number(round?.question.match(/Worlds in (\d{4})\?/)?.[1]);
      expect(round?.answerId).toBe(byYear.find((entry) => entry.year === year)?.answer);
      expect(new Set(round?.optionIds).size).toBe(4);
    }
  });

  it('offers an answer of several years once, and never as a wrong option of its own years', () => {
    for (const seed of seeds) {
      const round = buildYearRound(everyTeam, question, createRng(seed));
      const t1Years = byYear.filter(({ answer }) => answer === 'T1').map(({ year }) => year);
      const year = Number(round?.question.match(/(\d{4})/)?.[1]);
      expect(round?.optionIds.filter((id) => id === 'T1').length ?? 0).toBeLessThanOrEqual(1);
      if (round?.optionIds.includes('T1')) {
        expect(round.answerId === 'T1').toBe(t1Years.includes(year));
      }
    }
  });

  it('is deterministic for a seed', () => {
    expect(buildYearRound(everyTeam, question, createRng('same'))).toEqual(
      buildYearRound(everyTeam, question, createRng('same')),
    );
  });

  it('only uses teams that are still available', () => {
    const names = ['Fnatic', 'Taipei Assassins', 'T1', 'Samsung White'];
    for (const seed of seeds) {
      const round = buildYearRound(entities(names), question, createRng(seed));
      expect([...(round?.optionIds ?? [])].sort()).toEqual([...names].sort());
    }
  });

  it('gives up when fewer than four different answers are left', () => {
    const left = entities(['Fnatic', 'T1', 'Samsung White']);
    expect(buildYearRound(left, question, createRng('s'))).toBeUndefined();
  });

  it('never offers an excluded team', () => {
    const excluding = { ...question, exclude: ['T1'] };
    for (const seed of seeds) {
      const round = buildYearRound(everyTeam, excluding, createRng(seed));
      expect(round?.optionIds).not.toContain('T1');
    }
  });
});
