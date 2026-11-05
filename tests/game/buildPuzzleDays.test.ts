import { describe, expect, it } from 'vitest';
import { buildPuzzleDays } from '../../src/game/buildPuzzleDays';
import { createDailyPuzzle } from '../../src/game/dailyPuzzle';
import { GAME_MODES } from '../../src/game/gameMode';
import { realGameData } from '../support/realGameData';

const TODAY = '2026-03-05';

describe('buildPuzzleDays', () => {
  it("holds today's and tomorrow's puzzle, exactly as the generator makes them", () => {
    const days = buildPuzzleDays(realGameData, 'lore', TODAY);
    expect(days.map(({ puzzle }) => puzzle.date)).toEqual([TODAY, '2026-03-06']);
    expect(days[0]?.puzzle).toEqual(createDailyPuzzle(realGameData, TODAY, 'lore').puzzle);
    expect(days[1]?.puzzle).toEqual(createDailyPuzzle(realGameData, '2026-03-06', 'lore').puzzle);
  });

  it.each(GAME_MODES)('%s: carries every option a card shows, and nothing else', (mode) => {
    for (const { puzzle, options } of buildPuzzleDays(realGameData, mode, TODAY)) {
      const shown = puzzle.rounds
        .filter((round) => round.subject !== 'text')
        .flatMap((round) => round.optionIds.map((id) => `${round.subject}:${id}`));
      const carried = (['champion', 'item', 'ability'] as const).flatMap((subject) =>
        Object.keys(options[subject]).map((id) => `${subject}:${id}`),
      );
      expect(carried.sort()).toEqual([...new Set(shown)].sort());
      expect(options.text).toEqual({});
    }
  });

  it('keeps only what a card needs, so the page stays small', () => {
    const [today] = buildPuzzleDays(realGameData, 'stats', TODAY);
    for (const entity of Object.values(today?.options.champion ?? {})) {
      expect(Object.keys(entity).sort()).toEqual(['iconUrl', 'id', 'name', 'stats']);
      expect(entity.stats).toEqual({});
    }
  });
});
