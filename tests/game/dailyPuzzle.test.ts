import { describe, expect, it } from 'vitest';
import type { GameData } from '../../src/data/questions';
import { createDailyPuzzle } from '../../src/game/dailyPuzzle';
import { realGameData } from '../support/realGameData';

const currentChampions = realGameData.champions.snapshots.at(-1);
const currentItems = realGameData.items.snapshots.at(-1);
if (!currentChampions || !currentItems) throw new Error('no snapshot in game data');

describe('createDailyPuzzle', () => {
  it('gives every player the same puzzle for the same date', () => {
    expect(createDailyPuzzle(realGameData, '2030-05-05').puzzle).toEqual(
      createDailyPuzzle(realGameData, '2030-05-05').puzzle,
    );
  });

  it('keeps a day on its snapshots even after newer ones are published for later days', () => {
    // A shifted copy of the data, so the later snapshot would give a different puzzle.
    const shifted = {
      ...currentChampions,
      effectiveFrom: '2030-05-06',
      entities: currentChampions.entities.slice(0, -20),
    };
    // Only the current snapshots, so the test does not depend on how many the real files hold.
    const alone: GameData = {
      ...realGameData,
      champions: { ...realGameData.champions, snapshots: [currentChampions] },
      items: { ...realGameData.items, snapshots: [currentItems] },
    };
    const withUpcoming: GameData = {
      ...alone,
      champions: { ...alone.champions, snapshots: [currentChampions, shifted] },
    };

    const before = createDailyPuzzle(alone, '2030-05-05').puzzle;
    expect(createDailyPuzzle(withUpcoming, '2030-05-05').puzzle).toEqual(before);
    const lastChampion = currentChampions.entities.at(-1);
    const after = createDailyPuzzle(withUpcoming, '2030-05-06').entities;
    expect(lastChampion && after.champion.has(lastChampion.id)).toBe(false);
  });

  it('versions champions and items independently', () => {
    const upcoming = { ...currentItems, effectiveFrom: '2030-05-06', entities: [] };
    const data: GameData = {
      ...realGameData,
      items: { ...realGameData.items, snapshots: [currentItems, upcoming] },
    };
    expect(createDailyPuzzle(data, '2030-05-05').entities.item.size).toBe(
      currentItems.entities.length,
    );
    expect(createDailyPuzzle(data, '2030-05-06').entities.champion.size).toBe(
      currentChampions.entities.length,
    );
  });
});
