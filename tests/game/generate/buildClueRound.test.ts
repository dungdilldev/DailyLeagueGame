import { describe, expect, it } from 'vitest';
import type { ClueQuestion } from '../../../src/data/questions';
import type { Champion } from '../../../src/data/schema';
import { buildClueRound } from '../../../src/game/generate/buildClueRound';
import { createRng } from '../../../src/game/generate/random';

const champion = (id: string, title?: string): Champion => ({
  id,
  name: id,
  title: title ?? `the ${id}`,
  classes: [],
  iconUrl: `https://example.com/${id}.png`,
  stats: {},
});

const roster = ['Aatrox', 'Ahri', 'Akali', 'Alistar', 'Amumu', 'Anivia'].map((id) =>
  champion(id, `the ${id} of Legend`),
);

const QUESTION: ClueQuestion = {
  kind: 'clue',
  id: 'knownAsTitle',
  category: 'lore',
  difficulty: 'easy',
  subject: 'champion',
  clue: 'title',
  label: 'Champion titles',
  question: 'Which champion is known as "{title}"?',
};

const build = (question = QUESTION, champions: readonly Champion[] = roster, seed = 's') =>
  buildClueRound(champions, question, createRng(seed));

describe('buildClueRound', () => {
  it("quotes the answer's title and offers four different champions", () => {
    for (let seed = 0; seed < 50; seed++) {
      const round = build(QUESTION, roster, `seed${String(seed)}`);
      expect(round).toBeDefined();
      if (!round) return;
      expect(new Set(round.optionIds).size).toBe(4);
      expect(round.optionIds).toContain(round.answerId);
      expect(round.question).toBe(`Which champion is known as "the ${round.answerId} of Legend"?`);
      expect(round.question).not.toContain('{title}');
    }
  });

  it('has nothing to reveal besides the answer', () => {
    expect(build()).toMatchObject({
      questionId: 'knownAsTitle',
      subject: 'champion',
      statLabel: 'Champion titles',
      values: {},
    });
    expect(build()?.format).toBeUndefined();
  });

  it('asks about different champions over time, and is deterministic for a seed', () => {
    const answers = new Set<string>();
    for (let seed = 0; seed < 100; seed++) {
      const round = build(QUESTION, roster, `v${String(seed)}`);
      if (round) answers.add(round.answerId);
    }
    expect(answers).toEqual(new Set(roster.map(({ id }) => id)));
    expect(build(QUESTION, roster, 'same')).toEqual(build(QUESTION, roster, 'same'));
  });

  it('never uses an excluded champion', () => {
    const exclude = ['Aatrox', 'Ahri'];
    for (let seed = 0; seed < 50; seed++) {
      const round = build({ ...QUESTION, exclude }, roster, `x${String(seed)}`);
      expect(round?.optionIds.some((id) => exclude.includes(id))).toBe(false);
    }
  });

  it('returns undefined when fewer than four champions are available', () => {
    expect(build(QUESTION, roster.slice(0, 3))).toBeUndefined();
    expect(build({ ...QUESTION, exclude: ['Aatrox', 'Ahri', 'Akali'] })).toBeUndefined();
  });
});
