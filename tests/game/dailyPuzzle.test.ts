import { describe, expect, it } from 'vitest';
import type { GameData } from '../../src/data/questions';
import { createDailyPuzzle, puzzleDataFor } from '../../src/game/dailyPuzzle';
import { addUtcDays } from '../../src/game/date';
import { GAME_MODES } from '../../src/game/gameMode';
import { ROUND_GAP_BANDS, ROUNDS_PER_DAY } from '../../src/game/generate/config';
import { findPuzzleProblems } from '../support/findPuzzleProblems';
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

  it('plays only the questions of the chosen mode, and a different puzzle than the mixed one', () => {
    const date = '2030-05-05';
    const lore = createDailyPuzzle(realGameData, date, 'lore').puzzle;
    const loreIds = new Set(
      realGameData.questions.filter((q) => q.category === 'lore').map((q) => q.id),
    );
    expect(lore.rounds.length).toBeGreaterThan(0);
    expect(lore.rounds.every((round) => loreIds.has(round.questionId))).toBe(true);
    expect(createDailyPuzzle(realGameData, date, 'lore').puzzle).toEqual(lore);
    expect(createDailyPuzzle(realGameData, date).puzzle).not.toEqual(lore);
  });

  it('keeps the mixed mode identical to the puzzle without a mode', () => {
    expect(createDailyPuzzle(realGameData, '2030-05-05', 'mixed').puzzle).toEqual(
      createDailyPuzzle(realGameData, '2030-05-05').puzzle,
    );
  });

  it('builds a valid puzzle for every mode on every day of a year', () => {
    for (const mode of GAME_MODES) {
      const poolSize = realGameData.questions.filter(
        (q) => mode === 'mixed' || q.category === mode,
      ).length;
      const expected = Math.min(ROUNDS_PER_DAY, poolSize);
      for (let offset = 0; offset < 365; offset++) {
        const date = addUtcDays('2026-01-01', offset);
        const { puzzle } = createDailyPuzzle(realGameData, date, mode);
        expect(puzzle.rounds, `${mode} ${date}`).toHaveLength(expected);
        const { champions, items } = puzzleDataFor(realGameData, date);
        const problems = findPuzzleProblems(
          puzzle,
          [...champions, ...items],
          realGameData.questions,
          ROUND_GAP_BANDS.slice(0, expected),
        );
        expect(problems, `${mode} ${date}`).toEqual([]);
      }
    }
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
