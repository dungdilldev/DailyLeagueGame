import type { Champion, Entity, Item, StatMeta, StatSubject } from '../../data/schema';
import type { Puzzle, Round } from '../puzzle';
import { buildRound } from './buildRound';
import { MAX_PUZZLE_ATTEMPTS, ROUND_GAP_BANDS, type GapBand } from './config';
import { createRng, type Rng } from './random';

export interface PuzzleData {
  patch: string;
  champions: readonly Champion[];
  items: readonly Item[];
}

function firstSuccessful<T, R>(
  items: readonly T[],
  attempt: (item: T) => R | undefined,
): R | undefined {
  for (const item of items) {
    const result = attempt(item);
    if (result !== undefined) return result;
  }
  return undefined;
}

function tryBuildRounds(
  data: PuzzleData,
  stats: readonly StatMeta[],
  bands: readonly GapBand[],
  rng: Rng,
): Round[] | undefined {
  const pools: Record<StatSubject, readonly Entity[]> = {
    champion: data.champions,
    item: data.items,
  };
  const rounds: Round[] = [];
  // Ids of champions and items cannot clash (names vs. numbers), so one set serves both.
  const usedIds = new Set<string>();
  let remainingStats = rng.shuffle(stats);

  for (const band of bands) {
    // Some stats cannot satisfy some bands (e.g. few distinct move speeds can't give a 30% gap).
    const round = firstSuccessful(remainingStats, (stat) =>
      buildRound(
        pools[stat.subject].filter((entity) => !usedIds.has(entity.id)),
        stat,
        band,
        rng,
      ),
    );
    if (!round) return undefined;

    rounds.push(round);
    round.optionIds.forEach((id) => usedIds.add(id));
    remainingStats = remainingStats.filter((stat) => stat.id !== round.statId);
  }
  return rounds;
}

/**
 * Builds the puzzle for one UTC day. Deterministic: the same date and data always give the
 * same puzzle. Each round uses a different stat, nothing appears twice, and rounds get
 * harder in the order given by `bands`.
 */
export function buildPuzzle(
  date: string,
  data: PuzzleData,
  stats: readonly StatMeta[],
  bands: readonly GapBand[] = ROUND_GAP_BANDS,
): Puzzle {
  for (let attempt = 0; attempt < MAX_PUZZLE_ATTEMPTS; attempt++) {
    const rng = createRng(`${date}#${String(attempt)}`);
    const rounds = tryBuildRounds(data, stats, bands, rng);
    if (rounds) return { date, patch: data.patch, rounds };
  }
  throw new Error(
    `Could not build a puzzle for ${date} after ${String(MAX_PUZZLE_ATTEMPTS)} attempts`,
  );
}
