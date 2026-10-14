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
const everyone = [...snapshot.champions, ...snapshot.items];

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
      expect(findPuzzleProblems(puzzle, everyone), date).toEqual([]);
    }
  });
});

describe('buildPuzzle with champions and items', () => {
  const championIds = new Set(snapshot.champions.map((champion) => champion.id));
  const itemIds = new Set(snapshot.items.map((item) => item.id));
  const days = Array.from({ length: 365 }, (_, offset) => addUtcDays('2026-01-01', offset));
  const puzzles = days.map((date) => buildPuzzle(date, snapshot, data.stats));

  it('uses champions for champion questions and items for item questions, never mixing them', () => {
    for (const puzzle of puzzles) {
      for (const round of puzzle.rounds) {
        const allowed = round.subject === 'item' ? itemIds : championIds;
        expect(
          round.optionIds.every((id) => allowed.has(id)),
          `${puzzle.date} ${round.statId}`,
        ).toBe(true);
        expect(data.stats.find((stat) => stat.id === round.statId)?.subject).toBe(round.subject);
      }
    }
  });

  it('asks about both champions and items over time', () => {
    const subjects = new Set(
      puzzles.flatMap((puzzle) => puzzle.rounds.map((round) => round.subject)),
    );
    expect(subjects).toEqual(new Set(['champion', 'item']));
    const itemRounds = puzzles
      .flatMap((puzzle) => puzzle.rounds)
      .filter((round) => round.subject === 'item');
    expect(itemRounds.length).toBeGreaterThan(days.length / 2);
  });

  it('uses every item question at least once in a year', () => {
    const used = new Set(puzzles.flatMap((puzzle) => puzzle.rounds.map((round) => round.statId)));
    for (const stat of data.stats) expect(used.has(stat.id), stat.id).toBe(true);
  });

  it('still builds puzzles from an older snapshot that has no items, using champion questions only', () => {
    const withoutItems = { patch: snapshot.patch, champions: snapshot.champions, items: [] };
    for (const date of days.slice(0, 60)) {
      const puzzle = buildPuzzle(date, withoutItems, data.stats);
      expect(puzzle.rounds.every((round) => round.subject === 'champion')).toBe(true);
      expect(findPuzzleProblems(puzzle, snapshot.champions), date).toEqual([]);
    }
  });
});

describe('findPuzzleProblems', () => {
  it('flags a tampered answer', () => {
    const puzzle = buildPuzzle('2026-06-01', snapshot, data.stats);
    const round = puzzle.rounds[0];
    if (!round) throw new Error('no round');
    const wrong = round.optionIds.find((id) => id !== round.answerId) ?? '';
    const tampered = {
      ...puzzle,
      rounds: [{ ...round, answerId: wrong }, ...puzzle.rounds.slice(1)],
    };

    expect(findPuzzleProblems(tampered, everyone).join()).toContain('answer is not the highest');
  });
});
