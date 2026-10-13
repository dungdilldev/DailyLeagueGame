import type { ChampionsFile } from '../../src/data/schema';
import type { StatDefinition } from '../stats/types';

/** Sanity floor: a count far below the real roster means a partial or failed fetch. */
export const MIN_CHAMPION_COUNT = 100;

/** Returns human-readable problems; empty means the file is safe to publish. */
export function findProblems(file: ChampionsFile, stats: readonly StatDefinition[]): string[] {
  const problems: string[] = [];

  if (file.champions.length < MIN_CHAMPION_COUNT) {
    problems.push(
      `Only ${String(file.champions.length)} champions, expected at least ${String(MIN_CHAMPION_COUNT)}`,
    );
  }

  const seenIds = new Set<string>();
  for (const champion of file.champions) {
    if (seenIds.has(champion.id)) problems.push(`Duplicate champion id "${champion.id}"`);
    seenIds.add(champion.id);

    for (const stat of stats) {
      if (!(stat.id in champion.stats)) {
        problems.push(`${champion.id} is missing stat "${stat.id}"`);
      }
    }
  }
  return problems;
}
