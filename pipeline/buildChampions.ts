import {
  ChampionsFileSchema,
  type Champion,
  type ChampionsFile,
  type StatValue,
} from '../src/data/schema';
import { championIconUrl } from './sources/dataDragon';
import type { StatDefinition, StatInput } from './stats/types';

function buildStats(input: StatInput, stats: readonly StatDefinition[]): Record<string, StatValue> {
  const entries = stats.flatMap((stat) => {
    const value = stat.extract(input);
    // A missing value (e.g. brand-new champion not on the wiki yet) just leaves the stat out;
    // validation checks overall coverage, and the generator skips champions without the stat.
    return value === undefined ? [] : [[stat.id, { value, source: stat.source }] as const];
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

/** Builds the output file; sorted by id so regenerating unchanged data gives an identical file. */
export function buildChampionsFile(
  inputs: readonly StatInput[],
  version: string,
  stats: readonly StatDefinition[],
): ChampionsFile {
  const champions = inputs
    .map((input) => buildChampion(input, version, stats))
    .sort((a, b) => a.id.localeCompare(b.id));
  return ChampionsFileSchema.parse({ patch: version, champions });
}
