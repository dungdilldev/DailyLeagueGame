import type { GameDataFile, Snapshot } from '../data/schema';
import { buildPuzzle } from './generate/buildPuzzle';
import type { Puzzle } from './puzzle';
import { pickSnapshot } from './snapshot';

export interface DailyPuzzle {
  puzzle: Puzzle;
  /** The snapshot the puzzle was built from; its champions are the ones shown. */
  snapshot: Snapshot;
}

/** The puzzle for a UTC day: same date and data file always give the same puzzle. */
export function createDailyPuzzle(data: GameDataFile, date: string): DailyPuzzle {
  const snapshot = pickSnapshot(data.snapshots, date);
  return { puzzle: buildPuzzle(date, snapshot, data.stats), snapshot };
}
