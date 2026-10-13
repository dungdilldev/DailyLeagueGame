import { ChampionsFileSchema, type Champion, type ChampionsFile } from '../src/data/schema';
import { championIconUrl, type ChampionDetail, type ChampionSummary } from './sources/dataDragon';
import type { StatDefinition } from './stats/types';

export interface ChampionSource {
  summary: ChampionSummary;
  detail: ChampionDetail;
}

export function buildChampion(
  { summary, detail }: ChampionSource,
  version: string,
  stats: readonly StatDefinition[],
): Champion {
  return {
    id: summary.id,
    name: summary.name,
    title: summary.title,
    classes: summary.tags,
    iconUrl: championIconUrl(version, summary),
    stats: Object.fromEntries(
      stats.map((stat) => [stat.id, { value: stat.extract(detail), source: stat.source }]),
    ),
  };
}

/** Builds the output file; sorted by id so regenerating unchanged data gives an identical file. */
export function buildChampionsFile(
  sources: readonly ChampionSource[],
  version: string,
  stats: readonly StatDefinition[],
): ChampionsFile {
  const champions = sources
    .map((source) => buildChampion(source, version, stats))
    .sort((a, b) => a.id.localeCompare(b.id));
  return ChampionsFileSchema.parse({ patch: version, champions });
}
