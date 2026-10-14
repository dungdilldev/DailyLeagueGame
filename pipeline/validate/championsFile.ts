import type { Champion } from '../../src/data/schema';
import type { StatDefinition } from '../stats/types';

/** Sanity floor: a count far below the real roster means a partial or failed fetch. */
export const MIN_CHAMPION_COUNT = 100;
/**
 * Share of champions that must have each stat. Not 100%: a champion released today may be
 * missing from a secondary source. Near-zero coverage means a source broke, and fails the run.
 */
export const MIN_STAT_COVERAGE = 0.95;

/** Returns human-readable problems; empty means the champion data is safe to publish. */
export function findProblems(
  champions: readonly Champion[],
  stats: readonly StatDefinition[],
): string[] {
  const problems: string[] = [];
  const total = champions.length;

  if (total < MIN_CHAMPION_COUNT) {
    problems.push(
      `Only ${String(total)} champions, expected at least ${String(MIN_CHAMPION_COUNT)}`,
    );
  }

  const seenIds = new Set<string>();
  for (const champion of champions) {
    if (seenIds.has(champion.id)) problems.push(`Duplicate champion id "${champion.id}"`);
    seenIds.add(champion.id);
  }

  for (const stat of stats) {
    const withStat = champions.filter((champion) => stat.id in champion.stats).length;
    if (withStat < total * MIN_STAT_COVERAGE) {
      problems.push(
        `Stat "${stat.id}" present for only ${String(withStat)} of ${String(total)} champions`,
      );
    }
  }
  return problems;
}
