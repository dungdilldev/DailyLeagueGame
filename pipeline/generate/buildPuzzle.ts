import type { ChampionsFile } from '../../src/data/schema';
import type { Puzzle, Round } from '../../src/data/puzzleSchema';
import { buildRound, type StatInfo } from './buildRound';
import { MAX_PUZZLE_ATTEMPTS, ROUND_GAP_BANDS, type GapBand } from './config';
import { createRng, type Rng } from './random';

function tryBuildRounds(
  data: ChampionsFile,
  stats: readonly StatInfo[],
  bands: readonly GapBand[],
  rng: Rng,
): Round[] | undefined {
  const rounds: Round[] = [];
  const usedChampionIds = new Set<string>();
  let remainingStats = rng.shuffle(stats);

  for (const band of bands) {
    const available = data.champions.filter((champion) => !usedChampionIds.has(champion.id));
    // Some stats cannot satisfy some bands (e.g. few distinct move speeds can't give a 30% gap).
    const round = firstSuccessful(remainingStats, (stat) => buildRound(available, stat, band, rng));
    if (!round) return undefined;

    rounds.push(round);
    round.championIds.forEach((id) => usedChampionIds.add(id));
    remainingStats = remainingStats.filter((stat) => stat.id !== round.statId);
  }
  return rounds;
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

/**
 * Builds the puzzle for one UTC day. Deterministic: the same date and data always give the
 * same puzzle. Each round uses a different stat, no champion appears twice, and rounds get
 * harder in the order given by `bands`.
 */
export function buildPuzzle(
  date: string,
  data: ChampionsFile,
  stats: readonly StatInfo[],
  bands: readonly GapBand[] = ROUND_GAP_BANDS,
): Puzzle {
  for (let attempt = 0; attempt < MAX_PUZZLE_ATTEMPTS; attempt++) {
    const rounds = tryBuildRounds(data, stats, bands, createRng(`${date}#${String(attempt)}`));
    if (rounds) return { date, patch: data.patch, rounds };
  }
  throw new Error(
    `Could not build a puzzle for ${date} after ${String(MAX_PUZZLE_ATTEMPTS)} attempts`,
  );
}
