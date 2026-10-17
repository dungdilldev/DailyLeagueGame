import type { GameData } from '../data/questions';
import { buildEntityLookup, type EntityLookup } from './entityLookup';
import { buildPuzzle, type PuzzleData } from './generate/buildPuzzle';
import { ROUND_GAP_BANDS } from './generate/config';
import { MIXED_MODE, puzzleSeed, questionsForMode, type GameMode } from './gameMode';
import type { Puzzle } from './puzzle';
import { newestSnapshot, pickSnapshot } from './snapshot';

export interface DailyPuzzle {
  puzzle: Puzzle;
  /** The champions and items of the snapshots the puzzle was built from, for showing the options. */
  entities: EntityLookup;
}

/** The champion and item data in effect on `date`. */
export function puzzleDataFor(data: GameData, date: string): PuzzleData {
  return {
    champions: pickSnapshot(data.champions.snapshots, date).entities,
    items: pickSnapshot(data.items.snapshots, date).entities,
  };
}

/** The newest data, even if it only takes effect tomorrow. Used by the testing mode. */
export function newestPuzzleData(data: GameData): PuzzleData {
  return {
    champions: newestSnapshot(data.champions.snapshots).entities,
    items: newestSnapshot(data.items.snapshots).entities,
  };
}

/**
 * The puzzle for a UTC day: same date and data always give the same puzzle. The champion and
 * item files are versioned independently, so each day uses the snapshot of each file that was
 * in effect on that day. A mode other than mixed plays only the questions of its category.
 */
export function createDailyPuzzle(
  data: GameData,
  date: string,
  mode: GameMode = MIXED_MODE,
): DailyPuzzle {
  const puzzleData = puzzleDataFor(data, date);
  return {
    puzzle: buildPuzzle(
      date,
      puzzleData,
      questionsForMode(data.questions, mode),
      ROUND_GAP_BANDS,
      puzzleSeed(date, mode),
    ),
    entities: buildEntityLookup(puzzleData),
  };
}
