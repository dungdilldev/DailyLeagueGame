import type { Champion } from '../src/data/schema';
import { esportsSkinLines } from './esportsSkins';
import { iconPath } from './icons/iconPaths';
import type { ChampionStat, StatInput } from './stats/types';

function buildStats(input: StatInput, stats: readonly ChampionStat[]): Record<string, number> {
  const entries = stats.flatMap((stat) => {
    const value = stat.extract(input);
    // A missing value (e.g. brand-new champion not on the wiki yet) just leaves the stat out;
    // validation checks overall coverage, and the generator skips champions without the stat.
    return value === undefined ? [] : [[stat.id, value] as const];
  });
  return Object.fromEntries(entries);
}

export function buildChampion(input: StatInput, stats: readonly ChampionStat[]): Champion {
  const { summary } = input;
  const skinLines = esportsSkinLines(input.detail);
  return {
    id: summary.id,
    name: summary.name,
    title: summary.title,
    classes: summary.tags,
    iconUrl: iconPath('champions', summary.id),
    stats: buildStats(input, stats),
    // Left out when empty, which keeps the published file small.
    ...(skinLines.length > 0 && { esportsSkinLines: skinLines }),
  };
}

/** Sorted by id so regenerating unchanged data gives an identical result. */
export function buildChampions(
  inputs: readonly StatInput[],
  stats: readonly ChampionStat[],
): Champion[] {
  return inputs
    .map((input) => buildChampion(input, stats))
    .sort((a, b) => a.id.localeCompare(b.id));
}
