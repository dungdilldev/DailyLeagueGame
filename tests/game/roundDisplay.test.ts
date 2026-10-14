import { describe, expect, it } from 'vitest';
import type { Round } from '../../src/data/puzzleSchema';
import { displayValue, roundQuestion } from '../../src/game/roundDisplay';

const base: Round = {
  statId: 'baseHealth',
  statLabel: 'Base health',
  championIds: ['A', 'B', 'C', 'D'],
  answerId: 'A',
  values: { A: 1234, B: 3, C: 2, D: 1 },
};

describe('roundQuestion', () => {
  it('uses the stored question when present', () => {
    expect(roundQuestion({ ...base, question: 'Which champion was released most recently?' })).toBe(
      'Which champion was released most recently?',
    );
  });

  it('derives one from the label for puzzles published before questions were stored', () => {
    expect(roundQuestion(base)).toBe('Which champion has the highest base health?');
  });
});

describe('displayValue', () => {
  it('prefers the pre-formatted text', () => {
    const round = { ...base, displayValues: { A: 'Jun 13, 2013' } };
    expect(displayValue(round, 'A')).toBe('Jun 13, 2013');
  });

  it('falls back to the number with thousands separators', () => {
    expect(displayValue(base, 'A')).toBe('1,234');
  });

  it('is undefined for a champion that is not in the round', () => {
    expect(displayValue(base, 'Z')).toBeUndefined();
  });
});
