import { describe, expect, it } from 'vitest';
import type { Round } from '../../src/game/puzzle';
import { displayValue } from '../../src/game/roundDisplay';
import { formatStatValue } from '../../src/game/statFormat';

const base: Round = {
  statId: 'baseHealth',
  statLabel: 'Base health',
  question: 'Which champion has the highest base health?',
  format: { kind: 'number' },
  championIds: ['A', 'B', 'C', 'D'],
  answerId: 'A',
  values: { A: 1234, B: 3, C: 2, D: 1 },
};

describe('formatStatValue', () => {
  it('formats numbers with thousands separators', () => {
    expect(formatStatValue({ kind: 'number' }, 1234)).toBe('1,234');
    expect(formatStatValue({ kind: 'number' }, 0.668)).toBe('0.668');
  });

  it('formats a day count as a calendar date counted from the epoch', () => {
    expect(formatStatValue({ kind: 'date', epoch: '2013-06-01' }, 12)).toBe('Jun 13, 2013');
    expect(formatStatValue({ kind: 'date', epoch: '2009-01-01' }, 0)).toBe('Jan 1, 2009');
  });
});

describe('displayValue', () => {
  it('formats the value using the round format', () => {
    expect(displayValue(base, 'A')).toBe('1,234');
    const dateRound: Round = {
      ...base,
      format: { kind: 'date', epoch: '2013-06-01' },
      values: { A: 12 },
    };
    expect(displayValue(dateRound, 'A')).toBe('Jun 13, 2013');
  });

  it('is undefined for a champion that is not in the round', () => {
    expect(displayValue(base, 'Z')).toBeUndefined();
  });
});
