import type { GameData } from '../data/questions';
import type { Entity, OptionSubject } from '../data/schema';
import { createDailyPuzzle, type DailyPuzzle } from './dailyPuzzle';
import { addUtcDays } from './date';
import type { GameMode } from './gameMode';
import { PUZZLE_DAYS_PER_PAGE, type PuzzleDay } from './puzzleDays';

/** A card shows an option's name and icon; the values come with the round, so stats are dropped. */
function cardFields({ id, name, iconUrl }: Entity): Entity {
  return { id, name, iconUrl, stats: {} };
}

/** The puzzle with only the options its rounds show. */
export function toPuzzleDay({ puzzle, entities }: DailyPuzzle): PuzzleDay {
  const shown = (subject: OptionSubject) =>
    Object.fromEntries(
      puzzle.rounds
        .filter((round) => round.subject === subject)
        .flatMap((round) => round.optionIds)
        .flatMap((id) => {
          const entity = entities[subject].get(id);
          return entity ? [[id, cardFields(entity)] as const] : [];
        }),
    );
  return {
    puzzle,
    options: {
      champion: shown('champion'),
      item: shown('item'),
      ability: shown('ability'),
      text: shown('text'),
    },
  };
}

/** The puzzles a game page carries, built at build time: today's and the following days'. */
export function buildPuzzleDays(data: GameData, mode: GameMode, today: string): PuzzleDay[] {
  return Array.from({ length: PUZZLE_DAYS_PER_PAGE }, (_, offset) =>
    toPuzzleDay(createDailyPuzzle(data, addUtcDays(today, offset), mode)),
  );
}
