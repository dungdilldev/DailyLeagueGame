import type { Item } from '../src/data/schema';
import { itemIconUrl } from './sources/dataDragon';
import type { ItemStat, ItemStatInput } from './stats/types';

export function buildItem(input: ItemStatInput, version: string, stats: readonly ItemStat[]): Item {
  const entries = stats.flatMap((stat) => {
    const value = stat.extract(input);
    // Items only have the stats they actually grant; a missing value just leaves the stat out.
    return value === undefined ? [] : [[stat.id, value] as const];
  });
  return {
    id: input.item.id,
    name: input.item.name,
    iconUrl: itemIconUrl(version, input.item),
    stats: Object.fromEntries(entries),
  };
}

/** Sorted so regenerating unchanged data gives an identical result. */
export function buildItems(
  inputs: readonly ItemStatInput[],
  version: string,
  stats: readonly ItemStat[],
): Item[] {
  return inputs
    .map((input) => buildItem(input, version, stats))
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}
