import type { Entity, OptionSubject } from '../data/schema';
import type { EntityLookup } from './entityLookup';
import type { Puzzle } from './puzzle';

/**
 * One day's puzzle as a game page carries it, built into the page at build time: the rounds, and
 * only the options they show, with just what the cards need.
 */
export interface PuzzleDay {
  puzzle: Puzzle;
  /** Options by subject and id. Text options need none: their id is the name shown. */
  options: Record<OptionSubject, Record<string, Entity>>;
}

/** How many days a page carries: today and tomorrow, so the page still works after midnight. */
export const PUZZLE_DAYS_PER_PAGE = 2;

export function optionLookup(day: PuzzleDay): EntityLookup {
  const lookup = (subject: OptionSubject) => new Map(Object.entries(day.options[subject]));
  return {
    champion: lookup('champion'),
    item: lookup('item'),
    ability: lookup('ability'),
    text: lookup('text'),
  };
}

export interface PickedDay {
  day: PuzzleDay;
  /** False when the page has no puzzle for today (a missed build): the newest one is shown. */
  isToday: boolean;
}

/** The puzzle of `today` (UTC), or the newest the page has if it has none for today. */
export function pickPuzzleDay(days: readonly PuzzleDay[], today: string): PickedDay | undefined {
  const todays = days.find((day) => day.puzzle.date === today);
  if (todays) return { day: todays, isToday: true };
  // ISO dates compare correctly as plain strings.
  const newest = [...days].sort((a, b) => b.puzzle.date.localeCompare(a.puzzle.date))[0];
  return newest && { day: newest, isToday: false };
}
