import { describe, expect, it } from 'vitest';
import type { SkinLineQuestion } from '../../../src/data/questions';
import type { Entity } from '../../../src/data/schema';
import { buildSkinLineRound } from '../../../src/game/generate/buildSkinLineRound';
import { createRng } from '../../../src/game/generate/random';

const champion = (id: string, lines: string[] = []): Entity => ({
  id,
  name: id,
  iconUrl: '',
  stats: {},
  ...(lines.length > 0 && { esportsSkinLines: lines }),
});

const champions = [
  champion('JarvanIV', ['Fnatic', 'Samsung Galaxy']),
  champion('Xayah', ['Samsung Galaxy']),
  champion('LeeSin', ['T1 or SKT T1']),
  champion('Zed'),
  champion('Ahri'),
  champion('Lux'),
];

const question: SkinLineQuestion = {
  kind: 'skinLine',
  id: 'esportsSkinLine',
  category: 'esports',
  difficulty: 'medium',
  subject: 'champion',
  skinLine: 'esports',
  label: 'Esports skins',
  question: 'Which of these champions has a {line} skin?',
};
const seeds = Array.from({ length: 50 }, (_, index) => `seed${String(index)}`);

describe('buildSkinLineRound', () => {
  it('names a line and offers one champion with it and three without', () => {
    for (const seed of seeds) {
      const round = buildSkinLineRound(champions, question, createRng(seed));
      const line = round?.question.match(/has a (.+) skin\?/)?.[1] ?? '';
      const hasLine = (id: string) =>
        champions.find((c) => c.id === id)?.esportsSkinLines?.includes(line) ?? false;
      expect(hasLine(round?.answerId ?? '')).toBe(true);
      expect(round?.optionIds.filter(hasLine)).toHaveLength(1);
    }
  });

  it('never offers a champion with skins in two lines as a wrong option for either', () => {
    for (const seed of seeds) {
      const round = buildSkinLineRound(champions, question, createRng(seed));
      if (round?.question.includes('Samsung Galaxy') || round?.question.includes('Fnatic')) {
        const wrong = round.optionIds.filter((id) => id !== round.answerId);
        expect(wrong).not.toContain('JarvanIV');
      }
    }
  });

  it('gives up when no champion has a skin line, as in snapshots from before the field', () => {
    const plain = champions.map(({ id }) => champion(id));
    expect(buildSkinLineRound(plain, question, createRng('s'))).toBeUndefined();
  });

  it('never offers an excluded champion', () => {
    const excluding = { ...question, exclude: ['Zed'] };
    for (const seed of seeds) {
      expect(buildSkinLineRound(champions, excluding, createRng(seed))?.optionIds).not.toContain(
        'Zed',
      );
    }
  });
});
