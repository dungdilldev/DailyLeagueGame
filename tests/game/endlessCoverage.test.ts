import { describe, expect, it } from 'vitest';
import type { EndlessQuestion } from '../../src/game/endless';
import {
  emptyCoverage,
  recordAnswer,
  recordShown,
  unseenQuestionIds,
} from '../../src/game/endlessCoverage';
import { ROUND_GAP_BANDS } from '../../src/game/generate/config';

const question = (questionId: string, bandIndex: number): EndlessQuestion => ({
  bandIndex,
  round: {
    questionId,
    subject: 'champion',
    statLabel: questionId,
    question: '?',
    format: { kind: 'number' },
    optionIds: ['a', 'b', 'c', 'd'],
    answerId: 'a',
    values: { a: 4, b: 3, c: 2, d: 1 },
  },
});

describe('endless coverage', () => {
  it('starts empty, with one counter per difficulty', () => {
    const coverage = emptyCoverage();
    expect(coverage.asked).toEqual({});
    expect(coverage.bands).toEqual(ROUND_GAP_BANDS.map(() => 0));
  });

  it('counts shown questions per question and per difficulty', () => {
    let coverage = emptyCoverage();
    coverage = recordShown(coverage, question('armor', 0));
    coverage = recordShown(coverage, question('armor', 3));
    coverage = recordShown(coverage, question('itemCost', 3));
    expect(coverage.asked).toEqual({ armor: 2, itemCost: 1 });
    expect(coverage.bands).toEqual([1, 0, 0, 2, 0]);
  });

  it('counts only correct answers', () => {
    let coverage = recordShown(emptyCoverage(), question('armor', 0));
    coverage = recordAnswer(coverage, 'armor', false);
    expect(coverage.correct).toEqual({});
    coverage = recordAnswer(coverage, 'armor', true);
    expect(coverage.correct).toEqual({ armor: 1 });
  });

  it('does not modify the coverage it was given', () => {
    const before = emptyCoverage();
    recordShown(before, question('armor', 0));
    recordAnswer(before, 'armor', true);
    expect(before).toEqual(emptyCoverage());
  });

  it('lists the questions that have not been shown yet', () => {
    const coverage = recordShown(emptyCoverage(), question('armor', 0));
    expect(unseenQuestionIds(coverage, ['armor', 'itemCost', 'moveSpeed'])).toEqual([
      'itemCost',
      'moveSpeed',
    ]);
  });
});
