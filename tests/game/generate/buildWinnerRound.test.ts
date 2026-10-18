import { describe, expect, it } from 'vitest';
import type { WinnerQuestion } from '../../../src/data/questions';
import type { Entity } from '../../../src/data/schema';
import { buildWinnerRound } from '../../../src/game/generate/buildWinnerRound';
import { createRng } from '../../../src/game/generate/random';

const winners = [
  { year: 2011, team: 'Fnatic' },
  { year: 2012, team: 'Taipei Assassins' },
  { year: 2013, team: 'T1' },
  { year: 2014, team: 'Samsung White' },
  { year: 2015, team: 'T1' },
  { year: 2016, team: 'T1' },
  { year: 2017, team: 'Samsung Galaxy' },
  { year: 2018, team: 'Invictus Gaming' },
];

const question: WinnerQuestion = {
  kind: 'winner',
  id: 'worldsWinnerByYear',
  category: 'esports',
  difficulty: 'medium',
  subject: 'text',
  label: 'Worlds winners',
  question: 'Which team won Worlds in {year}?',
  winners,
};

const entities = (names: string[]): Entity[] =>
  names.map((name) => ({ id: name, name, iconUrl: '', stats: {} }));
const everyTeam = entities([...new Set(winners.map(({ team }) => team))]);
const seeds = Array.from({ length: 50 }, (_, index) => `seed${String(index)}`);

describe('buildWinnerRound', () => {
  it('names a year and offers its winner plus three other teams', () => {
    for (const seed of seeds) {
      const round = buildWinnerRound(everyTeam, question, createRng(seed));
      expect(round).toBeDefined();
      const year = Number(round?.question.match(/Worlds in (\d{4})\?/)?.[1]);
      expect(round?.answerId).toBe(winners.find((entry) => entry.year === year)?.team);
      expect(new Set(round?.optionIds).size).toBe(4);
    }
  });

  it('is deterministic for a seed', () => {
    expect(buildWinnerRound(everyTeam, question, createRng('same'))).toEqual(
      buildWinnerRound(everyTeam, question, createRng('same')),
    );
  });

  it('only uses teams that are still available', () => {
    const names = ['Fnatic', 'Taipei Assassins', 'T1', 'Samsung White'];
    for (const seed of seeds) {
      const round = buildWinnerRound(entities(names), question, createRng(seed));
      expect([...(round?.optionIds ?? [])].sort()).toEqual([...names].sort());
    }
  });

  it('gives up when fewer than four winning teams are left', () => {
    const left = entities(['Fnatic', 'T1', 'Samsung White']);
    expect(buildWinnerRound(left, question, createRng('s'))).toBeUndefined();
  });

  it('never offers an excluded team', () => {
    const excluding = { ...question, exclude: ['T1'] };
    for (const seed of seeds) {
      const round = buildWinnerRound(everyTeam, excluding, createRng(seed));
      expect(round?.optionIds).not.toContain('T1');
    }
  });
});
