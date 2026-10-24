import { describe, expect, it } from 'vitest';
import type { LogoQuestion } from '../../../src/data/questions';
import type { Entity } from '../../../src/data/schema';
import { buildLogoRound } from '../../../src/game/generate/buildLogoRound';
import { createRng } from '../../../src/game/generate/random';

const teams = ['T1', 'Fnatic', 'Cloud9', 'G2 Esports', 'Gen.G', 'Team Liquid'];
const question: LogoQuestion = {
  kind: 'logo',
  id: 'teamByLogo',
  category: 'esports',
  difficulty: 'medium',
  subject: 'text',
  logo: 'team',
  label: 'Team logos',
  question: 'Which team does this logo belong to?',
  teams,
};
const entities = (names: string[]): Entity[] =>
  names.map((name) => ({ id: name, name, iconUrl: '', stats: {} }));
const seeds = Array.from({ length: 50 }, (_, index) => `seed${String(index)}`);

describe('buildLogoRound', () => {
  it("shows a team's logo and offers that team plus three others", () => {
    for (const seed of seeds) {
      const round = buildLogoRound(entities(teams), question, createRng(seed));
      expect(round?.clue).toBe('teamLogo');
      expect(round?.optionIds).toContain(round?.answerId);
      expect(new Set(round?.optionIds).size).toBe(4);
    }
  });

  it('is deterministic for a seed', () => {
    expect(buildLogoRound(entities(teams), question, createRng('same'))).toEqual(
      buildLogoRound(entities(teams), question, createRng('same')),
    );
  });

  it('gives up when fewer than four teams are left, and never offers an excluded one', () => {
    expect(
      buildLogoRound(entities(['T1', 'Fnatic', 'Cloud9']), question, createRng('s')),
    ).toBeUndefined();
    const excluding = { ...question, exclude: ['T1'] };
    for (const seed of seeds) {
      expect(buildLogoRound(entities(teams), excluding, createRng(seed))?.optionIds).not.toContain(
        'T1',
      );
    }
  });
});
