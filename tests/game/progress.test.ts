import { describe, expect, it } from 'vitest';
import type { Puzzle } from '../../src/data/puzzleSchema';
import { isComplete, roundResults, score, submitAnswer } from '../../src/game/progress';

const round = (answerId: string) => ({
  statId: 'hp',
  statLabel: 'Health',
  championIds: ['A', 'B', 'C', 'D'],
  answerId,
  values: { A: 4, B: 3, C: 2, D: 1 },
});
const puzzle: Puzzle = { date: '2026-01-01', patch: '1.0', rounds: [round('A'), round('B')] };

describe('submitAnswer', () => {
  it('appends the choice without mutating the input', () => {
    const before: string[] = [];
    const after = submitAnswer(puzzle, before, 'A');
    expect(after).toEqual(['A']);
    expect(before).toEqual([]);
  });

  it('rejects a champion that is not an option in the current round', () => {
    expect(() => submitAnswer(puzzle, [], 'Z')).toThrow(/not an option/);
  });

  it('rejects answers once the puzzle is complete', () => {
    expect(() => submitAnswer(puzzle, ['A', 'B'], 'A')).toThrow(/already complete/);
  });
});

describe('scoring', () => {
  it('scores correct picks and reports per-round results', () => {
    expect(roundResults(puzzle, ['A', 'C'])).toEqual([true, false]);
    expect(score(puzzle, ['A', 'C'])).toBe(1);
  });

  it('only reports answered rounds', () => {
    expect(roundResults(puzzle, ['A'])).toEqual([true]);
  });

  it('knows when the puzzle is complete', () => {
    expect(isComplete(puzzle, ['A'])).toBe(false);
    expect(isComplete(puzzle, ['A', 'B'])).toBe(true);
  });
});
