import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildPuzzle } from '../../pipeline/generate/buildPuzzle';
import { ROUND_GAP_BANDS, ROUNDS_PER_DAY } from '../../pipeline/generate/config';
import { STAT_REGISTRY } from '../../pipeline/stats';
import { findPuzzleProblems } from '../../pipeline/validate/puzzle';
import { PuzzleSchema } from '../../src/data/puzzleSchema';
import { ChampionsFileSchema } from '../../src/data/schema';
import { addUtcDays } from '../../src/game/date';

// Uses the real published roster, so this also guards against stat/band combinations that break.
const data = ChampionsFileSchema.parse(
  JSON.parse(readFileSync('public/data/champions.json', 'utf8')),
);

describe('difficulty config', () => {
  it('gets strictly harder: bands move to smaller gaps each round', () => {
    for (let i = 1; i < ROUND_GAP_BANDS.length; i++) {
      const previous = ROUND_GAP_BANDS[i - 1];
      const current = ROUND_GAP_BANDS[i];
      expect(current?.maxRatio).toBeLessThanOrEqual(previous?.minRatio ?? 0);
    }
  });
});

describe('buildPuzzle', () => {
  it('is deterministic for the same date and data', () => {
    expect(buildPuzzle('2026-06-01', data, STAT_REGISTRY)).toEqual(
      buildPuzzle('2026-06-01', data, STAT_REGISTRY),
    );
  });

  it('differs between dates', () => {
    expect(buildPuzzle('2026-06-01', data, STAT_REGISTRY)).not.toEqual(
      buildPuzzle('2026-06-02', data, STAT_REGISTRY),
    );
  });

  it('produces a valid, schema-conforming puzzle for a full year of dates', () => {
    for (let offset = 0; offset < 365; offset++) {
      const date = addUtcDays('2026-01-01', offset);
      const puzzle = buildPuzzle(date, data, STAT_REGISTRY);

      expect(PuzzleSchema.safeParse(puzzle).success).toBe(true);
      expect(puzzle.rounds).toHaveLength(ROUNDS_PER_DAY);
      expect(findPuzzleProblems(puzzle, data), date).toEqual([]);
    }
  });
});

describe('findPuzzleProblems', () => {
  it('flags a tampered answer', () => {
    const puzzle = buildPuzzle('2026-06-01', data, STAT_REGISTRY);
    const round = puzzle.rounds[0];
    if (!round) throw new Error('no round');
    const wrong = round.championIds.find((id) => id !== round.answerId) ?? '';
    const tampered = {
      ...puzzle,
      rounds: [{ ...round, answerId: wrong }, ...puzzle.rounds.slice(1)],
    };

    expect(findPuzzleProblems(tampered, data).join()).toContain('answer is not the highest');
  });
});
