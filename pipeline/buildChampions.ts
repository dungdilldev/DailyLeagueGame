import type { Champion } from '../src/data/schema';
import { championIconUrl } from './sources/dataDragon';
import type { StatDefinition, StatInput } from './stats/types';

function buildStats(input: StatInput, stats: readonly StatDefinition[]): Record<string, number> {
  const entries = stats.flatMap((stat) => {
    const value = stat.extract(input);
    // A missing value (e.g. brand-new champion not on the wiki yet) just leaves the stat out;
    // validation checks overall coverage, and the generator skips champions without the stat.
    return value === undefined ? [] : [[stat.id, value] as const];
  });
  return Object.fromEntries(entries);
}

export function buildChampion(
  input: StatInput,
  version: string,
  stats: readonly StatDefinition[],
): Champion {
  const { summary } = input;
  return {
    id: summary.id,
    name: summary.name,
    title: summary.title,
    classes: summary.tags,
    iconUrl: championIconUrl(version, summary),
    stats: buildStats(input, stats),
  };
}

/** Sorted by id so regenerating unchanged data gives an identical result. */
export function buildChampions(
  inputs: readonly StatInput[],
  version: string,
  stats: readonly StatDefinition[],
): Champion[] {
  return inputs
    .map((input) => buildChampion(input, version, stats))
    .sort((a, b) => a.id.localeCompare(b.id));
}
