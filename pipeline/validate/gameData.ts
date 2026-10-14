import type { Champion, Item } from '../../src/data/schema';
import { isItemStat, type StatDefinition } from '../stats/types';

/** Sanity floors: counts far below the real totals mean a partial or failed fetch. */
export const MIN_CHAMPION_COUNT = 100;
export const MIN_ITEM_COUNT = 30;
/**
 * Share of entities that must have each stat, unless the stat says otherwise. Not 100%: a
 * champion released today may be missing from a secondary source. Near-zero coverage means a
 * source broke, and fails the run.
 */
export const MIN_STAT_COVERAGE = 0.95;
/** Building a round needs four different values, so a stat needs comfortably more than that. */
export const MIN_VALUES_PER_STAT = 8;

interface GameEntities {
  champions: readonly Champion[];
  items: readonly Item[];
}

function findDuplicateIds(label: string, entities: readonly { id: string }[]): string[] {
  const seen = new Set<string>();
  const problems: string[] = [];
  for (const { id } of entities) {
    if (seen.has(id)) problems.push(`Duplicate ${label} id "${id}"`);
    seen.add(id);
  }
  return problems;
}

/** Returns human-readable problems; empty means the data is safe to publish. */
export function findProblems(data: GameEntities, stats: readonly StatDefinition[]): string[] {
  const problems: string[] = [];

  if (data.champions.length < MIN_CHAMPION_COUNT) {
    problems.push(
      `Only ${String(data.champions.length)} champions, expected at least ${String(MIN_CHAMPION_COUNT)}`,
    );
  }
  if (data.items.length < MIN_ITEM_COUNT) {
    problems.push(
      `Only ${String(data.items.length)} items, expected at least ${String(MIN_ITEM_COUNT)}`,
    );
  }
  problems.push(
    ...findDuplicateIds('champion', data.champions),
    ...findDuplicateIds('item', data.items),
  );

  for (const stat of stats) {
    const [entities, noun] = isItemStat(stat)
      ? [data.items, 'items']
      : [data.champions, 'champions'];
    const withStat = entities.filter((entity) => stat.id in entity.stats).length;
    const required = Math.max(
      MIN_VALUES_PER_STAT,
      Math.ceil(entities.length * (stat.minCoverage ?? MIN_STAT_COVERAGE)),
    );
    if (withStat < required) {
      problems.push(
        `Stat "${stat.id}" present for only ${String(withStat)} of ${String(entities.length)} ${noun} (need ${String(required)})`,
      );
    }
  }
  return problems;
}
