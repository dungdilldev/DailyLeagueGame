import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GameDataFileSchema, type GameDataFile } from '../../src/data/schema';
import { createDailyPuzzle } from '../../src/game/dailyPuzzle';

const real = GameDataFileSchema.parse(
  JSON.parse(readFileSync('public/data/game-data.json', 'utf8')),
);
const currentSnapshot = real.snapshots[0];
if (!currentSnapshot) throw new Error('no snapshot in game data');

describe('createDailyPuzzle', () => {
  it('gives every player the same puzzle for the same date', () => {
    expect(createDailyPuzzle(real, '2030-05-05').puzzle).toEqual(
      createDailyPuzzle(real, '2030-05-05').puzzle,
    );
  });

  it('keeps a day on its snapshot even after a newer snapshot is published for later days', () => {
    const upcoming = { ...currentSnapshot, patch: 'next', effectiveFrom: '2030-05-06' };
    const withUpcoming: GameDataFile = { ...real, snapshots: [currentSnapshot, upcoming] };

    const before = createDailyPuzzle(real, '2030-05-05').puzzle;
    const sameDayAfterUpdate = createDailyPuzzle(withUpcoming, '2030-05-05').puzzle;
    expect(sameDayAfterUpdate).toEqual(before);
    expect(createDailyPuzzle(withUpcoming, '2030-05-06').puzzle.patch).toBe('next');
  });
});
