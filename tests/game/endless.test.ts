import { describe, expect, it } from 'vitest';
import { buildEndlessQuestion } from '../../src/game/endless';
import { ROUND_GAP_BANDS } from '../../src/game/generate/config';
import { findPuzzleProblems } from '../support/findPuzzleProblems';
import { realGameData, realPuzzleData } from '../support/realGameData';

const data = realPuzzleData;
const { questions } = realGameData;
const everyone = [...data.champions, ...data.items];

const ask = (index: number, filter = {}, seed = 'seed') =>
  buildEndlessQuestion(data, questions, seed, index, filter);

describe('buildEndlessQuestion', () => {
  it('is deterministic: the same seed, index and filter give the same question', () => {
    expect(ask(7)).toEqual(ask(7));
    expect(ask(7)).not.toEqual(ask(8));
    expect(ask(7, {}, 'other')).not.toEqual(ask(7));
  });

  it('always builds a valid question for its difficulty band', () => {
    for (let index = 0; index < 500; index++) {
      const question = ask(index);
      expect(question).toBeDefined();
      if (!question) return;
      const band = ROUND_GAP_BANDS[question.bandIndex];
      const problems = findPuzzleProblems(
        { date: '2026-01-01', rounds: [question.round] },
        everyone,
        questions,
        band ? [band] : [],
      );
      expect(problems, `question ${String(index)}`).toEqual([]);
    }
  });

  it('represents every question and every difficulty when asked many times', () => {
    const questionsSeen = new Set<string>();
    const bandsSeen = new Set<number>();
    for (let index = 0; index < 3000; index++) {
      const question = ask(index);
      if (!question) continue;
      questionsSeen.add(question.round.questionId);
      bandsSeen.add(question.bandIndex);
    }
    expect([...questionsSeen].sort()).toEqual(questions.map((question) => question.id).sort());
    expect([...bandsSeen].sort()).toEqual(ROUND_GAP_BANDS.map((_, i) => i));
  });

  it('asks every question about equally often, not weighted by how easy it is to build', () => {
    const counts = new Map<string, number>();
    const total = 4000;
    for (let index = 0; index < total; index++) {
      const id = ask(index)?.round.questionId ?? '';
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const expected = total / questions.length;
    for (const question of questions) {
      const count = counts.get(question.id) ?? 0;
      expect(count, question.id).toBeGreaterThan(expected * 0.7);
      expect(count, question.id).toBeLessThan(expected * 1.3);
    }
  });

  it('can be restricted to one question', () => {
    for (let index = 0; index < 50; index++) {
      expect(ask(index, { questionId: 'itemCost' })?.round.questionId).toBe('itemCost');
    }
  });

  it('can be restricted to one difficulty', () => {
    for (let index = 0; index < 50; index++) {
      const question = ask(index, { bandIndex: 2 });
      expect(question?.bandIndex).toBe(2);
    }
  });

  it('can combine both, and says so (undefined) when that cannot be built', () => {
    expect(ask(0, { questionId: 'baseHealth', bandIndex: 1 })).toBeDefined();
    // Movement speed has too few, too close values for the easiest round.
    expect(ask(0, { questionId: 'moveSpeed', bandIndex: 0 })).toBeUndefined();
  });

  it('returns undefined for an unknown question or difficulty', () => {
    expect(ask(0, { questionId: 'nope' })).toBeUndefined();
    expect(ask(0, { bandIndex: 99 })).toBeUndefined();
  });

  it('works without items, never asking about items', () => {
    const withoutItems = { champions: data.champions, items: [] };
    for (let index = 0; index < 200; index++) {
      const question = buildEndlessQuestion(withoutItems, questions, 'seed', index);
      expect(question?.round.subject).not.toBe('item');
    }
  });
});
