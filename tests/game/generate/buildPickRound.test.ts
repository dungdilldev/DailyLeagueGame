import { describe, expect, it } from 'vitest';
import type { PickQuestion } from '../../../src/data/questions';
import type { Champion } from '../../../src/data/schema';
import { buildPickRound } from '../../../src/game/generate/buildPickRound';
import { createRng } from '../../../src/game/generate/random';

const champion = (id: string): Champion => ({
  id,
  name: id,
  title: '',
  classes: [],
  iconUrl: `https://example.com/${id}.png`,
  stats: {},
});

const roster = ['Jinx', 'Ashe', 'Garen', 'Lux', 'Zed', 'Soraka'].map(champion);

const QUESTION: PickQuestion = {
  kind: 'pick',
  id: 'marksman',
  category: 'trivia',
  difficulty: 'easy',
  subject: 'champion',
  label: 'Marksmen',
  question: 'Which of these champions is a marksman?',
  correct: ['Jinx', 'Ashe'],
  wrong: ['Garen', 'Lux', 'Zed', 'Soraka'],
};

const build = (question: PickQuestion, entities = roster, seed = 's') =>
  buildPickRound(entities, question, createRng(seed));

describe('buildPickRound', () => {
  it('offers one champion from the correct list and three from the wrong list', () => {
    for (let seed = 0; seed < 50; seed++) {
      const round = build(QUESTION, roster, `seed${String(seed)}`);
      expect(round).toBeDefined();
      if (!round) return;
      expect(new Set(round.optionIds).size).toBe(4);
      expect(QUESTION.correct).toContain(round.answerId);
      const others = round.optionIds.filter((id) => id !== round.answerId);
      expect(others).toHaveLength(3);
      expect(others.every((id) => QUESTION.wrong.includes(id))).toBe(true);
    }
  });

  it('has nothing to reveal besides the answer', () => {
    const round = build(QUESTION);
    expect(round).toMatchObject({
      questionId: 'marksman',
      subject: 'champion',
      statLabel: 'Marksmen',
      question: 'Which of these champions is a marksman?',
      values: {},
    });
    expect(round?.format).toBeUndefined();
  });

  it('uses every correct and every wrong champion over time, not always the same ones', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 100; seed++) {
      build(QUESTION, roster, `v${String(seed)}`)?.optionIds.forEach((id) => seen.add(id));
    }
    expect(seen).toEqual(new Set(roster.map(({ id }) => id)));
  });

  it('is deterministic for the same seed', () => {
    expect(build(QUESTION, roster, 'same')).toEqual(build(QUESTION, roster, 'same'));
  });

  it('skips excluded champions', () => {
    const round = build({ ...QUESTION, exclude: ['Jinx', 'Soraka'] });
    expect(round?.optionIds).not.toContain('Jinx');
    expect(round?.optionIds).not.toContain('Soraka');
    expect(round?.answerId).toBe('Ashe');
  });

  it('ignores listed champions that are not available (used earlier or gone from the data)', () => {
    const available = roster.filter(({ id }) => id !== 'Jinx' && id !== 'Soraka');
    const withGhost = { ...QUESTION, wrong: [...QUESTION.wrong, 'Ghost'] };
    const round = build(withGhost, available);
    expect(round?.answerId).toBe('Ashe');
    expect(round?.optionIds.sort()).toEqual(['Ashe', 'Garen', 'Lux', 'Zed']);
  });

  it('returns undefined when no right answer or too few wrong options remain', () => {
    const noCorrect = roster.filter(({ id }) => !QUESTION.correct.includes(id));
    expect(build(QUESTION, noCorrect)).toBeUndefined();
    expect(build({ ...QUESTION, exclude: ['Garen', 'Lux'] })).toBeUndefined();
  });
});
