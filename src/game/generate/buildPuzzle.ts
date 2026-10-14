import type { Champion, StatMeta } from '../../data/schema';
import type { Puzzle, Round } from '../puzzle';
import { buildRound } from './buildRound';
import { MAX_PUZZLE_ATTEMPTS, ROUND_GAP_BANDS, type GapBand } from './config';
import { createRng, type Rng } from './random';

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
  champions: readonly Champion[],
  stats: readonly StatMeta[],
  bands: readonly GapBand[],
  rng: Rng,
): Round[] | undefined {
  const rounds: Round[] = [];
  const usedChampionIds = new Set<string>();
  let remainingStats = rng.shuffle(stats);

  for (const band of bands) {
    const available = champions.filter((champion) => !usedChampionIds.has(champion.id));
    // Some stats cannot satisfy some bands (e.g. few distinct move speeds can't give a 30% gap).
    const round = firstSuccessful(remainingStats, (stat) => buildRound(available, stat, band, rng));
    if (!round) return undefined;

    rounds.push(round);
    round.championIds.forEach((id) => usedChampionIds.add(id));
    remainingStats = remainingStats.filter((stat) => stat.id !== round.statId);
  }
  return rounds;
}

interface PuzzleData {
  patch: string;
  champions: readonly Champion[];
}

/**
 * Builds the puzzle for one UTC day. Deterministic: the same date and data always give the
 * same puzzle. Each round uses a different stat, no champion appears twice, and rounds get
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
    const rounds = tryBuildRounds(data.champions, stats, bands, rng);
    if (rounds) return { date, patch: data.patch, rounds };
  }
  throw new Error(
    `Could not build a puzzle for ${date} after ${String(MAX_PUZZLE_ATTEMPTS)} attempts`,
  );
}
