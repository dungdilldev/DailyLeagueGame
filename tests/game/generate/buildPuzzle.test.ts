import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GameDataFileSchema } from '../../../src/data/schema';
import { addUtcDays } from '../../../src/game/date';
import { buildPuzzle } from '../../../src/game/generate/buildPuzzle';
import { ROUND_GAP_BANDS, ROUNDS_PER_DAY } from '../../../src/game/generate/config';
import { pickSnapshot } from '../../../src/game/snapshot';
import { findPuzzleProblems } from '../../support/findPuzzleProblems';

// Uses the real published data, so this also guards against stat/band combinations that break.
// In CI the daily data job runs this suite before publishing, so new data can never go live if
// it cannot produce valid puzzles.
const data = GameDataFileSchema.parse(
  JSON.parse(readFileSync('public/data/game-data.json', 'utf8')),
);
const snapshot = pickSnapshot(data.snapshots, '2999-01-01');

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
    expect(buildPuzzle('2026-06-01', snapshot, data.stats)).toEqual(
      buildPuzzle('2026-06-01', snapshot, data.stats),
    );
  });

  it('differs between dates', () => {
    expect(buildPuzzle('2026-06-01', snapshot, data.stats)).not.toEqual(
      buildPuzzle('2026-06-02', snapshot, data.stats),
    );
  });

  it('produces a valid puzzle for a full year of dates', () => {
    for (let offset = 0; offset < 365; offset++) {
      const date = addUtcDays('2026-01-01', offset);
      const puzzle = buildPuzzle(date, snapshot, data.stats);

      expect(puzzle.rounds, date).toHaveLength(ROUNDS_PER_DAY);
      expect(findPuzzleProblems(puzzle, snapshot.champions), date).toEqual([]);
    }
  });
});

describe('findPuzzleProblems', () => {
  it('flags a tampered answer', () => {
    const puzzle = buildPuzzle('2026-06-01', snapshot, data.stats);
    const round = puzzle.rounds[0];
    if (!round) throw new Error('no round');
    const wrong = round.championIds.find((id) => id !== round.answerId) ?? '';
    const tampered = {
      ...puzzle,
      rounds: [{ ...round, answerId: wrong }, ...puzzle.rounds.slice(1)],
    };

    expect(findPuzzleProblems(tampered, snapshot.champions).join()).toContain(
      'answer is not the highest',
    );
  });
});
